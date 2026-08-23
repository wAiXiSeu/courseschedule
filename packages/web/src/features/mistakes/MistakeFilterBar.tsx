/**
 * 错题筛选栏组件
 *
 * 支持按科目、知识点、时间范围筛选错题
 */

import React from 'react';
import { Box, TextField, Chip, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { SUBJECT_COLORS } from '@courseschedule/shared';
import type { MistakeFilter } from '../../stores/useMistakeStore';

interface MistakeFilterBarProps {
  filter: MistakeFilter;
  onFilterChange: (filter: Partial<MistakeFilter>) => void;
}

/** 科目列表（从 SUBJECT_COLORS 生成） */
const SUBJECTS = Object.keys(SUBJECT_COLORS);

/**
 * 错题筛选栏
 */
export const MistakeFilterBar: React.FC<MistakeFilterBarProps> = ({
  filter,
  onFilterChange,
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
      {/* 科目筛选 */}
      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel>科目</InputLabel>
        <Select
          value={filter.subject}
          label="科目"
          onChange={(e) => onFilterChange({ subject: e.target.value })}
          size="small"
        >
          <MenuItem value="">全部</MenuItem>
          {SUBJECTS.map((subject) => (
            <MenuItem key={subject} value={subject}>
              {subject}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* 知识点筛选 */}
      <TextField
        label="知识点"
        placeholder="输入知识点"
        value={filter.knowledgePoint}
        onChange={(e) => onFilterChange({ knowledgePoint: e.target.value })}
        size="small"
        sx={{ minWidth: 150 }}
      />

      {/* 起始日期 */}
      <TextField
        label="开始日期"
        type="date"
        value={filter.startDate}
        onChange={(e) => onFilterChange({ startDate: e.target.value })}
        size="small"
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 150 }}
      />

      {/* 截止日期 */}
      <TextField
        label="结束日期"
        type="date"
        value={filter.endDate}
        onChange={(e) => onFilterChange({ endDate: e.target.value })}
        size="small"
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 150 }}
      />

      {/* 清除筛选 */}
      {(filter.subject || filter.knowledgePoint || filter.startDate || filter.endDate) && (
        <Chip
          label="清除筛选"
          onDelete={() =>
            onFilterChange({
              subject: '',
              knowledgePoint: '',
              startDate: '',
              endDate: '',
            })
          }
          sx={{ alignSelf: 'center' }}
        />
      )}
    </Box>
  );
};
