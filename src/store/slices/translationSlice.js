import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { translationAPI } from '../../services/api';

export const translateText = createAsyncThunk(
  'translation/translateText',
  async (translationData, { rejectWithValue }) => {
    try {
      const response = await translationAPI.translateText(
        translationData.text,
        translationData.sourceLang,
        [translationData.targetLang],
        translationData.userId
      );
      
      if (response.status === 'started') {
        return {
          status: 'started',
          jobId: response.job_id,
          originalText: translationData.text,
          sourceText: translationData.text
        };
      }
      
      // If it's not "started", check if it's an immediate translation result
      // The backend returns a dictionary of langCode -> translatedText (which can be a list of segments)
      const targetLang = translationData.targetLang;
      if (response && response[targetLang]) {
        const result = response[targetLang];
        const text = Array.isArray(result) 
          ? result.map(s => typeof s === 'string' ? s : s.text).join(' ') 
          : result;
          
        return {
          status: 'completed',
          translatedText: text,
          originalText: translationData.text,
          sourceText: translationData.text,
          sourceLang: translationData.sourceLang,
          targetLang: translationData.targetLang
        };
      }
      
      return rejectWithValue(response.msg || 'Failed to start text translation');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Text translation failed');
    }
  }
);

export const translateDocument = createAsyncThunk(
  'translation/translateDocument',
  async (translationData, { rejectWithValue }) => {
    try {
      const response = await translationAPI.translateDocument(
        translationData.file,
        translationData.sourceLang,
        [translationData.targetLang],
        translationData.userId
      );
      
      // Response structure for Expert Architecture: 
      // { "status": "started", "job_id": "...", "filename": "...", "original_text_preview": "..." }
      if (response.status === 'started') {
        return {
          status: 'started',
          jobId: response.job_id,
          originalText: response.original_text_preview, // Just a preview for now
          sourceText: response.original_text_preview
        };
      }
      
      // Fallback for legacy or error
      return rejectWithValue(response.msg || 'Failed to start document translation');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Document translation failed');
    }
  }
);

const initialState = {
  sourceLanguage: 'eng',
  targetLanguage: 'lug',
  inputText: '',
  translatedText: '',
  selectedFile: null,
  isLoading: false,
  error: null,
  history: [],
  activeTab: 0,
};

const translationSlice = createSlice({
  name: 'translation',
  initialState,
  reducers: {
    setSourceLanguage: (state, action) => {
      state.sourceLanguage = action.payload;
    },
    setTargetLanguage: (state, action) => {
      state.targetLanguage = action.payload;
    },
    setInputText: (state, action) => {
      state.inputText = action.payload;
    },
    setTranslatedText: (state, action) => {
      state.translatedText = action.payload;
    },
    appendTranslatedChunk: (state, action) => {
      if (state.translatedText) {
        state.translatedText += `\n\n${action.payload}`;
      } else {
        state.translatedText = action.payload;
      }
    },
    setSelectedFile: (state, action) => {
      state.selectedFile = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearTranslation: (state) => {
      state.inputText = '';
      state.translatedText = '';
      state.selectedFile = null;
    },
    addToHistory: (state, action) => {
      state.history.unshift(action.payload);
      if (state.history.length > 50) {
        state.history.pop();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(translateText.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(translateText.fulfilled, (state, action) => {
        state.isLoading = false;
        state.translatedText = action.payload.translatedText;
        // Add to history
        state.history.unshift({
          id: Date.now(),
          originalText: action.payload.originalText,
          translatedText: action.payload.translatedText,
          sourceLang: action.payload.sourceLang,
          targetLang: action.payload.targetLang,
          timestamp: new Date().toISOString(),
        });
      })
      .addCase(translateText.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(translateDocument.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(translateDocument.fulfilled, (state, action) => {
        state.isLoading = false;
        state.translatedText = action.payload.translatedText;
        // Add to history
        state.history.unshift({
          id: Date.now(),
          originalText: action.payload.originalText,
          translatedText: action.payload.translatedText,
          sourceLang: action.payload.sourceLang,
          targetLang: action.payload.targetLang,
          timestamp: new Date().toISOString(),
        });
      })
      .addCase(translateDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSourceLanguage,
  setTargetLanguage,
  setInputText,
  setTranslatedText,
  appendTranslatedChunk,
  setSelectedFile,
  setActiveTab,
  clearError,
  clearTranslation,
  addToHistory,
} = translationSlice.actions;

export default translationSlice.reducer;
