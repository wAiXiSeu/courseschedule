/**
 * 科目管理页面
 *
 * 按类别分组展示全部科目（中文名 + 颜色）。
 * 家长模式：手动添加科目、修改名称/类别/颜色、删除、恢复默认。
 * 孩子模式：只读查看。
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckIcon from '@mui/icons-material/Check';
import {
  type Subject,
  type SubjectCategory,
  SUBJECT_CATEGORY_LABELS,
  SUBJECT_CATEGORY_ORDER,
} from '@courseschedule/shared';
import {
  useSubjectStore,
  type SubjectInput,
} from '../../stores/useSubjectStore';
import { useIsParent } from '../../stores/useAppStore';
import { EmptyState } from '../../components/EmptyState';
import { pageHeadingSx, sectionTitleSx, cardSx, T, BORDER, SHADOW_SM } from '../../app/tokens';

/** 预设色板（供选择，也可自定义） */
const PRESET_COLORS = [
  '#E53935', '#D81B60', '#8E24AA', '#5E35B1',
  '#3949AB', '#1E88E5', '#00ACC1', '#00897B',
  '#43A047', '#7CB342', '#FDD835', '#FB8C00',
  '#F4511E', '#6D4C41', '#455A64', '#757575',
];

/* ─── 添加/编辑科目弹窗 ─── */

interface SubjectFormDialogProps {
  open: boolean;
  /** 编辑时传入现有科目 */
  subject?: Subject | null;
  onSave: (input: SubjectInput) => void;
  onClose: () => void;
}

const SubjectFormDialog: React.FC<SubjectFormDialogProps> = ({
  open,
  subject,
  onSave,
  onClose,
}) => {
  const subjects = useSubjectStore((s) => s.subjects);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SubjectCategory>('basic');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState('');

  // 打开时初始化
  React.useEffect(() => {
    if (open) {
      setName(subject?.name ?? '');
      setCategory(subject?.category ?? 'basic');
      setColor(subject?.color ?? PRESET_COLORS[0]);
      setError('');
    }
  }, [open, subject]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('请输入科目名称');
      return;
    }
    const duplicated = subjects.some(
      (s) => s.name === trimmed && s.id !== subject?.id
    );
    if (duplicated) {
      setError('该科目名称已存在');
      return;
    }
    onSave({ name: trimmed, category, color });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {subject ? '编辑科目' : '添加科目'}
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          autoFocus
          fullWidth
          label="科目名称"
          placeholder="如：书法、编程"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!error}
          helperText={error}
          sx={{ mt: 1, mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>类别</InputLabel>
          <Select
            label="类别"
            value={category}
            onChange={(e) => setCategory(e.target.value as SubjectCategory)}
          >
            {SUBJECT_CATEGORY_ORDER.map((c) => (
              <MenuItem key={c} value={c}>
                {SUBJECT_CATEGORY_LABELS[c]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
          颜色
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
          {PRESET_COLORS.map((hex) => (
            <Box
              key={hex}
              onClick={() => setColor(hex)}
              sx={{
                width: 30,
                height: 30,
                borderRadius: 1.5,
                bgcolor: hex,
                border: BORDER,
                boxShadow: color === hex ? SHADOW_SM : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                transform: color === hex ? 'translate(-1px, -1px)' : 'none',
              }}
            >
              {color === hex && <CheckIcon fontSize="small" />}
            </Box>
          ))}
          {/* 自定义颜色 */}
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 1.5,
              border: BORDER,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: T.paper,
              position: 'relative',
              cursor: 'pointer',
            }}
            title="自定义颜色"
          >
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 800 }}>+</Typography>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0,
                cursor: 'pointer',
              }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          取消
        </Button>
        <Button onClick={handleSubmit} variant="contained">
          {subject ? '保存' : '添加'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ─── 科目管理页 ─── */

/**
 * 科目管理页面
 */
export const SubjectsPage: React.FC = () => {
  const subjects = useSubjectStore((s) => s.subjects);
  const addSubject = useSubjectStore((s) => s.addSubject);
  const updateSubject = useSubjectStore((s) => s.updateSubject);
  const removeSubject = useSubjectStore((s) => s.removeSubject);
  const resetDefaults = useSubjectStore((s) => s.resetDefaults);

  const isParent = useIsParent();

  const [formOpen, setFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // 按类别分组（跳过空组）
  const groups = SUBJECT_CATEGORY_ORDER.map((category) => ({
    category,
    items: subjects.filter((s) => s.category === category),
  })).filter((g) => g.items.length > 0);

  const handleAdd = () => {
    setEditingSubject(null);
    setFormOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormOpen(true);
  };

  const handleSave = async (input: SubjectInput) => {
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, input);
      } else {
        await addSubject(input);
      }
    } catch (err) {
      window.alert((err as Error).message);
    }
  };

  const handleDelete = async (subject: Subject) => {
    if (
      window.confirm(
        `确定删除科目「${subject.name}」吗？已使用该科目的课程/计划/错题将按默认样式显示。`
      )
    ) {
      try {
        await removeSubject(subject.id);
      } catch (err) {
        window.alert((err as Error).message);
      }
    }
  };

  const handleReset = async () => {
    if (window.confirm('将覆盖当前科目列表并恢复内置默认科目，确定吗？')) {
      try {
        await resetDefaults();
      } catch (err) {
        window.alert((err as Error).message);
      }
    }
  };

  return (
    <Box sx={{ pb: 2 }}>
      {/* 页面标题 + 操作 */}
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
        <Typography sx={pageHeadingSx}>科目管理</Typography>
        {isParent && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RestartAltIcon />}
              onClick={handleReset}
            >
              恢复默认
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAdd}
            >
              添加科目
            </Button>
          </Box>
        )}
      </Box>

      {subjects.length === 0 ? (
        <EmptyState
          emoji="🏷️"
          title="还没有科目"
          description={
            isParent
              ? '点击右上角「添加科目」或「恢复默认」开始吧！'
              : '家长还没有配置科目。'
          }
        />
      ) : (
        groups.map((group) => (
          <Box key={group.category} sx={{ ...cardSx, mx: 2.5, mt: 2, p: 2 }}>
            <Typography sx={sectionTitleSx}>
              {SUBJECT_CATEGORY_LABELS[group.category]}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.25 }}>
              {group.items.map((subject) => (
                <Box
                  key={subject.id}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    bgcolor: subject.color,
                    color: '#fff',
                    border: BORDER,
                    borderRadius: '10px',
                    boxShadow: SHADOW_SM,
                    pl: 1.25,
                    pr: 0.5,
                    py: 0.5,
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {subject.name}
                  </Typography>
                  {isParent && (
                    <Box sx={{ display: 'flex', ml: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(subject)}
                        sx={{ color: '#fff', p: 0.25 }}
                        title="编辑科目"
                      >
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(subject)}
                        sx={{ color: '#fff', p: 0.25 }}
                        title="删除科目"
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        ))
      )}

      {/* 添加/编辑弹窗 */}
      <SubjectFormDialog
        open={formOpen}
        subject={editingSubject}
        onSave={handleSave}
        onClose={() => setFormOpen(false)}
      />
    </Box>
  );
};

export default SubjectsPage;
