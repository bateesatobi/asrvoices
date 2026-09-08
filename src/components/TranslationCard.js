import React, { useState, useEffect } from 'react';
import {
  Box, Button, FormControl, Grid, IconButton, MenuItem,
  Select, TextField, Alert, Tab, Tabs, Stack, Chip, LinearProgress,
  InputLabel, ListSubheader,
} from '@mui/material';
import {
  Translate, CloudUpload, SwapHoriz, Language,
  PictureAsPdf, Description,
  CheckCircle,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  setSourceLanguage, setTargetLanguage, setInputText,
  setSelectedFile, setActiveTab, clearError,
  translateText, translateDocument,
} from '../store/slices/translationSlice';
import DocumentTranslationDrawer from './DocumentTranslationDrawer';
import { ActivityStrip } from './progress';
import { TRANSLATE_LANGUAGES, toIso6393 } from '../constants/translateLanguages';

const G = 'linear-gradient(135deg, #f59e0b, #d97706)';
const GLASS = { background: 'rgba(248, 246, 240, 0.65)', border: '1px solid rgba(232, 160, 32, 0.15)', borderRadius: '14px' };
const SELECT_SX = {
  borderRadius: '12px', color: '#111111', fontSize: '0.9rem',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(17, 17, 17, 0.1)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#f59e0b' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f59e0b' },
  '& .MuiSvgIcon-root': { color: 'rgba(17, 17, 17, 0.5)' },
};
const LABEL_SX = { color: 'rgba(17, 17, 17, 0.5)', '&.Mui-focused': { color: '#f59e0b' } };

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TEXT_LENGTH = 5000;
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
    items.push(
      <MenuItem key={lang.value} value={lang.value} sx={{ color: '#111111', '&:hover': { color: '#f59e0b' } }}>
        {lang.label}
      </MenuItem>
    );
  });
  return items;
}

const SUPPORTED_FILE_TYPES = [
  { type: 'PDF',  extension: '.pdf' },
  { type: 'Word', extension: '.doc, .docx' },
  { type: 'Text', extension: '.txt' },
];

const TranslationCard = () => {
  const dispatch = useAppDispatch();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState(null);
  const [userClosedDrawer, setUserClosedDrawer] = useState(false);

  const {
    sourceLanguage, targetLanguage, inputText, translatedText,
    selectedFile, isLoading: loading, error, activeTab,
  } = useAppSelector(state => state.translation);
  const { user } = useAppSelector(state => state.auth);

  useEffect(() => {
    if (translatedText && !loading && !error && !drawerOpen && !userClosedDrawer) {
      setTimeout(() => {
        setDrawerData({
          translations: { [targetLanguage]: translatedText },
          original: activeTab === 0 ? inputText : selectedFile?.name || 'Document',
          metadata: {
            file_name: activeTab === 0 ? 'Text Translation' : selectedFile?.name || 'Document',
            file_size: activeTab === 0 ? inputText.length : selectedFile?.size || 0,
            languages_translated: 1,
            processing_status: 'completed',
          },
        });
        setDrawerOpen(true);
      }, 200);
    }
  }, [translatedText, loading, error, targetLanguage, activeTab, inputText, selectedFile, drawerOpen, userClosedDrawer]);

  const handleTranslate = async () => {
    if (!user?.userId) return;
    setDrawerOpen(false);
    setDrawerData(null);
    setUserClosedDrawer(false);
    try {
      if (activeTab === 0) {
        if (inputText.length > MAX_TEXT_LENGTH) throw new Error(`Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`);
        await dispatch(translateText({ userId: user.userId, sourceLang: toIso6393(sourceLanguage) || sourceLanguage, targetLang: toIso6393(targetLanguage) || targetLanguage, text: inputText })).unwrap();
      } else {
        if (!selectedFile) throw new Error('No file selected');
        if (selectedFile.size > MAX_FILE_SIZE) throw new Error('File size exceeds 10MB limit');
        await dispatch(translateDocument({ userId: user.userId, sourceLang: toIso6393(sourceLanguage) || sourceLanguage, targetLang: toIso6393(targetLanguage) || targetLanguage, file: selectedFile })).unwrap();
      }
    } catch {}
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const fileType = `.${file.name.split('.').pop().toLowerCase()}`;
    const validTypes = SUPPORTED_FILE_TYPES.map(t => t.extension.split(', ').map(e => e.toLowerCase())).flat();
    if (validTypes.includes(fileType)) {
      dispatch(setSelectedFile(file));
      dispatch(clearError());
    }
    event.target.value = null;
  };



  const handleSwapLanguages = () => {
    dispatch(setSourceLanguage(targetLanguage));
    dispatch(setTargetLanguage(sourceLanguage));
  };

  return (
    <>
      <Box>
        {/* Tabs */}
        <Box sx={{ mb: 3, borderBottom: '1px solid rgba(17,17,17,0.08)' }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => dispatch(setActiveTab(v))}
            sx={{ minHeight: 40, '& .MuiTabs-indicator': { background: G, height: 2, borderRadius: 1 } }}
          >
            {['Text Translation', 'Document Translation'].map((label, i) => (
              <Tab key={i} label={label}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', minHeight: 40, color: activeTab === i ? '#f59e0b' : 'rgba(17,17,17,0.4)', '&.Mui-selected': { color: '#f59e0b' } }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Language Selectors */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth size="small">
              <InputLabel sx={LABEL_SX}>Source Language</InputLabel>
              <Select value={toIso6393(sourceLanguage) || sourceLanguage} label="Source Language" onChange={e => dispatch(setSourceLanguage(e.target.value))} MenuProps={TRANSLATE_MENU_PROPS} sx={SELECT_SX}>
                {translateLanguageMenuItems()}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2} sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton onClick={handleSwapLanguages} sx={{ width: 36, height: 36, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', '&:hover': { background: 'rgba(245,158,11,0.25)' } }}>
              <SwapHoriz fontSize="small" />
            </IconButton>
          </Grid>
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth size="small">
              <InputLabel sx={LABEL_SX}>Target Language</InputLabel>
              <Select value={toIso6393(targetLanguage) || targetLanguage} label="Target Language" onChange={e => dispatch(setTargetLanguage(e.target.value))} MenuProps={TRANSLATE_MENU_PROPS} sx={SELECT_SX}>
                {translateLanguageMenuItems()}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Content */}
        {activeTab === 0 ? (
          <Box sx={{ mb: 4 }}>
            <TextField
              multiline 
              rows={12} 
              fullWidth
              label="Content to Translate"
              placeholder="Type or paste your text here for professional translation…"
              value={inputText}
              onChange={e => dispatch(setInputText(e.target.value))}
              error={inputText.length > MAX_TEXT_LENGTH}
              helperText={`${inputText.length} / ${MAX_TEXT_LENGTH} characters`}
              sx={{
                '& .MuiOutlinedInput-root': { 
                  borderRadius: '20px', 
                  color: '#111111', 
                  backgroundColor: 'rgba(17,17,17,0.02)',
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  padding: '20px',
                  '& fieldset': { borderColor: 'rgba(17, 17, 17, 0.08)' }, 
                  '&:hover fieldset': { borderColor: 'rgba(245, 158, 11, 0.4)' }, 
                  '&.Mui-focused fieldset': { borderColor: '#f59e0b', borderWidth: '2px' } 
                },
                '& .MuiInputLabel-root': { ...LABEL_SX, transform: 'translate(20px, 20px) scale(1)', '&.Mui-input-shrink': { transform: 'translate(14px, -9px) scale(0.75)' } },
                '& .MuiFormHelperText-root': { color: '#64748b', textAlign: 'right', fontWeight: 500 },
              }}
            />
          </Box>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                border: '1.5px dashed',
                borderColor: selectedFile ? '#f59e0b' : 'rgba(17,17,17,0.12)',
                borderRadius: '14px', p: 4, textAlign: 'center', cursor: 'pointer',
                background: selectedFile ? 'rgba(245,158,11,0.05)' : 'rgba(17,17,17,0.02)',
                transition: 'all 0.25s ease',
                '&:hover': { borderColor: '#f59e0b', background: 'rgba(245,158,11,0.04)' },
              }}
              onClick={() => document.getElementById('transl-file-input')?.click()}
            >
              {selectedFile ? (
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
                  <CheckCircle sx={{ color: '#f59e0b', fontSize: 22 }} />
                  <Box sx={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.9rem' }}>{selectedFile.name}</Box>
                </Stack>
              ) : (
                <>
                  <Box sx={{ width: 52, height: 52, borderRadius: '14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                    <CloudUpload sx={{ fontSize: 26, color: '#f59e0b' }} />
                  </Box>
                  <Box sx={{ color: '#111111', fontWeight: 600, fontSize: '0.95rem', mb: 0.5 }}>Click to upload document</Box>
                  <Box sx={{ color: '#64748b', fontSize: '0.8rem' }}>PDF, DOC, DOCX, TXT · Max 10MB</Box>
                  <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
                    {SUPPORTED_FILE_TYPES.map(t => (
                      <Chip key={t.type} label={t.type} size="small"
                        sx={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.7rem' }} />
                    ))}
                  </Stack>
                </>
              )}
              <input id="transl-file-input" type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} style={{ display: 'none' }} />
            </Box>
            {translatedText && (
              <Box sx={{ ...GLASS, p: 2.5, mt: 2, borderColor: 'rgba(245, 158, 11, 0.25)', background: 'rgba(245, 158, 11, 0.05)' }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CheckCircle sx={{ color: '#f59e0b', fontSize: 18 }} />
                  <Box sx={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.9rem' }}>Translation Completed Successfully</Box>
                </Stack>
                <Box sx={{ color: '#64748b', fontSize: '0.8rem', mt: 0.5 }}>Results are displayed in the drawer on the right</Box>
              </Box>
            )}
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px', background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </Alert>
        )}

        <ActivityStrip active={loading} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained" size="large" onClick={handleTranslate}
            disabled={loading || (!inputText && !selectedFile)}
            startIcon={<Translate />}
            sx={{
              borderRadius: '50px', textTransform: 'none', fontWeight: 700, px: 4, py: 1.3,
              background: G, boxShadow: '0 4px 20px rgba(245,158,11,0.2)',
              '&:hover': { background: 'linear-gradient(135deg,#fbbf24,#d97706)', boxShadow: '0 6px 28px rgba(245,158,11,0.35)', transform: 'translateY(-1px)' },
              '&.Mui-disabled': { background: 'rgba(17, 17, 17, 0.08)', color: 'rgba(17,17,17,0.3)', boxShadow: 'none' },
            }}
          >
            {loading ? 'Translating…' : 'Translate'}
          </Button>
        </Box>
      </Box>

      <DocumentTranslationDrawer
        isOpen={drawerOpen}
        onClose={() => { setDrawerOpen(false); setUserClosedDrawer(true); }}
        translationData={drawerData}
        isLoading={loading}
        error={error}
        fileName={selectedFile?.name || 'Text Translation'}
      />
    </>
  );
};

export default TranslationCard;
