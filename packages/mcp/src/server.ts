import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DomainCtx } from './domain';
import { registerTools } from './tools';

export const INSTRUCTIONS = `课程表服务（家庭学习助手）工具集。数据按家庭空间隔离，当前家庭已在启动时锚定。
通用口径：
- 日期格式 YYYY-MM-DD；「今天」以服务器本地时区为准。
- childId 省略时用默认孩子；多孩子先调 get_family_info 查看。
- 课程分校内/校外/充电三类；校内课程不参与打卡与积分。
- 分值：校外/充电到课 8 分，计划任务打卡 10 分，复习任务打卡 12 分，当日任务全完成额外 20 分，连续里程碑 7/21/50/100 天分别奖 50/150/300/500 分。
- 过去日期的打卡自动视为补卡（仅最近 7 天）：补卡同分，但不计入连续天数与里程碑。
- 撤销打卡后对应派生积分自动回冲；余额可为负（透支）。
- 兑换下单不扣分，家长 review_redemption approve 后才扣分。
典型流程：get_checkin_tasks 拿 refType/refId → check_in；get_points / get_points_ledger 查积分。`;

/** 构建一个注册好全部工具的 MCP server，stdio 与 HTTP 入口共用 */
export function createMcpServer(ctx: DomainCtx): McpServer {
  const server = new McpServer(
    { name: 'courseschedule', version: '0.1.0' },
    { instructions: INSTRUCTIONS }
  );
  registerTools(server, ctx);
  return server;
}