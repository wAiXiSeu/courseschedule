-- ============================================================
-- 订正：把科目「画画」(art) 改名为「美术」
--
-- 校内美术课复用了默认科目 art（原名「画画」），故显示为画画。
-- 这里把该科目名改成「美术」，课程数据无需改动。
--
-- 用法：Supabase Dashboard → SQL Editor → 粘贴 → Run
-- 幂等：可重复执行。
-- ============================================================

do $$
declare
  v_email text := 'REPLACE_WITH_YOUR_LOGIN_EMAIL';   -- ← 运行前改成你的登录邮箱
  v_uid   uuid;
  v_family text;
  v_now   bigint := floor(extract(epoch from now()) * 1000);
begin
  select id into v_uid from auth.users where lower(email) = lower(v_email);
  if v_uid is null then raise exception '未找到账号 %', v_email; end if;

  select id into v_family from families where "ownerUserId" = v_uid order by "createdAt" limit 1;
  if v_family is null then raise exception '未找到该账号的家庭空间，请先在应用登录一次'; end if;

  update "subjects"
     set "name" = '美术', "updatedAt" = v_now
   where "familyId" = v_family and "id" = 'art';

  -- 若该空间还没有 art 科目行（极少数情况），补一条
  insert into "subjects" ("id","userId","familyId","name","category","color","createdAt","updatedAt")
    values ('art', v_uid, v_family, '美术', 'art', '#D81B60', v_now, v_now)
    on conflict ("familyId","id") do update set "name" = '美术', "updatedAt" = v_now;

  raise notice '已将科目「画画」订正为「美术」（family=%）', v_family;
end
$$;
