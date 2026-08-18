import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Chip, Alert, useTheme, useMediaQuery, Grid, MenuItem } from '@mui/material';
import {
  Mic as MicIcon,
  CloudUpload as UploadIcon,
  History as HistoryIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  AutoAwesome as AutoAwesomeIcon,
  GraphicEq as GraphicEqIcon,
} from '@mui/icons-material';
import {
  ElevenLabsCard,
  ElevenLabsButton,
  ElevenLabsTabs,
  ElevenLabsTextField,
  ElevenLabsFileUpload,
  PropertySection,
  PropertyRow,
  RightPropertiesPanel,
  StudioLayout,
} from '../ElevenLabsUI';
import { voiceCloningAPI, subscriptionAPI } from '../../services/api';
import { LANGUAGES } from '../../constants/languages';
import CreditEstimateChip from '../CreditEstimateChip';

const GOLD = '#E8A020';
const GOLD_DARK = '#C47F10';

const CLONING_COST = 10;

const TAB_CONFIG = [
  { label: 'Upload Sample', icon: <UploadIcon fontSize="small" /> },
  { label: 'Record Voice', icon: <MicIcon fontSize="small" /> },
];

export default function VoiceCloningElevenLabs() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mainTab, setMainTab] = useState(0); // 0: New Cloning, 1: History
  const [historyData, setHistoryData] = useState([]);
  const [voiceFile, setVoiceFile] = useState(null);
  const [referenceText, setReferenceText] = useState('');
  const [language, setLanguage] = useState('en');
  const [temperature, setTemperature] = useState(0.7);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [userBalance, setUserBalance] = useState(null);
  const [clonedVoice, setClonedVoice] = useState(null);

  const mediaRecorder = useRef(null);
  const mediaStream = useRef(null);
  const chunks = useRef([]);
  const timerRef = useRef(null);
  const [recordingTime, setRecordingTime] = useState(0);

  // Fetch user balance
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.uid || user.userId;
    if (userId) {
      subscriptionAPI.getBalance(userId)
        .then(data => setUserBalance(data.balance ?? data.credit_balance ?? null))
        .catch(() => {});
    }
  }, []);

  // Fetch voice cloning history
  const fetchHistory = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.uid || user.userId;
    if (!userId) return;
    try {
      const data = await voiceCloningAPI.getVoices(userId);
      setHistoryData(data.results || data || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  useEffect(() => {
    if (mainTab === 1) {
      fetchHistory();
    }
  }, [mainTab]);

  // Handle recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        chunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/wav' });
        setRecordedBlob(blob);
        setVoiceFile(blob);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      setErrorMsg('Could not access microphone. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
  };

  // Handle voice cloning
  const handleClone = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.uid || user.userId;
    
    if (!userId) {
      setErrorMsg('Please log in to continue');
      return;
    }

    if (!voiceFile) {
      setErrorMsg('Please provide a voice sample');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('audio', voiceFile);
      formData.append('reference_text', referenceText);
      formData.append('language', language);
      formData.append('temperature', temperature);

      const result = await voiceCloningAPI.cloneVoice(userId, formData);
      setClonedVoice(result);
      setSuccessMsg('Voice cloned successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg(error.message || 'Voice cloning failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Load history item
  const loadHistoryItem = (item) => {
    setClonedVoice(item);
    setLanguage(item.language || 'en');
    setReferenceText(item.reference_text || '');
    setMainTab(0);
  };

  // Clear form
  const handleClear = () => {
    setVoiceFile(null);
    setRecordedBlob(null);
    setReferenceText('');
    setClonedVoice(null);
  };

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const mainTabs = [
    { label: 'New Cloning', icon: <MicIcon fontSize="small" /> },
    { label: 'History', icon: <HistoryIcon fontSize="small" /> },
  ];

  // Properties panel content
  const propertiesPanel = (
    <RightPropertiesPanel title="Cloning Settings">
      <PropertySection title="Voice Settings" defaultOpen={true}>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: '0.75rem', color: '#999999', mb: 0.5, fontWeight: 600, textTransform: 'uppercase' }}>
            Language
          </Typography>
          <ElevenLabsTextField
            select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            fullWidth
            size="small"
          >
            {LANGUAGES.map((lang) => (
              <MenuItem key={lang.code} value={lang.code}>
                {lang.name}
              </MenuItem>
            ))}
          </ElevenLabsTextField>
        </Box>

        <Box>
          <Typography sx={{ fontSize: '0.75rem', color: '#999999', mb: 0.5, fontWeight: 600, textTransform: 'uppercase' }}>
            Temperature: {temperature}
          </Typography>
          <Box sx={{ px: 1 }}>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: GOLD }}
            />
          </Box>
          <Typography sx={{ fontSize: '0.75rem', color: '#999999', mt: 0.5 }}>
            Lower = more accurate, Higher = more expressive
          </Typography>
        </Box>
      </PropertySection>

      <PropertySection title="Reference Text" defaultOpen={true}>
        <ElevenLabsTextField
          placeholder="Enter reference text (optional)..."
          value={referenceText}
          onChange={(e) => setReferenceText(e.target.value)}
          multiline
          minRows={3}
          fullWidth
          size="small"
        />
        <Typography sx={{ fontSize: '0.75rem', color: '#999999', mt: 1 }}>
          Helps improve cloning accuracy
        </Typography>
      </PropertySection>

      <PropertySection title="Account" defaultOpen={false}>
        <PropertyRow label="Credit Balance" value={userBalance !== null ? `${userBalance.toFixed(2)}` : 'Loading...'} />
        <PropertyRow label="Cloning Cost" value={`${CLONING_COST} credits`} />
      </PropertySection>
    </RightPropertiesPanel>
  );

  return (
    <StudioLayout
      propertiesPanel={mainTab === 0 ? propertiesPanel : null}
      showPropertiesPanel={true}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em' }}>
              Voice Cloning
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: '#666666', mt: 0.5 }}>
              Clone voices from audio samples for personalized TTS
            </Typography>
          </Box>
          <CreditEstimateChip />
        </Box>

        {/* Main Tabs */}
        <ElevenLabsTabs value={mainTab} onChange={(_, v) => setMainTab(v)} tabs={mainTabs} />

        {/* New Cloning Tab */}
        {mainTab === 0 && (
          <Box sx={{ display: 'flex', gap: 3, flex: 1, flexDirection: isMobile ? 'column' : 'row' }}>
            {/* Left: Input */}
            <ElevenLabsCard sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #f0f0f0' }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1a1a' }}>
                  Voice Sample
                </Typography>
              </Box>
              
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3, gap: 3 }}>
                <ElevenLabsFileUpload
                  onFileSelect={(file) => setVoiceFile(file)}
                  selectedFile={voiceFile}
                  onClearFile={() => setVoiceFile(null)}
                  accept="audio/*"
                />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4, borderTop: '1px solid #f0f0f0' }}>
                  <Typography sx={{ fontSize: '0.875rem', color: '#666666' }}>
                    Or record your voice:
                  </Typography>
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      bgcolor: isRecording ? 'rgba(232,160,32,0.1)' : '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      border: isRecording ? `2px solid ${GOLD}` : '2px solid #e8e8e8',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: isRecording ? 'rgba(232,160,32,0.15)' : '#e8e8e8',
                      },
                    }}
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? (
                      <StopIcon sx={{ fontSize: 48, color: GOLD_DARK }} />
                    ) : (
                      <MicIcon sx={{ fontSize: 48, color: '#666666' }} />
                    )}
                  </Box>

                  <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a1a' }}>
                    {formatTime(recordingTime)}
                  </Typography>

                  <Typography sx={{ fontSize: '0.875rem', color: '#666666' }}>
                    {isRecording ? 'Recording...' : 'Click to start recording'}
                  </Typography>
                </Box>

                {recordedBlob && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
                    <audio controls src={URL.createObjectURL(recordedBlob)} style={{ height: 40 }} />
                    <Button
                      size="small"
                      onClick={() => {
                        setRecordedBlob(null);
                        setVoiceFile(null);
                        setRecordingTime(0);
                      }}
                      sx={{ color: '#666666' }}
                    >
                      Discard
                    </Button>
                  </Box>
                )}
              </Box>

              <Box sx={{ p: 2, borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#999999' }}>
                  {voiceFile ? voiceFile.name : recordedBlob ? 'Recorded audio' : 'No voice sample'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" onClick={handleClear} sx={{ color: '#666666' }}>
                    Clear
                  </Button>
                  <ElevenLabsButton
                    variant="contained"
                    onClick={handleClone}
                    disabled={isProcessing || (!voiceFile && !recordedBlob)}
                    loading={isProcessing}
                    startIcon={<AutoAwesomeIcon />}
                  >
                    Clone Voice
                  </ElevenLabsButton>
                </Box>
              </Box>
            </ElevenLabsCard>

            {/* Right: Output */}
            <ElevenLabsCard sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #f0f0f0' }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1a1a' }}>
                  Cloned Voice
                </Typography>
              </Box>
              
              <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {clonedVoice ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: '100%' }}>
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        bgcolor: 'rgba(232,160,32,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `2px solid ${GOLD}`,
                      }}
                    >
                      <GraphicEqIcon sx={{ fontSize: 48, color: GOLD_DARK }} />
                    </Box>

                    <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: '#1a1a1a' }}>
                      Voice Ready!
                    </Typography>

                    <Typography sx={{ fontSize: '0.875rem', color: '#666666', textAlign: 'center' }}>
                      Your voice has been cloned successfully. You can now use it in the Text-to-Speech studio.
                    </Typography>

                    {clonedVoice.audio_url && (
                      <audio controls src={clonedVoice.audio_url} style={{ width: '100%' }} />
                    )}

                    <ElevenLabsButton
                      variant="outlined"
                      onClick={handleClear}
                    >
                      Clone Another Voice
                    </ElevenLabsButton>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', color: '#999999' }}>
                    <Typography sx={{ fontSize: '0.875rem' }}>
                      Cloned voice will appear here
                    </Typography>
                  </Box>
                )}
              </Box>
            </ElevenLabsCard>
          </Box>
        )}

      {/* History Tab */}
      {mainTab === 1 && (
        <ElevenLabsCard title="Cloned Voices" subtitle={`Showing ${historyData.length} voices`}>
          <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
            {historyData.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center', color: '#999999' }}>
                <Typography sx={{ fontSize: '0.875rem' }}>No cloned voices yet</Typography>
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
                      {item.name || 'Untitled Voice'}
                    </Typography>
                    <Chip
                      label={item.language || 'en'}
                      size="small"
                      sx={{ height: 24, fontSize: '0.75rem', bgcolor: '#f5f5f5' }}
                    />
                  </Box>
                  <Typography sx={{ fontSize: '0.8125rem', color: '#666666' }}>
                    Created: {new Date(item.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
        </ElevenLabsCard>
      )}

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
      </Box>
    </StudioLayout>
  );
}
