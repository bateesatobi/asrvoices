import React, { useState, useEffect } from 'react';
import {
  Box, Button, Grid, TextField, Typography, IconButton,
  Chip, Stack, Avatar, Alert,
  InputBase, Tab, Tabs,
  Stepper, Step, StepLabel, StepContent, Paper,
  FormControl, Select, MenuItem, InputLabel,
} from '@mui/material';
import {
  Search, Male, Female, CheckCircle, CheckCircleOutline,
  CloudUpload, Description, DeleteSweep,
  VolumeUp, Download, RecordVoiceOver, AutoAwesome,
} from '@mui/icons-material';
import { ttsAPI, subscriptionAPI, getFriendlyErrorMessage } from '../services/api';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { NEURAL_LANGUAGES, NEURAL_SPEAKERS } from '../constants/neural_config';
import { AC, G, GLASS, STEPPER_SX } from '../utils/mediaVault';
import CreditEstimateChip from './CreditEstimateChip';
import { consumePipeline } from '../utils/pipelineHandoff';
import SendToStudioButton from './SendToStudioButton';
import { AvoicesBackdropLoader } from './progress';
import { UsageTip, useStudioTour } from './onboarding';
import { TOUR_IDS, synthesizeTour } from './onboarding/tours';

const EQ_ANIM = `
  @keyframes eq0 { 0%,100%{height:3px} 50%{height:14px} }
  @keyframes eq1 { 0%,100%{height:10px} 50%{height:4px} }
  @keyframes eq2 { 0%,100%{height:6px} 50%{height:16px} }
  @keyframes eq3 { 0%,100%{height:14px} 50%{height:5px} }
  @keyframes eq4 { 0%,100%{height:4px} 50%{height:12px} }
  @keyframes eq5 { 0%,100%{height:9px} 50%{height:3px} }
  @keyframes eq6 { 0%,100%{height:7px} 50%{height:15px} }
`;

function EqBars({ active }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: 18, flexShrink: 0 }}>
      <style>{EQ_ANIM}</style>
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <Box key={i} sx={{
          width: 2.5,
          height: active ? [4, 10, 6, 14, 4, 9, 7][i] : 3,
          borderRadius: '2px',
          background: active ? AC : 'rgba(17, 17, 17, 0.15)',
          animation: active ? `eq${i} ${0.6 + i * 0.07}s ease-in-out infinite` : 'none',
          transition: 'background 0.3s, height 0.3s',
        }} />
      ))}
    </Box>
  );
}

function VoiceCard({ speaker, isSelected, onClick }) {
  const langName = NEURAL_LANGUAGES.find(l => l.code === speaker.lang)?.name || speaker.lang.toUpperCase();
  const isMale = speaker.gender === 'male';

  return (
    <Box onClick={onClick} sx={{
      p: 2,
      borderRadius: '12px',
      cursor: 'pointer',
      border: isSelected ? `2px solid ${AC}` : '1px solid #e8e8e8',
      background: isSelected ? 'rgba(232, 160, 32, 0.04)' : '#ffffff',
      transition: 'all 0.2s ease',
      '&:hover': { 
        background: isSelected ? 'rgba(232, 160, 32, 0.04)' : '#fafafa',
        borderColor: isSelected ? AC : '#d0d0d0',
      },
    }}>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Avatar sx={{
            width: 40,
            height: 40,
            fontSize: '0.875rem',
            fontWeight: 600,
            background: isSelected ? AC : speaker.color,
            color: isSelected ? '#ffffff' : '#666',
          }}>
            {speaker.name[0]}
          </Avatar>
          {isSelected && (
            <Box sx={{ 
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: AC,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #ffffff'
            }}>
              <CheckCircle sx={{ fontSize: 12, color: '#ffffff' }} />
            </Box>
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ 
            fontWeight: 600,
            fontSize: '0.875rem',
            color: '#1a1a1a',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            mb: 0.5
          }}>
            {speaker.name}
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Chip 
              label={langName} 
              size="small" 
              sx={{ 
                height: 18,
                fontSize: '0.6875rem',
                fontWeight: 500,
                background: '#f5f5f5',
                color: '#666',
                border: 'none',
                '& .MuiChip-label': { px: 0.75 }
              }} 
            />
            <Box sx={{ 
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: isMale ? 'rgba(96,165,250,0.15)' : 'rgba(244,114,182,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isMale ? <Male sx={{ fontSize: 10, color: '#60a5fa' }} /> : <Female sx={{ fontSize: 10, color: '#f472b6' }} />}
            </Box>
          </Stack>
        </Box>
        <EqBars active={isSelected} />
      </Stack>
    </Box>
  );
}

function VoicePanel({ selectedId, onSelect }) {
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');

  const filtered = NEURAL_SPEAKERS.filter(s => {
    const ml = langFilter === 'all' || s.lang === langFilter;
    const mg = genderFilter === 'all' || s.gender === genderFilter;
    const ms = !search
      || s.name.toLowerCase().includes(search.toLowerCase())
      || (NEURAL_LANGUAGES.find(l => l.code === s.lang)?.name || '').toLowerCase().includes(search.toLowerCase());
    return ml && mg && ms;
  });

  const selected = NEURAL_SPEAKERS.find(s => s.id === selectedId);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: { xs: 400, md: 480 }, gap: 1.25 }}>
      <Box sx={{ 
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        background: '#fafafa',
        border: '1px solid #e8e8e8',
        borderRadius: '8px',
        px: 2,
        py: 1.25
      }}>
        <Search sx={{ fontSize: 18, color: '#999' }} />
        <InputBase 
          placeholder="Search voices…" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          sx={{ 
            flex: 1,
            fontSize: '0.875rem',
            color: '#1a1a1a',
            '& input::placeholder': { color: '#999' }
          }} 
        />
      </Box>

      <Stack direction="row" spacing={0.6}>
        {[{ v: 'all', label: 'All' }, { v: 'male', label: '♂ Male' }, { v: 'female', label: '♀ Female' }].map(g => (
          <Chip 
            key={g.v} 
            label={g.label} 
            size="small" 
            onClick={() => setGenderFilter(g.v)} 
            sx={{
              height: 26,
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: genderFilter === g.v ? '#1a1a1a' : '#fafafa',
              color: genderFilter === g.v ? '#ffffff' : '#666',
              border: '1px solid',
              borderColor: genderFilter === g.v ? '#1a1a1a' : '#e8e8e8',
              '&:hover': {
                background: genderFilter === g.v ? '#333' : '#f5f5f5',
              }
            }} 
          />
        ))}
      </Stack>

      <Box sx={{ overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
        <Stack direction="row" spacing={0.6} sx={{ width: 'max-content' }}>
          {NEURAL_LANGUAGES.map(lang => (
            <Chip 
              key={lang.code} 
              label={lang.name} 
              size="small" 
              onClick={() => setLangFilter(lang.code)} 
              sx={{
                height: 24,
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                background: langFilter === lang.code ? 'rgba(232, 160, 32, 0.1)' : '#fafafa',
                color: langFilter === lang.code ? AC : '#666',
                border: '1px solid',
                borderColor: langFilter === lang.code ? `rgba(232, 160, 32, 0.3)` : '#e8e8e8',
                '&:hover': {
                  background: langFilter === lang.code ? 'rgba(232, 160, 32, 0.15)' : '#f5f5f5',
                }
              }} 
            />
          ))}
        </Stack>
      </Box>

      <Typography sx={{ fontSize: '0.62rem', color: 'rgba(17, 17, 17, 0.2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {filtered.length} voices
      </Typography>

      <Grid container spacing={1.2} sx={{ flex: 1, overflowY: 'auto', pr: 0.5, alignContent: 'flex-start' }}>
        {filtered.map(s => (
          <Grid item xs={12} sm={6} md={4} key={s.id}>
            <VoiceCard speaker={s} isSelected={selectedId === s.id} onClick={() => onSelect(s)} />
          </Grid>
        ))}
        {filtered.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <RecordVoiceOver sx={{ fontSize: 32, color: 'rgba(17, 17, 17, 0.1)', mb: 1 }} />
              <Typography sx={{ color: 'rgba(17, 17, 17, 0.2)', fontSize: '0.8rem' }}>No voices match</Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {selected && (
        <Box sx={{ mt: 'auto', p: 1.25, borderRadius: '12px', background: 'rgba(232, 160, 32, 0.08)', border: `1px solid ${AC}30` }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', fontWeight: 900, background: G }}>{selected.name[0]}</Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', color: '#111111' }}>{selected.name}</Typography>
              <Typography sx={{ fontSize: '0.6rem', color: AC, fontWeight: 600 }}>
                {NEURAL_LANGUAGES.find(l => l.code === selected.lang)?.name}
              </Typography>
            </Box>
            <VolumeUp sx={{ fontSize: 16, color: AC }} />
          </Stack>
        </Box>
      )}
    </Box>
  );
}

function StepNav({ onBack, onNext, backDisabled, nextDisabled, nextLabel = 'Next' }) {
  return (
    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
      <Button disabled={backDisabled} onClick={onBack} sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none', color: 'rgba(17,17,17,0.6)' }}>Back</Button>
      <Button variant="contained" onClick={onNext} disabled={nextDisabled} sx={{ background: G, borderRadius: '10px', fontWeight: 800, textTransform: 'none', boxShadow: '0 4px 18px rgba(232, 160, 32, 0.25)' }}>
        {nextLabel}
      </Button>
    </Stack>
  );
}

const SynthesisStudio = () => {
  useStudioTour(TOUR_IDS.synthesize, synthesizeTour);
  const [activeTab, setActiveTab] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [inputText, setInputText] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState(NEURAL_SPEAKERS[0]);
  const [outputLang, setOutputLang] = useState(NEURAL_SPEAKERS[0].lang);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultAudio, setResultAudio] = useState(null);
  const [docResults, setDocResults] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [userBalance, setUserBalance] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.uid || user.userId;
  const isTextMode = activeTab === 0;
  const hasResult = isTextMode ? !!resultAudio : !!docResults;
  const busy = isGenerating;

  useEffect(() => {
    if (userId && subscriptionAPI.getBalance) {
      subscriptionAPI.getBalance(userId)
        .then(d => setUserBalance(d.balance ?? d.credit_balance ?? null))
        .catch(() => {});
    }
  }, [userId]);

  useEffect(() => {
    const handoff = consumePipeline('synthesize');
    if (!handoff?.text) return;
    setActiveTab(0);
    setInputText(String(handoff.text).slice(0, 5000));
    const lang = handoff.targetLang || handoff.sourceLang;
    if (lang) {
      setOutputLang(lang);
      const match = NEURAL_SPEAKERS.find(s => s.lang === lang);
      if (match) setSelectedSpeaker(match);
    }
    setSuccessMsg('Text imported — pick a voice and generate.');
    setActiveStep(1);
  }, []);

  const handleTabChange = (_, v) => {
    setActiveTab(v);
    setActiveStep(0);
    setError(null);
    setSuccessMsg(null);
  };

  const handleSpeakerSelect = s => setSelectedSpeaker(s);

  const handleNext = () => setActiveStep(prev => prev + 1);
  const handleBack = () => setActiveStep(prev => Math.max(0, prev - 1));

  const handleReset = () => {
    setActiveStep(0);
    setInputText('');
    setDocFile(null);
    setResultAudio(null);
    setDocResults(null);
    setError(null);
    setSuccessMsg(null);
  };

  const canProceedFromContent = isTextMode ? !!inputText.trim() : !!docFile;

  const handleSynthesize = async () => {
    if (!inputText.trim() || isGenerating || !userId) return;
    setIsGenerating(true);
    setError(null);
    setSuccessMsg(null);
    setResultAudio(null);
    try {
      const response = await ttsAPI.synthesizeText(inputText.trim(), selectedSpeaker.id, outputLang, userId);
      if (response.audio_file_url) {
        setResultAudio(response.audio_file_url);
        setSuccessMsg('Speech synthesis completed successfully!');
        setActiveStep(4);
      } else if (response.doc_id) {
        const voiceData = await ttsAPI.getVocifyVoice(response.doc_id);
        const path = voiceData.entries?.[0]?.translations_with_tts?.[outputLang]?.audio_file_path
          || voiceData.entries?.[0]?.audio_file_path
          || voiceData.audio_url;
        if (path) {
          setResultAudio(path);
          setSuccessMsg('Speech synthesis completed successfully!');
          setActiveStep(4);
        } else throw new Error('Synthesis failed.');
      }
      window.dispatchEvent(new CustomEvent('refresh-balance'));
      window.dispatchEvent(new CustomEvent('library-updated'));
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Synthesis failed. Please try again.'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDocumentSynthesize = async () => {
    if (!docFile || isGenerating || !userId) return;
    setIsGenerating(true);
    setError(null);
    setSuccessMsg(null);
    setDocResults(null);
    try {
      const response = await ttsAPI.translateDocumentWithTTS(docFile, outputLang, [outputLang], selectedSpeaker.id, userId);
      if (response.translations) {
        setDocResults(response.translations);
        setSuccessMsg('Document synthesis completed successfully!');
        setActiveStep(4);
      }
      window.dispatchEvent(new CustomEvent('refresh-balance'));
      window.dispatchEvent(new CustomEvent('library-updated'));
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Document synthesis failed.'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => (isTextMode ? handleSynthesize() : handleDocumentSynthesize());

  const langName = NEURAL_LANGUAGES.find(l => l.code === outputLang)?.name || outputLang;
  const charCount = inputText.length;

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, minHeight: '100vh', background: 'transparent', color: '#111111', maxWidth: 1200, mx: 'auto' }}>

      <AvoicesBackdropLoader
        open={busy}
        message={isTextMode ? 'Synthesizing speech…' : 'Processing document…'}
        submessage="Neural voices are rendering your audio"
      />

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: '12px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f87171' }}>{error}</Alert>}
      {successMsg && <Alert severity="success" onClose={() => setSuccessMsg(null)} sx={{ mb: 2, borderRadius: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>{successMsg}</Alert>}

      <Box data-tour="studio-mode" sx={{ mb: 2, borderBottom: '1px solid rgba(17, 17, 17, 0.07)' }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ minHeight: 40, '& .MuiTabs-indicator': { background: G, height: 2, borderRadius: 1 } }}>
          {[
            { label: 'Text to Speech', icon: <VolumeUp sx={{ fontSize: 17 }} /> },
            { label: 'Document to Speech', icon: <CloudUpload sx={{ fontSize: 17 }} /> },
          ].map(({ label, icon }, i) => (
            <Tab key={i} label={label} icon={icon} iconPosition="start" sx={{
              textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', minHeight: 40,
              color: activeTab === i ? AC : 'rgba(17, 17, 17, 0.4)',
              '&.Mui-selected': { color: AC },
            }} />
          ))}
        </Tabs>
      </Box>

      <Stepper data-tour="studio-flow" activeStep={activeStep} orientation="vertical" sx={STEPPER_SX}>

        {/* Step 1: Content */}
        <Step>
          <StepLabel>Step 1: {isTextMode ? 'Enter Your Script' : 'Upload Document'}</StepLabel>
          <StepContent>
            <Paper elevation={0} sx={{ p: 3, mb: 2, ...GLASS, mt: 1 }}>
              <Typography sx={{ fontSize: '0.85rem', color: 'rgba(17,17,17,0.6)', mb: 2, fontWeight: 600 }}>
                {isTextMode
                  ? 'Type or paste the text you want to convert into natural-sounding speech.'
                  : 'Upload a PDF, DOCX, or TXT file to synthesize as audio.'}
              </Typography>

              {isTextMode ? (
                <Box sx={{ position: 'relative' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(17,17,17,0.3)' }}>Script</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(17,17,17,0.3)', fontWeight: 600 }}>{charCount} / 5000</Typography>
                      <IconButton size="small" onClick={() => setInputText('')} sx={{ color: 'rgba(17,17,17,0.2)', p: 0.5 }}>
                        <DeleteSweep sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Stack>
                  </Stack>
                  <TextField
                    multiline fullWidth minRows={8} maxRows={16}
                    placeholder="Enter your script here…"
                    value={inputText}
                    onChange={e => setInputText(e.target.value.slice(0, 5000))}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', color: '#111111', fontSize: '1rem', lineHeight: 1.65, background: 'rgba(17,17,17,0.02)' } }}
                  />
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, border: '1px dashed rgba(17,17,17,0.1)', borderRadius: '16px', background: 'rgba(17,17,17,0.02)' }}>
                  {!docFile ? (
                    <>
                      <Description sx={{ fontSize: 40, color: 'rgba(17,17,17,0.15)', mb: 1.5 }} />
                      <Typography sx={{ fontSize: '0.8rem', color: 'rgba(17,17,17,0.5)', mb: 2, fontWeight: 600 }}>PDF · DOCX · TXT · Max 10 MB</Typography>
                      <Button component="label" variant="contained" startIcon={<CloudUpload />} sx={{ background: G, borderRadius: '12px', px: 4, fontWeight: 900, boxShadow: '0 4px 20px rgba(232, 160, 32, 0.25)' }}>
                        Upload Document
                        <input accept=".pdf,.docx,.doc,.txt" hidden type="file" onChange={e => { setDocFile(e.target.files[0]); e.target.value = ''; }} />
                      </Button>
                    </>
                  ) : (
                    <Stack spacing={1.5} alignItems="center">
                      <Box sx={{ width: 64, height: 64, borderRadius: '16px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Description sx={{ fontSize: 32, color: '#10b981' }} />
                      </Box>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#111111' }}>{docFile.name}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: 'rgba(17,17,17,0.4)' }}>{(docFile.size / 1024).toFixed(0)} KB</Typography>
                      <Button size="small" onClick={() => setDocFile(null)} sx={{ color: 'rgba(17,17,17,0.5)', fontWeight: 700, textTransform: 'none' }}>Remove & re-upload</Button>
                    </Stack>
                  )}
                </Box>
              )}
            </Paper>
            <StepNav onBack={handleBack} onNext={handleNext} backDisabled={activeStep === 0} nextDisabled={!canProceedFromContent} />
          </StepContent>
        </Step>

        {/* Step 2: Language */}
        <Step>
          <StepLabel>Step 2: Select Output Language</StepLabel>
          <StepContent>
            <Paper elevation={0} sx={{ p: 3, mb: 2, ...GLASS, mt: 1 }}>
              <Typography sx={{ fontSize: '0.85rem', color: 'rgba(17,17,17,0.6)', mb: 2, fontWeight: 600 }}>
                Choose the language for the generated audio.
              </Typography>
              <FormControl fullWidth size="small" sx={{ maxWidth: 360 }}>
                <InputLabel sx={{ color: 'rgba(17,17,17,0.5)', '&.Mui-focused': { color: AC } }}>Output Language</InputLabel>
                <Select
                  value={outputLang}
                  label="Output Language"
                  onChange={e => setOutputLang(e.target.value)}
                  sx={{ borderRadius: '12px', color: '#111111', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(17,17,17,0.15)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: AC } }}
                >
                  {NEURAL_LANGUAGES.filter(l => l.code !== 'all').map(l => (
                    <MenuItem key={l.code} value={l.code}>{l.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Paper>
            <StepNav onBack={handleBack} onNext={handleNext} backDisabled={false} nextDisabled={false} />
          </StepContent>
        </Step>

        {/* Step 3: Voice */}
        <Step>
          <StepLabel>Step 3: Select Target Voice</StepLabel>
          <StepContent>
            <Paper elevation={0} sx={{ p: 3, mb: 2, ...GLASS, mt: 1 }}>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                <Typography sx={{ fontSize: '0.85rem', color: 'rgba(17,17,17,0.6)', fontWeight: 600 }}>
                  Pick the neural voice that will narrate your {isTextMode ? 'script' : 'document'}.
                </Typography>
                <UsageTip title="Browse all voices by native language filter. Output language is set in the previous step — any speaker can narrate in any language." />
              </Stack>
              <VoicePanel selectedId={selectedSpeaker.id} onSelect={handleSpeakerSelect} />
            </Paper>
            <StepNav onBack={handleBack} onNext={handleNext} backDisabled={false} nextDisabled={false} nextLabel="Next Step" />
          </StepContent>
        </Step>

        {/* Step 4: Generate */}
        <Step>
          <StepLabel>Step 4: Review & Generate Audio</StepLabel>
          <StepContent>
            <Paper elevation={0} sx={{ p: 3, mb: 2, ...GLASS, mt: 1 }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Typography sx={{ fontSize: '0.9rem', color: '#111111', mb: 2, fontWeight: 800 }}>Configuration</Typography>
                  <Stack spacing={1.5} sx={{ p: 2, background: 'rgba(17,17,17,0.03)', borderRadius: '12px' }}>
                    <Typography sx={{ fontSize: '0.8rem', color: '#111111' }}>
                      <strong>Mode:</strong> {isTextMode ? 'Text to Speech' : 'Document to Speech'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: '#111111' }}>
                      <strong>Language:</strong> {langName}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: '#111111' }}>
                      <strong>Voice:</strong> {selectedSpeaker.name}
                    </Typography>
                    {isTextMode && (
                      <Typography sx={{ fontSize: '0.8rem', color: '#111111' }}>
                        <strong>Characters:</strong> {charCount}
                      </Typography>
                    )}
                    {!isTextMode && docFile && (
                      <Typography sx={{ fontSize: '0.8rem', color: '#111111' }}>
                        <strong>File:</strong> {docFile.name}
                      </Typography>
                    )}
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography sx={{ fontSize: '0.9rem', color: '#111111', mb: 2, fontWeight: 800 }}>Generate</Typography>
                  <Stack spacing={2} sx={{ p: 2, background: 'rgba(232,160,32,0.05)', borderRadius: '12px', border: `1px solid ${AC}30` }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Typography sx={{ fontSize: '0.8rem', color: 'rgba(17,17,17,0.6)' }}>
                        Ready to synthesize.
                      </Typography>
                      {isTextMode && (
                        <CreditEstimateChip service="tts" quantity={charCount} balance={userBalance} />
                      )}
                    </Stack>
                    <Button
                      variant="contained" fullWidth
                      onClick={handleGenerate}
                      disabled={busy || !canProceedFromContent}
                      startIcon={<AutoAwesome />}
                      sx={{ background: G, color: '#fff', py: 1.5, borderRadius: '12px', fontWeight: 900, fontSize: '0.9rem', boxShadow: '0 4px 20px rgba(232, 160, 32, 0.25)' }}
                    >
                      {busy ? 'Synthesizing…' : isTextMode ? 'Generate Speech' : 'Generate Document Audio'}
                    </Button>
                    {hasResult && (
                      <Typography sx={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, textAlign: 'center' }}>
                        ✓ Audio ready — proceed to preview
                      </Typography>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
            <StepNav onBack={handleBack} onNext={handleNext} backDisabled={false} nextDisabled={!hasResult} nextLabel="Preview Results" />
          </StepContent>
        </Step>

        {/* Step 5: Preview & Download */}
        <Step>
          <StepLabel>Step 5: Preview & Download</StepLabel>
          <StepContent>
            <Paper elevation={0} sx={{ p: 4, mb: 2, ...GLASS, mt: 1, textAlign: 'center' }}>
              <CheckCircleOutline sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#111111', mb: 1 }}>
                {isTextMode ? 'Synthesis Complete!' : 'Document Audio Ready!'}
              </Typography>
              <Typography sx={{ fontSize: '0.9rem', color: 'rgba(17,17,17,0.6)', mb: 4 }}>
                {isTextMode
                  ? 'Your text has been converted to natural speech.'
                  : 'Your document has been processed and audio is ready.'}
              </Typography>

              {isTextMode && resultAudio ? (
                <Box sx={{ maxWidth: 640, mx: 'auto', textAlign: 'left' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ready</Typography>
                    </Stack>
                    <Button size="small" href={resultAudio} download startIcon={<Download />} sx={{ color: AC, fontWeight: 800, textTransform: 'none' }}>Download</Button>
                  </Stack>
                  <AudioPlayer src={resultAudio} style={{ background: 'rgba(17,17,17,0.03)', borderRadius: '12px', border: '1px solid rgba(17,17,17,0.06)' }} />
                </Box>
              ) : docResults ? (
                <Stack spacing={2} sx={{ maxWidth: 640, mx: 'auto', textAlign: 'left' }}>
                  {Object.entries(docResults).map(([lang, data]) => (
                    <Box key={lang} sx={{ p: 2, borderRadius: '12px', background: 'rgba(17,17,17,0.02)', border: '1px solid rgba(17,17,17,0.05)' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: AC, textTransform: 'uppercase' }}>
                          {NEURAL_LANGUAGES.find(l => l.code === lang)?.name || lang}
                        </Typography>
                        <Button size="small" href={data.audio_file_path} download startIcon={<Download />} sx={{ color: AC, fontWeight: 800, textTransform: 'none', fontSize: '0.72rem' }}>Download</Button>
                      </Stack>
                      <AudioPlayer src={data.audio_file_path} style={{ background: 'transparent', borderRadius: '10px' }} />
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography sx={{ color: 'rgba(17,17,17,0.4)', fontSize: '0.85rem' }}>No audio generated yet. Go back to Step 4 and run synthesis.</Typography>
              )}

              <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 4 }}>
                <Button variant="outlined" onClick={handleBack} sx={{ borderColor: 'rgba(17,17,17,0.2)', color: 'rgba(17,17,17,0.7)', fontWeight: 800, px: 4, py: 1.5, borderRadius: '12px' }}>Back</Button>
                <Button variant="outlined" onClick={handleReset} sx={{ borderColor: 'rgba(17,17,17,0.2)', color: 'rgba(17,17,17,0.7)', fontWeight: 800, px: 4, py: 1.5, borderRadius: '12px' }}>Start Over</Button>
                {isTextMode && inputText.trim() && (
                  <SendToStudioButton
                    label="Send to Voiceover"
                    targets={['voiceover', 'translate']}
                    variant="contained"
                    size="medium"
                    getPayload={() => ({ text: inputText, sourceLang: outputLang, targetLang: outputLang })}
                    sx={{ background: G, color: '#fff', borderColor: 'transparent', px: 3, py: 1.5, '&:hover': { background: G, opacity: 0.92 } }}
                  />
                )}
              </Stack>
            </Paper>
          </StepContent>
        </Step>

      </Stepper>
    </Box>
  );
};

export default SynthesisStudio;
