import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Chip, Alert, useTheme, useMediaQuery, Grid, MenuItem, IconButton } from '@mui/material';
import {
  RecordVoiceOver as VoiceoverIcon,
  History as HistoryIcon,
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import {
  ElevenLabsCard,
  ElevenLabsButton,
  ElevenLabsTabs,
  ElevenLabsTextField,
  PropertySection,
  PropertyRow,
  RightPropertiesPanel,
  StudioLayout,
  TimelineEditor,
} from '../ElevenLabsUI';
import { ttsAPI, subscriptionAPI } from '../../services/api';
import CreditEstimateChip from '../CreditEstimateChip';
import { dataAPI } from '../../services/api';
import { NEURAL_LANGUAGES, NEURAL_SPEAKERS } from '../../constants/neural_config';

const GOLD = '#E8A020';
const GOLD_DARK = '#C47F10';

const EMOTIONS = [
  { id: 'neutral', label: 'Neutral' },
  { id: 'excited', label: 'Excited' },
  { id: 'calm', label: 'Calm' },
  { id: 'authoritative', label: 'Authoritative' },
  { id: 'whisper', label: 'Whisper' },
  { id: 'sad', label: 'Sad' },
];

const TAB_CONFIG = [
  { label: 'Text Blocks', icon: <VoiceoverIcon fontSize="small" /> },
  { label: 'Document', icon: <DownloadIcon fontSize="small" /> },
];

export default function VoiceoversElevenLabs({ userId }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [mainTab, setMainTab] = useState(0); // 0: New Voiceover, 1: History
  const [inputTab, setInputTab] = useState(0); // 0: Text Blocks, 1: Document
  const [historyData, setHistoryData] = useState([]);
  const [textBlocks, setTextBlocks] = useState([
    { id: 1, text: '', voice: NEURAL_SPEAKERS[0]?.id, language: 'en', emotion: 'neutral', speed: 1.0, pitch: 0 }
  ]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [userBalance, setUserBalance] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [showProperties, setShowProperties] = useState(true);

  // Fetch user balance
  useEffect(() => {
    if (userId) {
      subscriptionAPI.getBalance(userId)
        .then(data => setUserBalance(data.balance ?? data.credit_balance ?? null))
        .catch(() => {});
    }
  }, [userId]);

  // Fetch voiceover history
  const fetchHistory = async () => {
    if (!userId) return;
    try {
      const data = await dataAPI.getVoiceovers(userId);
      setHistoryData(data.results || data || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  useEffect(() => {
    if (mainTab === 1) {
      fetchHistory();
    }
  }, [mainTab, userId]);

  // Add text block
  const addTextBlock = () => {
    setTextBlocks([
      ...textBlocks,
      { id: Date.now(), text: '', voice: NEURAL_SPEAKERS[0]?.id, language: 'en', emotion: 'neutral', speed: 1.0, pitch: 0 }
    ]);
  };

  // Remove text block
  const removeTextBlock = (id) => {
    setTextBlocks(textBlocks.filter(block => block.id !== id));
  };

  // Update text block
  const updateTextBlock = (id, field, value) => {
    setTextBlocks(textBlocks.map(block => 
      block.id === id ? { ...block, [field]: value } : block
    ));
  };

  // Handle generate voiceover
  const handleGenerate = async () => {
    if (!userId) {
      setErrorMsg('Please log in to continue');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const result = await ttsAPI.generateVoiceover(userId, {
        blocks: textBlocks,
        file: uploadedFile,
      });

      setCurrentProject(result);
      setSuccessMsg('Voiceover generated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg(error.message || 'Voiceover generation failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Load history item
  const loadHistoryItem = (item) => {
    setCurrentProject(item);
    setTextBlocks(item.blocks || [{ id: 1, text: '', voice: NEURAL_SPEAKERS[0]?.id, language: 'en', emotion: 'neutral' }]);
    setMainTab(0);
  };

  // Clear form
  const handleClear = () => {
    setTextBlocks([{ id: 1, text: '', voice: NEURAL_SPEAKERS[0]?.id, language: 'en', emotion: 'neutral', speed: 1.0, pitch: 0 }]);
    setUploadedFile(null);
    setCurrentProject(null);
  };

  const mainTabs = [
    { label: 'New Voiceover', icon: <VoiceoverIcon fontSize="small" /> },
    { label: 'History', icon: <HistoryIcon fontSize="small" /> },
  ];

  const inputTabs = TAB_CONFIG.map(tab => ({ label: tab.label, icon: tab.icon }));

  // Properties panel content
  const propertiesPanel = (
    <RightPropertiesPanel title="Voiceover Settings">
      <PropertySection title="Global Settings" defaultOpen={true}>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: '0.75rem', color: '#999999', mb: 0.5, fontWeight: 600, textTransform: 'uppercase' }}>
            Default Voice
          </Typography>
          <ElevenLabsTextField
            select
            value={textBlocks[0]?.voice || NEURAL_SPEAKERS[0]?.id}
            onChange={(e) => updateTextBlock(textBlocks[0]?.id, 'voice', e.target.value)}
            fullWidth
            size="small"
          >
            {NEURAL_SPEAKERS.map((voice) => (
              <MenuItem key={voice.id} value={voice.id}>
                {voice.name} ({voice.lang.toUpperCase()})
              </MenuItem>
            ))}
          </ElevenLabsTextField>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: '0.75rem', color: '#999999', mb: 0.5, fontWeight: 600, textTransform: 'uppercase' }}>
            Default Language
          </Typography>
          <ElevenLabsTextField
            select
            value={textBlocks[0]?.language || 'en'}
            onChange={(e) => updateTextBlock(textBlocks[0]?.id, 'language', e.target.value)}
            fullWidth
            size="small"
          >
            {NEURAL_LANGUAGES.map((lang) => (
              <MenuItem key={lang.code} value={lang.code}>
                {lang.name}
              </MenuItem>
            ))}
          </ElevenLabsTextField>
        </Box>

        <Box>
          <Typography sx={{ fontSize: '0.75rem', color: '#999999', mb: 0.5, fontWeight: 600, textTransform: 'uppercase' }}>
            Default Emotion
          </Typography>
          <ElevenLabsTextField
            select
            value={textBlocks[0]?.emotion || 'neutral'}
            onChange={(e) => updateTextBlock(textBlocks[0]?.id, 'emotion', e.target.value)}
            fullWidth
            size="small"
          >
            {EMOTIONS.map((emotion) => (
              <MenuItem key={emotion.id} value={emotion.id}>
                {emotion.label}
              </MenuItem>
            ))}
          </ElevenLabsTextField>
        </Box>
      </PropertySection>

      <PropertySection title="Background Music" defaultOpen={false}>
        <Typography sx={{ fontSize: '0.8125rem', color: '#999999', py: 2 }}>
          Add background music to your voiceover (coming soon)
        </Typography>
      </PropertySection>

      <PropertySection title="File Info" defaultOpen={false}>
        {uploadedFile ? (
          <>
            <PropertyRow label="File Name" value={uploadedFile.name} />
            <PropertyRow label="File Size" value={`${(uploadedFile.size / 1024).toFixed(2)} KB`} />
          </>
        ) : (
          <Typography sx={{ fontSize: '0.8125rem', color: '#999999', py: 2 }}>
            No document selected
          </Typography>
        )}
      </PropertySection>

      <PropertySection title="Account" defaultOpen={false}>
        <PropertyRow label="Credit Balance" value={userBalance !== null ? `${userBalance.toFixed(2)}` : 'Loading...'} />
        <PropertyRow label="User ID" value={userId?.substring(0, 8) + '...'} />
      </PropertySection>
    </RightPropertiesPanel>
  );

  return (
    <StudioLayout
      propertiesPanel={mainTab === 0 ? propertiesPanel : null}
      showPropertiesPanel={showProperties}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em' }}>
              Voiceovers
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: '#666666', mt: 0.5 }}>
              Create AI-powered voiceovers from text or documents
            </Typography>
          </Box>
          <CreditEstimateChip />
        </Box>

        {/* Main Tabs */}
        <ElevenLabsTabs value={mainTab} onChange={(_, v) => setMainTab(v)} tabs={mainTabs} />

        {/* New Voiceover Tab */}
        {mainTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
            {!currentProject && (
              <ElevenLabsCard>
                <ElevenLabsTabs value={inputTab} onChange={(_, v) => setInputTab(v)} tabs={inputTabs} />
              
              <Box sx={{ p: 3 }}>
                {inputTab === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {textBlocks.map((block, index) => (
                      <ElevenLabsCard key={block.id} sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1a1a' }}>
                            Block {index + 1}
                          </Typography>
                          {textBlocks.length > 1 && (
                            <IconButton
                              size="small"
                              onClick={() => removeTextBlock(block.id)}
                              sx={{ color: '#666666' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                        <ElevenLabsTextField
                          placeholder="Enter text for this block..."
                          value={block.text}
                          onChange={(e) => updateTextBlock(block.id, 'text', e.target.value)}
                          multiline
                          minRows={3}
                          fullWidth
                        />
                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontSize: '0.75rem', color: '#999999', mb: 0.5, fontWeight: 600 }}>
                              Voice
                            </Typography>
                            <ElevenLabsTextField
                              select
                              value={block.voice}
                              onChange={(e) => updateTextBlock(block.id, 'voice', e.target.value)}
                              fullWidth
                              size="small"
                            >
                              {NEURAL_SPEAKERS.map((voice) => (
                                <MenuItem key={voice.id} value={voice.id}>
voice.name
                                </MenuItem>
                              ))}
                            </ElevenLabsTextField>
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontSize: '0.75rem', color: '#999999', mb: 0.5, fontWeight: 600 }}>
                              Emotion
                            </Typography>
                            <ElevenLabsTextField
                              select
                              value={block.emotion}
                              onChange={(e) => updateTextBlock(block.id, 'emotion', e.target.value)}
                              fullWidth
                              size="small"
                            >
                              {EMOTIONS.map((emotion) => (
                                <MenuItem key={emotion.id} value={emotion.id}>
emotion.label
                                </MenuItem>
                              ))}
                            </ElevenLabsTextField>
                          </Box>
                        </Box>
                      </ElevenLabsCard>
                    ))}
                    
                    <ElevenLabsButton
                      variant="outlined"
                      onClick={addTextBlock}
                      startIcon={<AddIcon />}
                      fullWidth
                    >
                      Add Text Block
                    </ElevenLabsButton>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: '#666666' }}>
                      Upload a document to convert to voiceover:
                    </Typography>
                    <Box
                      sx={{
                        border: '2px dashed #e8e8e8',
                        borderRadius: 2,
                        p: 4,
                        textAlign: 'center',
                        cursor: 'pointer',
                        '&:hover': { borderColor: GOLD, bgcolor: 'rgba(232,160,32,0.02)' },
                      }}
                    >
                      <UploadIcon sx={{ fontSize: 48, color: '#999999', mb: 1 }} />
                      <Typography sx={{ fontSize: '0.875rem', color: '#666666' }}>
                        Click to upload or drag and drop
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#999999', mt: 0.5 }}>
                        PDF, DOC, DOCX, TXT
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              <Box sx={{ p: 3, borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#999999' }}>
                  {inputTab === 0 ? `${textBlocks.length} blocks` : (uploadedFile ? uploadedFile.name : 'No file')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" onClick={handleClear} sx={{ color: '#666666' }}>
                    Clear
                  </Button>
                  <ElevenLabsButton
                    variant="contained"
                    onClick={handleGenerate}
                    disabled={isProcessing || (inputTab === 0 && textBlocks.every(b => !b.text.trim()))}
                    loading={isProcessing}
                    startIcon={<AutoAwesomeIcon />}
                  >
                    Generate Voiceover
                  </ElevenLabsButton>
                </Box>
              </Box>
            </ElevenLabsCard>
          )}

          {/* Current Project View */}
          {currentProject && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <ElevenLabsCard title="Voiceover Preview">
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <ElevenLabsButton
                        variant="contained"
                        startIcon={<PlayIcon />}
                      >
                        Play
                      </ElevenLabsButton>
                      <ElevenLabsButton
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                      >
                        Download
                      </ElevenLabsButton>
                    </Box>
                    
                    <TimelineEditor
                      audioUrl={currentProject.audio_url}
                      showAddSegment={false}
                      onTimeUpdate={(time) => console.log('Time:', time)}
                    />
                  </Box>
                </ElevenLabsCard>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <ElevenLabsCard title="Project Info">
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <PropertyRow label="Status" value={currentProject.status} />
                    <PropertyRow label="Blocks" value={currentProject.total_blocks || textBlocks.length} />
                    <PropertyRow label="Duration" value={currentProject.duration || 'N/A'} />
                    
                    <ElevenLabsButton
                      variant="text"
                      onClick={handleClear}
                      fullWidth
                    >
                      New Voiceover
                    </ElevenLabsButton>
                  </Box>
                </ElevenLabsCard>
              </Grid>
            </Grid>
          )}
          </Box>
        )}

        {/* History Tab */}
        {mainTab === 1 && (
          <ElevenLabsCard title="Voiceover History" subtitle={`Showing ${historyData.length} voiceovers`}>
            <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
              {historyData.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center', color: '#999999' }}>
                  <Typography sx={{ fontSize: '0.875rem' }}>No voiceover history yet</Typography>
                </Box>
              ) : (
                historyData.map((item) => (
                  <Box
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    sx={{
                      p: 2,
                      borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#fafafa' },
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1a1a' }}>
                        {item.title || 'Untitled Voiceover'}
                      </Typography>
                      <Chip
                        label={item.status || 'completed'}
                        size="small"
                        sx={{ height: 24, fontSize: '0.75rem', bgcolor: '#f5f5f5' }}
                      />
                    </Box>
                    <Typography sx={{ fontSize: '0.8125rem', color: '#666666' }}>
                      {item.total_blocks || 0} blocks • {item.duration || 'N/A'}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </ElevenLabsCard>
        )}
      </Box>

      {/* Success/Error Messages */}
      {successMsg && (
        <Alert severity="success" onClose={() => setSuccessMsg('')} sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
          {successMsg}
        </Alert>
      )}
      {errorMsg && (
        <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
          {errorMsg}
        </Alert>
      )}
    </StudioLayout>
  );
}
