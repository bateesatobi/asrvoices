import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Chip, Alert, useTheme, useMediaQuery, Grid, MenuItem, IconButton, Stack } from '@mui/material';
import {
  VideoLibrary as VideoIcon,
  RecordVoiceOver as VoiceoverIcon,
  CloudUpload as UploadIcon,
  History as HistoryIcon,
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  AutoAwesome as AutoAwesomeIcon,
  Image as ImageIcon,
  KeyboardArrowLeft,
  KeyboardArrowRight,
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
  VideoPreviewPanel,
  TimelineEditor,
} from '../ElevenLabsUI';
import { videoAPI, ttsAPI, subscriptionAPI } from '../../services/api';
import CreditEstimateChip from '../CreditEstimateChip';
import { dataAPI } from '../../services/api';
import { NEURAL_LANGUAGES, NEURAL_SPEAKERS } from '../../constants/neural_config';
import { LANGUAGES } from '../../constants/languages';
import { ASR_LANGUAGES, DEFAULT_ASR_LANG } from '../../constants/asrLanguages';
import StudioHeroBanner from '../Layout/StudioHeroBanner';
import { STUDIO_VISUALS } from '../../data/studioVisuals';

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

const DUBBING_TAB_CONFIG = [
  { label: 'Upload Video', icon: <UploadIcon fontSize="small" /> },
  { label: 'YouTube URL', icon: <VideoIcon fontSize="small" /> },
];

const VOICEOVER_TAB_CONFIG = [
  { label: 'Video', icon: <VideoIcon fontSize="small" /> },
  { label: 'Slideshow', icon: <ImageIcon fontSize="small" /> },
];

export default function VideoVoiceoverCombined({ userId }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  
  // Main tabs: Video Dubbing, Voiceovers, History
  const [mainTab, setMainTab] = useState(0); // 0: Video Dubbing, 1: Voiceovers, 2: History
  
  // Video Dubbing state
  const [dubbingInputTab, setDubbingInputTab] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState(DEFAULT_ASR_LANG);
  const [targetLanguages, setTargetLanguages] = useState(['lg']);
  const [selectedVoice, setSelectedVoice] = useState(NEURAL_SPEAKERS[0]?.id);
  const [currentVideo, setCurrentVideo] = useState(null);
  
  // Voiceovers state
  const [voiceoverInputTab, setVoiceoverInputTab] = useState(0);
  const [textBlocks, setTextBlocks] = useState([
    { id: 1, text: '', voice: NEURAL_SPEAKERS[0]?.id, language: 'en', emotion: 'neutral', speed: 1.0, pitch: 0 }
  ]);
  const [voiceoverFile, setVoiceoverFile] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  
  // Slideshow state
  const [imageFiles, setImageFiles] = useState([]);
  const [slideshowUrl, setSlideshowUrl] = useState(null);
  
  // Video voiceover state
  const [voiceoverVideoFile, setVoiceoverVideoFile] = useState(null);
  const [voiceoverVideoUrl, setVoiceoverVideoUrl] = useState(null);
  
  // Shared state
  const [historyData, setHistoryData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [userBalance, setUserBalance] = useState(null);
  const [showProperties, setShowProperties] = useState(true);

  // Fetch user balance
  useEffect(() => {
    if (userId) {
      subscriptionAPI.getBalance(userId)
        .then(data => setUserBalance(data.balance ?? data.credit_balance ?? null))
        .catch(() => {});
    }
  }, [userId]);

  // Fetch combined history
  const fetchHistory = async () => {
    if (!userId) return;
    try {
      const [dubbingData, voiceoverData] = await Promise.all([
        dataAPI.getDubbedVideos(userId),
        dataAPI.getVoiceovers(userId)
      ]);
      const combined = [
        ...(dubbingData.results || dubbingData || []).map(item => ({ ...item, type: 'dubbing' })),
        ...(voiceoverData.results || voiceoverData || []).map(item => ({ ...item, type: 'voiceover' }))
      ];
      setHistoryData(combined);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  useEffect(() => {
    if (mainTab === 2) {
      fetchHistory();
    }
  }, [mainTab, userId]);

  // Handle video dubbing
  const handleDubbing = async () => {
    if (!userId) {
      setErrorMsg('Please log in to continue');
      return;
    }
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      let result;
      if (dubbingInputTab === 0) {
        const formData = new FormData();
        formData.append('video', uploadedFile);
        formData.append('source_language', sourceLanguage);
        formData.append('target_languages', JSON.stringify(targetLanguages));
        formData.append('voice_id', selectedVoice);
        result = await videoAPI.dubVideo(userId, formData);
      } else {
        result = await videoAPI.dubFromYoutube(userId, {
          url: youtubeUrl,
          source_language: sourceLanguage,
          target_languages: targetLanguages,
          voice_id: selectedVoice,
        });
      }
      setCurrentVideo(result);
      setSuccessMsg('Dubbing started successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg(error.message || 'Dubbing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle voiceover generation
  const handleGenerateVoiceover = async () => {
    if (!userId) {
      setErrorMsg('Please log in to continue');
      return;
    }
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const result = await ttsAPI.generateVoiceover(userId, {
        blocks: textBlocks,
        language: 'en',
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

  // Toggle target language
  const toggleTargetLanguage = (lang) => {
    if (targetLanguages.includes(lang)) {
      setTargetLanguages(targetLanguages.filter(l => l !== lang));
    } else {
      setTargetLanguages([...targetLanguages, lang]);
    }
  };

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
    setTextBlocks(textBlocks.map(block => block.id === id ? { ...block, [field]: value } : block));
  };

  // Handle image upload for slideshow
  const handleImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newImages = files.map(f => ({ id: Date.now() + Math.random(), file: f, url: URL.createObjectURL(f) }));
    setImageFiles(prev => {
      const updated = [...prev, ...newImages];
      // Sync blocks if we have more images than blocks
      if (updated.length > textBlocks.length) {
        const extraBlocks = Array.from({ length: updated.length - textBlocks.length }).map(() => ({
          id: Date.now() + Math.random(),
          text: '',
          voice: NEURAL_SPEAKERS[0]?.id,
          language: 'en',
          emotion: 'neutral',
          speed: 1.0,
          pitch: 0
        }));
        setTextBlocks(b => [...b, ...extraBlocks]);
      }
      return updated;
    });
  };

  // Remove image
  const removeImage = (id) => {
    setImageFiles(prev => {
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter(img => img.id !== id);
    });
  };

  // Move image (reorder)
  const moveImage = (index, dir) => {
    if (index + dir < 0 || index + dir >= imageFiles.length) return;
    setImageFiles(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + dir];
      copy[index + dir] = temp;
      return copy;
    });
  };

  // Handle slideshow generation
  const handleGenerateSlideshow = async () => {
    if (!userId) {
      setErrorMsg('Please log in to continue');
      return;
    }
    if (!imageFiles.length) {
      setErrorMsg('Please upload at least one image');
      return;
    }
    if (textBlocks.length < imageFiles.length) {
      setErrorMsg('Not enough script blocks for your images');
      return;
    }
    
    setIsProcessing(true);
    setErrorMsg(null);
    
    try {
      const populated = textBlocks.slice(0, imageFiles.length);
      if (populated.some(b => !b.text.trim())) {
        setErrorMsg('All image blocks must have text');
        setIsProcessing(false);
        return;
      }
      
      const segments = populated.map(b => ({
        text: b.text,
        speaker_id: b.voice,
        target_lang: b.language,
        pitch: b.pitch,
        rate: b.speed
      }));
      const files = imageFiles.map(img => img.file);
      
      const res = await videoAPI.finalizeImageSlideshow(segments, userId, files);
      
      if (res?.slideshow_url) {
        setSlideshowUrl(res.slideshow_url);
        setSuccessMsg('Slideshow generated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        throw new Error('No slideshow URL received from server');
      }
    } catch (error) {
      setErrorMsg(error.message || 'Slideshow generation failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle video voiceover generation
  const handleGenerateVideoVoiceover = async () => {
    if (!userId) {
      setErrorMsg('Please log in to continue');
      return;
    }
    if (!voiceoverVideoFile) {
      setErrorMsg('Please upload a video file');
      return;
    }
    if (textBlocks.every(b => !b.text.trim())) {
      setErrorMsg('Please provide narration text');
      return;
    }
    
    setIsProcessing(true);
    setErrorMsg(null);
    
    try {
      // First, render the voiceover audio
      const populated = textBlocks.filter(b => b.text.trim());
      const segments = populated.map(b => ({
        text: b.text,
        speaker_id: b.voice,
        language: b.language,
        pitch: b.pitch,
        rate: b.speed
      }));
      
      const voiceoverRes = await videoAPI.renderVoiceover(segments, userId, 'Video Voiceover');
      
      if (!voiceoverRes?.doc_id) {
        throw new Error('Failed to generate voiceover audio');
      }
      
      // Then, finalize the video with the voiceover
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('doc_id', voiceoverRes.doc_id);
      formData.append('video_file', voiceoverVideoFile);
      
      const finalRes = await videoAPI.finalizeNarrationVideo(voiceoverRes.doc_id, userId, voiceoverVideoFile);
      
      if (finalRes?.video_url) {
        setVoiceoverVideoUrl(finalRes.video_url);
        setCurrentProject({ ...voiceoverRes, video_url: finalRes.video_url });
        setSuccessMsg('Video voiceover generated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        throw new Error('Failed to finalize video with voiceover');
      }
    } catch (error) {
      setErrorMsg(error.message || 'Video voiceover generation failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear form
  const handleClear = () => {
    setUploadedFile(null);
    setYoutubeUrl('');
    setSourceLanguage('en');
    setTargetLanguages(['lg']);
    setSelectedVoice(NEURAL_SPEAKERS[0]?.id);
    setCurrentVideo(null);
    setTextBlocks([{ id: 1, text: '', voice: NEURAL_SPEAKERS[0]?.id, language: 'en', emotion: 'neutral', speed: 1.0, pitch: 0 }]);
    setVoiceoverFile(null);
    setCurrentProject(null);
    setImageFiles([]);
    setSlideshowUrl(null);
    setVoiceoverVideoFile(null);
    setVoiceoverVideoUrl(null);
    setErrorMsg(null);
    setSuccessMsg('');
  };

  // Load history item
  const loadHistoryItem = (item) => {
    if (item.type === 'dubbing') {
      setCurrentVideo(item);
      setSourceLanguage(item.source_lang || 'en');
      setTargetLanguages(item.target_langs || ['lg']);
      setMainTab(0);
    } else {
      setCurrentProject(item);
      setTextBlocks(item.blocks || [{ id: 1, text: '', voice: NEURAL_SPEAKERS[0]?.id, language: 'en', emotion: 'neutral' }]);
      setMainTab(1);
    }
  };

  // Clear forms
  const handleClearDubbing = () => {
    setUploadedFile(null);
    setYoutubeUrl('');
    setCurrentVideo(null);
  };

  const handleClearVoiceover = () => {
    setTextBlocks([{ id: 1, text: '', voice: NEURAL_SPEAKERS[0]?.id, language: 'en', emotion: 'neutral', speed: 1.0, pitch: 0 }]);
    setVoiceoverFile(null);
    setCurrentProject(null);
  };

  const mainTabs = [
    { label: 'Video Dubbing', icon: <VideoIcon fontSize="small" /> },
    { label: 'Voiceovers', icon: <VoiceoverIcon fontSize="small" /> },
    { label: 'History', icon: <HistoryIcon fontSize="small" /> },
  ];

  const dubbingInputTabs = DUBBING_TAB_CONFIG.map(tab => ({ label: tab.label, icon: tab.icon }));
  const voiceoverInputTabs = VOICEOVER_TAB_CONFIG.map(tab => ({ label: tab.label, icon: tab.icon }));

  // Properties panel content
  const dubbingPropertiesPanel = (
    <RightPropertiesPanel title="Dubbing Settings">
      <PropertySection title="Languages" defaultOpen={true}>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: '0.75rem', color: '#999999', mb: 0.5, fontWeight: 600, textTransform: 'uppercase' }}>
            Source Language
          </Typography>
          <ElevenLabsTextField
            select
            value={sourceLanguage}
            onChange={(e) => setSourceLanguage(e.target.value)}
            fullWidth
            size="small"
          >
            {ASR_LANGUAGES.map((lang) => (
              <MenuItem key={lang.value} value={lang.value}>
                {lang.label}
              </MenuItem>
            ))}
          </ElevenLabsTextField>
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.75rem', color: '#999999', mb: 0.5, fontWeight: 600, textTransform: 'uppercase' }}>
            Target Languages
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {LANGUAGES.map((lang) => (
              <Chip
                key={lang.value}
                label={lang.label}
                onClick={() => toggleTargetLanguage(lang.value)}
                size="small"
                sx={{
                  height: 28,
                  fontSize: '0.75rem',
                  bgcolor: targetLanguages.includes(lang.value) ? 'rgba(232,160,32,0.1)' : '#f5f5f5',
                  color: targetLanguages.includes(lang.value) ? GOLD_DARK : '#666666',
                  border: targetLanguages.includes(lang.value) ? `1px solid rgba(232,160,32,0.2)` : '1px solid #e8e8e8',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: targetLanguages.includes(lang.value) ? 'rgba(232,160,32,0.15)' : '#e8e8e8',
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      </PropertySection>
      <PropertySection title="Voice Selection" defaultOpen={true}>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: '0.75rem', color: '#999999', mb: 0.5, fontWeight: 600, textTransform: 'uppercase' }}>
            Voice
          </Typography>
          <ElevenLabsTextField
            select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
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
      </PropertySection>
      <PropertySection title="Account" defaultOpen={false}>
        <PropertyRow label="Credit Balance" value={userBalance !== null ? `${userBalance.toFixed(2)}` : 'Loading...'} />
        <PropertyRow label="User ID" value={userId?.substring(0, 8) + '...'} />
      </PropertySection>
    </RightPropertiesPanel>
  );

  const voiceoverPropertiesPanel = (
    <RightPropertiesPanel title="Voiceover Settings">
      <PropertySection title="Global Settings" defaultOpen={true}>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: '0.75rem', color: '#999999', mb: 0.5, fontWeight: 600, textTransform: 'uppercase' }}>
            Default Voice
          </Typography>
          <ElevenLabsTextField
            select
            value={textBlocks[0]?.voice || NEURAL_SPEAKERS[0]?.id}
            onChange={(e) => {
              const newVoice = e.target.value;
              setTextBlocks(textBlocks.map(b => ({ ...b, voice: newVoice })));
            }}
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
      </PropertySection>
      <PropertySection title="Account" defaultOpen={false}>
        <PropertyRow label="Credit Balance" value={userBalance !== null ? `${userBalance.toFixed(2)}` : 'Loading...'} />
        <PropertyRow label="User ID" value={userId?.substring(0, 8) + '...'} />
      </PropertySection>
    </RightPropertiesPanel>
  );

  return (
    <StudioLayout
      propertiesPanel={mainTab === 0 ? dubbingPropertiesPanel : mainTab === 1 ? voiceoverPropertiesPanel : null}
      showPropertiesPanel={showProperties}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 3 }}>
        <StudioHeroBanner
          image={STUDIO_VISUALS.video.image}
          video={currentVideo ? undefined : STUDIO_VISUALS.video.video}
          title="Video & Voiceover"
          subtitle="Dub and narrate on a player and timeline — not a stack of empty cards"
          height={mainTab === 0 && !currentVideo ? 300 : 176}
        >
          {mainTab === 0 && !currentVideo && (
            <Box sx={{ mt: 2, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.94)', overflow: 'hidden' }}>
              <ElevenLabsTabs value={dubbingInputTab} onChange={(_, v) => setDubbingInputTab(v)} tabs={dubbingInputTabs} />
              <Box sx={{ p: 2 }}>
                {dubbingInputTab === 0 ? (
                  <ElevenLabsFileUpload
                    onFileSelect={(file) => setUploadedFile(file)}
                    selectedFile={uploadedFile}
                    onClearFile={() => setUploadedFile(null)}
                    accept="video/*"
                  />
                ) : (
                  <ElevenLabsTextField
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    fullWidth
                  />
                )}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                  <CreditEstimateChip />
                  <ElevenLabsButton
                    variant="contained"
                    onClick={handleDubbing}
                    disabled={isProcessing || (!uploadedFile && !youtubeUrl)}
                    loading={isProcessing}
                    startIcon={<AutoAwesomeIcon />}
                  >
                    Start dubbing
                  </ElevenLabsButton>
                </Stack>
              </Box>
            </Box>
          )}
        </StudioHeroBanner>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <ElevenLabsTabs value={mainTab} onChange={(_, v) => setMainTab(v)} tabs={mainTabs} />
          {!(mainTab === 0 && !currentVideo) && <CreditEstimateChip />}
        </Stack>

        {/* Video Dubbing Tab */}
        {mainTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
            {currentVideo && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Box sx={{ borderRadius: '16px', overflow: 'hidden', bgcolor: '#111' }}>
                    <VideoPreviewPanel
                      videoUrl={currentVideo.output_url || currentVideo.video_url}
                      poster={currentVideo.thumbnail}
                      onTimeUpdate={(time) => console.log('Time:', time)}
                      onPlayStateChange={(playing) => console.log('Playing:', playing)}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <PropertyRow label="Status" value={currentVideo.status} />
                    <PropertyRow label="Segments" value={currentVideo.segments?.length || 0} />
                    <PropertyRow label="Source Language" value={currentVideo.source_lang} />
                    <PropertyRow label="Target Languages" value={currentVideo.target_langs?.join(', ') || 'N/A'} />
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <ElevenLabsButton variant="outlined" fullWidth startIcon={<DownloadIcon />}>
                        Download
                      </ElevenLabsButton>
                      <ElevenLabsButton variant="text" onClick={handleClearDubbing}>
                        New Dubbing
                      </ElevenLabsButton>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TimelineEditor
                    audioUrl={currentVideo.audio_url}
                    showAddSegment={false}
                    onTimeUpdate={(time) => console.log('Timeline time:', time)}
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        )}

        {/* Voiceovers Tab */}
        {mainTab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
            {!currentProject && (
              <ElevenLabsCard>
                <ElevenLabsTabs value={voiceoverInputTab} onChange={(_, v) => setVoiceoverInputTab(v)} tabs={voiceoverInputTabs} />
                <Box sx={{ p: 3 }}>
                  {voiceoverInputTab === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* Video Upload Section */}
                      <ElevenLabsFileUpload
                        onFileSelect={(file) => setVoiceoverVideoFile(file)}
                        selectedFile={voiceoverVideoFile}
                        onClearFile={() => setVoiceoverVideoFile(null)}
                        accept="video/*"
                      />
                      
                      {/* Text Blocks for Video Voiceover */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1a1a' }}>
                          Narration Script
                        </Typography>
                        {textBlocks.map((block, index) => (
                          <ElevenLabsCard key={block.id} sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1a1a' }}>
                                Block {index + 1}
                              </Typography>
                              {textBlocks.length > 1 && (
                                <IconButton size="small" onClick={() => removeTextBlock(block.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                            <ElevenLabsTextField
                              placeholder="Enter narration text..."
                              value={block.text}
                              onChange={(e) => updateTextBlock(block.id, 'text', e.target.value)}
                              multiline
                              minRows={2}
                              fullWidth
                              size="small"
                            />
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
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
                                      {voice.name}
                                    </MenuItem>
                                  ))}
                                </ElevenLabsTextField>
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: '0.75rem', color: '#999999', mb: 0.5, fontWeight: 600 }}>
                                  Language
                                </Typography>
                                <ElevenLabsTextField
                                  select
                                  value={block.language}
                                  onChange={(e) => updateTextBlock(block.id, 'language', e.target.value)}
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
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* Image Upload Section */}
                      <Box sx={{ textAlign: 'center', py: 4, border: '1px dashed rgba(17, 17, 17,0.1)', borderRadius: '12px', background: 'rgba(17,17,17,0.02)' }}>
                        <ImageIcon sx={{ fontSize: 32, color: 'rgba(17, 17, 17,0.2)', mb: 1 }} />
                        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(17, 17, 17,0.4)', mb: 2, fontWeight: 600 }}>
                          Upload images to create a slideshow voiceover
                        </Typography>
                        <Button component="label" variant="contained" size="small" sx={{ background: GOLD, borderRadius: '10px', textTransform: 'none', fontWeight: 800, fontSize: '0.75rem' }}>
                          Select Images
                          <input type="file" hidden accept="image/*" multiple onChange={handleImagesUpload} />
                        </Button>
                      </Box>
                      
                      {/* Image Preview */}
                      {imageFiles.length > 0 && (
                        <Box>
                          <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(17, 17, 17,0.3)', mb: 1.5 }}>
                            {imageFiles.length} Images Added (Drag to reorder)
                          </Typography>
                          <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto', pb: 1 }}>
                            {imageFiles.map((img, i) => (
                              <Box key={img.id} sx={{ position: 'relative', width: 120, height: 80, borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(17,17,17,0.05)' }}>
                                <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <Box sx={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.55rem', fontWeight: 900, px: 0.6, py: 0.2, borderRadius: '4px' }}>
                                  {i + 1}
                                </Box>
                                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', opacity: 0, '&:hover': { opacity: 1 }, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, transition: 'opacity 0.2s' }}>
                                  <IconButton size="small" onClick={() => moveImage(i, -1)} disabled={i === 0} sx={{ color: '#fff', background: 'rgba(255,255,255,0.2)', p: 0.3 }}>
                                    <KeyboardArrowLeft sx={{ fontSize: 14 }} />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => removeImage(img.id)} sx={{ color: '#f87171', background: 'rgba(255,255,255,0.2)', p: 0.3 }}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => moveImage(i, 1)} disabled={i === imageFiles.length - 1} sx={{ color: '#fff', background: 'rgba(255,255,255,0.2)', p: 0.3 }}>
                                    <KeyboardArrowRight sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Box>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      )}
                      
                      {/* Text Blocks for Slideshow */}
                      {imageFiles.length > 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1a1a' }}>
                            Script for Images
                          </Typography>
                          {textBlocks.slice(0, imageFiles.length).map((block, index) => (
                            <ElevenLabsCard key={block.id} sx={{ p: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1a1a' }}>
                                  Image {index + 1}
                                </Typography>
                              </Box>
                              <ElevenLabsTextField
                                placeholder={`Enter narration for image ${index + 1}...`}
                                value={block.text}
                                onChange={(e) => updateTextBlock(block.id, 'text', e.target.value)}
                                multiline
                                minRows={2}
                                fullWidth
                                size="small"
                              />
                              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
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
                                        {voice.name}
                                      </MenuItem>
                                    ))}
                                  </ElevenLabsTextField>
                                </Box>
                              </Box>
                            </ElevenLabsCard>
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
                <Box sx={{ p: 3, borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '0.75rem', color: '#999999' }}>
                    {voiceoverInputTab === 0 ? (voiceoverVideoFile ? voiceoverVideoFile.name : 'No video') : `${imageFiles.length} images`}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={handleClearVoiceover} sx={{ color: '#666666' }}>
                      Clear
                    </Button>
                    <ElevenLabsButton
                      variant="contained"
                      onClick={voiceoverInputTab === 0 ? handleGenerateVideoVoiceover : handleGenerateSlideshow}
                      disabled={isProcessing || (voiceoverInputTab === 0 && (!voiceoverVideoFile || textBlocks.every(b => !b.text.trim()))) || (voiceoverInputTab === 1 && imageFiles.length === 0)}
                      loading={isProcessing}
                      startIcon={<AutoAwesomeIcon />}
                    >
                      {voiceoverInputTab === 0 ? 'Generate Video Voiceover' : 'Generate Slideshow'}
                    </ElevenLabsButton>
                  </Box>
                </Box>
              </ElevenLabsCard>
            )}

            {currentProject && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <ElevenLabsCard title="Voiceover Preview">
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <ElevenLabsButton variant="contained" startIcon={<PlayIcon />}>
                          Play
                        </ElevenLabsButton>
                        <ElevenLabsButton variant="outlined" startIcon={<DownloadIcon />}>
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
                        onClick={handleClearVoiceover}
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
        {mainTab === 2 && (
          <ElevenLabsCard title="Activity History" subtitle={`Showing ${historyData.length} items`}>
            <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
              {historyData.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center', color: '#999999' }}>
                  <Typography sx={{ fontSize: '0.875rem' }}>No activity history yet</Typography>
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
                        {item.title || (item.type === 'dubbing' ? 'Untitled Dubbing' : 'Untitled Voiceover')}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Chip
                          label={item.type === 'dubbing' ? 'Video Dubbing' : 'Voiceover'}
                          size="small"
                          sx={{ height: 24, fontSize: '0.75rem', bgcolor: item.type === 'dubbing' ? 'rgba(232,160,32,0.1)' : '#f5f5f5', color: item.type === 'dubbing' ? GOLD_DARK : '#666666' }}
                        />
                        <Chip
                          label={item.status || 'completed'}
                          size="small"
                          sx={{ height: 24, fontSize: '0.75rem', bgcolor: '#f5f5f5' }}
                        />
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: '0.8125rem', color: '#666666' }}>
                      {item.type === 'dubbing' 
                        ? `${item.segments?.length || 0} segments • ${item.target_langs?.join(', ') || 'N/A'}`
                        : `${item.total_blocks || 0} blocks • ${item.duration || 'N/A'}`
                      }
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
