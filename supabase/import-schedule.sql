-- ============================================================
-- 新学期课表导入 · 一（3）班 · 夏令时 · 2026 秋学期
--
-- 用法：
--   1. Supabase Dashboard → SQL Editor → 粘贴本文件 → Run；
--   2. 回到应用刷新「课程表」即可看到。
--
-- 校历对齐（南京市 2026~2027 学年第一学期）：
--   · 正式上课 2026-09-01（周二）；寒假 2027-01-27 起 → 课表有效期 2026-09-01 ~ 2027-01-26。
--   · 国庆 10-01~10-07：对占用到的工作日自动生成「课程取消」（在应用里显示为已取消）。
--   · 秋假（校历仅注明 10-11 月期间）：日期确定后，按第 7 步的格式追加即可。
--   · 期末（第 21 周 1/18~1/24）：非节假日，默认保留正课，如需清空该周同样在第 7 步追加。
--
-- 特性：幂等，可重复执行（每次先清掉上次导入的 imp_% 行再重建）。
-- ============================================================

do $$
declare
  v_email  text   := 'REPLACE_WITH_YOUR_LOGIN_EMAIL';   -- ← 运行前改成你的登录邮箱
  v_child  text   := 'default-child';
  v_from   text   := '2026-09-01';   -- 开学
  v_until  text   := '2027-01-26';   -- 末次上课日（寒假前一天）
  v_uid    uuid;
  v_family text;
  v_now    bigint := floor(extract(epoch from now()) * 1000);
begin
  /* 1. 定位账号 */
  select id into v_uid from auth.users where lower(email) = lower(v_email);
  if v_uid is null then
    raise exception '未找到账号 %：请先在应用里注册/登录一次，再重跑', v_email;
  end if;

  /* 2. 定位（或创建）个人家庭空间 */
  select id into v_family
    from families where "ownerUserId" = v_uid order by "createdAt" limit 1;
  if v_family is null then
    v_family := 'fam_' || replace(gen_random_uuid()::text, '-', '');
    insert into families ("id","userId","ownerUserId","name","createdAt","updatedAt")
      values (v_family, v_uid, v_uid, '我的空间', v_now, v_now);
  end if;

  /* 3. 清理上次导入（幂等） */
  delete from "courseCancellations" where "familyId" = v_family and "id" like 'imp_cancel_%';
  delete from "scheduleRules"        where "familyId" = v_family and "id" like 'imp_rule_%';
  delete from "courses"              where "familyId" = v_family and "id" like 'imp_course_%';

  /* 4. 补齐校内科目（已存在则更新名称/类别/颜色） */
  insert into "subjects" ("id","userId","familyId","name","category","color","createdAt","updatedAt") values
    ('pe',       v_uid, v_family, '体育与健康',   'sports',  '#00897B', v_now, v_now),
    ('music',    v_uid, v_family, '音乐',         'art',     '#AB47BC', v_now, v_now),
    ('science',  v_uid, v_family, '科学',         'general', '#039BE5', v_now, v_now),
    ('morality', v_uid, v_family, '道德与法治',   'basic',   '#5E35B1', v_now, v_now),
    ('labor',    v_uid, v_family, '劳动',         'general', '#8D6E63', v_now, v_now),
    ('practice', v_uid, v_family, '综合实践活动', 'general', '#EF6C00', v_now, v_now),
    ('team',     v_uid, v_family, '少先队/心理健康','general','#C2185B', v_now, v_now)
  on conflict ("familyId","id") do update
    set "name" = excluded."name",
        "category" = excluded."category",
        "color" = excluded."color",
        "updatedAt" = excluded."updatedAt";

  /* 5. 课程（10 门）—— color 存科目 id，note 存任课老师 */
  insert into "courses"
    ("id","userId","familyId","childId","name","type","location","color","note","createdAt","updatedAt") values
    ('imp_course_chinese', v_uid, v_family, v_child, '语文',             'school', null, 'chinese',  '吴起璐', v_now, v_now),
    ('imp_course_math',    v_uid, v_family, v_child, '数学',             'school', null, 'math',     '施娅林', v_now, v_now),
    ('imp_course_pe',      v_uid, v_family, v_child, '体育与健康',       'school', null, 'pe',       null,     v_now, v_now),
    ('imp_course_music',   v_uid, v_family, v_child, '音乐',             'school', null, 'music',    '徐晶',   v_now, v_now),
    ('imp_course_art',     v_uid, v_family, v_child, '美术',             'school', null, 'art',      '陈佳瑶', v_now, v_now),
    ('imp_course_science', v_uid, v_family, v_child, '科学',             'school', null, 'science',  '李珏',   v_now, v_now),
    ('imp_course_morality',v_uid, v_family, v_child, '道德与法治',       'school', null, 'morality', '武昊雷', v_now, v_now),
    ('imp_course_labor',   v_uid, v_family, v_child, '劳动',             'school', null, 'labor',    '刘诗媛', v_now, v_now),
    ('imp_course_practice',v_uid, v_family, v_child, '综合实践活动',     'school', null, 'practice', '施娅林', v_now, v_now),
    ('imp_course_team',    v_uid, v_family, v_child, '少先队/心理健康',  'school', null, 'team',     '吴起璐', v_now, v_now);

  /* 6. 排课规则（26 条）：weekday 1=周一 … 5=周五；有效期 2026-09-01 ~ 2027-01-26 */
  insert into "scheduleRules"
    ("id","userId","familyId","childId","courseId","weekday","startTime","endTime","repeatType","effectiveFrom","effectiveUntil","isActive","createdAt","updatedAt")
  select
    'imp_rule_' || (row_number() over ())::text,
    v_uid, v_family, v_child, r.course, r.wd, r.st, r.en, 'weekly', v_from, v_until, true, v_now, v_now
  from (values
    -- 语文
    ('imp_course_chinese', 1, '08:20','09:00'),
    ('imp_course_chinese', 2, '08:20','09:00'),
    ('imp_course_chinese', 2, '09:35','10:15'),
    ('imp_course_chinese', 3, '08:20','09:00'),
    ('imp_course_chinese', 4, '10:30','11:10'),
    ('imp_course_chinese', 4, '13:45','14:20'),
    ('imp_course_chinese', 5, '08:20','09:00'),
    -- 数学
    ('imp_course_math', 1, '09:35','10:15'),
    ('imp_course_math', 2, '10:30','11:10'),
    ('imp_course_math', 4, '08:20','09:00'),
    ('imp_course_math', 5, '09:35','10:15'),
    -- 体育与健康
    ('imp_course_pe', 1, '10:30','11:10'),
    ('imp_course_pe', 2, '13:45','14:20'),
    ('imp_course_pe', 3, '13:45','14:20'),
    ('imp_course_pe', 4, '11:25','12:00'),
    ('imp_course_pe', 5, '10:30','11:10'),
    -- 音乐
    ('imp_course_music', 1, '11:25','12:00'),
    ('imp_course_music', 2, '14:55','15:35'),
    -- 美术
    ('imp_course_art', 3, '11:25','12:00'),
    ('imp_course_art', 4, '09:35','10:15'),
    -- 科学
    ('imp_course_science', 3, '10:30','11:10'),
    -- 道德与法治
    ('imp_course_morality', 2, '11:25','12:00'),
    ('imp_course_morality', 5, '11:25','12:00'),
    -- 劳动
    ('imp_course_labor', 1, '13:45','14:20'),
    -- 综合实践活动
    ('imp_course_practice', 3, '09:35','10:15'),
    -- 少先队/心理健康
    ('imp_course_team', 5, '13:45','14:20')
  ) as r(course, wd, st, en);

  /* 7. 节假日课程取消：命中该 weekday 的规则当天标记为已取消。
        国庆占用工作日已列出；秋假/其它调休按同样格式追加。 */
  insert into "courseCancellations"
    ("id","userId","familyId","childId","courseId","ruleId","date","reason","createdAt","updatedAt")
  select
    'imp_cancel_' || (row_number() over ())::text,
    v_uid, v_family, v_child, r."courseId", r."id", h.hday, h.reason, v_now, v_now
  from (values
    ('2026-10-01'::text, '国庆假期'),
    ('2026-10-02',       '国庆假期'),
    ('2026-10-05',       '国庆假期'),
    ('2026-10-06',       '国庆假期'),
    ('2026-10-07',       '国庆假期')
    -- 秋假示例（确定日期后取消注释并改成实际安排）：
    -- , ('2026-11-16', '秋假'), ('2026-11-17', '秋假'), ('2026-11-18', '秋假')
  ) as h(hday, reason)
  join "scheduleRules" r
    on  r."familyId" = v_family
    and r."id" like 'imp_rule_%'
    and r."weekday" = extract(isodow from to_date(h.hday, 'YYYY-MM-DD'))::int;

  raise notice '导入完成：family=%，课程 10 门 / 排课 26 条 / 有效期 % ~ %', v_family, v_from, v_until;
end
$$;
