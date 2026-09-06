/**
 * 积分流水列表
 *
 * 按归属日分组，同日按发生时刻倒序。派生条目与落库条目混排，
 * 孩子看到的顺序就是积分进出的顺序。
 */

import React, { useState } from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  POINT_ENTRY_KIND_LABELS,
  type PointEntry,
  type PointEntryKind,
} from '@courseschedule/shared';
import { T, BORDER, BORDER_SOFT, cardSx } from '../../app/tokens';

/** 流水来源贴纸图标 */
const KIND_EMOJI: Record<PointEntryKind, string> = {
  checkin: '⭐',
  attendance: '🏫',
  mistake: '📕',
  daily_goal: '🔥',
  milestone: '🏅',
  manual: '✏️',
  redemption: '🎁',
};

interface LedgerListProps {
  entries: PointEntry[];
  /** 传入则手工流水显示删除按钮（派生条目没有可删的载体） */
  onDeleteAdjustment?: (id: string) => void;
}

/** 一屏装不下整部历史，默认先给 30 条 */
const COLLAPSED_COUNT = 30;

/** '2026-09-05' → '9月5日' */
function formatDate(date: string): string {
  const [, month, day] = date.split('-');
  return `${parseInt(month, 10)}月${parseInt(day, 10)}日`;
}

export const LedgerList: React.FC<LedgerListProps> = ({ entries, onDeleteAdjustment }) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? entries : entries.slice(0, COLLAPSED_COUNT);

  // entries 已按日期倒序，顺序聚簇即可
  const groups: { date: string; items: PointEntry[] }[] = [];
  for (const entry of visible) {
    const last = groups[groups.length - 1];
    if (last && last.date === entry.date) last.items.push(entry);
    else groups.push({ date: entry.date, items: [entry] });
  }

  if (entries.length === 0) {
    return (
      <Box sx={{ ...cardSx, p: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: T.textMuted, fontWeight: 600 }}>
          还没有积分流水，去打卡页勾一项吧
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {groups.map((group) => (
        <Box key={group.date}>
          <Typography
            sx={{ fontWeight: 800, fontSize: '0.85rem', color: T.textMuted, mb: 1, pl: 0.5 }}
          >
            {formatDate(group.date)}
          </Typography>
          <Box
            sx={{
              bgcolor: T.paper,
              border: BORDER,
              borderRadius: 3,
              boxShadow: `3px 3px 0 0 ${T.ink}`,
              overflow: 'hidden',
            }}
          >
            {group.items.map((entry, i) => (
              <Box
                key={entry.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                  borderTop: i === 0 ? 'none' : BORDER_SOFT,
                }}
              >
                <Typography sx={{ fontSize: '1.25rem', lineHeight: 1 }}>
                  {KIND_EMOJI[entry.kind]}
                </Typography>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: T.ink,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {entry.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: T.textMuted, fontWeight: 600 }}>
                    {POINT_ENTRY_KIND_LABELS[entry.kind]}
                    {entry.note ? ` · ${entry.note}` : ''}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: '1rem',
                    whiteSpace: 'nowrap',
                    color: entry.points >= 0 ? T.green : T.pink,
                  }}
                >
                  {entry.points >= 0 ? `+${entry.points}` : entry.points} ⭐
                </Typography>
                {onDeleteAdjustment && entry.kind === 'manual' && (
                  <IconButton
                    size="small"
                    onClick={() => onDeleteAdjustment(entry.refId ?? entry.id)}
                    aria-label="删除这条手工流水"
                  >
                    <DeleteOutlineIcon fontSize="small" sx={{ color: T.textMuted }} />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      ))}

      {entries.length > COLLAPSED_COUNT && (
        <Button
          onClick={() => setExpanded((v) => !v)}
          variant="outlined"
          sx={{ borderRadius: 3, fontWeight: 800, border: BORDER }}
        >
          {expanded ? '收起' : `展开更早的 ${entries.length - COLLAPSED_COUNT} 条`}
        </Button>
      )}
    </Box>
  );
};

export default LedgerList;
