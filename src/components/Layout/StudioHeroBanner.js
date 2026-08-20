import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Full-bleed photo or muted Mixkit loop with title overlay.
 * Pass children for an on-image dropzone / CTA (no extra empty card).
 */
export default function StudioHeroBanner({
  image,
  video,
  title,
  subtitle,
  height = 200,
  children,
}) {
  const [usePoster, setUsePoster] = useState(!video);

  useEffect(() => {
    setUsePoster(!video);
  }, [video]);

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        minHeight: height,
        mb: 3,
        bgcolor: '#111',
      }}
    >
      {video && !usePoster ? (
        <Box
          component="video"
          src={video}
          poster={image}
          muted
          loop
          playsInline
          autoPlay
          onError={() => setUsePoster(true)}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <Box
          component="img"
          src={image}
          alt=""
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.62) 100%)',
        }}
      />
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          p: { xs: 2.5, md: 3 },
          minHeight: height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: children ? 'flex-end' : 'flex-end',
        }}
      >
        {title && (
          <Typography
            sx={{
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-0.02em',
              textShadow: '0 1px 12px rgba(0,0,0,0.35)',
            }}
          >
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.82)', mt: 0.5, maxWidth: 560 }}>
            {subtitle}
          </Typography>
        )}
        {children}
      </Box>
    </Box>
  );
}
