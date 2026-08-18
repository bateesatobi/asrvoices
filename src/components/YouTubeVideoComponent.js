import React, { useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { Box, Typography } from '@mui/material';

const extractVideoID = (url) => {
  if (!url) return null;
  const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^?&"'>]+)/;
  const match = String(url).match(regExp);
  return match ? match[1] : null;
};

const YouTubeVideoComponent = React.forwardRef(({ videoUrl, onTimeUpdate }, ref) => {
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const videoId = extractVideoID(videoUrl);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  if (!videoId) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>Unable to load YouTube video</Typography>
      </Box>
    );
  }

  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    if (typeof ref === 'function') ref(event.target);
    else if (ref) ref.current = event.target;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const player = playerRef.current;
      if (player && player.getPlayerState?.() === YouTube.PlayerState.PLAYING) {
        onTimeUpdate?.(player.getCurrentTime());
      }
    }, 1000);
  };

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <Box sx={{ width: '100%', height: '100%', '& iframe': { width: '100%', height: '100%' } }}>
      <YouTube videoId={videoId} opts={opts} onReady={onPlayerReady} />
    </Box>
  );
});

YouTubeVideoComponent.displayName = 'YouTubeVideoComponent';

export default YouTubeVideoComponent;
