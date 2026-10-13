/**
 * 课程表页面
 *
 * 周视图网格（周一在前，课程色块按时间行排布）
 * 支持添加/编辑课程，删除二次确认
 */

import React, { useState } from 'react';
import { Box, Button, Fab, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useScheduleData } from './useScheduleData';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { CourseFormDialog } from './CourseFormDialog';
import { OccurrenceDialog } from './OccurrenceDialog';
import { useScheduleStore, courseRepo, ruleRepo } from '../../stores/useScheduleStore';
import { useAppStore, useIsParent } from '../../stores/useAppStore';
import { EmptyState } from '../../components/EmptyState';
import { pageHeadingSx, T, BORDER } from '../../app/tokens';
import { cancellationKey } from '../../data/repositories/courseCancellationRepository';
import { COURSE_TYPE_LABELS, COURSE_TYPE_ORDER } from '@courseschedule/shared';
import type { Course } from '@courseschedule/shared';
import type { CourseOccurrence } from '@courseschedule/shared';
import type { CourseFormData } from '../../stores/useScheduleStore';
import type { ScheduleRuleFormData } from '../../stores/useScheduleStore';

/**
 * 课程表页面
 */
export const SchedulePage: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    typeFilter,
    setTypeFilter,
    weekStart,
    weekOccurrences,
    monthStart,
    monthGridDays,
    cancellations,
    loading,
    goNextWeek,
    goPrevWeek,
    goThisWeek,
    goNextMonth,
    goPrevMonth,
    goThisMonth,
  } = useScheduleData();

  const courses = useScheduleStore((s) => s.courses);
  const rules = useScheduleStore((s) => s.rules);
  const createCourse = useScheduleStore((s) => s.createCourse);
  const updateCourse = useScheduleStore((s) => s.updateCourse);
  const deleteCourse = useScheduleStore((s) => s.deleteCourse);
  const cancelOccurrence = useScheduleStore((s) => s.cancelOccurrence);
  const uncancelOccurrence = useScheduleStore((s) => s.uncancelOccurrence);

  const childId = useAppStore((s) => s.childId);
  const isParent = useIsParent();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [actionOccurrence, setActionOccurrence] = useState<CourseOccurrence | null>(null);

  // 打开添加弹窗
  const handleAdd = () => {
    setEditingCourseId(null);
    setFormOpen(true);
  };

  // 打开编辑弹窗
  const handleEdit = async (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    const courseRules = rules.filter((r) => r.courseId === courseId);
    const existingRules: ScheduleRuleFormData[] = courseRules.map((r) => ({
      weekday: r.weekday,
      startTime: r.startTime,
      endTime: r.endTime,
      effectiveFrom: r.effectiveFrom,
      effectiveUntil: r.effectiveUntil,
    }));

    setEditingCourseId(courseId);
    setFormOpen(true);
  };

  // 保存课程
  const handleSave = async (data: CourseFormData) => {
    if (editingCourseId) {
      const course = courses.find((c) => c.id === editingCourseId);
      if (course) {
        await updateCourse(course, data);
      }
    } else {
      await createCourse(data);
    }
  };

  // 删除课程（含其所有排课规则）
  const handleDeleteCourse = async (course: Course) => {
    await deleteCourse(course.id);
  };

  // 判断是否为空
  const isEmpty = !loading && courses.length === 0;

  return (
    <Box sx={{ pb: 2 }}>
      {/* 页面标题 + 视角切换 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          px: 2.5,
          pt: 3,
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <Typography sx={pageHeadingSx}>课程表</Typography>

          {/* 周 / 月 视角切换 */}
          <Box
            sx={{
              display: 'inline-flex',
              border: BORDER,
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: `2px 2px 0 0 ${T.ink}`,
              bgcolor: T.paper,
            }}
          >
            {(['week', 'month'] as const).map((mode) => (
              <Box
                key={mode}
                component="button"
                type="button"
                onClick={() => setViewMode(mode)}
                sx={{
                  border: 'none',
                  outline: 'none',
                  px: 1.25,
                  py: 0.5,
                  fontFamily: 'inherit',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  bgcolor: viewMode === mode ? T.yellow : 'transparent',
                  color: viewMode === mode ? T.ink : T.textMuted,
                  transition: 'background-color 0.12s ease, color 0.12s ease',
                  '&:hover': {
                    backgroundColor: viewMode === mode ? T.yellow : T.gray,
                  },
                }}
              >
                {mode === 'week' ? '周视角' : '月视角'}
              </Box>
            ))}
          </Box>

          {/* 课程类型筛选：全部 / 校内 / 校外 / 充电 */}
          <Box
            sx={{
              display: 'inline-flex',
              border: BORDER,
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: `2px 2px 0 0 ${T.ink}`,
              bgcolor: T.paper,
            }}
          >
            {([
              { value: 'all', label: '全部' },
              ...COURSE_TYPE_ORDER.map((t) => ({ value: t, label: COURSE_TYPE_LABELS[t] })),
            ] as const).map((opt) => (
              <Box
                key={opt.value}
                component="button"
                type="button"
                onClick={() => setTypeFilter(opt.value)}
                sx={{
                  border: 'none',
                  outline: 'none',
                  px: 1.5,
                  py: 0.5,
                  fontFamily: 'inherit',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  bgcolor: typeFilter === opt.value ? T.yellow : 'transparent',
                  color: typeFilter === opt.value ? T.ink : T.textMuted,
                  transition: 'background-color 0.12s ease, color 0.12s ease',
                  '&:hover': {
                    backgroundColor: typeFilter === opt.value ? T.yellow : T.gray,
                  },
                }}
              >
                {opt.label}
              </Box>
            ))}
          </Box>
        </Box>

        {isParent && (
          <Button variant="contained" color="primary" size="small" startIcon={<AddIcon />} onClick={handleAdd}>
            添加课程
          </Button>
        )}
      </Box>

      {/* 周 / 月 视图 */}
      {isEmpty ? (
        <EmptyState
          emoji="📚"
          title="还没有课程"
          description={
            isParent
              ? '点击右上角「添加课程」开始排课吧！'
              : '家长还没有安排课程，休息日快乐～'
          }
          action={
            isParent ? (
              <Button variant="contained" onClick={handleAdd}>
                添加第一门课程
              </Button>
            ) : undefined
          }
        />
      ) : viewMode === 'week' ? (
        <WeekView
          weekStart={weekStart}
          weekOccurrences={weekOccurrences}
          cancellations={cancellations}
          onPrevWeek={goPrevWeek}
          onNextWeek={goNextWeek}
          onThisWeek={goThisWeek}
          onCourseClick={isParent ? (occ) => setActionOccurrence(occ) : undefined}
        />
      ) : (
        <MonthView
          monthStart={monthStart}
          gridDays={monthGridDays}
          cancellations={cancellations}
          onPrevMonth={goPrevMonth}
          onNextMonth={goNextMonth}
          onThisMonth={goThisMonth}
          onCourseClick={isParent ? (occ) => setActionOccurrence(occ) : undefined}
        />
      )}

      {/* 课程表单弹窗（从某个类型筛选进入添加时，默认选中该类型） */}
      <CourseFormDialog
        open={formOpen}
        defaultType={typeFilter === 'all' ? undefined : typeFilter}
        course={editingCourseId ? courses.find((c) => c.id === editingCourseId) : undefined}
        existingRules={
          editingCourseId
            ? rules
                .filter((r) => r.courseId === editingCourseId)
                .map((r) => ({
                  weekday: r.weekday,
                  startTime: r.startTime,
                  endTime: r.endTime,
                  effectiveFrom: r.effectiveFrom,
                  effectiveUntil: r.effectiveUntil,
                }))
            : undefined
        }
        onSave={handleSave}
        onDelete={handleDeleteCourse}
        onClose={() => setFormOpen(false)}
      />

      {/* 单节课操作弹窗（取消 / 恢复） */}
      <OccurrenceDialog
        open={Boolean(actionOccurrence)}
        occurrence={actionOccurrence}
        cancellation={
          actionOccurrence
            ? cancellations.get(cancellationKey(actionOccurrence.ruleId, actionOccurrence.date))
            : undefined
        }
        onClose={() => setActionOccurrence(null)}
        onCancel={(reason) =>
          actionOccurrence
            ? cancelOccurrence(
                actionOccurrence.courseId,
                actionOccurrence.ruleId,
                actionOccurrence.date,
                reason
              )
            : Promise.resolve()
        }
        onRestore={() =>
          actionOccurrence
            ? uncancelOccurrence(actionOccurrence.ruleId, actionOccurrence.date)
            : Promise.resolve()
        }
        onEditCourse={() => {
          if (actionOccurrence) {
            const courseId = actionOccurrence.courseId;
            setActionOccurrence(null);
            void handleEdit(courseId);
          }
        }}
      />
    </Box>
  );
};

export default SchedulePage;
