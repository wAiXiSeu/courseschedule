-- ============================================================
-- 增量升级脚本：打卡积分与积分兑换系统
--
-- 用途：给【已部署】的库补上积分功能，不动任何已有数据。
--       全新的空库直接执行 supabase/schema.sql 即可，无需本文件。
--
-- 用法：Supabase（opentrust 控制台）→ SQL Editor → 粘贴本文件全部内容 → Run
-- 幂等：可重复执行。
--
-- ⚠️ 全文一律平铺语句，不使用 do $$ ... $$ 块与 $$ 函数体：
--    该控制台会按分号截断 dollar-quoted 块（upgrade v1 曾因此半途失败）。
--    若整份执行报语法错误，改为逐条选中执行。
--
-- 执行后前端无需改动配置；重启页面即可（应用不会自动建表）。
-- ============================================================

-- ---------- 1. 打卡记录放开「课程到课」引用类型 ----------
-- 约束名由 PG 按「表名_列名_check」自动生成，标识符带大小写，必须加双引号引用。

alter table "checkinRecords" drop constraint if exists "checkinRecords_refType_check";

alter table "checkinRecords" add constraint "checkinRecords_refType_check"
  check ("refType" in ('plan_task', 'review_task', 'course_rule'));

-- ---------- 2. 家长手工加减积分流水 ----------

create table if not exists "pointAdjustments" (
  "id"        text    primary key,
  "userId"    uuid    not null default auth.uid(),
  "familyId"  text    not null,
  "childId"   text    not null,
  "date"      text    not null,
  "points"    integer not null,
  "reason"    text    not null,
  "createdAt" bigint  not null,
  "updatedAt" bigint  not null
);

-- ---------- 3. 兑换品（家长自定义并定价） ----------

create table if not exists "rewards" (
  "id"          text    primary key,
  "userId"      uuid    not null default auth.uid(),
  "familyId"    text    not null,
  "childId"     text    not null,
  "title"       text    not null,
  "emoji"       text    not null,
  "description" text,
  "cost"        integer not null check ("cost" > 0),
  "isActive"    boolean not null default true,
  "createdAt"   bigint  not null,
  "updatedAt"   bigint  not null
);

-- ---------- 4. 兑换单（孩子下单 → 家长确认才扣分） ----------

create table if not exists "redemptions" (
  "id"          text    primary key,
  "userId"      uuid    not null default auth.uid(),
  "familyId"    text    not null,
  "childId"     text    not null,
  "rewardId"    text    not null,
  "rewardTitle" text    not null,
  "rewardEmoji" text    not null,
  "cost"        integer not null,
  "status"      text    not null default 'pending'
                check ("status" in ('pending', 'approved', 'rejected')),
  "requestedBy" uuid    not null default auth.uid(),
  "requestedAt" bigint  not null,
  "reviewedBy"  uuid,
  "reviewedAt"  bigint,
  "createdAt"   bigint  not null,
  "updatedAt"   bigint  not null
);

-- ---------- 5. 索引 ----------

create index if not exists "pointAdjustments_family" on "pointAdjustments" ("familyId", "childId", "date");
create index if not exists "rewards_family"         on "rewards"          ("familyId", "childId");
create index if not exists "redemptions_family"     on "redemptions"      ("familyId", "childId", "status");

-- ---------- 6. 行级安全（与其他业务表同一口径：限定我可见的家庭） ----------

alter table "pointAdjustments" enable row level security;
drop policy if exists "family_access" on "pointAdjustments";
create policy "family_access" on "pointAdjustments" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

alter table "rewards" enable row level security;
drop policy if exists "family_access" on "rewards";
create policy "family_access" on "rewards" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

alter table "redemptions" enable row level security;
drop policy if exists "family_access" on "redemptions";
create policy "family_access" on "redemptions" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

-- ---------- 7. 执行后自检（应返回 3 行） ----------
-- select table_name from information_schema.tables
--   where table_schema = 'public'
--     and table_name in ('pointAdjustments', 'rewards', 'redemptions');
