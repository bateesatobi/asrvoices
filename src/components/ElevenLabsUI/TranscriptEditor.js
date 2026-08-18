import React, { useState, useRef } from 'react';
import { Box, Typography, Avatar, IconButton, TextField, Chip, Tooltip, useTheme } from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const GOLD = '#E8A020';
const GOLD_DARK = '#C47F10';

/**
 * TranscriptSegment - Individual transcript segment with speaker label and timestamp
 * 
 * @param {Object} props
 * @param {string} props.speaker - Speaker name/identifier
 * @param {string} props.timestamp - Timestamp (e.g., "00:56")
 * @param {string} props.text - Transcript text
 * @param {boolean} props.isActive - Whether segment is active/selected
 * @param {boolean} props.isEditable - Whether text can be edited
 * @param {Function} props.onEdit - Callback when edit button clicked
 * @param {Function} props.onSave - Callback when save button clicked
 * @param {Function} props.onCancel - Callback when cancel button clicked
 * @param {Function} props.onCopy - Callback when copy button clicked
 * @param {Function} props.onClick - Callback when segment clicked
 */
function TranscriptSegment({
  speaker,
  timestamp,
  text,
  isActive = false,
  isEditable = false,
  onEdit,
  onSave,
  onCancel,
  onCopy,
  onClick,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);
  const theme = useTheme();

  const handleSave = () => {
    onSave?.(editedText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(text);
    setIsEditing(false);
    onCancel?.();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    onCopy?.();
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        gap: 2,
        p: 2,
        borderRadius: 1.5,
        bgcolor: isActive ? 'rgba(232,160,32,0.08)' : 'transparent',
        border: isActive ? `1px solid rgba(232,160,32,0.2)` : '1px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        '&:hover': {
          bgcolor: isActive ? 'rgba(232,160,32,0.12)' : 'rgba(0,0,0,0.02)',
        },
      }}
    >
      {/* Speaker avatar and timestamp */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60, flexShrink: 0 }}>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: isActive ? GOLD : '#e8e8e8',
            color: isActive ? '#ffffff' : '#666666',
            fontSize: '0.8125rem',
            fontWeight: 600,
            mb: 0.5,
          }}
        >
          <PersonIcon fontSize="small" />
        </Avatar>
        <Typography sx={{ fontSize: '0.75rem', color: '#999999', fontFamily: 'monospace' }}>
          {timestamp}
        </Typography>
      </Box>

      {/* Transcript text */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: '0.9375rem',
            color: '#1a1a1a',
            lineHeight: 1.6,
            fontWeight: 500,
          }}
        >
          {speaker && (
            <Box component="span" sx={{ color: GOLD_DARK, fontWeight: 600, mr: 1 }}>
              {speaker}:
            </Box>
          )}
          {isEditing ? (
            <TextField
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              fullWidth
              multiline
              size="small"
              sx={{
                '& .MuiInputBase-root': {
                  bgcolor: '#ffffff',
                  fontSize: '0.9375rem',
                },
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            text
          )}
        </Typography>
      </Box>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexShrink: 0 }}>
        {isEditing ? (
          <>
            <Tooltip title="Save" arrow>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                sx={{ color: GOLD_DARK }}
              >
                <CheckIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cancel" arrow>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
                sx={{ color: '#666666' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <>
            {isEditable && (
              <Tooltip title="Edit" arrow>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                    onEdit?.();
                  }}
                  sx={{ color: '#666666' }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Copy" arrow>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy();
                }}
                sx={{ color: '#666666' }}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    </Box>
  );
}

/**
 * TranscriptEditor - Full transcript editor with speaker labels, timestamps, and search
 * 
 * @param {Object} props
 * @param {Array} props.segments - Array of transcript segments {id, speaker, timestamp, text}
 * @param {boolean} props.editable - Whether transcript is editable
 * @param {Function} props.onSegmentUpdate - Callback when segment is updated
 * @param {Function} props.onSegmentClick - Callback when segment is clicked
 * @param {string} props.activeSegmentId - ID of currently active segment
 */
export default function TranscriptEditor({
  segments = [],
  editable = true,
  onSegmentUpdate,
  onSegmentClick,
  activeSegmentId,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSegments, setFilteredSegments] = useState(segments);

  // Filter segments based on search
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSegments(segments);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredSegments(
        segments.filter(
          (seg) =>
            seg.text.toLowerCase().includes(query) ||
            seg.speaker?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, segments]);

  const handleSegmentUpdate = (segmentId, newText) => {
    onSegmentUpdate?.(segmentId, newText);
  };

  const handleExport = () => {
    const fullText = segments.map((seg) => `[${seg.timestamp}] ${seg.speaker || ''}: ${seg.text}`).join('\n\n');
    navigator.clipboard.writeText(fullText);
  };

  return (
    <Box
      sx={{
        bgcolor: '#ffffff',
        border: '1px solid #e8e8e8',
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          borderBottom: '1px solid #e8e8e8',
          bgcolor: '#ffffff',
        }}
      >
        <Typography
          sx={{
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: '#1a1a1a',
            letterSpacing: '-0.01em',
          }}
        >
          Transcript
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={`${segments.length} segments`}
            size="small"
            sx={{
              height: 24,
              fontSize: '0.75rem',
              bgcolor: '#f5f5f5',
              color: '#666666',
            }}
          />
          <Box
            onClick={handleExport}
            sx={{
              px: 2,
              py: 0.75,
              borderRadius: 1,
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: GOLD_DARK,
              bgcolor: 'rgba(232,160,32,0.08)',
              '&:hover': {
                bgcolor: 'rgba(232,160,32,0.12)',
              },
              transition: 'all 0.15s ease',
            }}
          >
            Export
          </Box>
        </Box>
      </Box>

      {/* Search bar */}
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1.5,
            bgcolor: '#ffffff',
            border: '1px solid #e8e8e8',
            borderRadius: 1,
            '&:focus-within': {
              borderColor: GOLD,
              borderWidth: 2,
            },
            transition: 'all 0.15s ease',
          }}
        >
          <SearchIcon sx={{ fontSize: 18, color: '#999999' }} />
          <TextField
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: {
                fontSize: '0.875rem',
                color: '#1a1a1a',
              },
            }}
          />
        </Box>
      </Box>

      {/* Transcript segments */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          py: 2,
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            background: '#fafafa',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#e8e8e8',
            borderRadius: 3,
            '&:hover': {
              background: '#d0d0d0',
            },
          },
        }}
      >
        {filteredSegments.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              color: '#999999',
            }}
          >
            <Typography sx={{ fontSize: '0.875rem' }}>
              {searchQuery ? 'No matching segments found' : 'No transcript segments yet'}
            </Typography>
          </Box>
        ) : (
          filteredSegments.map((segment) => (
            <TranscriptSegment
              key={segment.id}
              speaker={segment.speaker}
              timestamp={segment.timestamp}
              text={segment.text}
              isActive={segment.id === activeSegmentId}
              isEditable={editable}
              onEdit={() => {}}
              onSave={(newText) => handleSegmentUpdate(segment.id, newText)}
              onCancel={() => {}}
              onCopy={() => {}}
              onClick={() => onSegmentClick?.(segment.id)}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
