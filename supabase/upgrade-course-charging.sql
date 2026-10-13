-- ============================================================
-- 增量升级脚本：课程类型新增「充电」
--
-- 用途：给【已部署】的库放开 courses.type 检查约束，允许 'charging'。
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

-- 约束名由 PG 按「表名_列名_check」自动生成，标识符带大小写，必须加双引号引用。

alter table "courses" drop constraint if exists "courses_type_check";

alter table "courses" add constraint "courses_type_check"
  check ("type" in ('school', 'extracurricular', 'charging'));