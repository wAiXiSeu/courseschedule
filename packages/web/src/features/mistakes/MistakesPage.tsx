/**
 * 错题本主页面
 *
 * 包含：页面标题 + 添加按钮、筛选栏、错题卡片列表（响应式 Grid）、空状态引导。
 * 支持添加、编辑、删除、掌握状态切换。
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useMistakeStore } from '../../stores/useMistakeStore';
import { MistakeCard } from './MistakeCard';
import { MistakeFilterBar } from './MistakeFilterBar';
import { MistakeFormDialog } from './MistakeFormDialog';
import { EmptyState } from '../../components/EmptyState';
import type { Mistake } from '@courseschedule/shared';
import type { MistakeFormData } from '../../stores/useMistakeStore';

/**
 * 错题本主页面
 */
export const MistakesPage: React.FC = () => {
  /* ─── Store 状态 ─── */
  const mistakes = useMistakeStore((s) => s.mistakes);
  const filter = useMistakeStore((s) => s.filter);
  const loading = useMistakeStore((s) => s.loading);
  const error = useMistakeStore((s) => s.error);
  const loadAll = useMistakeStore((s) => s.loadAll);
  const addMistake = useMistakeStore((s) => s.addMistake);
  const updateMistake = useMistakeStore((s) => s.updateMistake);
  const deleteMistake = useMistakeStore((s) => s.deleteMistake);
  const toggleMastery = useMistakeStore((s) => s.toggleMastery);
  const applyFilter = useMistakeStore((s) => s.applyFilter);

  /* ─── 弹窗状态 ─── */
  const [formOpen, setFormOpen] = useState(false);
  const [editingMistake, setEditingMistake] = useState<Mistake | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  /* ─── 初始化加载 ─── */
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /* ─── 添加错题 ─── */
  const handleAdd = () => {
    setEditingMistake(null);
    setFormOpen(true);
  };

  /* ─── 编辑错题 ─── */
  const handleEdit = (mistake: Mistake) => {
    setEditingMistake(mistake);
    setFormOpen(true);
  };

  /* ─── 保存（新建/编辑） ─── */
  const handleSave = async (data: MistakeFormData) => {
    if (editingMistake) {
      await updateMistake(editingMistake, data);
    } else {
      await addMistake(data);
    }
  };

  /* ─── 删除确认 ─── */
  const handleDeleteRequest = (mistakeId: string) => {
    setDeleteTargetId(mistakeId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    await deleteMistake(deleteTargetId);
    setDeleteConfirmOpen(false);
    setDeleteTargetId(null);
  };

  /* ─── 掌握状态切换 ─── */
  const handleToggleMastery = useCallback(
    (mistakeId: string) => {
      toggleMastery(mistakeId);
    },
    [toggleMastery]
  );

  /* ─── 筛选条件变更 ─── */
  const handleFilterChange = (partial: Partial<typeof filter>) => {
    applyFilter(partial);
  };

  /* ─── 判断空列表 ─── */
  const isEmpty = !loading && mistakes.length === 0;

  return (
    <Box sx={{ pb: 2 }}>
      {/* 页面标题区 */}
      <Box
        sx={{
          bgcolor: 'error.main',
          color: '#fff',
          px: 3,
          py: 3,
          borderRadius: '0 0 24px 24px',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            📕 错题本
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{
              bgcolor: 'rgba(255,255,255,0.25)',
              color: '#fff',
              borderRadius: 2,
              fontWeight: 600,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
            }}
          >
            添加错题
          </Button>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
          记录错题，攻克薄弱点
        </Typography>
      </Box>

      {/* 筛选栏 */}
      <Box sx={{ px: 2, mt: 2 }}>
        <MistakeFilterBar filter={filter} onFilterChange={handleFilterChange} />
      </Box>

      {/* 错误提示 */}
      {error && (
        <Box sx={{ px: 2, mb: 1 }}>
          <Typography color="error" variant="body2">
            加载失败：{error}
          </Typography>
        </Box>
      )}

      {/* Loading 状态 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {/* 空列表引导 */}
      {!loading && isEmpty && (
        <EmptyState
          emoji="📕"
          title="还没有错题记录"
          description="点击右上角「添加错题」开始记录吧！"
          action={
            <Button
              variant="contained"
              color="error"
              onClick={handleAdd}
              sx={{ borderRadius: 2 }}
            >
              添加第一道错题
            </Button>
          }
        />
      )}

      {/* 错题卡片列表（响应式 Grid） */}
      {!loading && !isEmpty && (
        <Box sx={{ px: 2, mt: 1 }}>
          <Grid container spacing={2}>
            {mistakes.map((mistake) => (
              <Grid item xs={12} sm={6} md={4} key={mistake.id}>
                <MistakeCard
                  mistake={mistake}
                  onEdit={handleEdit}
                  onDelete={handleDeleteRequest}
                  onToggleMastery={handleToggleMastery}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* 错题录入/编辑弹窗 */}
      <MistakeFormDialog
        open={formOpen}
        mistake={editingMistake}
        onSubmit={handleSave}
        onClose={() => setFormOpen(false)}
      />

      {/* 删除确认弹窗 */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>确认删除</DialogTitle>
        <DialogContent>
          <Typography>确定要删除这道错题吗？</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            删除后不可恢复。
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            取消
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MistakesPage;
