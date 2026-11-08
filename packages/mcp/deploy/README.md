# 课程表 MCP — 远程部署（HTTP 模式）

把 MCP 服务作为常驻 HTTP 服务跑在服务器上，本地 agent（Qoder / Claude 等）通过
`https://<域名>/mcp` 接入，用固定 bearer token 鉴权。

## 目录内容

| 文件 | 作用 |
| --- | --- |
| `courseschedule-mcp.service` | systemd 单元模板 |
| `nginx-mcp.conf` | nginx 反向代理片段（贴进 443 server 块） |
| `client-config.example.json` | 本地 MCP 客户端接入模板 |

## 架构

- 传输：Streamable HTTP，**stateless**（每请求独立，无 session），JSON 直返，无 SSE。
- 路径：`/mcp` 需要 `Authorization: Bearer <token>`；`/health` 免鉴权且只返回 `ok`。
- 服务以家长账号登录 Supabase，启动时锚定家庭空间；RLS 与 web 端一致。
- 入口：`dist/http.js`（HTTP）/ `dist/index.js`（stdio，本地用）。

## 前置条件

- Node.js ≥ 20.12（`node -v` 确认）
- pnpm（仓库根有 `.npmrc` 的 `shamefully-hoist=true`）
- 一个已配 TLS 的域名（**必须 HTTPS**，token 走明文头）
- 服务器可访问你的 Supabase 实例

## 环境变量（写进 `packages/mcp/.env`，勿入库）

```dotenv
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_EMAIL=家长账号邮箱
SUPABASE_PASSWORD=家长账号密码

# 可选：账号可见多个家庭时指定；只有一个会自动选中
FAMILY_ID=
# 可选：默认孩子，默认 default-child
CHILD_ID=

# HTTP 模式必填：固定 bearer token
MCP_HTTP_TOKEN=<64 位 hex>
# 可选：监听端口 / 地址，默认 8787 / 127.0.0.1（只给 nginx 用，勿直接暴露公网）
MCP_HTTP_PORT=8787
MCP_HTTP_HOST=127.0.0.1
```

生成 token：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> `config` 会相对 `dist/http.js` 自动定位 `packages/mcp/.env`，systemd 不需要 `EnvironmentFile`。
> 进程环境变量优先于 `.env`（便于用 `Environment=` 临时覆盖）。

## 部署步骤（服务器上）

```bash
# 1) 更新代码（git pull 或 tar 上传，排除 node_modules / .env）
# 2) 安装运行时依赖（dist 外部化了 SDK/supabase/hono 等，必须有 node_modules）
pnpm install
# 3) 构建，产出 dist/index.js 与 dist/http.js
pnpm -C packages/mcp build
# 4) 写好 packages/mcp/.env（见上）
```

### systemd

```bash
sudo cp packages/mcp/deploy/courseschedule-mcp.service /etc/systemd/system/
sudo sed -i \
  -e 's#__SERVICE_USER__#courseuser#g' \
  -e 's#__APP_DIR__#/srv/courseschedule#g' \
  -e 's#__NODE_BIN__#/usr/local/bin/node#g' \
  /etc/systemd/system/courseschedule-mcp.service
sudo systemctl daemon-reload
sudo systemctl enable --now courseschedule-mcp
sudo systemctl status courseschedule-mcp
journalctl -u courseschedule-mcp -f          # 看启动日志（家庭锚定信息）
```

占位符：

| 占位符 | 含义 |
| --- | --- |
| `__SERVICE_USER__` | 运行用户，需能读 `.env` 与 `node_modules` |
| `__APP_DIR__` | 仓库根目录，如 `/srv/courseschedule` |
| `__NODE_BIN__` | Node 绝对路径，如 `/usr/local/bin/node` |

### nginx

把 `nginx-mcp.conf` 内容贴进已有的 `https server { ... }` 块（建议复用现有 443 站点），
把 `__MCP_PORT__` 换成后端端口（默认 `8787`）：

```bash
sed 's#__MCP_PORT__#8787#g' packages/mcp/deploy/nginx-mcp.conf   # 生成待粘贴内容
sudo nginx -t && sudo nginx -s reload
```

要点：`Authorization` 头 nginx 默认透传；后端 JSON 直返，无需 `proxy_buffering off`；
客户端可能对 `/mcp` 发 GET 探测 SSE，后端回 `405` 属正常。

## 验证

```bash
# 服务器本机
curl -s http://127.0.0.1:8787/health                 # → ok
# 对外
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://<域名>/mcp   # → 401（无 token）
```

## 本地客户端接入

把 `client-config.example.json` 合并进客户端的 `mcpServers`，替换域名与 token：

```json
{
  "mcpServers": {
    "courseschedule": {
      "type": "streamable-http",
      "url": "https://plan.waixi.wang/mcp",
      "headers": {
        "Authorization": "Bearer <MCP_HTTP_TOKEN>"
      }
    }
  }
}
```

- 个别客户端不需要 `type`，或在 url 直连时用 `"http"`；以客户端文档为准。
- token 取服务器 `packages/mcp/.env` 的 `MCP_HTTP_TOKEN`（本地与远程同一个值）。
- 重启客户端后应看到 13 个工具（`get_family_info`、`get_schedule`、`check_in` 等）。

## 运维与安全

- **token 等同家长密码**：服务能以家长身份读写真实数据。泄露就改 `.env` 的 `MCP_HTTP_TOKEN`，
  重启服务并更新所有客户端。
- 只绑定 `127.0.0.1`，仅经 nginx + TLS 暴露；不要 `MCP_HTTP_HOST=0.0.0.0` 直接上公网。
- `/health` 无鉴权但只返回 `ok`，不含任何信息。
- 日志走 stderr：`journalctl -u courseschedule-mcp -f`。
- 家庭空间在**启动时锚定**；改 `FAMILY_ID` 或账号可见家庭变化后需重启服务。

## 常见问题

| 现象 | 排查 |
| --- | --- |
| 启动即退出，日志「缺少 MCP_HTTP_TOKEN」 | `.env` 未配置 token |
| 启动即退出，日志「登录失败」 | `SUPABASE_EMAIL/PASSWORD` 错，或账号未初始化家庭 |
| 「可见多个家庭空间，请用 FAMILY_ID 指定」 | 账号属于多个家庭，补 `FAMILY_ID` |
| 客户端连上但 401 | 请求头 token 与 `.env` 不一致，或 nginx 吞了 Authorization |
| 502 Bad Gateway | 后端未起或端口不符（`systemctl status` + `.env` 端口） |
| 改代码后行为没变 | 忘了 `pnpm -C packages/mcp build` 并重启服务 |
