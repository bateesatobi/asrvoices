import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { RV_AC } from './resultViewTokens';
import { MIN_EXPORT_CREDITS } from '../../hooks/useExportGate';

const ExportCreditsChip = ({ balance, lowCredits }) => {
  if (balance == null) return null;

  const formatted = Number(balance).toFixed(2);

  return (
    <Tooltip
      title={
        lowCredits
          ? `At least ${MIN_EXPORT_CREDITS} credits are required to copy or download results.`
          : 'Credits available for export actions'
      }
    >
      <Chip
        size="small"
        icon={<AccountBalanceWalletOutlinedIcon sx={{ fontSize: '14px !important' }} />}
        label={`${formatted} credits`}
        sx={{
          fontWeight: 700,
          fontSize: '0.72rem',
          height: 26,
          background: lowCredits ? 'rgba(239, 68, 68, 0.08)' : 'rgba(232, 160, 32, 0.08)',
          color: lowCredits ? '#ef4444' : RV_AC,
          border: `1px solid ${lowCredits ? 'rgba(239, 68, 68, 0.22)' : 'rgba(232, 160, 32, 0.22)'}`,
          '& .MuiChip-icon': { color: 'inherit' },
        }}
      />
    </Tooltip>
  );
};

export default ExportCreditsChip;
