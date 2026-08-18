import React from 'react';
import { Stack, IconButton, Tooltip, useTheme } from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import FacebookOutlinedIcon from '@mui/icons-material/FacebookOutlined';
import LinkIcon from '@mui/icons-material/Link';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import { RV_AC } from './resultViewTokens';
import {
  shareViaWhatsApp,
  shareViaEmail,
  shareViaLinkedIn,
  shareViaTwitter,
  shareViaFacebook,
  shareViaTikTok,
  copyShareLink,
  tryNativeShare,
  getPageShareUrl,
} from '../../utils/shareHelpers';

const iconBtnSx = (color) => ({
  width: 34,
  height: 34,
  color,
  border: '1px solid rgba(17, 17, 17, 0.08)',
  background: 'rgba(255,255,255,0.6)',
  '&:hover': { background: 'rgba(232, 160, 32, 0.1)', borderColor: 'rgba(232, 160, 32, 0.25)' },
});

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.182a8.174 8.174 0 01-4.165-1.136l-.299-.178-3.015.902.902-3.015-.178-.299A8.174 8.174 0 014.818 12c0-4.514 3.668-8.182 8.182-8.182S21.182 7.486 21.182 12 17.514 18.182 12 18.182z" />
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TikTokIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13.4a8.26 8.26 0 005.58 2.18V12.1a4.84 4.84 0 01-3.77-1.41z" />
  </svg>
);

/**
 * Social share actions for result content.
 * @param {{ title?: string, text?: string, url?: string, onNotify?: Function, compact?: boolean }} props
 */
const ResultShareBar = ({ title, text, url, onNotify, compact = false }) => {
  const isDark = useTheme().palette.mode === 'dark';
  const shareUrl = url || getPageShareUrl();
  const payload = { title, text, url: shareUrl, onNotify };

  const handleNativeShare = async () => {
    const ok = await tryNativeShare(payload);
    if (!ok) copyShareLink(payload);
  };

  return (
    <Stack
      direction="row"
      spacing={compact ? 0.25 : 0.5}
      alignItems="center"
      flexWrap="wrap"
      sx={{ gap: compact ? 0.25 : 0.5 }}
    >
      <Tooltip title="Share via WhatsApp">
        <IconButton size="small" onClick={() => shareViaWhatsApp(payload)} sx={iconBtnSx('#25D366')} aria-label="Share on WhatsApp">
          <WhatsAppIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Share via email">
        <IconButton size="small" onClick={() => shareViaEmail(payload)} sx={iconBtnSx('#EA4335')} aria-label="Share via email">
          <EmailOutlinedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Share on LinkedIn">
        <IconButton size="small" onClick={() => shareViaLinkedIn(payload)} sx={iconBtnSx('#0A66C2')} aria-label="Share on LinkedIn">
          <LinkedInIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Share on X">
        <IconButton size="small" onClick={() => shareViaTwitter(payload)} sx={iconBtnSx(isDark ? '#fff' : '#111')} aria-label="Share on X">
          <XIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Share on Facebook">
        <IconButton size="small" onClick={() => shareViaFacebook(payload)} sx={iconBtnSx('#1877F2')} aria-label="Share on Facebook">
          <FacebookOutlinedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Share on TikTok">
        <IconButton size="small" onClick={() => shareViaTikTok(payload)} sx={iconBtnSx('#111')} aria-label="Share on TikTok">
          <TikTokIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Copy link">
        <IconButton size="small" onClick={() => copyShareLink(payload)} sx={iconBtnSx(RV_AC)} aria-label="Copy link">
          <LinkIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Tooltip>
      {typeof navigator !== 'undefined' && navigator.share && (
        <Tooltip title="More share options">
          <IconButton size="small" onClick={handleNativeShare} sx={iconBtnSx('rgba(17,17,17,0.55)')} aria-label="Share">
            <ShareOutlinedIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
};

export default ResultShareBar;
