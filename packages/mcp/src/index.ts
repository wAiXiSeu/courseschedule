import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config';
import { FamilyDb, resolveFamily, signIn } from './db';
import { createMcpServer } from './server';

async function main() {
  const cfg = loadConfig();
  const { client, userId } = await signIn(cfg);
  const family = await resolveFamily(client, cfg.familyId);
  const ctx = { db: new FamilyDb(client, family.id), family, userId, defaultChildId: cfg.childId };

  const server = createMcpServer(ctx);
  await server.connect(new StdioServerTransport());
  // stdout 是 MCP 协议通道，日志一律走 stderr
  console.error(`[courseschedule-mcp] 已就绪：家庭「${family.name}」(${family.id})，默认孩子 ${cfg.childId}`);
}

main().catch((err) => {
  console.error(`[courseschedule-mcp] 启动失败：${(err as Error).message}`);
  process.exit(1);
});