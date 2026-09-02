-- ============================================================
-- 一次性升级/修复脚本 v2：userId 隔离 → 家庭空间（familyId）隔离
--
-- 与 v1 的区别：全部使用「平铺语句」，不使用 do $$ ... $$ 块
--   （opentrust 自建控制台会按分号截断 dollar-quoted 块，v1 的
--     回填 UPDATE 未执行、孤儿兜底却执行了，导致多账号数据被
--     盖章到同一个家庭、唯一索引创建报 23505）。
-- 本脚本会【覆盖式】按「创建人 → 其个人家庭」重新映射所有行的
-- familyId，因此也能修复 v1 半途失败留下的错误盖章。
--
-- 用法：SQL Editor 整份执行；若报「函数创建失败」等语法错误，
--       说明控制台连 return(...) 形式也截断，改逐条选中执行。
-- 完成后无需再执行 supabase/schema.sql（本文件已补齐全部索引与策略）；
--   schema.sql 仅用于全新的空库。
-- ============================================================

-- ---------- 0.（可选）执行前只读诊断 ----------
-- select "familyId", count(*) from "subjects" group by "familyId" order by 2 desc;
-- select "id", "ownerUserId", "name" from "families" order by "createdAt";

-- ---------- 1. 家庭表 ----------

create table if not exists "families" (
  "id"          text primary key,
  "userId"      uuid not null default auth.uid(),
  "ownerUserId" uuid not null,
  "name"        text not null,
  "createdAt"   bigint not null,
  "updatedAt"   bigint not null
);

create table if not exists "familyMembers" (
  "id"        text primary key,
  "userId"    uuid,
  "familyId"  text not null references "families" ("id") on delete cascade,
  "email"     text not null,
  "status"    text not null default 'pending'
              check ("status" in ('pending', 'accepted', 'declined')),
  "invitedBy" uuid not null default auth.uid(),
  "createdAt" bigint not null,
  "updatedAt" bigint not null
);

create index if not exists "familyMembers_family" on "familyMembers" ("familyId");

-- ---------- 2. 每个账号确保有一个个人家庭（幂等） ----------

insert into "families" ("id", "userId", "ownerUserId", "name", "createdAt", "updatedAt")
select
  gen_random_uuid()::text,
  u."id",
  u."id",
  coalesce(split_part(lower(u."email"), '@', 1), '我的') || '的空间',
  floor(extract(epoch from now()) * 1000)::bigint,
  floor(extract(epoch from now()) * 1000)::bigint
from "auth"."users" u
where not exists (select 1 from "families" f where f."ownerUserId" = u."id");

-- ---------- 3. 用户 → 家庭映射表（一 owner 取最早建的那个） ----------

drop table if exists "tmp_userFamily";

create unlogged table "tmp_userFamily" as
select distinct on ("ownerUserId") "ownerUserId", "id" as "familyId"
  from "families"
 order by "ownerUserId", "createdAt" asc;

-- ---------- 4. 业务表补列 + 覆盖式回填 familyId ----------

alter table "courses"             add column if not exists "familyId" text;
alter table "scheduleRules"       add column if not exists "familyId" text;
alter table "courseCancellations" add column if not exists "familyId" text;
alter table "learningPlans"       add column if not exists "familyId" text;
alter table "planTasks"           add column if not exists "familyId" text;
alter table "reviewItems"         add column if not exists "familyId" text;
alter table "reviewTasks"         add column if not exists "familyId" text;
alter table "checkinRecords"      add column if not exists "familyId" text;
alter table "mistakes"            add column if not exists "familyId" text;
alter table "subjects"            add column if not exists "familyId" text;

update "courses" s set "familyId" = m."familyId" from "tmp_userFamily" m where m."ownerUserId" = s."userId" and s."familyId" is distinct from m."familyId";
update "scheduleRules" s set "familyId" = m."familyId" from "tmp_userFamily" m where m."ownerUserId" = s."userId" and s."familyId" is distinct from m."familyId";
update "courseCancellations" s set "familyId" = m."familyId" from "tmp_userFamily" m where m."ownerUserId" = s."userId" and s."familyId" is distinct from m."familyId";
update "learningPlans" s set "familyId" = m."familyId" from "tmp_userFamily" m where m."ownerUserId" = s."userId" and s."familyId" is distinct from m."familyId";
update "planTasks" s set "familyId" = m."familyId" from "tmp_userFamily" m where m."ownerUserId" = s."userId" and s."familyId" is distinct from m."familyId";
update "reviewItems" s set "familyId" = m."familyId" from "tmp_userFamily" m where m."ownerUserId" = s."userId" and s."familyId" is distinct from m."familyId";
update "reviewTasks" s set "familyId" = m."familyId" from "tmp_userFamily" m where m."ownerUserId" = s."userId" and s."familyId" is distinct from m."familyId";
update "checkinRecords" s set "familyId" = m."familyId" from "tmp_userFamily" m where m."ownerUserId" = s."userId" and s."familyId" is distinct from m."familyId";
update "mistakes" s set "familyId" = m."familyId" from "tmp_userFamily" m where m."ownerUserId" = s."userId" and s."familyId" is distinct from m."familyId";
update "subjects" s set "familyId" = m."familyId" from "tmp_userFamily" m where m."ownerUserId" = s."userId" and s."familyId" is distinct from m."familyId";

-- 同一空间内同 id 科目去重（v1 错误盖章可能已产生重复行，保留 rowId 最小的一条）
delete from "subjects" a
 using "subjects" b
 where a."familyId" = b."familyId" and a."id" = b."id" and a."rowId" > b."rowId";

-- v1 错误盖章遗留、但创建人已无家庭/账号已注销的行：清回 NULL（不可见，不参与唯一索引）
update "courses" set "familyId" = null where "userId" not in (select "ownerUserId" from "tmp_userFamily");
update "scheduleRules" set "familyId" = null where "userId" not in (select "ownerUserId" from "tmp_userFamily");
update "courseCancellations" set "familyId" = null where "userId" not in (select "ownerUserId" from "tmp_userFamily");
update "learningPlans" set "familyId" = null where "userId" not in (select "ownerUserId" from "tmp_userFamily");
update "planTasks" set "familyId" = null where "userId" not in (select "ownerUserId" from "tmp_userFamily");
update "reviewItems" set "familyId" = null where "userId" not in (select "ownerUserId" from "tmp_userFamily");
update "reviewTasks" set "familyId" = null where "userId" not in (select "ownerUserId" from "tmp_userFamily");
update "checkinRecords" set "familyId" = null where "userId" not in (select "ownerUserId" from "tmp_userFamily");
update "mistakes" set "familyId" = null where "userId" not in (select "ownerUserId" from "tmp_userFamily");
update "subjects" set "familyId" = null where "userId" not in (select "ownerUserId" from "tmp_userFamily");

-- ---------- 5. 唯一索引切到 familyId 口径 ----------

drop index if exists "checkinRecords_uq";
create unique index if not exists "checkinRecords_uq"
  on "checkinRecords" ("familyId", "childId", "date", "refType", "refId");

-- subjects / courseCancellations 上残留的表级唯一约束（旧 userId 口径）动态删除；
-- 这是本文件唯一的 do-block，若控制台仍截断：手动执行
--   select conrelid::regclass, conname from pg_constraint where contype='u'
--     and conrelid in ('subjects'::regclass, 'courseCancellations'::regclass);
-- 再逐条 alter table ... drop constraint ...;
do $blk$
declare r record;
begin
  for r in
    select conrelid::regclass::text as tbl, conname
      from pg_constraint
     where contype = 'u'
       and conrelid in ('"subjects"'::regclass, '"courseCancellations"'::regclass)
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
  end loop;
end
$blk$;

create unique index if not exists "subjects_family_id_uq"
  on "subjects" ("familyId", "id");
create unique index if not exists "cancellations_family_rule_date_uq"
  on "courseCancellations" ("familyId", "ruleId", "date");

-- ---------- 6. 权限辅助函数（return 形式，避免 dollar-quote 函数体） ----------

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

-- ---------- 7. RLS 策略：平铺逐表（先清 owner 旧策略） ----------

alter table "courses" enable row level security;
drop policy if exists "owner" on "courses";
drop policy if exists "family_access" on "courses";
create policy "family_access" on "courses" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

alter table "scheduleRules" enable row level security;
drop policy if exists "owner" on "scheduleRules";
drop policy if exists "family_access" on "scheduleRules";
create policy "family_access" on "scheduleRules" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

alter table "courseCancellations" enable row level security;
drop policy if exists "owner" on "courseCancellations";
drop policy if exists "family_access" on "courseCancellations";
create policy "family_access" on "courseCancellations" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

alter table "learningPlans" enable row level security;
drop policy if exists "owner" on "learningPlans";
drop policy if exists "family_access" on "learningPlans";
create policy "family_access" on "learningPlans" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

alter table "planTasks" enable row level security;
drop policy if exists "owner" on "planTasks";
drop policy if exists "family_access" on "planTasks";
create policy "family_access" on "planTasks" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

alter table "reviewItems" enable row level security;
drop policy if exists "owner" on "reviewItems";
drop policy if exists "family_access" on "reviewItems";
create policy "family_access" on "reviewItems" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

alter table "reviewTasks" enable row level security;
drop policy if exists "owner" on "reviewTasks";
drop policy if exists "family_access" on "reviewTasks";
create policy "family_access" on "reviewTasks" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

alter table "checkinRecords" enable row level security;
drop policy if exists "owner" on "checkinRecords";
drop policy if exists "family_access" on "checkinRecords";
create policy "family_access" on "checkinRecords" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

alter table "mistakes" enable row level security;
drop policy if exists "owner" on "mistakes";
drop policy if exists "family_access" on "mistakes";
create policy "family_access" on "mistakes" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

alter table "subjects" enable row level security;
drop policy if exists "owner" on "subjects";
drop policy if exists "family_access" on "subjects";
create policy "family_access" on "subjects" for all to authenticated
  using ("familyId" in (select "myFamilyIds"()))
  with check ("familyId" in (select "myFamilyIds"()));

-- 家庭表策略
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

alter table "familyMembers" enable row level security;
drop policy if exists "member_visible" on "familyMembers";
create policy "member_visible" on "familyMembers" for select to authenticated
  using ("userId" = auth.uid() or lower("email") = "myEmail"() or "isFamilyOwner"("familyId"));
drop policy if exists "member_invite" on "familyMembers";
create policy "member_invite" on "familyMembers" for insert to authenticated
  with check ("status" = 'pending' and "userId" is null and "invitedBy" = auth.uid() and "isFamilyOwner"("familyId"));
drop policy if exists "member_respond" on "familyMembers";
create policy "member_respond" on "familyMembers" for update to authenticated
  using ("userId" = auth.uid() or lower("email") = "myEmail"())
  with check ("userId" = auth.uid() or lower("email") = "myEmail"());
drop policy if exists "member_leave" on "familyMembers";
create policy "member_leave" on "familyMembers" for delete to authenticated
  using ("userId" = auth.uid() or "isFamilyOwner"("familyId"));

-- ---------- 8. 其余业务索引（幂等补齐） ----------

create index if not exists "courses_family"        on "courses"             ("familyId", "childId");
create index if not exists "scheduleRules_family"  on "scheduleRules"       ("familyId", "childId");
create index if not exists "scheduleRules_course"  on "scheduleRules"       ("courseId");
create index if not exists "cancellations_rule"    on "courseCancellations" ("ruleId", "date");
create index if not exists "learningPlans_family"  on "learningPlans"       ("familyId", "childId");
create index if not exists "planTasks_plan"        on "planTasks"           ("planId");
create index if not exists "reviewItems_family"    on "reviewItems"         ("familyId", "childId");
create index if not exists "reviewTasks_item"      on "reviewTasks"         ("reviewItemId", "dueDate");
create index if not exists "mistakes_family"       on "mistakes"            ("familyId", "childId", "mistakeDate");
drop index if exists "familyMembers_uq_email";
create unique index if not exists "familyMembers_uq_email"
  on "familyMembers" ("familyId", lower("email"));
drop index if exists "familyMembers_uq_user";
create unique index if not exists "familyMembers_uq_user"
  on "familyMembers" ("familyId", "userId") where "userId" is not null;

-- 未使用的 children 表移除
drop table if exists "children";

-- ---------- 9. 清理映射临时表 + 执行后核对 ----------

drop table if exists "tmp_userFamily";

-- 应无输出（familyId 为空的行仅可能来自已注销账号）：
--   select 'courses' t, count(*) n from "courses" where "familyId" is null
--   union all select 'subjects', count(*) from "subjects" where "familyId" is null;
