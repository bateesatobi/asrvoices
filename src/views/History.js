import React from "react";
import { Box } from "@mui/material";
import HistoryComponent from "../components/History";
import HistoryElevenLabs from "../components/Redesigned/HistoryElevenLabs";

const History = () => {
  // Use the new ElevenLabs-style design
  return (
    <Box>
      <HistoryElevenLabs />
    </Box>
  );
};

export default History;
