import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Snackbar, Alert, Avatar, Chip, IconButton } from '@mui/material';
import { PlayArrow, Pause, VolumeUp, Download, MoreVert } from '@mui/icons-material';
import {
  ElevenLabsCard,
  ElevenLabsButton,
  ElevenLabsTextField,
  ElevenLabsSettingsPanel,
  SettingSlider,
  SettingSelect,
  SettingToggle,
  SettingSection,
} from '../ElevenLabsUI';
import { ttsAPI, getFriendlyErrorMessage } from '../../services/api';
import { LANGUAGES } from '../../constants/languages';

const GOLD = '#E8A020';

/**
 * Redesigned Text-to-Speech component with ElevenLabs design patterns
 * Features the voice library with preview buttons and settings panel
 */
export default function Text2SpeechElevenLabs() {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [speed, setSpeed] = useState(1.0);
  const [stability, setStability] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.75);
  const [speakerBoost, setSpeakerBoost] = useState(true);
  const [outputFormat, setOutputFormat] = useState('mp3_44100_128');
  const [loading, setLoading] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  // Sample voices - replace with actual API call
  const voices = [
    { id: 'roger', name: 'Roger', description: 'Laid-Back, Casual, Resonant', language: 'English', preview: null },
    { id: 'sarah', name: 'Sarah', description: 'Warm, Professional, Clear', language: 'English', preview: null },
    { id: 'james', name: 'James', description: 'Deep, Authoritative, Confident', language: 'English', preview: null },
    { id: 'emma', name: 'Emma', description: 'Friendly, Upbeat, Natural', language: 'English', preview: null },
    { id: 'david', name: 'David', description: 'Calm, Soothing, Mature', language: 'English', preview: null },
    { id: 'lisa', name: 'Lisa', description: 'Energetic, Young, Dynamic', language: 'English', preview: null },
  ];

  const handleVoicePreview = (voiceId) => {
    if (playingVoiceId === voiceId) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(voiceId);
      // TODO: Play voice preview
      setTimeout(() => setPlayingVoiceId(null), 3000);
    }
  };

  const handleGenerate = async () => {
    if (!text || !selectedVoice) {
      setSnack({ open: true, msg: 'Please enter text and select a voice', sev: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.uid || user.userId;

      const response = await ttsAPI.synthesize({
        text,
        voice: selectedVoice.id,
        speed,
        userId,
      });

      setSnack({ open: true, msg: 'Speech generated successfully!', sev: 'success' });
    } catch (error) {
      setSnack({ open: true, msg: getFriendlyErrorMessage(error), sev: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Narrate a story',
    'Tell a silly joke',
    'Record an advertisement',
    'Speak in different languages',
    'Direct a dramatic movie scene',
    'Hear from a video game character',
    'Introduce your podcast',
    'Guide a meditation class',
  ];

  return (
    <Grid container spacing={3}>
      {/* Left side - Main content area */}
      <Grid item xs={12} md={7}>
        {/* Text input area */}
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: '2rem',
              fontWeight: 600,
              color: '#1a1a1a',
              letterSpacing: '-0.02em',
              mb: 1.5,
            }}
          >
            Text to Speech
          </Typography>
          <Typography sx={{ fontSize: '1rem', color: '#666', mb: 3 }}>
            Start typing here or paste any text you want to turn into lifelike speech...
          </Typography>

          <ElevenLabsTextField
            multiline
            rows={10}
            placeholder="Start typing here or paste any text you want to turn into lifelike speech..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />

          {/* Quick prompts */}
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#1a1a1a',
                mb: 1.5,
              }}
            >
              Get started with
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {quickPrompts.map((prompt, index) => (
                <Chip
                  key={index}
                  label={prompt}
                  onClick={() => setText(prompt)}
                  sx={{
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    bgcolor: '#fafafa',
                    border: '1px solid #e8e8e8',
                    '&:hover': {
                      bgcolor: 'rgba(232,160,32,0.08)',
                      borderColor: GOLD,
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Voice selection */}
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#1a1a1a',
              mb: 2,
            }}
          >
            Voice
          </Typography>

          {/* Selected voice display */}
          {selectedVoice ? (
            <Box
              sx={{
                border: `2px solid ${GOLD}`,
                borderRadius: '12px',
                p: 2.5,
                bgcolor: 'rgba(232,160,32,0.04)',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
              }}
            >
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: GOLD,
                  color: '#ffffff',
                  fontWeight: 600,
                }}
              >
                {selectedVoice.name[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#1a1a1a' }}>
                  {selectedVoice.name}
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: '#666' }}>
                  {selectedVoice.description}
                </Typography>
              </Box>
              <IconButton
                onClick={() => handleVoicePreview(selectedVoice.id)}
                sx={{
                  bgcolor: '#1a1a1a',
                  color: '#ffffff',
                  '&:hover': { bgcolor: '#333' },
                }}
              >
                {playingVoiceId === selectedVoice.id ? <Pause /> : <PlayArrow />}
              </IconButton>
            </Box>
          ) : (
            <Box
              sx={{
                border: '1px dashed #e8e8e8',
                borderRadius: '12px',
                p: 3,
                textAlign: 'center',
                bgcolor: '#fafafa',
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: '0.875rem', color: '#999' }}>
                Select a voice from the library below
              </Typography>
            </Box>
          )}

          {/* Voice library grid */}
          <Grid container spacing={2}>
            {voices.map((voice) => (
              <Grid item xs={12} sm={6} key={voice.id}>
                <Box
                  onClick={() => setSelectedVoice(voice)}
                  sx={{
                    border:
                      selectedVoice?.id === voice.id ? `2px solid ${GOLD}` : '1px solid #e8e8e8',
                    borderRadius: '12px',
                    p: 2,
                    cursor: 'pointer',
                    bgcolor: selectedVoice?.id === voice.id ? 'rgba(232,160,32,0.04)' : '#ffffff',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: GOLD,
                      bgcolor: 'rgba(232,160,32,0.04)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: selectedVoice?.id === voice.id ? GOLD : '#e8e8e8',
                        color: selectedVoice?.id === voice.id ? '#ffffff' : '#666',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    >
                      {voice.name[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          color: '#1a1a1a',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {voice.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          color: '#666',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {voice.description}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVoicePreview(voice.id);
                      }}
                      sx={{
                        color: '#666',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                      }}
                    >
                      {playingVoiceId === voice.id ? (
                        <Pause fontSize="small" />
                      ) : (
                        <PlayArrow fontSize="small" />
                      )}
                    </IconButton>
                  </Box>
                  <Chip
                    label={voice.language}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.6875rem',
                      bgcolor: 'rgba(0,0,0,0.04)',
                      color: '#666',
                    }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Audio player section (when generated) */}
        {/* TODO: Add audio player component */}
      </Grid>

      {/* Right side - Settings panel */}
      <Grid item xs={12} md={5}>
        <Box sx={{ position: 'sticky', top: 80 }}>
          <ElevenLabsSettingsPanel>
            <Typography
              sx={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#1a1a1a',
                mb: 3,
              }}
            >
              Settings
            </Typography>

            <SettingSection title="Voice Settings">
              <SettingSlider
                label="Speed"
                value={speed}
                onChange={(e, v) => setSpeed(v)}
                min={0.5}
                max={2.0}
                step={0.1}
                marks={[
                  { value: 0.5, label: 'Slower' },
                  { value: 2.0, label: 'Faster' },
                ]}
              />

              <SettingSlider
                label="Stability"
                value={stability}
                onChange={(e, v) => setStability(v)}
                min={0}
                max={1}
                step={0.01}
                marks={[
                  { value: 0, label: 'More variable' },
                  { value: 1, label: 'More stable' },
                ]}
              />

              <SettingSlider
                label="Similarity"
                value={similarity}
                onChange={(e, v) => setSimilarity(v)}
                min={0}
                max={1}
                step={0.01}
                marks={[
                  { value: 0, label: 'Low' },
                  { value: 1, label: 'High' },
                ]}
              />
            </SettingSection>

            <SettingSection title="Output">
              <SettingSelect
                label="Output Format"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                options={[
                  { value: 'mp3_44100_128', label: 'MP3 44.1kHz (128kbps)' },
                  { value: 'mp3_44100_192', label: 'MP3 44.1kHz (192kbps)' },
                  { value: 'pcm_16000', label: 'PCM 16kHz' },
                  { value: 'pcm_24000', label: 'PCM 24kHz' },
                ]}
              />

              <SettingToggle
                label="Speaker boost"
                checked={speakerBoost}
                onChange={(e) => setSpeakerBoost(e.target.checked)}
                description="Enhance voice clarity and presence"
              />
            </SettingSection>

            {/* Generate button */}
            <ElevenLabsButton
              variant="contained"
              fullWidth
              size="large"
              loading={loading}
              disabled={!text || !selectedVoice || loading}
              onClick={handleGenerate}
              sx={{ mt: 3 }}
            >
              Generate Speech
            </ElevenLabsButton>
          </ElevenLabsSettingsPanel>
        </Box>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack({ ...snack, open: false })}
          severity={snack.sev}
          sx={{ borderRadius: '8px' }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
