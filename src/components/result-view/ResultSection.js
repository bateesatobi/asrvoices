import React, { useState } from 'react';
import {
  Accordion, AccordionSummary, AccordionDetails,
  Box, Stack, Typography, IconButton, Tooltip, useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { RV_AC, rvGlass, rvAccordionSx } from './resultViewTokens';
import ResultShareBar from './ResultShareBar';

const ResultSection = ({
  title,
  icon: Icon,
  children,
  onCopy,
  highlight = false,
  collapsible = true,
  defaultExpanded = true,
  shareTitle,
  shareText,
  shareUrl,
  onNotify,
  sx = {},
}) => {
  const isDark = useTheme().palette.mode === 'dark';
  const glass = rvGlass(isDark);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const headerActions = (
    <Stack direction="row" spacing={0.25} alignItems="center" onClick={(e) => e.stopPropagation()}>
      {onCopy && (
        <Tooltip title="Copy">
          <IconButton
            size="small"
            onClick={onCopy}
            aria-label="Copy"
            sx={{ color: 'rgba(17, 17, 17, 0.35)', '&:hover': { color: RV_AC, background: 'rgba(232, 160, 32, 0.08)' } }}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );

  const shareRow = shareText ? (
    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(17, 17, 17, 0.06)' }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(17,17,17,0.4)', mb: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Share
      </Typography>
      <ResultShareBar title={shareTitle || title} text={shareText} url={shareUrl} onNotify={onNotify} compact />
    </Box>
  ) : null;

  if (!collapsible) {
    return (
      <Box
        sx={{
          ...glass,
          p: { xs: 2.5, md: 3.5 },
          mb: 3,
          ...(highlight && {
            border: '1px solid rgba(232, 160, 32, 0.25)',
            background: 'rgba(232, 160, 32, 0.04)',
          }),
          ...sx,
        }}
      >
        <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
          {Icon && <Icon sx={{ color: RV_AC, fontSize: 20 }} />}
          <Typography sx={{ fontWeight: 800, color: '#111111', fontSize: '0.95rem', flex: 1 }}>
            {title}
          </Typography>
          {headerActions}
        </Stack>
        {children}
        {shareRow}
      </Box>
    );
  }

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, val) => setExpanded(val)}
      sx={{
        ...rvAccordionSx(expanded, isDark),
        mb: 3,
        ...(highlight && expanded && { background: 'rgba(232, 160, 32, 0.05)' }),
        ...sx,
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: RV_AC }} />}>
        <Stack direction="row" alignItems="center" gap={1} sx={{ width: '100%', pr: 1 }}>
          {Icon && <Icon sx={{ color: RV_AC, fontSize: 20 }} />}
          <Typography sx={{ fontWeight: 800, color: '#111111', fontSize: '0.95rem', flex: 1 }}>
            {title}
          </Typography>
          {headerActions}
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
        {children}
        {shareRow}
      </AccordionDetails>
    </Accordion>
  );
};

export default ResultSection;
