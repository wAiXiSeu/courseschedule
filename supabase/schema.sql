-- ============================================================
-- 小朋友学习助手 · Supabase 建表脚本
--
-- 用法：Supabase Dashboard → SQL Editor → 粘贴本文件全部内容 → Run
-- 幂等：可重复执行，不会破坏已有数据
-- 已有旧库（userId 隔离版）：请先执行 supabase/upgrade-to-family.sql
--
-- 数据隔离模型：家庭空间（family）
--   · 每个账号注册后自动有一个个人家庭，默认数据不与其他账号共享。
--   · 家长可按邮箱邀请另一个账号；对方在应用内「接受」后，
--     两人共同管理该家庭下的数据。
--   · 业务表全部带 "familyId"，读写由 RLS 限定到「我拥有或我已加入」的家庭。
--
-- 其他约定：
--   · 列名与 packages/shared/src/domain/models.ts 的 TS 字段 1:1，
--     加双引号保持 camelCase，前端无需字段映射层。
--   · "id" 由前端 genId() 生成（21 位），时间戳为 epoch 毫秒 bigint。
--   · "userId" 表示「创建人」，由 default auth.uid() 服务端写入，不作为隔离键。
-- ============================================================

/* ─────────────── 家庭空间与成员 ─────────────── */

create table if not exists "families" (
  "id"          text primary key,
  "userId"      uuid not null default auth.uid(),
  "ownerUserId" uuid not null,
  "name"        text not null,
  "createdAt"   bigint not null,
  "updatedAt"   bigint not null
);

-- 仅记录「被邀请的成员」；家长由 families.ownerUserId 表达，不占成员行
create table if not exists "familyMembers" (
  "id"        text primary key,
  "userId"    uuid,                        -- 受邀人接受后回填；待确认时为空
  "familyId"  text not null references "families" ("id") on delete cascade,
  "email"     text not null,               -- 邀请时填写的账号邮箱
  "status"    text not null default 'pending'
              check ("status" in ('pending', 'accepted', 'declined')),
  "invitedBy" uuid not null default auth.uid(),
  "createdAt" bigint not null,
  "updatedAt" bigint not null
);

/* ─────────────── 课程与排课 ─────────────── */

create table if not exists "courses" (
  "id"        text primary key,
  "userId"    uuid not null default auth.uid(),
  "familyId"  text not null,
  "childId"   text not null,
  "name"      text not null,
  "type"      text not null check ("type" in ('school', 'extracurricular', 'charging')),
  "location"  text,
  "color"     text not null,
  "note"      text,
  "createdAt" bigint not null,
  "updatedAt" bigint not null
);

create table if not exists "scheduleRules" (
  "id"             text primary key,
  "userId"         uuid    not null default auth.uid(),
  "familyId"       text    not null,
  "childId"        text    not null,
  "courseId"       text    not null references "courses" ("id") on delete cascade,
  "weekday"        smallint not null check ("weekday" between 0 and 6),
  "startTime"      text    not null,
  "endTime"        text    not null,
  "repeatType"     text    not null default 'weekly' check ("repeatType" = 'weekly'),
  "effectiveFrom"  text    not null,
  "effectiveUntil" text,
  "isActive"       boolean not null default true,
  "location"       text,
  "note"           text,
  "createdAt"      bigint  not null,
  "updatedAt"      bigint  not null
);

/* ─────────────── 课程取消 ─────────────── */

create table if not exists "courseCancellations" (
  "id"        text primary key,
  "userId"    uuid   not null default auth.uid(),
  "familyId"  text   not null,
  "childId"   text   not null,
  "courseId"  text   not null,
  "ruleId"    text   not null,
  "date"      text   not null,
  "reason"    text   not null,
  "createdAt" bigint not null,
  "updatedAt" bigint not null,
  unique ("familyId", "ruleId", "date")
);

/* ─────────────── 学习计划 ─────────────── */

create table if not exists "learningPlans" (
  "id"          text primary key,
  "userId"      uuid not null default auth.uid(),
  "familyId"    text not null,
  "childId"     text not null,
  "title"       text not null,
  "description" text,
  "subject"     text not null,
  "startDate"   text not null,
  "endDate"     text not null,
  "status"      text not null check ("status" in ('active', 'completed', 'archived')),
  "createdAt"   bigint not null,
  "updatedAt"   bigint not null
);

create table if not exists "planTasks" (
  "id"           text primary key,
  "userId"       uuid    not null default auth.uid(),
  "familyId"     text    not null,
  "childId"      text    not null,
  "planId"       text    not null references "learningPlans" ("id") on delete cascade,
  "title"        text    not null,
  "description"  text,
  "frequency"    text    not null check ("frequency" in ('daily', 'weekly', 'once')),
  "weekdays"     jsonb,
  "specificDate" text,
  "durationMin"  integer,
  "isActive"     boolean not null default true,
  "createdAt"    bigint  not null,
  "updatedAt"    bigint  not null
);

/* ─────────────── 复习项 / 复习任务 ─────────────── */

create table if not exists "reviewItems" (
  "id"                 text primary key,
  "userId"             uuid  not null default auth.uid(),
  "familyId"           text  not null,
  "childId"            text  not null,
  "title"              text  not null,
  "subject"            text  not null,
  "learnDate"          text  not null,
  "intervals"          jsonb not null default '[]'::jsonb,
  "intervalTemplateId" text,
  "sourceType"         text  not null check ("sourceType" in ('manual', 'mistake')),
  "sourceId"           text,
  "createdAt"          bigint not null,
  "updatedAt"          bigint not null
);

create table if not exists "reviewTasks" (
  "id"            text primary key,
  "userId"        uuid     not null default auth.uid(),
  "familyId"      text     not null,
  "childId"       text     not null,
  "reviewItemId"  text     not null references "reviewItems" ("id") on delete cascade,
  "intervalIndex" smallint not null,
  "dueDate"       text     not null,
  "status"        text     not null check ("status" in ('pending', 'done', 'skipped')),
  "doneAt"        bigint,
  "createdAt"     bigint   not null,
  "updatedAt"     bigint   not null
);

/* ─────────────── 打卡 ─────────────── */

create table if not exists "checkinRecords" (
  "id"        text primary key,
  "userId"    uuid    not null default auth.uid(),
  "familyId"  text    not null,
  "childId"   text    not null,
  -- course_rule：课程到课打卡，"refId" 存排课规则 id，配合 "date" 唯一定位一次上课
  "refType"   text    not null
              check ("refType" in ('plan_task', 'review_task', 'course_rule')),
  "refId"     text    not null,
  "date"      text    not null,
  "doneAt"    bigint  not null,
  "isMakeup"  boolean not null default false,
  "createdAt" bigint  not null,
  "updatedAt" bigint  not null
);

/* ─────────────── 积分与奖励 ───────────────
   积分余额 = 由打卡/错题实时派生的分 + 手工加减 − 已确认兑换。
   派生部分不落库（撤销打卡即自动回冲），本段只存两类真实发生的账。 */

-- 家长手工加减积分流水（"points" 可为负，如奖励计划外努力或抵扣违规）
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

-- 兑换品：家长自定义标题、贴纸图标与价格；isActive=false 仅下架，不删历史
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

-- 兑换单：孩子下单 → 家长确认才真正扣积分。
-- title/emoji/cost 为下单时快照，奖励之后改名、改价或下架都不影响历史单据。
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

/* ─────────────── 错题本 ─────────────── */

create table if not exists "mistakes" (
  "id"              text primary key,
  "userId"          uuid  not null default auth.uid(),
  "familyId"        text  not null,
  "childId"         text  not null,
  "subject"         text  not null,
  "knowledgePoints" jsonb not null default '[]'::jsonb,
  "questionText"    text  not null,
  "imageIds"        jsonb not null default '[]'::jsonb,
  "reasonTags"      jsonb not null default '[]'::jsonb,
  "mistakeDate"     text  not null,
  "masteryStatus"   text  not null check ("masteryStatus" in ('pending', 'mastered')),
  "createdAt"       bigint not null,
  "updatedAt"       bigint not null
);

/* ─────────────── 科目（家庭级：同家庭成员共用一套科目） ─────────────── */

create table if not exists "subjects" (
  "rowId"     bigint generated always as identity primary key,
  "userId"    uuid not null default auth.uid(),
  "familyId"  text not null,
  "id"        text not null,
  "name"      text not null,
  "category"  text not null check ("category" in ('basic', 'general', 'art', 'sports', 'chess')),
  "color"     text not null,
  "createdAt" bigint not null default (floor(extract(epoch from now()) * 1000)),
  "updatedAt" bigint not null default (floor(extract(epoch from now()) * 1000)),
  unique ("familyId", "id")
);

/* ─────────────── 索引 ─────────────── */

create index if not exists "courses_family"        on "courses"             ("familyId", "childId");
create index if not exists "scheduleRules_family"  on "scheduleRules"       ("familyId", "childId");
create index if not exists "scheduleRules_course"  on "scheduleRules"       ("courseId");
create index if not exists "cancellations_rule"    on "courseCancellations" ("ruleId", "date");
create index if not exists "learningPlans_family"  on "learningPlans"       ("familyId", "childId");
create index if not exists "planTasks_plan"        on "planTasks"           ("planId");
create index if not exists "reviewItems_family"    on "reviewItems"         ("familyId", "childId");
create index if not exists "reviewTasks_item"      on "reviewTasks"         ("reviewItemId", "dueDate");
create index if not exists "mistakes_family"       on "mistakes"            ("familyId", "childId", "mistakeDate");
create index if not exists "pointAdjustments_family" on "pointAdjustments"  ("familyId", "childId", "date");
create index if not exists "rewards_family"         on "rewards"             ("familyId", "childId");
create index if not exists "redemptions_family"     on "redemptions"         ("familyId", "childId", "status");
create unique index if not exists "familyMembers_uq_email"
  on "familyMembers" ("familyId", lower("email"));
create unique index if not exists "familyMembers_uq_user"
  on "familyMembers" ("familyId", "userId") where "userId" is not null;
create unique index if not exists "checkinRecords_uq"
  on "checkinRecords" ("familyId", "childId", "date", "refType", "refId");

/* ─────────────── 权限判断辅助函数 ───────────────
   SECURITY DEFINER：跨表判断而不触发 RLS 递归；只读，按当前 token 身份计算。
   用 PG14 的 RETURN (子查询) 形式，规避部分自建控制台截断 dollar-quote 块。 */

create or replace function "myEmail"() returns text
language sql stable security definer set search_path = public
return (select lower("email") from "auth"."users" where "id" = auth.uid());

create or replace function "myFamilyIds"() returns setof text
language sql stable security definer set search_path = public
return (
  select "id" from "families" where "ownerUserId" = auth.uid()
  union
  select "familyId" from "familyMembers"
    where "userId" = auth.uid() and "status" = 'accepted'
);

create or replace function "isFamilyOwner"("fid" text) returns boolean
language sql stable security definer set search_path = public
return (select exists (
  select 1 from "families" where "id" = "fid" and "ownerUserId" = auth.uid()
));

revoke all on function "myEmail"() from public;
revoke all on function "myFamilyIds"() from public;
revoke all on function "isFamilyOwner"("fid" text) from public;
grant execute on function "myEmail"() to authenticated;
grant execute on function "myFamilyIds"() to authenticated;
grant execute on function "isFamilyOwner"("fid" text) to authenticated;

/* ─────────────── 行级安全 ─────────────── */

-- 业务表：只能读写「我可见家庭」的数据（逐表平铺，规避 do $$ 块截断）
--   若控制台连 $blk$ 动态块（见 upgrade 脚本）也截断，这里保持同样平铺写法。

alter table "courses" enable row level security;
drop policy if exists "family_access" on "courses";
create policy "family_access" on "courses" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

alter table "scheduleRules" enable row level security;
drop policy if exists "family_access" on "scheduleRules";
create policy "family_access" on "scheduleRules" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

alter table "courseCancellations" enable row level security;
drop policy if exists "family_access" on "courseCancellations";
create policy "family_access" on "courseCancellations" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

alter table "learningPlans" enable row level security;
drop policy if exists "family_access" on "learningPlans";
create policy "family_access" on "learningPlans" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

alter table "planTasks" enable row level security;
drop policy if exists "family_access" on "planTasks";
create policy "family_access" on "planTasks" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

alter table "reviewItems" enable row level security;
drop policy if exists "family_access" on "reviewItems";
create policy "family_access" on "reviewItems" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

alter table "reviewTasks" enable row level security;
drop policy if exists "family_access" on "reviewTasks";
create policy "family_access" on "reviewTasks" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

alter table "checkinRecords" enable row level security;
drop policy if exists "family_access" on "checkinRecords";
create policy "family_access" on "checkinRecords" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

alter table "mistakes" enable row level security;
drop policy if exists "family_access" on "mistakes";
create policy "family_access" on "mistakes" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

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

alter table "subjects" enable row level security;
drop policy if exists "family_access" on "subjects";
create policy "family_access" on "subjects" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

-- 家庭：成员可见；任何人可建自己的家庭（个人空间）；仅家长可改名/删除
alter table "families" enable row level security;
drop policy if exists "family_visible" on "families";
create policy "family_visible" on "families" for select to authenticated
  using ("id" in (select "myFamilyIds"()));
drop policy if exists "family_create" on "families";
create policy "family_create" on "families" for insert to authenticated
  with check ("ownerUserId" = auth.uid());
drop policy if exists "family_manage" on "families";
create policy "family_manage" on "families" for update to authenticated
  using ("ownerUserId" = auth.uid())
  with check ("ownerUserId" = auth.uid());
drop policy if exists "family_delete" on "families";
create policy "family_delete" on "families" for delete to authenticated
  using ("ownerUserId" = auth.uid());

-- 成员邀请：家长只能落 pending（DB 层保证「必须对方同意」）；
-- 受邀人自己确认/拒绝；家长可移除成员，成员可自行退出。
alter table "familyMembers" enable row level security;
drop policy if exists "member_visible" on "familyMembers";
create policy "member_visible" on "familyMembers" for select to authenticated
  using (
    "userId" = auth.uid()
    or lower("email") = "myEmail"()
    or "isFamilyOwner"("familyId")
  );
drop policy if exists "member_invite" on "familyMembers";
create policy "member_invite" on "familyMembers" for insert to authenticated
  with check (
    "status" = 'pending'
    and "userId" is null
    and "invitedBy" = auth.uid()
    and "isFamilyOwner"("familyId")
  );
drop policy if exists "member_respond" on "familyMembers";
create policy "member_respond" on "familyMembers" for update to authenticated
  using (
    "userId" = auth.uid()
    or lower("email") = "myEmail"()
  )
  with check (
    "userId" = auth.uid()
    or lower("email") = "myEmail"()
  );
drop policy if exists "member_leave" on "familyMembers";
create policy "member_leave" on "familyMembers" for delete to authenticated
  using ("userId" = auth.uid() or "isFamilyOwner"("familyId"));

-- ============================================================
-- 上线后建议：Authentication → Providers → Email → 关闭 Confirm email，
-- 注册即可直接进入应用，无需邮箱确认。
-- ============================================================
