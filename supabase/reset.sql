-- ============================================================
-- 重置脚本 ⚠️ 会清空 Supabase 中全部业务数据
--
-- 用途：数据库里已存在旧版（familyId 隔离）表结构时，
--       先执行本文件，再执行 schema.sql 完成平滑重建。
--
-- 执行前请先确认没有需要保留的真实数据（各表 count 均为 0，
--   或已自行导出备份）。
-- ============================================================

begin;

-- 业务表（含家庭空间预留表）
drop table if exists
  "courseCancellations",
  "redemptions",
  "rewards",
  "pointAdjustments",
  "checkinRecords",
  "reviewTasks",
  "reviewItems",
  "mistakes",
  "subjects",
  "planTasks",
  "learningPlans",
  "scheduleRules",
  "courses",
  "children",
  "familyMembers",
  "families"
cascade;

-- 家庭空间辅助函数
drop function if exists "myEmail"();
drop function if exists "myFamilyIds"();
drop function if exists "isFamilyOwner"(text);

commit;

-- 重置完成后，请接着执行 supabase/schema.sql
