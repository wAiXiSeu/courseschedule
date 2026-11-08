import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { loadConfig } from './config';
import { FamilyDb, resolveFamily, signIn } from './db';
import { createMcpServer } from './server';

async function main() {
  const cfg = loadConfig();
  if (!cfg.httpToken) {
    throw new Error('HTTP 模式缺少 MCP_HTTP_TOKEN（固定 bearer token），请在 packages/mcp/.env 或环境变量中配置');
  }
  const tokenHash = createHash('sha256').update(cfg.httpToken).digest();

  const { client, userId } = await signIn(cfg);
  const family = await resolveFamily(client, cfg.familyId);
  const ctx = { db: new FamilyDb(client, family.id), family, userId, defaultChildId: cfg.childId };

  // 常量时间比较，避免按字节/长度旁路泄露 token
  const authorized = (req: IncomingMessage): boolean => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return false;
    const provided = header.slice('Bearer '.length).trim();
    const providedHash = createHash('sha256').update(provided).digest();
    return timingSafeEqual(tokenHash, providedHash);
  };

  const json = (res: ServerResponse, status: number, body: unknown, extraHeaders?: Record<string, string>) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders });
    res.end(JSON.stringify(body));
  };

  const httpServer = createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;

      // 存活探针：无鉴权、不含任何敏感信息，供 nginx/systemd 检查
      if (req.method === 'GET' && pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('ok');
        return;
      }

      if (pathname !== '/mcp') {
        json(res, 404, { error: 'not found' });
        return;
      }

      if (!authorized(req)) {
        json(res, 401, { error: 'unauthorized' }, { 'WWW-Authenticate': 'Bearer' });
        return;
      }

      // stateless：每个请求独立 server+transport，JSON 直返（无 SSE，nginx 无需关缓冲）
      const mcp = createMcpServer(ctx);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      res.on('close', () => {
        void transport.close();
        void mcp.close();
      });
      await mcp.connect(transport);
      await transport.handleRequest(req, res);
    } catch (err) {
      console.error('[courseschedule-mcp] 处理请求出错：', err);
      if (!res.headersSent) json(res, 500, { error: 'internal error' });
    }
  });

  httpServer.listen(cfg.httpPort, cfg.httpHost, () => {
    console.error(
      `[courseschedule-mcp] HTTP 就绪：http://${cfg.httpHost}:${cfg.httpPort}/mcp` +
        `（家庭「${family.name}」(${family.id})，默认孩子 ${cfg.childId}，bearer 鉴权已启用）`
    );
  });

  const shutdown = (signal: string) => {
    console.error(`[courseschedule-mcp] 收到 ${signal}，关闭 HTTP 服务…`);
    httpServer.close(() => process.exit(0));
    // 兜底：10s 内未关完强制退出
    setTimeout(() => process.exit(0), 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error(`[courseschedule-mcp] HTTP 启动失败：${(err as Error).message}`);
  process.exit(1);
});