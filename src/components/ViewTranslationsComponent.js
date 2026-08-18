import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Button, Chip, Stack, Tooltip, Typography } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import TranslateIcon from '@mui/icons-material/Translate';
import { dataAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import useExportGate from '../hooks/useExportGate';
import {
  ResultViewLayout, ResultTextPanel, ResultLangAccordion, rvPrimaryButtonSx,
  ExportCreditsChip, ResultViewSnackbar, useResultNotify, ResultShareBar,
} from './result-view';
import {
  normalizeTranslationEntry,
  formatTranslationDate,
  getTranslationLanguageRows,
  getLanguageDisplayName,
} from '../utils/translationViewHelpers';

const ViewTranslationsComponent = ({ translationId }) => {
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editedTexts, setEditedTexts] = useState({});
  const navigate = useNavigate();
  const { balance, lowCredits, exportBlockedTitle, copyText, downloadBlob } = useExportGate();
  const { snackbar, notify, closeNotify } = useResultNotify();

  useEffect(() => {
    let cancelled = false;

    const fetchEntries = async () => {
      if (!translationId) {
        setLoading(false);
        setError('Missing translation ID');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await dataAPI.getTranslation(translationId);
        const rows = Array.isArray(response?.entries) ? response.entries : [];
        const normalized = normalizeTranslationEntry(rows[0]);
        if (!cancelled) {
          setEntry(normalized);
          if (!normalized) setError('Translation not found');
        }
      } catch {
        if (!cancelled) {
          setEntry(null);
          setError('Could not load translation');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchEntries();
    return () => { cancelled = true; };
  }, [translationId]);

  const languageRows = useMemo(
    () => getTranslationLanguageRows(entry),
    [entry]
  );

  const getLangText = useCallback(
    (code, fallback) => editedTexts[code] ?? fallback,
    [editedTexts]
  );

  const saveLangText = useCallback((code, text) => {
    setEditedTexts((prev) => ({ ...prev, [code]: text }));
  }, []);

  const originalText = getLangText('original', entry?.originalText || '');

  const downloadAsText = async () => {
    if (!entry) return;
    let content = `Title: ${entry.title}\nDate: ${formatTranslationDate(entry.date)}\n\n`;
    content += `Original (${getLanguageDisplayName(entry.sourceLang)}):\n${originalText}\n\n`;
    languageRows.forEach(({ code, label }) => {
      const text = getLangText(code, languageRows.find((r) => r.code === code)?.text);
      content += `${label} (${code.toUpperCase()}):\n${text || '—'}\n\n`;
    });
    await downloadBlob(content, `${entry.title || 'translation'}.txt`, 'text/plain', notify);
  };

  const isProcessing = entry?.status === 'processing';
  const hasContent = entry && (originalText || languageRows.some((r) => !r.isEmpty));
  const pageTitle = entry?.title || 'Translation';

  const headerActions = (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
      <ExportCreditsChip balance={balance} lowCredits={lowCredits} />
      <ResultShareBar title={pageTitle} text={originalText || pageTitle} onNotify={notify} compact />
      {entry && hasContent && (
        <Tooltip title={!lowCredits ? 'Download all languages' : exportBlockedTitle}>
          <span>
            <Button
              startIcon={<GetAppIcon />}
              onClick={downloadAsText}
              disabled={lowCredits}
              sx={rvPrimaryButtonSx}
            >
              Download all
            </Button>
          </span>
        </Tooltip>
      )}
    </Stack>
  );

  return (
    <>
      <ResultViewLayout
        type="translation"
        title={pageTitle}
        date={formatTranslationDate(entry?.date)}
        onBack={() => navigate(-1)}
        loading={loading}
        empty={!loading && (!entry || !hasContent)}
        emptyMessage={error || 'No translation data available'}
        emptyIcon={TranslateIcon}
        headerActions={headerActions}
      >
        {entry && (
          <>
            {(isProcessing || entry.collection === 'translated_documents' || languageRows.length > 1) && (
              <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                {languageRows.length > 0 && (
                  <Chip label={`${languageRows.length} language${languageRows.length !== 1 ? 's' : ''}`} size="small" sx={{ fontWeight: 600 }} />
                )}
                {entry.collection === 'translated_documents' && (
                  <Chip label="Document translation" size="small" sx={{ fontWeight: 600 }} />
                )}
                {isProcessing && (
                  <Chip label="Processing" size="small" color="warning" sx={{ fontWeight: 600 }} />
                )}
              </Stack>
            )}

            {entry.originalText ? (
              <ResultTextPanel
                title={`Original · ${getLanguageDisplayName(entry.sourceLang)}`}
                icon={TranslateIcon}
                text={originalText}
                defaultExpanded
                editable
                onSave={(text) => saveLangText('original', text)}
                onCopy={() => copyText(originalText, notify)}
                shareTitle={pageTitle}
                shareText={originalText}
                onNotify={notify}
              />
            ) : null}

            {languageRows.length > 0 ? (
              languageRows.map(({ code, label, text, isEmpty }, i) => {
                const langText = getLangText(code, text);
                return (
                  <ResultLangAccordion
                    key={code}
                    langCode={code}
                    langLabel={label}
                    meta={isEmpty ? (isProcessing ? 'Translating…' : 'No content') : undefined}
                    defaultExpanded={i === 0}
                    text={langText}
                    editable={!isEmpty}
                    onSave={(val) => saveLangText(code, val)}
                    onCopy={!isEmpty ? () => copyText(langText, notify) : undefined}
                    shareTitle={`${pageTitle} — ${label}`}
                    shareText={langText}
                    onNotify={notify}
                  >
                    {isEmpty && (
                      <Typography sx={{ color: 'rgba(17, 17, 17, 0.45)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                        {isProcessing
                          ? 'This language is still being translated.'
                          : 'No translated text was stored for this language.'}
                      </Typography>
                    )}
                  </ResultLangAccordion>
                );
              })
            ) : (
              !entry.originalText && (
                <Typography sx={{ color: 'rgba(17, 17, 17, 0.5)', fontSize: '0.9375rem' }}>
                  Translation content is not available for this record yet.
                </Typography>
              )
            )}
          </>
        )}
      </ResultViewLayout>

      <ResultViewSnackbar {...snackbar} onClose={closeNotify} />
    </>
  );
};

export default ViewTranslationsComponent;
