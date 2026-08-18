import React, { useEffect, useState } from "react";
import { Stack } from "@mui/material";
import SummarizeIcon from '@mui/icons-material/Summarize';
import { dataAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import useExportGate from '../hooks/useExportGate';
import {
  ResultViewLayout, ResultTextPanel, ExportCreditsChip, ResultViewSnackbar, useResultNotify, ResultShareBar,
} from './result-view';

const ViewSummaryComponent = ({ translationId, showBack = true }) => {
  const navigate = useNavigate();
  const [scriptDate, setScriptDate] = useState("");
  const [scriptTitle, setScriptTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const { balance, lowCredits, copyText } = useExportGate();
  const { snackbar, notify, closeNotify } = useResultNotify();

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      try {
        const response = await dataAPI.getSummary(translationId);
        if (response.entries?.length > 0) {
          const entry = response.entries[0];
          setScriptDate(entry.Date || entry.date || new Date().toISOString());
          setScriptTitle(entry.title || "AI Summary");
          setSummary(entry.Summary || entry.summary || "No summary available.");
        }
      } catch {
        notify("Failed to fetch summary", "error");
      } finally {
        setLoading(false);
      }
    };
    if (translationId) fetchEntries();
    else setLoading(false);
  }, [translationId, notify]);

  return (
    <>
      <ResultViewLayout
        type="summary"
        title={scriptTitle}
        subtitle="AI Summary"
        date={scriptDate}
        onBack={showBack ? () => navigate(-1) : undefined}
        loading={loading}
        empty={!loading && !summary}
        emptyMessage="No summary available"
        emptyIcon={SummarizeIcon}
        badges={[{ label: 'Neural analysis' }]}
        headerActions={
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <ExportCreditsChip balance={balance} lowCredits={lowCredits} />
            <ResultShareBar title={scriptTitle} text={summary} onNotify={notify} compact />
          </Stack>
        }
      >
        <ResultTextPanel
          title="Summary"
          icon={SummarizeIcon}
          text={summary}
          defaultExpanded
          editable
          onSave={setSummary}
          onCopy={summary ? () => copyText(summary, notify) : undefined}
          shareTitle={scriptTitle}
          shareText={summary}
          onNotify={notify}
          highlight
        />
      </ResultViewLayout>

      <ResultViewSnackbar {...snackbar} onClose={closeNotify} />
    </>
  );
};

export default ViewSummaryComponent;
