/**
 * 补打卡弹窗（按天补）
 *
 * 入口在计划卡片上。可选过去 7 天的任意一天（不含今天，今天走打卡页），
 * 选中后列出「该计划当天确实应完成」的任务供勾选。
 *
 * 口径提醒（由 shared 纯函数保证，这里只负责如实传 isMakeup）：
 * - 补卡与正常打卡同分，不打折
 * - 补卡日不计入连续天数与里程碑，但计入累计天数
 * - 当天任务靠补卡补齐，满额奖照发
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import {
  addDays,
  getTodayISODate,
  getWeekdayLabel,
  isPlanTaskDueOn,
  pointsForCheckin,
  taskExistedOn,
  type CheckInRecord,
  type ISODate,
  type LearningPlan,
  type PlanTask,
} from '@courseschedule/shared';
import { useAppStore } from '../../stores/useAppStore';
import { useCheckinStore, checkinRepo } from '../../stores/useCheckinStore';
import { T, BORDER } from '../../app/tokens';

/** 可补卡的最大回溯天数（不含今天） */
const MAKEUP_WINDOW_DAYS = 7;

interface MakeupCheckinDialogProps {
  open: boolean;
  plan: LearningPlan;
  /** 该计划下的全部任务 */
  planTasks: PlanTask[];
  onClose: () => void;
  /** 提交后的提示（由页面负责展示） */
  onDone?: (message: string) => void;
}

/** 单个候选日的概览 */
interface DayOption {
  date: ISODate;
  label: string;
  weekday: string;
  dueTasks: PlanTask[];
  doneCount: number;
}

/** '2026-09-05' → '9月5日' */
function formatDate(date: ISODate): string {
  const [, month, day] = date.split('-');
  return `${parseInt(month, 10)}月${parseInt(day, 10)}日`;
}

export const MakeupCheckinDialog: React.FC<MakeupCheckinDialogProps> = ({
  open,
  plan,
  planTasks,
  onClose,
  onDone,
}) => {
  const childId = useAppStore((s) => s.childId);
  const checkin = useCheckinStore((s) => s.checkin);
  const uncheckin = useCheckinStore((s) => s.uncheckin);

  const [records, setRecords] = useState<CheckInRecord[]>([]);
  const [pickedDate, setPickedDate] = useState<ISODate | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const today = getTodayISODate();
  const oldest = addDays(today, -MAKEUP_WINDOW_DAYS);

  /** 已打卡的键：`${date}:${taskId}` */
  const doneKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const record of records) {
      if (record.refType === 'plan_task') keys.add(`${record.date}:${record.refId}`);
    }
    return keys;
  }, [records]);

  // 候选日 = 昨天起往回 7 天，只保留「当天确实有该计划任务应完成」的日子
  const dayOptions = useMemo<DayOption[]>(() => {
    const days: DayOption[] = [];
    for (let i = 1; i <= MAKEUP_WINDOW_DAYS; i++) {
      const date = addDays(today, -i);
      const dueTasks = planTasks.filter(
        (task) => task.isActive && isPlanTaskDueOn(task, date) && taskExistedOn(task.createdAt, date)
      );
      if (dueTasks.length === 0) continue;
      days.push({
        date,
        label: formatDate(date),
        weekday: getWeekdayLabel(new Date(date).getDay()),
        dueTasks,
        doneCount: dueTasks.filter((t) => doneKeys.has(`${date}:${t.id}`)).length,
      });
    }
    return days;
  }, [today, planTasks, doneKeys]);

  const loadRecords = useCallback(async () => {
    const list = await checkinRepo.listByDateRange(childId, oldest, today);
    setRecords(list);
  }, [childId, oldest, today]);

  // 每次打开都重拉区间记录，避免看到过期状态
  useEffect(() => {
    if (!open) return;
    setPickedDate(null);
    setChecked(new Set());
    void loadRecords();
  }, [open, loadRecords]);

  const picked = dayOptions.find((d) => d.date === pickedDate) ?? null;

  // 默认全勾：补卡的默认意图就是「这些事都做了」。
  // 若默认只勾未打卡项，对一个已全部打卡的日子点提交会把当天记录当成「不该完成」而删掉。
  useEffect(() => {
    if (!picked) return;
    setChecked(new Set(picked.dueTasks.map((t) => t.id)));
  }, [picked]);

  const toggle = (taskId: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!picked) return;
    setSaving(true);
    try {
      let changed = 0;
      for (const task of picked.dueTasks) {
        const key = `${picked.date}:${task.id}`;
        const alreadyDone = doneKeys.has(key);
        const shouldBeDone = checked.has(task.id);

        if (shouldBeDone && !alreadyDone) {
          await checkin('plan_task', task.id, picked.date, true);
          changed++;
        } else if (!shouldBeDone && alreadyDone) {
          await uncheckin('plan_task', task.id, picked.date);
          changed++;
        }
      }
      await loadRecords();
      onDone?.(
        changed === 0
          ? '没有变化'
          : `已补 ${picked.label} 的打卡（不计入连续天数与里程碑）`
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        补打卡 · {plan.title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: T.textMuted, fontWeight: 600, mb: 1.5 }}>
          选一天补上漏掉的打卡，只能补最近 {MAKEUP_WINDOW_DAYS} 天（今天请到打卡页勾）。
        </Typography>

        {dayOptions.length === 0 && (
          <Box
            sx={{
              p: 2.5,
              mb: 1.5,
              textAlign: 'center',
              borderRadius: 3,
              bgcolor: T.gray,
              border: BORDER,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, color: T.textMuted }}>
              最近 {MAKEUP_WINDOW_DAYS} 天没有这个计划需要完成的任务
            </Typography>
          </Box>
        )}

        {/* 第一步：选日期 */}
        {dayOptions.map((day) => {
          const allDone = day.doneCount === day.dueTasks.length;
          const active = day.date === pickedDate;

          return (
            <Box
              key={day.date}
              role="button"
              tabIndex={0}
              aria-pressed={active}
              onClick={() => setPickedDate(day.date)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setPickedDate(day.date)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 1,
                mb: 1.25,
                cursor: 'pointer',
                borderRadius: 2.5,
                border: BORDER,
                bgcolor: active ? T.yellow : T.paper,
                boxShadow: active ? `2px 2px 0 0 ${T.ink}` : 'none',
              }}
            >
              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{day.label}</Typography>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: T.textMuted }}>
                {day.weekday}
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Chip
                size="small"
                label={`应完成 ${day.dueTasks.length} 项`}
                sx={{ fontSize: '0.7rem', fontWeight: 700, height: 22 }}
              />
              {allDone ? (
                <Chip
                  size="small"
                  label="已打卡"
                  sx={{ fontSize: '0.7rem', fontWeight: 700, height: 22, bgcolor: T.green, color: '#fff' }}
                />
              ) : (
                <Chip
                  size="small"
                  label={day.doneCount > 0 ? `${day.doneCount}/${day.dueTasks.length}` : '未打卡'}
                  color="warning"
                  sx={{ fontSize: '0.7rem', fontWeight: 700, height: 22 }}
                />
              )}
            </Box>
          );
        })}

        {/* 第二步：勾选当天任务 */}
        {picked && (
          <Box sx={{ borderRadius: 2.5, border: BORDER, overflow: 'hidden' }}>
            {picked.dueTasks.map((task, index) => {
              const key = `${picked.date}:${task.id}`;
              const alreadyDone = doneKeys.has(key);
              return (
                <Box
                  key={task.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 1.25,
                    minHeight: 56,
                    borderTop: index === 0 ? 'none' : `1px solid ${T.gray}`,
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={checked.has(task.id)}
                    onChange={() => toggle(task.id)}
                    sx={{ p: 0.5, flexShrink: 0 }}
                  />
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.4 }}>
                      {task.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        lineHeight: 1.4,
                        color: alreadyDone ? T.green : T.textMuted,
                      }}
                    >
                      {alreadyDone
                        ? '这天已有打卡记录'
                        : `完成后可得 ${pointsForCheckin('plan_task')} ⭐`}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: T.textMuted, fontWeight: 600 }}>
          补卡与正常打卡同分；但不计入连续天数与里程碑（累计打卡天数照常计入）。
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" sx={{ borderRadius: 2 }}>
          取消
        </Button>
        <Button
          onClick={() => void handleSubmit()}
          variant="contained"
          disabled={!picked || saving}
          sx={{ borderRadius: 2, fontWeight: 800 }}
        >
          提交补卡
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MakeupCheckinDialog;