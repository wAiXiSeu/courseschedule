/**
 * MCP 服务端到端冒烟测试
 *
 * 在 Supabase 上注册一次性测试账号（mcp-smoke-*@example.com），在其隔离家庭内
 * 铺底数据，通过 stdio 启动真实服务并调用全部工具断言，最后清理全部业务数据。
 * 残留：测试账号本身（auth.users 一行，无家庭无数据），可在控制台手动删除。
 *
 * 前提：实例开放注册且关闭邮箱确认（supabase/schema.sql 上线建议的口径）。
 * 用法：pnpm smoke:mcp
 */

import { createClient } from '@supabase/supabase-js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
for (const p of [resolve(packageRoot, '.env'), resolve(packageRoot, '../web/.env')]) {
  try {
    process.loadEnvFile(p);
  } catch {
    // 可选来源
  }
}
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('缺少 SUPABASE_URL / SUPABASE_ANON_KEY（packages/mcp/.env 或 packages/web/.env）');
  process.exit(2);
}

const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const shiftDay = (s, n) => {
  const d = new Date(`${s}T00:00:00`);
  d.setDate(d.getDate() + n);
  return iso(d);
};
const today = iso(new Date());
const now = Date.now();
const DAY = 86_400_000;
const CHILD = 'default-child';

let passed = 0;
const failures = [];
function check(cond, label) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failures.push(label);
    console.error(`  ✗ ${label}`);
  }
}

const admin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

const email = `mcp-smoke-${Date.now()}@example.com`;
const password = `McpSmoke!${randomUUID().slice(0, 8)}`;
const familyId = randomUUID();
let client = null;
let transport = null;
let serverStderr = '';

async function seed() {
  const ins = async (table, row) => {
    const { error } = await admin.from(table).insert({ familyId, ...row });
    if (error) throw new Error(`铺底 ${table} 失败：${error.message}`);
  };
  const base = { childId: CHILD, createdAt: now, updatedAt: now };
  const weekday = new Date(`${today}T00:00:00`).getDay();

  const { error: familyError } = await admin.from('families').insert({ id: familyId, userId, ownerUserId: userId, name: 'MCP 冒烟测试', createdAt: now, updatedAt: now });
  if (familyError) throw new Error(`铺底 families 失败：${familyError.message}`);
  await ins('subjects', { id: 'piano', name: '钢琴', category: 'art', color: '#8B5CF6' });
  await ins('courses', { ...base, id: pianoId, name: '钢琴课', type: 'extracurricular', color: 'piano' });
  await ins('courses', { ...base, id: schoolId, name: '数学课', type: 'school', color: 'math' });
  await ins('scheduleRules', { ...base, id: pianoRuleId, courseId: pianoId, weekday, startTime: '10:00', endTime: '11:00', repeatType: 'weekly', effectiveFrom: shiftDay(today, -10), isActive: true });
  await ins('scheduleRules', { ...base, id: schoolRuleId, courseId: schoolId, weekday, startTime: '08:00', endTime: '08:45', repeatType: 'weekly', effectiveFrom: shiftDay(today, -10), isActive: true });
  await ins('learningPlans', { ...base, id: planId, title: '冒烟测试计划', subject: 'math', startDate: shiftDay(today, -10), endDate: shiftDay(today, 10), status: 'active' });
  await ins('planTasks', { ...base, id: planTaskId, planId, title: '背乘法口诀', frequency: 'daily', isActive: true, createdAt: now - 10 * DAY });
  await ins('reviewItems', { ...base, id: reviewItemId, title: '冒烟知识点', subject: 'math', learnDate: shiftDay(today, -3), intervals: [1, 2, 4], sourceType: 'manual', createdAt: now - 3 * DAY });
  await ins('reviewTasks', { ...base, id: reviewTaskId, reviewItemId, intervalIndex: 0, dueDate: shiftDay(today, -2), status: 'pending', createdAt: now - 3 * DAY });
  await ins('rewards', { ...base, id: cheapRewardId, title: '测试冰淇淋', emoji: '🍦', cost: 5, isActive: true });
  await ins('rewards', { ...base, id: expensiveRewardId, title: '测试大礼', emoji: '🎁', cost: 999999, isActive: true });
}

const pianoId = randomUUID();
const schoolId = randomUUID();
const pianoRuleId = randomUUID();
const schoolRuleId = randomUUID();
const planId = randomUUID();
const planTaskId = randomUUID();
const reviewItemId = randomUUID();
const reviewTaskId = randomUUID();
const cheapRewardId = randomUUID();
const expensiveRewardId = randomUUID();
let userId = null;
let scratchAccount = false;

async function cleanup() {
  const tables = ['checkinRecords', 'redemptions', 'pointAdjustments', 'rewards', 'reviewTasks', 'reviewItems', 'planTasks', 'learningPlans', 'scheduleRules', 'courseCancellations', 'courses', 'subjects'];
  for (const t of tables) {
    const { error } = await admin.from(t).delete().eq('familyId', familyId);
    if (error) console.error(`清理 ${t} 失败：${error.message}`);
  }
  const { error } = await admin.from('families').delete().eq('id', familyId);
  if (error) console.error(`清理 families 失败：${error.message}`);
}

async function call(name, args = {}) {
  const res = await client.callTool({ name, arguments: args });
  const text = res.content?.find((c) => c.type === 'text')?.text ?? '';
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    // 错误结果是纯文本
  }
  return { isError: !!res.isError, data, text };
}

function expectError(res, needle, label) {
  check(res.isError && res.text.includes(needle), `${label}（期望报错含「${needle}」，实际：${res.text.slice(0, 80)}）`);
}

async function run() {
  const configuredEmail = process.env.SUPABASE_EMAIL?.trim();
  const configuredPassword = process.env.SUPABASE_PASSWORD;
  let serverEmail;
  let serverPassword;

  if (configuredEmail && configuredPassword) {
    console.log(`使用已配置账号 ${configuredEmail} 登录（在其名下建隔离测试家庭，跑完整家庭删除）…`);
    const { data, error } = await admin.auth.signInWithPassword({ email: configuredEmail, password: configuredPassword });
    if (error || !data.user) {
      console.error(`登录失败：${error?.message ?? '未返回用户'}`);
      process.exitCode = 2;
      return;
    }
    userId = data.user.id;
    serverEmail = configuredEmail;
    serverPassword = configuredPassword;
  } else {
    scratchAccount = true;
    console.log(`注册测试账号 ${email} …`);
    const { data, error } = await admin.auth.signUp({ email, password });
    if (error || !data.session) {
      console.error(`SKIP：实例未开放免确认注册（${error?.message ?? 'signUp 未返回 session，需邮箱确认'}）。`);
      console.error('请在 packages/mcp/.env 配置真实家长账号后重跑（脚本会在其名下建隔离测试家庭，结束即删）。');
      process.exitCode = 2;
      return;
    }
    userId = data.user.id;
    serverEmail = email;
    serverPassword = password;
  }
  console.log('铺底测试数据…');
  await seed();

  console.log('启动 MCP 服务（stdio）…');
  transport = new StdioClientTransport({
    command: process.execPath,
    args: [resolve(packageRoot, 'dist/index.js')],
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME ?? '',
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      SUPABASE_EMAIL: serverEmail,
      SUPABASE_PASSWORD: serverPassword,
      FAMILY_ID: familyId,
      CHILD_ID: CHILD,
    },
    stderr: 'pipe',
  });
  transport.stderr?.on('data', (chunk) => {
    serverStderr += chunk.toString();
  });
  client = new Client({ name: 'mcp-smoke', version: '0.0.0' });
  await client.connect(transport);

  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name);
  const expected = ['get_family_info', 'list_courses', 'get_schedule', 'get_checkin_tasks', 'check_in', 'undo_check_in', 'get_points', 'get_points_ledger', 'adjust_points', 'list_rewards', 'redeem_reward', 'list_redemptions', 'review_redemption'];
  check(expected.every((n) => names.includes(n)), `listTools 返回全部 13 个工具（实际 ${names.length}）`);

  console.log('— 家庭与课程 —');
  const info = await call('get_family_info');
  check(info.data?.family?.id === familyId && info.data?.childIds?.includes(CHILD), 'get_family_info 返回家庭与孩子');
  const courses = await call('list_courses');
  check(courses.data?.count === 2, 'list_courses 返回 2 门课程');
  const piano = courses.data?.courses?.find((c) => c.id === pianoId);
  check(piano?.subject === '钢琴' && piano?.rules?.[0]?.id === pianoRuleId, 'list_courses 关联科目名与排课规则');

  console.log('— 课程表查询 —');
  const sched = await call('get_schedule');
  check(sched.data?.count === 2, 'get_schedule 今天展开 2 节课（含校内）');
  check(sched.data?.occurrences?.every((o) => !o.attended), 'get_schedule 初始均未到课');
  const school = sched.data?.occurrences?.find((o) => o.courseId === schoolId);
  check(school?.checkinEnabled === false, '校内课程 checkinEnabled=false');
  const week = await call('get_schedule', { startDate: today, endDate: shiftDay(today, 6) });
  check(week.data?.count === 2, 'get_schedule 一周区间 weekly 规则各展开 1 次');
  expectError(await call('get_schedule', { date: '2026-13-99' }), '无效日期', '非法日期被拒绝');
  expectError(await call('get_schedule', { startDate: today }), '同时提供', '区间缺 endDate 被拒绝');

  console.log('— 打卡清单 —');
  const tasks0 = await call('get_checkin_tasks');
  check(tasks0.data?.tasks?.length === 2, 'get_checkin_tasks 今天 2 项任务（计划+逾期复习）');
  check(tasks0.data?.attendance?.length === 1 && tasks0.data?.attendance?.[0]?.refId === pianoRuleId, '到课清单仅校外课（剔除校内）');

  console.log('— 打卡与积分 —');
  const c1 = await call('check_in', { refType: 'course_rule', refId: pianoRuleId });
  check(c1.data?.pointsEarned === 8 && c1.data?.balance === 8, '到课打卡 +8，余额 8');
  const c2 = await call('check_in', { refType: 'course_rule', refId: pianoRuleId });
  check(c2.data?.already === true && c2.data?.pointsEarned === 0, '重复打卡幂等不加分');
  const c3 = await call('check_in', { refType: 'plan_task', refId: planTaskId });
  check(c3.data?.pointsEarned === 10 && c3.data?.balance === 38, '计划任务 +10，当日满额 +20，余额 38');
  const c4 = await call('check_in', { refType: 'review_task', refId: reviewTaskId });
  check(c4.data?.pointsEarned === 12 && c4.data?.balance === 30, '复习 +12；生成下一轮今日到期，满额奖回冲，余额 30');
  const { data: nextTasks } = await admin.from('reviewTasks').select('*').eq('familyId', familyId).eq('reviewItemId', reviewItemId);
  check(nextTasks?.some((t) => t.intervalIndex === 0 && t.status === 'done') && nextTasks?.some((t) => t.intervalIndex === 1 && t.status === 'pending'), '复习打卡联动：本轮 done + 下一轮 pending');
  const c5 = await call('check_in', { refType: 'plan_task', refId: planTaskId, date: shiftDay(today, -1) });
  check(c5.data?.isMakeup === true && c5.data?.pointsEarned === 10, '昨日打卡自动补卡且同分 +10');
  check(c5.data?.balance === 60, '补卡补齐昨日满额 +20，余额 60');
  expectError(await call('check_in', { refType: 'plan_task', refId: planTaskId, date: shiftDay(today, -8) }), '最近 7 天', '超窗补卡被拒绝');
  expectError(await call('check_in', { refType: 'course_rule', refId: pianoRuleId, date: shiftDay(today, -1) }), '没有排课', '无排课日到课被拒绝');
  expectError(await call('check_in', { refType: 'course_rule', refId: schoolRuleId }), '校内课程', '校内课程打卡被拒绝');
  expectError(await call('check_in', { refType: 'plan_task', refId: planTaskId, date: shiftDay(today, 1) }), '未来日期', '未来日期打卡被拒绝');
  expectError(await call('check_in', { refType: 'plan_task', refId: 'not-exist' }), '不存在', '无效 refId 被拒绝');

  const points = await call('get_points');
  check(points.data?.balance?.balance === 60, 'get_points 余额 60');
  check(points.data?.currentStreak === 1 && points.data?.longestStreak === 1, '连续打卡 1 天（补卡日不计连续）');
  check(points.data?.totalCheckinDays === 2, '累计打卡 2 天（补卡日计入）');
  check(points.data?.nextMilestone?.days === 7, '下一里程碑 7 天档');
  const ledger = await call('get_points_ledger', { limit: 3 });
  check(ledger.data?.total === 5 && ledger.data?.entries?.length === 3, '流水共 5 条，limit=3 生效');
  const ledgerAll = await call('get_points_ledger');
  check(ledgerAll.data?.entries?.reduce((s, e) => s + e.points, 0) === 60, '流水分值合计与余额一致');

  const undo = await call('undo_check_in', { refType: 'course_rule', refId: pianoRuleId });
  check(undo.data?.removed === true && undo.data?.pointsReverted === 8 && undo.data?.balance === 52, '撤销到课回冲 8 分，余额 52');
  const undo2 = await call('undo_check_in', { refType: 'course_rule', refId: pianoRuleId });
  check(undo2.data?.removed === false, '重复撤销返回 removed=false');

  console.log('— 手工调整 —');
  const adj = await call('adjust_points', { points: 7, reason: '冒烟测试奖励' });
  check(adj.data?.ok === true && adj.data?.balance === 59, '手工 +7，余额 59');
  expectError(await call('adjust_points', { points: 0, reason: 'x' }), '非零整数', '0 分调整被拒绝');
  expectError(await call('adjust_points', { points: 5, reason: ' ' }), 'reason 必填', '空原因被拒绝');

  console.log('— 兑换流程 —');
  const rewards = await call('list_rewards');
  check(rewards.data?.rewards?.find((r) => r.id === cheapRewardId)?.affordable === true, '余额够兑换冰淇淋');
  check(rewards.data?.rewards?.find((r) => r.id === expensiveRewardId)?.affordable === false, '大礼标记余额不足');
  const redeem = await call('redeem_reward', { rewardId: cheapRewardId });
  check(redeem.data?.ok === true && redeem.data?.redemption?.status === 'pending' && redeem.data?.balance === 59, '下单 pending 不扣分');
  expectError(await call('redeem_reward', { rewardId: cheapRewardId }), '待确认', '同品重复下单被拒绝');
  const pending = await call('list_redemptions', { status: 'pending' });
  check(pending.data?.count === 1, 'list_redemptions pending=1');
  const approve = await call('review_redemption', { id: redeem.data.redemption.id, action: 'approve' });
  check(approve.data?.ok === true && approve.data?.balance === 54, '家长确认后扣 5 分，余额 54');
  expectError(await call('review_redemption', { id: redeem.data.redemption.id, action: 'approve' }), '已经处理过', '重复审批被拒绝');
  expectError(await call('redeem_reward', { rewardId: expensiveRewardId }), '积分不够', '余额不足下单被拒绝');
  const redeem2 = await call('redeem_reward', { rewardId: cheapRewardId });
  const reject = await call('review_redemption', { id: redeem2.data.redemption.id, action: 'reject' });
  const afterReject = await call('get_points');
  check(reject.data?.ok === true && afterReject.data?.balance?.balance === 54, '拒绝兑换不扣分');
}

try {
  await run();
} catch (err) {
  failures.push(`执行异常：${err.message}`);
  console.error(err);
  if (serverStderr) console.error('— 服务 stderr —\n' + serverStderr.slice(-2000));
} finally {
  try {
    await client?.close();
  } catch {
    // 忽略关闭异常
  }
  if (userId) {
    console.log('清理测试数据…');
    await cleanup();
  }
}

console.log(`\n结果：${passed} 通过，${failures.length} 失败`);
if (scratchAccount && userId) console.log(`残留测试账号：${email}（auth.users 一行，无家庭无数据，可在控制台删除）`);
if (failures.length > 0) {
  console.error(failures.map((f) => `  ✗ ${f}`).join('\n'));
  process.exitCode = 1;
}