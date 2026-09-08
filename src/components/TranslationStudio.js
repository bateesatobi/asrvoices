import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Button, FormControl, Grid, IconButton, MenuItem,
  Select, TextField, Alert, Stack, Chip,
  Typography, Tooltip, Menu, Tab, Tabs,
  Stepper, Step, StepLabel, StepContent, Paper, ListSubheader,
} from '@mui/material';
import {
  Translate, CloudUpload, SwapHoriz,
  ContentCopy, GetApp, CheckCircleOutline,
  Description, PictureAsPdf, AutoAwesome, TextFields,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  setSourceLanguage, setTargetLanguage, setInputText, setTranslatedText,
  appendTranslatedChunk, setSelectedFile, translateText, translateDocument,
} from '../store/slices/translationSlice';
import { translationAPI, subscriptionAPI, BASE_URL, getFriendlyErrorMessage } from '../services/api';
import { AC, G, GLASS, STEPPER_SX } from '../utils/mediaVault';
import { TRANSLATE_LANGUAGES, getTranslateLanguageLabel, toIso6393 } from '../constants/translateLanguages';
import CreditEstimateChip from './CreditEstimateChip';
import { AvoicesJobProgress } from './progress';
import SendToStudioButton from './SendToStudioButton';
import { consumePipeline } from '../utils/pipelineHandoff';
import { useStudioTour } from './onboarding';
import { TOUR_IDS, translateTour } from './onboarding/tours';

const TRANSLATE_MENU_PROPS = { PaperProps: { sx: { maxHeight: 360 } } };

function translateLanguageMenuItems() {
  const items = [];
  let lastGroup = null;
  TRANSLATE_LANGUAGES.forEach((lang) => {
    if (lang.group && lang.group !== lastGroup) {
      lastGroup = lang.group;
      items.push(
        <ListSubheader key={`group-${lastGroup}`} sx={{ fontWeight: 800, fontSize: '0.7rem' }}>
          {lastGroup}
        </ListSubheader>
      );
    }
    items.push(<MenuItem key={lang.value} value={lang.value}>{lang.label}</MenuItem>);
  });
  return items;
}

function StepNav({ onBack, onNext, backDisabled, nextDisabled, nextLabel = 'Next' }) {
  return (
    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
      <Button disabled={backDisabled} onClick={onBack} sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none', color: 'rgba(17,17,17,0.6)' }}>Back</Button>
      <Button variant="contained" onClick={onNext} disabled={nextDisabled} sx={{ background: G, borderRadius: '10px', fontWeight: 800, textTransform: 'none', boxShadow: '0 4px 18px rgba(232, 160, 32, 0.25)' }}>{nextLabel}</Button>
    </Stack>
  );
}

const TranslationStudio = () => {
  const dispatch = useAppDispatch();
  const {
    sourceLanguage, targetLanguage, inputText, translatedText,
    selectedFile, isLoading,
  } = useAppSelector(state => state.translation);
  const { user } = useAppSelector(state => state.auth);

  useStudioTour(TOUR_IDS.translate, translateTour);

  const [activeTab, setActiveTab] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [exportAnchor, setExportAnchor] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 100, percentage: 0 });
  const [streamingActive, setStreamingActive] = useState(false);
  const [streamInfo, setStreamInfo] = useState('System Ready');
  const [userBalance, setUserBalance] = useState(null);
  const translationEndRef = useRef(null);
  const sourceRef = useRef(null);
  const targetRef = useRef(null);

  const isTextMode = activeTab === 0;
  const hasContent = isTextMode ? !!inputText.trim() : !!selectedFile;
  const busy = isLoading || streamingActive;
  const hasResult = !!translatedText?.trim();
  const uid = user?.uid || user?.userId;
  const isLowBalance = false;

  useEffect(() => {
    if (uid) {
      subscriptionAPI.getBalance(uid)
        .then(data => setUserBalance(data.balance ?? data.credit_balance ?? null))
        .catch(() => {});
    }
  }, [uid]);

  useEffect(() => {
    const handoff = consumePipeline('translate');
    if (!handoff) return;
    setActiveTab(0);
    if (handoff.text) dispatch(setInputText(String(handoff.text)));
    const langs = TRANSLATE_LANGUAGES.map(l => l.value);
    if (handoff.sourceLang && langs.includes(toIso6393(handoff.sourceLang) || handoff.sourceLang)) {
      dispatch(setSourceLanguage(toIso6393(handoff.sourceLang) || handoff.sourceLang));
    }
    if (handoff.text) {
      setSuccessMsg('Text imported from your previous step — pick a target language and translate.');
      setActiveStep(2);
    }
  }, [dispatch]);

  useEffect(() => {
    let eventSource;
    if (streamingActive && uid) {
      dispatch(setTranslatedText(''));
      setStreamInfo('Initializing Stream…');
      const streamUrl = `${BASE_URL}/translate/stream/${uid}`;
      eventSource = new EventSource(streamUrl);

      eventSource.onopen = () => setStreamInfo('Connected · Processing…');

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.chunk) {
            dispatch(appendTranslatedChunk(data.chunk));
            if (translationEndRef.current) translationEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
          if (data.error) {
            setStreamInfo(`Error: ${data.error}`);
            setStreamingActive(false);
          }
        } catch { /* ignore parse errors */ }
      };

      eventSource.onerror = () => {
        setStreamInfo('Stream Finalized');
        eventSource.close();
        setStreamingActive(false);
      };

      return () => { if (eventSource) eventSource.close(); };
    }
  }, [streamingActive, uid, dispatch]);

  useEffect(() => {
    if (!streamingActive && !isLoading && translatedText?.trim() && activeStep === 2) {
      setActiveStep(3);
    }
  }, [streamingActive, isLoading, translatedText, activeStep]);

  useEffect(() => {
    let interval;
    if (isLoading && user?.userId) {
      interval = setInterval(async () => {
        try {
          const status = await translationAPI.getTranslationStatus(user.userId);
          setProgress({ current: status.current || 0, total: status.total || 100, percentage: status.percentage || 0 });
          if (status.status === 'completed') {
            setStreamingActive(false);
            setActiveStep(3);
          }
        } catch { /* ignore */ }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLoading, user?.userId]);

  const handleTabChange = (_, v) => {
    setActiveTab(v);
    setActiveStep(0);
    setErrorMsg(null);
    setSuccessMsg('');
  };

  const handleNext = () => setActiveStep(s => s + 1);
  const handleBack = () => setActiveStep(s => Math.max(0, s - 1));

  const handleReset = () => {
    dispatch(setInputText(''));
    dispatch(setSelectedFile(null));
    dispatch(setTranslatedText(''));
    setStreamingActive(false);
    setStreamInfo('System Ready');
    setActiveStep(0);
    setSuccessMsg('');
    setErrorMsg(null);
  };

  const swapLanguages = () => {
    dispatch(setSourceLanguage(targetLanguage));
    dispatch(setTargetLanguage(sourceLanguage));
  };

  const handleTranslate = async () => {
    if (!user?.userId) return;
    setErrorMsg(null);
    setSuccessMsg('');
    try {
      if (selectedFile && !isTextMode) {
        const result = await dispatch(translateDocument({
          userId: user.userId, sourceLang: toIso6393(sourceLanguage) || sourceLanguage, targetLang: toIso6393(targetLanguage) || targetLanguage, file: selectedFile,
        })).unwrap();
        if (result.status === 'started') setStreamingActive(true);
      } else if (inputText.trim()) {
        const result = await dispatch(translateText({
          userId: user.userId, sourceLang: toIso6393(sourceLanguage) || sourceLanguage, targetLang: toIso6393(targetLanguage) || targetLanguage, text: inputText,
        })).unwrap();
        if (result.status === 'started') {
          setStreamingActive(true);
        } else if (result.status === 'completed') {
          setStreamInfo('Translation Complete');
          setSuccessMsg('Translation loaded successfully');
          setActiveStep(3);
        }
        subscriptionAPI.getBalance(user.userId).then(data => {
          setUserBalance(data.balance ?? data.credit_balance ?? null);
          window.dispatchEvent(new CustomEvent('refresh-balance'));
          window.dispatchEvent(new CustomEvent('library-updated'));
        }).catch(() => {});
      }
    } catch (e) {
      if (e.response?.status === 402) {
        setErrorMsg(e.response?.data?.detail || 'Insufficient credits');
        window.dispatchEvent(new CustomEvent('subscription-limit-exceeded', {
          detail: { message: e.response?.data?.detail, status: 402 },
        }));
      } else {
        setErrorMsg(getFriendlyErrorMessage(e, 'Translation failed'));
      }
    }
  };

  const handleExport = async (format) => {
    setExportAnchor(null);
    if (!translatedText) return;
    try {
      const filename = selectedFile ? selectedFile.name.split('.')[0] : 'translation';
      let blob;
      if (format === 'docx') blob = await translationAPI.exportToDocx(translatedText, filename);
      else if (format === 'pdf') blob = await translationAPI.exportToPdf(translatedText, filename);
      else blob = new Blob([translatedText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setSuccessMsg(`Exported as ${format.toUpperCase()}`);
    } catch {
      setErrorMsg('Export failed');
    }
  };

  const sourceLangLabel = getTranslateLanguageLabel(sourceLanguage);
  const targetLangLabel = getTranslateLanguageLabel(targetLanguage);

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, minHeight: '100vh', background: 'transparent', maxWidth: 1200, mx: 'auto' }}>

      {errorMsg && <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ mb: 2, borderRadius: '12px' }}>{errorMsg}</Alert>}
      {successMsg && <Alert severity="success" onClose={() => setSuccessMsg('')} sx={{ mb: 2, borderRadius: '12px' }}>{successMsg}</Alert>}

      <Box data-tour="studio-mode" sx={{ mb: 2, borderBottom: '1px solid rgba(17,17,17,0.07)' }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ minHeight: 40, '& .MuiTabs-indicator': { background: G, height: 2 } }}>
          <Tab label="Text Translation" icon={<TextFields sx={{ fontSize: 17 }} />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40, color: activeTab === 0 ? AC : 'rgba(17,17,17,0.4)', '&.Mui-selected': { color: AC } }} />
          <Tab label="Document Translation" icon={<CloudUpload sx={{ fontSize: 17 }} />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40, color: activeTab === 1 ? AC : 'rgba(17,17,17,0.4)', '&.Mui-selected': { color: AC } }} />
        </Tabs>
      </Box>

      <Stepper data-tour="studio-flow" activeStep={activeStep} orientation="vertical" sx={STEPPER_SX}>

        <Step>
          <StepLabel>Step 1: {isTextMode ? 'Enter Source Text' : 'Upload Document'}</StepLabel>
          <StepContent>
            <Paper elevation={0} sx={{ p: 3, mb: 2, ...GLASS, mt: 1 }}>
              <Typography sx={{ fontSize: '0.85rem', color: 'rgba(17,17,17,0.6)', mb: 2, fontWeight: 600 }}>
                {isTextMode ? 'Paste or type the content you want translated.' : 'Upload a PDF, DOCX, or TXT file for translation.'}
              </Typography>
              {isTextMode ? (
                <TextField
                  multiline fullWidth minRows={8} maxRows={14}
                  placeholder="Type or paste material here…"
                  value={inputText}
                  onChange={e => dispatch(setInputText(e.target.value))}
                  disabled={!!selectedFile}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', color: '#111111', fontSize: '0.95rem', lineHeight: 1.7 } }}
                />
              ) : (
                <Box sx={{ textAlign: 'center', py: 3, border: '1px dashed rgba(17,17,17,0.12)', borderRadius: '16px', background: 'rgba(17,17,17,0.02)' }}>
                  {selectedFile ? (
                    <Stack spacing={1} alignItems="center">
                      <Description sx={{ fontSize: 40, color: '#10b981' }} />
                      <Typography sx={{ fontWeight: 800, color: '#111111' }}>{selectedFile.name}</Typography>
                      <Button size="small" onClick={() => dispatch(setSelectedFile(null))} sx={{ fontWeight: 700, color: 'rgba(17,17,17,0.5)' }}>Remove file</Button>
                    </Stack>
                  ) : (
                    <>
                      <CloudUpload sx={{ fontSize: 36, color: 'rgba(17,17,17,0.2)', mb: 1 }} />
                      <input type="file" id="studio-upload" hidden onChange={e => dispatch(setSelectedFile(e.target.files[0]))} accept=".pdf,.docx,.doc,.txt" />
                      <Button component="label" htmlFor="studio-upload" variant="contained" sx={{ background: G, borderRadius: '12px', fontWeight: 900, mt: 1 }}>
                        Upload Document
                      </Button>
                      <Typography sx={{ fontSize: '0.75rem', color: 'rgba(17,17,17,0.4)', mt: 1.5 }}>PDF · DOCX · TXT</Typography>
                    </>
                  )}
                </Box>
              )}
            </Paper>
            <StepNav onBack={handleBack} onNext={handleNext} backDisabled={activeStep === 0} nextDisabled={!hasContent} />
          </StepContent>
        </Step>

        <Step>
          <StepLabel>Step 2: Select Languages</StepLabel>
          <StepContent>
            <Paper elevation={0} sx={{ p: 3, mb: 2, ...GLASS, mt: 1 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 180, flex: 1 }}>
                  <Select value={toIso6393(sourceLanguage) || sourceLanguage} onChange={e => dispatch(setSourceLanguage(e.target.value))} MenuProps={TRANSLATE_MENU_PROPS} sx={{ borderRadius: '12px', color: '#111111' }}>
                    {translateLanguageMenuItems()}
                  </Select>
                </FormControl>
                <IconButton onClick={swapLanguages} sx={{ color: AC, background: 'rgba(232,160,32,0.08)' }}><SwapHoriz /></IconButton>
                <FormControl size="small" sx={{ minWidth: 180, flex: 1 }}>
                  <Select value={toIso6393(targetLanguage) || targetLanguage} onChange={e => dispatch(setTargetLanguage(e.target.value))} MenuProps={TRANSLATE_MENU_PROPS} sx={{ borderRadius: '12px', color: '#111111' }}>
                    {translateLanguageMenuItems()}
                  </Select>
                </FormControl>
              </Stack>
            </Paper>
            <StepNav onBack={handleBack} onNext={handleNext} backDisabled={false} nextDisabled={false} />
          </StepContent>
        </Step>

        <Step>
          <StepLabel>Step 3: Translate</StepLabel>
          <StepContent>
            <Paper elevation={0} sx={{ p: 3, mb: 2, ...GLASS, mt: 1 }}>
              <Stack spacing={1.5} sx={{ p: 2, background: 'rgba(232,160,32,0.05)', borderRadius: '12px', border: `1px solid ${AC}30`, mb: 2 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#111111' }}><strong>Mode:</strong> {isTextMode ? 'Text' : 'Document'}</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#111111' }}><strong>From:</strong> {sourceLangLabel} → <strong>To:</strong> {targetLangLabel}</Typography>
                {isTextMode && <Typography sx={{ fontSize: '0.8rem', color: '#111111' }}><strong>Characters:</strong> {inputText.trim().length}</Typography>}
                {!isTextMode && selectedFile && <Typography sx={{ fontSize: '0.8rem', color: '#111111' }}><strong>File:</strong> {selectedFile.name}</Typography>}
                {isTextMode && inputText.trim().length > 0 && (
                  <Box><CreditEstimateChip service="text_translation" quantity={inputText.trim().length} balance={userBalance} /></Box>
                )}
              </Stack>
              <Button
                variant="contained" fullWidth startIcon={<AutoAwesome />}
                onClick={handleTranslate}
                disabled={busy || !hasContent || isLowBalance}
                sx={{ background: G, py: 1.5, borderRadius: '12px', fontWeight: 900, mb: 2 }}
              >
                {busy ? (streamingActive ? 'Streaming…' : 'Processing…') : 'Start Translation'}
              </Button>
              {(busy || streamingActive) && (
                <AvoicesJobProgress
                  value={progress.percentage}
                  label={streamInfo.toUpperCase()}
                  sublabel="Live stream"
                />
              )}
              {hasResult && !busy && (
                <Typography sx={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, mt: 1, textAlign: 'center' }}>✓ Translation ready</Typography>
              )}
            </Paper>
            <StepNav onBack={handleBack} onNext={handleNext} backDisabled={false} nextDisabled={!hasResult && !busy} nextLabel="View Results" />
          </StepContent>
        </Step>

        <Step>
          <StepLabel>Step 4: Review & Export</StepLabel>
          <StepContent>
            <Paper elevation={0} sx={{ p: 3, mb: 2, ...GLASS, mt: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(17,17,17,0.3)' }}>Translation Result</Typography>
                <Stack direction="row" spacing={1}>
                  {streamingActive && <Chip size="small" label="Live" sx={{ bgcolor: AC, color: '#fff', fontSize: '0.65rem', fontWeight: 800 }} />}
                  <Tooltip title="Copy">
                    <IconButton size="small" onClick={() => navigator.clipboard.writeText(translatedText)} disabled={!hasResult}><ContentCopy fontSize="small" /></IconButton>
                  </Tooltip>
                  <Button size="small" startIcon={<GetApp />} disabled={!hasResult} onClick={e => setExportAnchor(e.currentTarget)} sx={{ fontWeight: 800, color: AC, textTransform: 'none' }}>Export</Button>
                  <SendToStudioButton
                    targets={['synthesize', 'voiceover', 'dubbing']}
                    disabled={!hasResult}
                    getPayload={() => ({ text: translatedText, sourceLang: targetLanguage, targetLang: targetLanguage })}
                  />
                </Stack>
              </Stack>
              <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)} PaperProps={{ sx: { borderRadius: '12px', minWidth: 160 } }}>
                <MenuItem onClick={() => handleExport('docx')}><Description sx={{ mr: 1.5, color: '#3b82f6' }} /> Word</MenuItem>
                <MenuItem onClick={() => handleExport('pdf')}><PictureAsPdf sx={{ mr: 1.5, color: '#ef4444' }} /> PDF</MenuItem>
                <MenuItem onClick={() => handleExport('txt')}>Plain Text</MenuItem>
              </Menu>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(17,17,17,0.35)', mb: 1, textTransform: 'uppercase' }}>Source</Typography>
                  <Box ref={sourceRef} sx={{ p: 2, maxHeight: 280, overflowY: 'auto', borderRadius: '12px', background: 'rgba(17,17,17,0.03)', border: '1px solid rgba(17,17,17,0.06)' }}>
                    <Typography sx={{ fontSize: '0.85rem', color: '#111111', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {isTextMode ? inputText : selectedFile ? `[Document: ${selectedFile.name}]` : '—'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: AC, mb: 1, textTransform: 'uppercase' }}>Translation</Typography>
                  <Box ref={targetRef} sx={{ p: 2, maxHeight: 280, overflowY: 'auto', borderRadius: '12px', background: 'rgba(232,160,32,0.04)', border: `1px solid ${AC}25` }}>
                    <TextField
                      multiline fullWidth variant="standard"
                      placeholder="Translation will appear here…"
                      value={translatedText}
                      onChange={e => dispatch(setTranslatedText(e.target.value))}
                      InputProps={{ disableUnderline: true, sx: { color: '#111111', fontSize: '0.9rem', lineHeight: 1.8 } }}
                    />
                    <div ref={translationEndRef} />
                  </Box>
                </Grid>
              </Grid>
            </Paper>
            <Paper elevation={0} sx={{ p: 4, ...GLASS, textAlign: 'center' }}>
              <CheckCircleOutline sx={{ fontSize: 48, color: '#10b981', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 3 }}>Translation Complete</Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button variant="outlined" onClick={handleBack} sx={{ borderRadius: '12px', fontWeight: 800, px: 3 }}>Back</Button>
                <Button variant="outlined" onClick={handleReset} sx={{ borderRadius: '12px', fontWeight: 800, px: 3 }}>Start Over</Button>
              </Stack>
            </Paper>
          </StepContent>
        </Step>

      </Stepper>
    </Box>
  );
};

export default TranslationStudio;
