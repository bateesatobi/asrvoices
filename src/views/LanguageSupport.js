import React from 'react';
import { Box, Container, Stack, Chip } from '@mui/material';
import LanguageCatalog from '../components/languages/LanguageCatalog';
import { LANGUAGE_STATS } from '../constants/languageSupport';
import StudioHeroBanner from '../components/Layout/StudioHeroBanner';
import { STUDIO_VISUALS } from '../data/studioVisuals';

/** Dashboard Languages page — inside Sidenav layout */
const LanguageSupport = () => (
  <Container maxWidth="xl" sx={{ pb: 6 }}>
    <Box sx={{ py: { xs: 2, md: 3 } }}>
      <StudioHeroBanner
        image={STUDIO_VISUALS.languages.image}
        title="Languages"
        subtitle={`Coverage across ${LANGUAGE_STATS.studioFeatures} studios · ${LANGUAGE_STATS.totalLanguages} locales`}
        height={176}
      />
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Chip
          label="Live catalog"
          size="small"
          sx={{ ml: 'auto', fontWeight: 700, bgcolor: 'rgba(16,185,129,0.1)', color: '#059669', display: { xs: 'none', sm: 'flex' } }}
        />
      </Stack>

      <LanguageCatalog variant="dashboard" />
    </Box>
  </Container>
);

export default LanguageSupport;
