import React, { useEffect, useState } from 'react';
import {
  Accordion, AccordionSummary, AccordionDetails,
  Typography, Stack, Chip, IconButton, TextField, Button, Tooltip, Box, useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { RV_AC, rvAccordionSx } from './resultViewTokens';
import ResultShareBar from './ResultShareBar';

const ResultLangAccordion = ({
  langCode,
  langLabel,
  meta,
  expanded,
  defaultExpanded = false,
  onChange,
  children,
  text,
  onCopy,
  editable = false,
  onSave,
  saving = false,
  shareTitle,
  shareText,
  shareUrl,
  onNotify,
  headerActions,
}) => {
  const isDark = useTheme().palette.mode === 'dark';
  const isExpanded = expanded ?? defaultExpanded;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text || '');
  const [displayText, setDisplayText] = useState(text || '');

  useEffect(() => {
    setDisplayText(text || '');
    setEditValue(text || '');
  }, [text]);

  const handleStartEdit = (e) => {
    e.stopPropagation();
    setEditValue(displayText);
    setIsEditing(true);
  };

  const handleCancelEdit = (e) => {
    e?.stopPropagation?.();
    setEditValue(displayText);
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e?.stopPropagation?.();
    const trimmed = editValue.trim();
    if (!trimmed) {
      onNotify?.('Text cannot be empty', 'error');
      return;
    }
    try {
      if (onSave) await onSave(trimmed);
      setDisplayText(trimmed);
      setIsEditing(false);
      onNotify?.('Changes saved', 'success');
    } catch {
      /* caller handles error feedback */
    }
  };

  const sharePayload = shareText ?? displayText;
  const showShare = sharePayload && !isEditing;

  const editBlock = isEditing ? (
    <Box sx={{ mb: 1 }}>
      <TextField
        fullWidth
        multiline
        minRows={6}
        maxRows={20}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        autoFocus
        sx={{
          mb: 1.5,
          '& .MuiOutlinedInput-root': { borderRadius: '12px', lineHeight: 1.75, fontSize: '0.92rem' },
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
  ) : null;

  return (
    <Accordion
      {...(onChange != null ? { expanded, onChange } : { defaultExpanded })}
      sx={rvAccordionSx(isExpanded, isDark)}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: RV_AC }} />} sx={{ borderRadius: '16px' }}>
        <Stack direction="row" alignItems="center" gap={2} sx={{ width: '100%', pr: 1 }}>
          <Chip
            label={(langCode || '').toUpperCase()}
            size="small"
            sx={{
              background: 'rgba(232, 160, 32, 0.1)',
              color: RV_AC,
              fontWeight: 800,
              fontSize: '0.68rem',
              height: 24,
            }}
          />
          <Typography sx={{ fontWeight: 700, color: '#111111', flex: 1 }}>
            {langLabel || langCode}
          </Typography>
          {meta && (
            <Typography variant="caption" sx={{ color: 'rgba(17, 17, 17, 0.35)', fontWeight: 600 }}>
              {meta}
            </Typography>
          )}
          <Stack direction="row" spacing={0.25} alignItems="center" onClick={(e) => e.stopPropagation()}>
            {onCopy && !isEditing && (
              <Tooltip title="Copy">
                <IconButton size="small" onClick={onCopy} sx={{ color: 'rgba(17, 17, 17, 0.3)', '&:hover': { color: RV_AC } }}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {editable && !isEditing && displayText && (
              <Tooltip title="Edit">
                <IconButton size="small" onClick={handleStartEdit} sx={{ color: 'rgba(17, 17, 17, 0.3)', '&:hover': { color: RV_AC } }}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {headerActions}
          </Stack>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
        {editBlock}
        {!isEditing && (
          <>
            {displayText && (
              <Typography sx={{ color: 'rgba(17, 17, 17, 0.72)', lineHeight: 1.85, whiteSpace: 'pre-wrap', mb: children ? 2 : 0 }}>
                {displayText}
              </Typography>
            )}
            {children}
          </>
        )}
        {showShare && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(17, 17, 17, 0.06)' }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(17,17,17,0.4)', mb: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Share
            </Typography>
            <ResultShareBar
              title={shareTitle || langLabel}
              text={sharePayload}
              url={shareUrl}
              onNotify={onNotify}
              compact
            />
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default ResultLangAccordion;
