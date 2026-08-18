import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, CssBaseline, useMediaQuery, useTheme } from '@mui/material';
import { useSidebar } from '../hooks/useSidebar';
import { isStudioRoute, TOP_BAR_HEIGHT } from '../constants/studioRoutes';
import ElevenLabsStyleSidebar from './Layout/ElevenLabsStyleSidebar';
import ElevenLabsStyleTopBar from './Layout/ElevenLabsStyleTopBar';

const W = 240;
const CLOSED_W = 65;

export default function Sidenav() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { open, toggleDrawer } = useSidebar();
  const location = useLocation();
  const studioPage = isStudioRoute(location.pathname);

  useEffect(() => {
    const sidebarWidth = isMobile ? 0 : open ? W : CLOSED_W;
    document.documentElement.style.setProperty('--avoices-sidebar-width', `${sidebarWidth}px`);
    return () => {
      document.documentElement.style.setProperty('--avoices-sidebar-width', '0px');
    };
  }, [open, isMobile]);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <ElevenLabsStyleSidebar open={open} toggleDrawer={toggleDrawer} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          bgcolor: '#FAFAFA',
          width: { xs: '100%', md: `calc(100% - ${open ? W : CLOSED_W}px)` },
          transition: 'width 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ElevenLabsStyleTopBar isMobile={isMobile} toggleDrawer={toggleDrawer} />

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            p: studioPage ? 0 : { xs: 2, md: 3 },
            ...(studioPage && {
              height: `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
              overflow: 'hidden',
            }),
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
