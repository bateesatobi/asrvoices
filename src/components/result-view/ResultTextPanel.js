import React, { useEffect, useState } from 'react';
import {
  Accordion, AccordionSummary, AccordionDetails,
  Box, Stack, Typography, IconButton, TextField, Button, Tooltip, useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { RV_AC, rvAccordionSx, rvGlass } from './resultViewTokens';
import ResultShareBar from './ResultShareBar';

/**
 * Collapsible text panel with optional edit, copy, and social share.
 */
const ResultTextPanel = ({
  title,
  icon: Icon,
  text = '',
  defaultExpanded = true,
  collapsible = true,
  editable = false,
  onSave,
  onCopy,
  shareTitle,
  shareText,
  shareUrl,
  onNotify,
  highlight = false,
  saving = false,
  emptyMessage = 'No content available',
  minRows = 8,
}) => {
  const isDark = useTheme().palette.mode === 'dark';
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    setDisplayText(text);
    setEditValue(text);
  }, [text]);

  const handleStartEdit = () => {
    setEditValue(displayText);
    setIsEditing(true);
    setExpanded(true);
  };

  const handleCancelEdit = () => {
    setEditValue(displayText);
    setIsEditing(false);
  };

  const handleSave = async () => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      onNotify?.('Text cannot be empty', 'error');
      return;
    }
    try {
      if (onSave) await onSave(trimmed);
      setDisplayText(trimmed);
      setIsEditing(false);
      if (!saving) onNotify?.('Changes saved', 'success');
    } catch {
      /* caller handles error feedback */
    }
  };

  const sharePayload = shareText ?? displayText;
  const panelTitle = shareTitle ?? title;

  const actionButtons = (
    <Stack direction="row" spacing={0.25} alignItems="center" onClick={(e) => e.stopPropagation()}>
      {onCopy && !isEditing && (
        <Tooltip title="Copy">
          <IconButton size="small" onClick={onCopy} sx={{ color: 'rgba(17, 17, 17, 0.35)', '&:hover': { color: RV_AC } }}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {editable && !isEditing && displayText && (
        <Tooltip title="Edit text">
          <IconButton size="small" onClick={handleStartEdit} sx={{ color: 'rgba(17, 17, 17, 0.35)', '&:hover': { color: RV_AC } }}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );

  const body = isEditing ? (
    <Box>
      <TextField
        fullWidth
        multiline
        minRows={minRows}
        maxRows={24}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        autoFocus
        sx={{
          mb: 1.5,
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            lineHeight: 1.75,
            fontSize: '0.92rem',
            background: 'rgba(255,255,255,0.7)',
          },
        }}
      />
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          variant="contained"
          startIcon={<SaveOutlinedIcon sx={{ fontSize: 16 }} />}
          onClick={handleSave}
          disabled={saving}
          sx={{
            textTransform: 'none', fontWeight: 800, fontSize: '0.72rem', borderRadius: '8px',
            background: 'linear-gradient(135deg, #E8A020, #C47F10)', color: '#111', boxShadow: 'none',
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <IconButton size="small" onClick={handleCancelEdit} disabled={saving}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  ) : displayText ? (
    <Typography sx={{ color: 'rgba(17, 17, 17, 0.72)', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
      {displayText}
    </Typography>
  ) : (
    <Typography sx={{ color: 'rgba(17, 17, 17, 0.45)', fontStyle: 'italic' }}>{emptyMessage}</Typography>
  );

  const shareRow = !isEditing && sharePayload ? (
    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(17, 17, 17, 0.06)' }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(17,17,17,0.4)', mb: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Share
      </Typography>
      <ResultShareBar title={panelTitle} text={sharePayload} url={shareUrl} onNotify={onNotify} compact />
    </Box>
  ) : null;

  if (!collapsible) {
    const glass = rvGlass(isDark);
    return (
      <Box sx={{ ...glass, p: { xs: 2.5, md: 3.5 }, mb: 3, ...(highlight && { border: '1px solid rgba(232,160,32,0.25)', background: 'rgba(232,160,32,0.04)' }) }}>
        <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
          {Icon && <Icon sx={{ color: RV_AC, fontSize: 20 }} />}
          <Typography sx={{ fontWeight: 800, color: '#111111', fontSize: '0.95rem', flex: 1 }}>{title}</Typography>
          {actionButtons}
        </Stack>
        {body}
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
        ...(highlight && expanded && { background: 'rgba(232, 160, 32, 0.05)' }),
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: RV_AC }} />}>
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ width: '100%', pr: 1 }}>
          {Icon && <Icon sx={{ color: RV_AC, fontSize: 20 }} />}
          <Typography sx={{ fontWeight: 800, color: '#111111', fontSize: '0.95rem', flex: 1 }}>{title}</Typography>
          {actionButtons}
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
        {body}
        {shareRow}
      </AccordionDetails>
    </Accordion>
  );
};

export default ResultTextPanel;
