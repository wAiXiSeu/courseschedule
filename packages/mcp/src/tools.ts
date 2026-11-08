import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DomainCtx } from './domain';
import {
  adjustPoints,
  checkIn,
  familyInfo,
  getCheckinTasks,
  getPoints,
  getPointsLedger,
  getSchedule,
  listCourses,
  listRedemptions,
  listRewards,
  redeemReward,
  reviewRedemption,
  undoCheckin,
} from './domain';

interface ToolResult {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
  [key: string]: unknown;
}

const ok = (data: unknown): ToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
});

const guard = async (fn: () => Promise<unknown>): Promise<ToolResult> => {
  try {
    return ok(await fn());
  } catch (err) {
    return { content: [{ type: 'text', text: (err as Error).message }], isError: true };
  }
};

const childIdArg = z.string().optional().describe('孩子 ID，省略时用默认孩子（见 get_family_info）');
const dateArg = z.string().optional().describe('日期 YYYY-MM-DD，省略时为今天');
const refTypeArg = z
  .enum(['course_rule', 'plan_task', 'review_task'])
  .describe('course_rule=课程到课（refId 传排课规则 ruleId）；plan_task=学习计划任务；review_task=复习任务');

export function registerTools(server: McpServer, ctx: DomainCtx): void {
  server.registerTool(
    'get_family_info',
    {
      description:
        '查看当前家庭空间：家庭名称、孩子 ID 列表、默认孩子、今天日期。不确定 childId 时先调本工具。',
      inputSchema: {},
    },
    () => guard(() => familyInfo(ctx))
  );

  server.registerTool(
    'list_courses',
    {
      description:
        '列出全部课程定义及其每周排课规则（星期、时间、生效期、是否启用）。查 courseId / ruleId 用本工具。',
      inputSchema: { childId: childIdArg },
    },
    (args) => guard(() => listCourses(ctx, args))
  );

  server.registerTool(
    'get_schedule',
    {
      description:
        '查询课程表：传 date 查单日，或 startDate+endDate 查区间（最长 31 天），都不传查今天。返回每节课的时间、地点、是否被取消、是否已到课。校内课程也会列出，但不参与打卡积分。',
      inputSchema: {
        date: dateArg,
        startDate: z.string().optional().describe('区间起始日 YYYY-MM-DD（与 endDate 同时提供）'),
        endDate: z.string().optional().describe('区间结束日 YYYY-MM-DD（含）'),
        childId: childIdArg,
      },
    },
    (args) => guard(() => getSchedule(ctx, args))
  );

  server.registerTool(
    'get_checkin_tasks',
    {
      description:
        '列出某日可打卡事项：学习计划任务、到期复习任务、校外/充电课程到课，含完成状态与分值。date 默认今天；过去 7 天内的日期可补卡。打卡前先调本工具拿 refType / refId。',
      inputSchema: { date: dateArg, childId: childIdArg },
    },
    (args) => guard(() => getCheckinTasks(ctx, args))
  );

  server.registerTool(
    'check_in',
    {
      description:
        '打卡 / 到课确认。date 默认今天；过去日期自动按补卡（仅最近 7 天，补卡同分但不计连续天数与里程碑）；未来日期拒绝。幂等：已打卡返回 already=true 不重复计分。复习任务打卡会联动完成本轮并生成下一轮复习。',
      inputSchema: {
        refType: refTypeArg,
        refId: z.string().describe('引用 ID：排课规则 / 计划任务 / 复习任务的 id'),
        date: dateArg,
        childId: childIdArg,
      },
    },
    (args) => guard(() => checkIn(ctx, args))
  );

  server.registerTool(
    'undo_check_in',
    {
      description:
        '撤销某日某事项的打卡，对应派生积分自动回冲。注意：复习任务的完成状态不会回退（与 web 端一致）。',
      inputSchema: {
        refType: refTypeArg,
        refId: z.string().describe('引用 ID，与 check_in 相同'),
        date: dateArg,
        childId: childIdArg,
      },
    },
    (args) => guard(() => undoCheckin(ctx, args))
  );

  server.registerTool(
    'get_points',
    {
      description:
        '积分总览：余额（可为负=透支）、累计获得 / 已兑换 / 家长扣分、当前与最长连续打卡（补卡不计连续）、累计打卡天数、下一档里程碑、待确认兑换单数。',
      inputSchema: { childId: childIdArg },
    },
    (args) => guard(() => getPoints(ctx, args))
  );

  server.registerTool(
    'get_points_ledger',
    {
      description:
        '积分流水（打卡派生 + 手工调整 + 兑换），按日期倒序。kind：checkin 打卡 / attendance 到课 / mistake 错题攻克 / daily_goal 当日满额 / milestone 里程碑 / manual 家长调整 / redemption 兑换。',
      inputSchema: {
        limit: z.number().int().min(1).max(100).optional().describe('返回条数，默认 20，最大 100'),
        childId: childIdArg,
      },
    },
    (args) => guard(() => getPointsLedger(ctx, args))
  );

  server.registerTool(
    'adjust_points',
    {
      description:
        '家长手工加减积分：points 为非零整数（正数奖励、负数扣分），reason 必填（会作为流水展示给孩子看）。date 默认今天。',
      inputSchema: {
        points: z.number().int().describe('增减分值，非零整数，负数为扣分'),
        reason: z.string().describe('原因，展示给孩子看'),
        date: dateArg,
        childId: childIdArg,
      },
    },
    (args) => guard(() => adjustPoints(ctx, args))
  );

  server.registerTool(
    'list_rewards',
    {
      description:
        '列出兑换品（默认仅上架中的），含价格、当前余额是否够兑换、是否已有待确认兑换单。',
      inputSchema: {
        includeInactive: z.boolean().optional().describe('是否包含已下架兑换品，默认 false'),
        childId: childIdArg,
      },
    },
    (args) => guard(() => listRewards(ctx, args))
  );

  server.registerTool(
    'redeem_reward',
    {
      description:
        '提交兑换单（pending 状态，不立即扣分）。余额不足或该兑换品已有待确认单时会被拒绝。家长用 review_redemption 确认后才真正扣分。',
      inputSchema: {
        rewardId: z.string().describe('兑换品 ID（见 list_rewards）'),
        childId: childIdArg,
      },
    },
    (args) => guard(() => redeemReward(ctx, args))
  );

  server.registerTool(
    'list_redemptions',
    {
      description: '查询兑换单，可按 status 过滤，按提交时间倒序返回。',
      inputSchema: {
        status: z.enum(['pending', 'approved', 'rejected']).optional().describe('不传则返回全部'),
        childId: childIdArg,
      },
    },
    (args) => guard(() => listRedemptions(ctx, args))
  );

  server.registerTool(
    'review_redemption',
    {
      description:
        '家长审批兑换单：approve 通过（再次校验余额并扣分）或 reject 拒绝。仅 pending 状态的单可审批。',
      inputSchema: {
        id: z.string().describe('兑换单 ID'),
        action: z.enum(['approve', 'reject']).describe('approve=通过并扣分；reject=拒绝'),
        childId: childIdArg,
      },
    },
    (args) => guard(() => reviewRedemption(ctx, args))
  );
}