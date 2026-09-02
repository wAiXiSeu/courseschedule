/**
 * 科目选择器（按类别分组，显示中文名 + 颜色圆点）
 *
 * 数据来源为科目 store（含用户手动添加/修改的科目），
 * 需放在 MUI FormControl 内使用，用法与 Select 一致。
 */

import React from 'react';
import { MenuItem, ListSubheader, Box, Select, type SelectProps } from '@mui/material';
import {
  type SubjectCategory,
  SUBJECT_CATEGORY_LABELS,
  SUBJECT_CATEGORY_ORDER,
} from '@courseschedule/shared';
import { useSubjectStore, useSubjectResolver } from '../stores/useSubjectStore';

interface SubjectSelectProps extends Omit<SelectProps, 'children' | 'label' | 'onChange'> {
  /** 浮动标签文字 */
  label: string;
  /** 选中值变化（event.target.value 为科目 id） */
  onChange?: (event: { target: { value: string } }) => void;
  /** 是否在选项最前加「全部」空值项（筛选场景用） */
  includeAll?: boolean;
  /** 「全部」项的值，默认 '' */
  allValue?: string;
  /** 「全部」项的文案，默认 '全部' */
  allLabel?: string;
}

/**
 * 分组科目下拉
 */
export const SubjectSelect: React.FC<SubjectSelectProps> = ({
  label,
  includeAll = false,
  allValue = '',
  allLabel = '全部',
  onChange,
  ...selectProps
}) => {
  const subjects = useSubjectStore((state) => state.subjects);
  const resolve = useSubjectResolver();

  // 按类别分组（跳过空组）
  const groups: { category: SubjectCategory; items: typeof subjects }[] = [];
  for (const category of SUBJECT_CATEGORY_ORDER) {
    const items = subjects.filter((s) => s.category === category);
    if (items.length > 0) groups.push({ category, items });
  }

  return (
    <Select
      {...selectProps}
      label={label}
      onChange={onChange as unknown as SelectProps['onChange']}
      renderValue={(v) =>
        includeAll && v === allValue ? allLabel : resolve(String(v)).name
      }
    >
      {includeAll && <MenuItem value={allValue}>{allLabel}</MenuItem>}
      {groups.map((g) => [
        <ListSubheader
          key={`cat-${g.category}`}
          component="div"
          sx={{ fontWeight: 700, lineHeight: '32px' }}
        >
          {SUBJECT_CATEGORY_LABELS[g.category]}
        </ListSubheader>,
        ...g.items.map((s) => (
          <MenuItem key={s.id} value={s.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: s.color,
                  border: `1.5px solid #1A1A1A`,
                  flexShrink: 0,
                }}
              />
              {s.name}
            </Box>
          </MenuItem>
        )),
      ])}
    </Select>
  );
};
