/**
 * 打卡页面入口
 *
 * 今日任务与今日课程到课两类勾选，勾一下即时看到得多少 ⭐。
 * 顶部统计面板：累计 / 连续打卡天数、本周格子、今日完成率。
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Chip,
  Divider,
  Snackbar,
  Button,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useCheckinData, type AttendanceView } from './useCheckinData';
import { useCheckinStore } from '../../stores/useCheckinStore';
import { useReviewStore } from '../../stores/useReviewStore';
import { useAppStore } from '../../stores/useAppStore';
import { StatsPanel } from './StatsPanel';
import { T, BORDER, pageHeadingSx, sectionTitleSx } from '../../app/tokens';
import { pointsForCheckin, type TaskView } from '@courseschedule/shared';

/** 打卡即时反馈 */
interface Feedback {
  text: string;
  /** 刚刚撤销打卡：提示积分已回冲，避免孩子以为白赚了 */
  reversed: boolean;
}

/**
 * 打卡页面
 */
export const CheckinPage: React.FC = () => {
  const checkinData = useCheckinData();
  const checkin = useCheckinStore((s) => s.checkin);
  const uncheckin = useCheckinStore((s) => s.uncheckin);
  const completeReviewTask = useReviewStore((s) => s.completeTask);
  const currentDate = useAppStore((s) => s.currentDate);
  const navigate = useNavigate();

  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // 处理任务打卡 / 取消打卡
  const handleToggleCheckin = async (task: TaskView) => {
    if (task.done) {
      await uncheckin(task.refType, task.refId, currentDate);
      const lost = pointsForCheckin(task.refType, false);
      setFeedback({ text: `已撤销，退回 ${lost} ⭐`, reversed: true });
      await checkinData.refresh();
      return;
    }

    await checkin(task.refType, task.refId, currentDate);
    // 复习任务打卡即视为完成该间隔节点，否则它会永远挂在待办里、满额奖再也拿不到
    if (task.refType === 'review_task') {
      await completeReviewTask(task.refId);
    }
    setFeedback({ text: `+${pointsForCheckin(task.refType, false)} ⭐ 已入账`, reversed: false });
    await checkinData.refresh();
  };

  // 处理课程到课 / 撤销到课
  const handleToggleAttendance = async (course: AttendanceView) => {
    if (course.cancelled) return;

    if (course.done) {
      await uncheckin('course_rule', course.ruleId, currentDate);
      setFeedback({ text: '已撤销到课，退回积分', reversed: true });
    } else {
      await checkin('course_rule', course.ruleId, currentDate);
      setFeedback({
        text: `+${pointsForCheckin('course_rule', false)} ⭐ 到课已记录`,
        reversed: false,
      });
    }
    await checkinData.refresh();
  };

  const formatDate = (dateStr: string) => {
    const [, month, day] = dateStr.split('-');
    return `${parseInt(month, 10)}月${parseInt(day, 10)}日`;
  };

  const { todayTasks, todayCourses, completionRate } = checkinData;
  const allDone = completionRate.total > 0 && completionRate.done === completionRate.total;

  return (
    <Box sx={{ pb: 2 }}>
      {/* 页面标题区 */}
      <Box sx={{ px: 2.5, pt: 3, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography sx={pageHeadingSx}>今日打卡</Typography>
          <Chip
            icon={<TrendingUpIcon />}
            label="积分奖励"
            onClick={() => navigate('/points')}
            size="small"
            sx={{
              fontWeight: 800,
              bgcolor: T.paper,
              border: BORDER,
              boxShadow: `2px 2px 0 0 ${T.ink}`,
            }}
          />
        </Box>
        <Typography variant="body2" sx={{ color: T.textMuted, fontWeight: 600, mt: 1 }}>
          {formatDate(currentDate)}
        </Typography>
      </Box>

      {/* 统计面板 */}
      <Box sx={{ px: 2, mt: 2 }}>
        <StatsPanel
          totalDays={checkinData.totalDays}
          currentStreak={checkinData.currentStreak}
          longestStreak={checkinData.longestStreak}
          weekStrip={checkinData.weekStrip}
          completionRate={completionRate}
        />
      </Box>

      {/* 今日任务列表 */}
      <Box sx={{ px: 2, mt: 3 }}>
        <Typography sx={{ ...sectionTitleSx, fontSize: '1.0625rem', mb: 1.5 }}>
          今日任务
        </Typography>

        {checkinData.loading && (
          <Typography sx={{ textAlign: 'center', py: 4, color: T.textMuted, fontWeight: 700 }}>
            加载中...
          </Typography>
        )}

        {!checkinData.loading && todayTasks.length === 0 && (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 3.5,
              bgcolor: T.paper,
              border: BORDER,
              boxShadow: `3px 3px 0 0 ${T.ink}`,
            }}
          >
            <Typography variant="body2" sx={{ color: T.textMuted, fontWeight: 600 }}>
              今日暂无任务
            </Typography>
          </Box>
        )}

        {!checkinData.loading && todayTasks.length > 0 && (
          <Box
            sx={{
              borderRadius: 3.5,
              overflow: 'hidden',
              bgcolor: T.paper,
              border: BORDER,
              boxShadow: `3px 3px 0 0 ${T.ink}`,
            }}
          >
            <List disablePadding>
              {todayTasks.map((task, index) => (
                <React.Fragment key={task.key}>
                  <ListItem
                    sx={{
                      bgcolor: task.done ? '#EAF8F0' : 'transparent',
                      transition: 'background-color 0.2s',
                      py: 2,
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        checked={task.done}
                        onChange={() => void handleToggleCheckin(task)}
                        icon={<StarBorderIcon sx={{ fontSize: 28, color: '#C9C1AF' }} />}
                        checkedIcon={
                          <StarIcon
                            sx={{
                              fontSize: 28,
                              color: T.yellow,
                              stroke: T.ink,
                              strokeWidth: 1,
                            }}
                          />
                        }
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 700,
                              textDecoration: task.done ? 'line-through' : 'none',
                              color: task.done ? T.textMuted : T.ink,
                            }}
                          >
                            {task.title}
                          </Typography>
                          <Chip
                            label={task.sourceLabel}
                            size="small"
                            color={task.sourceLabel === '学习计划' ? 'primary' : 'secondary'}
                            sx={{ fontSize: '0.7rem', height: 22 }}
                          />
                          {task.due && (
                            <Chip
                              label="到期"
                              size="small"
                              color="warning"
                              sx={{ fontSize: '0.7rem', height: 22 }}
                            />
                          )}
                          <Box sx={{ ml: 'auto', fontWeight: 800, fontSize: '0.8rem', color: T.textMuted }}>
                            +{pointsForCheckin(task.refType, false)} ⭐
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < todayTasks.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}

        {/* 当天到期任务全部完成，满额奖已在积分账本里 */}
        {allDone && (
          <Box
            sx={{
              mt: 1.5,
              px: 2,
              py: 1.5,
              borderRadius: 3,
              bgcolor: T.green,
              border: BORDER,
              boxShadow: `3px 3px 0 0 ${T.ink}`,
            }}
          >
            <Typography sx={{ fontWeight: 800, color: '#fff' }}>
              🎉 今日任务全部完成，满额奖励已到账
            </Typography>
          </Box>
        )}
      </Box>

      {/* 今日校外课程到课（校内课程不参与打卡） */}
      {todayCourses.length > 0 && (
        <Box sx={{ px: 2, mt: 4 }}>
          <Typography sx={{ ...sectionTitleSx, fontSize: '1.0625rem', mb: 1.5 }}>
            今天的校外课 · 到课打卡
          </Typography>
          <Box
            sx={{
              borderRadius: 3.5,
              overflow: 'hidden',
              bgcolor: T.paper,
              border: BORDER,
              boxShadow: `3px 3px 0 0 ${T.ink}`,
            }}
          >
            <List disablePadding>
              {todayCourses.map((course, index) => (
                <React.Fragment key={course.key}>
                  <ListItem
                    sx={{
                      bgcolor: course.done ? '#EAF8F0' : 'transparent',
                      opacity: course.cancelled ? 0.55 : 1,
                      py: 2,
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        checked={course.done}
                        disabled={course.cancelled}
                        onChange={() => void handleToggleAttendance(course)}
                        icon={<StarBorderIcon sx={{ fontSize: 28, color: '#C9C1AF' }} />}
                        checkedIcon={
                          <StarIcon sx={{ fontSize: 28, color: T.yellow, stroke: T.ink, strokeWidth: 1 }} />
                        }
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              flexShrink: 0,
                              bgcolor: course.color,
                              border: BORDER,
                            }}
                          />
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 700,
                              textDecoration: course.done ? 'line-through' : 'none',
                              color: course.done || course.cancelled ? T.textMuted : T.ink,
                            }}
                          >
                            {course.courseName}
                          </Typography>
                          <Typography variant="body2" sx={{ color: T.textMuted, fontWeight: 700 }}>
                            {course.startTime}-{course.endTime}
                          </Typography>
                          <Box sx={{ ml: 'auto', fontWeight: 800, fontSize: '0.8rem', color: T.textMuted }}>
                            {course.cancelled
                              ? '已取消'
                              : `+${pointsForCheckin('course_rule', false)} ⭐`}
                          </Box>
                        </Box>
                      }
                      secondary={course.cancelled ? `取消原因：${course.cancelledReason}` : undefined}
                    />
                  </ListItem>
                  {index < todayCourses.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: T.textMuted, fontWeight: 600 }}>
            校内课程由学校统一管理，不参与打卡；校外课请假请家长在课程表里记「取消」。
          </Typography>
        </Box>
      )}

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={2200}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            borderRadius: 3,
            border: BORDER,
            boxShadow: `3px 3px 0 0 ${T.ink}`,
            bgcolor: feedback?.reversed ? T.gray : T.yellow,
            fontWeight: 800,
            color: T.ink,
          }}
        >
          {feedback?.text}
        </Box>
      </Snackbar>

      {/* 顶栏余额没跟上时，从这里也能去积分页 */}
      {!checkinData.loading && todayTasks.length === 0 && todayCourses.length === 0 && (
        <Box sx={{ px: 2, mt: 3, textAlign: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/points')}
            sx={{ borderRadius: 3, fontWeight: 800, border: BORDER }}
          >
            看看我的积分
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CheckinPage;
