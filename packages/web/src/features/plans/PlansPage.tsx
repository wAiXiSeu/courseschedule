/**
 * 学习计划页面入口
 *
 * 含 Tab 切换（学习计划 | 复习计划）
 * 学习计划 Tab：显示计划卡片列表 + 新建按钮
 * 复习计划 Tab：显示复习项卡片列表 + 录入按钮
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { usePlanData } from './usePlanData';
import { useReviewData } from './useReviewData';
import { usePlanStore } from '../../stores/usePlanStore';
import { useReviewStore } from '../../stores/useReviewStore';
import { useIsParent } from '../../stores/useAppStore';
import { PlanCard } from './PlanCard';
import { PlanFormDialog } from './PlanFormDialog';
import { PlanTaskFormDialog } from './PlanTaskFormDialog';
import { ReviewCard } from './ReviewCard';
import { ReviewItemFormDialog } from './ReviewItemFormDialog';
import type { LearningPlan, ReviewItem } from '@courseschedule/shared';
import { T, pageHeadingSx } from '../../app/tokens';

/**
 * 学习计划页面
 */
export const PlansPage: React.FC = () => {
  // Tab 状态：0=学习计划，1=复习计划
  const [activeTab, setActiveTab] = useState(0);

  // 学习计划对话框状态
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<LearningPlan | null>(null);

  // 计划任务对话框状态
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<null>(null);
  const [taskPlanId, setTaskPlanId] = useState<string>('');

  // 复习项对话框状态
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  // 删除确认对话框
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'plan' | 'review'; id: string; name: string } | null>(null);

  // 数据 Hooks
  const planData = usePlanData();
  const reviewData = useReviewData();

  // Store Actions
  const createPlan = usePlanStore((s) => s.createPlan);
  const updatePlan = usePlanStore((s) => s.updatePlan);
  const deletePlan = usePlanStore((s) => s.deletePlan);
  const createTask = usePlanStore((s) => s.createTask);
  const updateTask = usePlanStore((s) => s.updateTask);
  const deleteTask = usePlanStore((s) => s.deleteTask);
  const createReviewItem = useReviewStore((s) => s.createItem);
  const updateReviewItem = useReviewStore((s) => s.updateItem);
  const deleteReviewItem = useReviewStore((s) => s.deleteItem);

  const isParent = useIsParent();

  // 处理学习计划提交
  const handlePlanSubmit = async (data: any) => {
    if (editingPlan) {
      await updatePlan(editingPlan, data);
    } else {
      await createPlan(data);
    }
  };

  // 处理计划任务提交
  const handleTaskSubmit = async (data: any) => {
    await createTask(data);
  };

  // 处理复习项提交
  const handleReviewSubmit = async (data: any) => {
    await createReviewItem(data);
  };

  // 处理编辑计划
  const handleEditPlan = (plan: LearningPlan) => {
    setEditingPlan(plan);
    setPlanDialogOpen(true);
  };

  // 处理删除确认
  const handleDeleteConfirm = (type: 'plan' | 'review', id: string, name: string) => {
    setDeleteTarget({ type, id, name });
    setDeleteConfirmOpen(true);
  };

  // 执行删除
  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'plan') {
      await deletePlan(deleteTarget.id);
    } else {
      await deleteReviewItem(deleteTarget.id);
    }
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  // 处理添加任务
  const handleAddTask = (plan: LearningPlan) => {
    setTaskPlanId(plan.id);
    setTaskDialogOpen(true);
  };

  return (
    <Box sx={{ pb: 2 }}>
      {/* 页面标题区 */}
      <Box sx={{ px: 2.5, pt: 3, pb: 1 }}>
        <Typography sx={pageHeadingSx}>
          学习计划
        </Typography>
        <Typography variant="body2" sx={{ color: T.textMuted, fontWeight: 600, mt: 1 }}>
          制定计划，跟踪进度，坚持复习
        </Typography>
      </Box>

      {/* Tab 切换 */}
      <Box sx={{ px: 2.5, mt: 1 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="fullWidth"
        >
          <Tab label={`学习计划 (${planData.plans.length})`} />
          <Tab label={`复习计划 (${reviewData.items.length})`} />
        </Tabs>
      </Box>

      {/* 学习计划 Tab */}
      {activeTab === 0 && (
        <Box sx={{ px: 2, mt: 2 }}>
          {planData.loading && (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              加载中...
            </Typography>
          )}
          {!planData.loading && planData.plans.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">暂无学习计划</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {isParent
                  ? '点击下方按钮创建第一个学习计划'
                  : '家长还没有安排学习计划'}
              </Typography>
            </Box>
          )}
          {planData.plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              progress={planData.getPlanProgress(plan)}
              todayTaskCount={planData.getTodayTaskCount(plan.id)}
              totalTaskCount={planData.getTasksByPlan(plan.id).length}
              onEdit={isParent ? handleEditPlan : undefined}
              onDelete={
                isParent ? (p) => handleDeleteConfirm('plan', p.id, p.title) : undefined
              }
              onAddTask={isParent ? handleAddTask : undefined}
            />
          ))}
          {isParent && (
            <Fab
              color="primary"
              sx={{ position: 'fixed', bottom: 88, right: 24 }}
              onClick={() => {
                setEditingPlan(null);
                setPlanDialogOpen(true);
              }}
            >
              <AddIcon />
            </Fab>
          )}
        </Box>
      )}

      {/* 复习计划 Tab */}
      {activeTab === 1 && (
        <Box sx={{ px: 2, mt: 2 }}>
          {reviewData.loading && (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              加载中...
            </Typography>
          )}
          {!reviewData.loading && reviewData.items.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">暂无复习内容</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {isParent
                  ? '录入学习内容，系统自动安排复习计划'
                  : '家长还没有安排复习内容'}
              </Typography>
            </Box>
          )}
          {reviewData.items.map((item) => {
            const progress = reviewData.getReviewProgress(item.id);
            return (
              <ReviewCard
                key={item.id}
                item={item}
                doneRounds={progress.done}
                totalRounds={progress.total}
                todayDueCount={reviewData.getTodayDueCount(item.id)}
                onDelete={
                  isParent
                    ? (i) => handleDeleteConfirm('review', i.id, i.title)
                    : undefined
                }
              />
            );
          })}
          {isParent && (
            <Fab
              color="primary"
              sx={{ position: 'fixed', bottom: 88, right: 24 }}
              onClick={() => setReviewDialogOpen(true)}
            >
              <AddIcon />
            </Fab>
          )}
        </Box>
      )}

      {/* 学习计划对话框 */}
      <PlanFormDialog
        open={planDialogOpen}
        plan={editingPlan}
        onClose={() => setPlanDialogOpen(false)}
        onSubmit={handlePlanSubmit}
      />

      {/* 计划任务对话框 */}
      <PlanTaskFormDialog
        open={taskDialogOpen}
        planId={taskPlanId}
        onClose={() => setTaskDialogOpen(false)}
        onSubmit={handleTaskSubmit}
      />

      {/* 复习项对话框 */}
      <ReviewItemFormDialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        onSubmit={handleReviewSubmit}
      />

      {/* 删除确认对话框 */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>确定要删除「{deleteTarget?.name}」吗？</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            删除后不可恢复，相关任务也将一并删除。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>取消</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlansPage;
