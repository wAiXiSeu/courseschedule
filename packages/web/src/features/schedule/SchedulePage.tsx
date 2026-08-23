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
import { CourseFormDialog } from './CourseFormDialog';
import { useScheduleStore, courseRepo, ruleRepo } from '../../stores/useScheduleStore';
import { useAppStore } from '../../stores/useAppStore';
import { EmptyState } from '../../components/EmptyState';
import type { CourseFormData } from '../../stores/useScheduleStore';
import type { ScheduleRuleFormData } from '../../stores/useScheduleStore';

/**
 * 课程表页面
 */
export const SchedulePage: React.FC = () => {
  const { weekStart, weekOccurrences, loading, goNextWeek, goPrevWeek, goThisWeek } =
    useScheduleData();

  const courses = useScheduleStore((s) => s.courses);
  const rules = useScheduleStore((s) => s.rules);
  const createCourse = useScheduleStore((s) => s.createCourse);
  const updateCourse = useScheduleStore((s) => s.updateCourse);
  const deleteCourse = useScheduleStore((s) => s.deleteCourse);

  const childId = useAppStore((s) => s.childId);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

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

  // 判断是否为空
  const isEmpty = !loading && courses.length === 0;

  return (
    <Box sx={{ pb: 2 }}>
      {/* 页面标题 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          pt: 2,
          pb: 1,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          📅 课程表
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          添加课程
        </Button>
      </Box>

      {/* 周视图 */}
      {isEmpty ? (
        <EmptyState
          emoji="📚"
          title="还没有课程"
          description="点击右上角「添加课程」开始排课吧！"
          action={
            <Button variant="contained" onClick={handleAdd}>
              添加第一门课程
            </Button>
          }
        />
      ) : (
        <WeekView
          weekStart={weekStart}
          weekOccurrences={weekOccurrences}
          onPrevWeek={goPrevWeek}
          onNextWeek={goNextWeek}
          onThisWeek={goThisWeek}
          onCourseClick={(occ) => handleEdit(occ.courseId)}
        />
      )}

      {/* 课程表单弹窗 */}
      <CourseFormDialog
        open={formOpen}
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
        onClose={() => setFormOpen(false)}
      />
    </Box>
  );
};

export default SchedulePage;
