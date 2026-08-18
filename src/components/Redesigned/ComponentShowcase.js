import React, { useState } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import {
  CloudUpload,
  Mic,
  PlayArrow,
  CheckCircle,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import {
  ElevenLabsCard,
  ElevenLabsButton,
  ElevenLabsFileUpload,
  ElevenLabsModal,
  ElevenLabsTabs,
  ElevenLabsTextField,
  ElevenLabsTable,
  ElevenLabsSettingsPanel,
  SettingSlider,
  SettingSelect,
  SettingToggle,
  SettingSection,
} from '../ElevenLabsUI';

/**
 * Component Showcase - Demonstrates all ElevenLabs UI components
 * Use this as a reference for how to use each component
 */
export default function ComponentShowcase() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [textValue, setText] = useState('');
  const [sliderValue, setSliderValue] = useState(50);
  const [selectValue, setSelectValue] = useState('option1');
  const [toggleValue, setToggleValue] = useState(true);

  const tableColumns = [
    { label: 'Name', field: 'name' },
    { label: 'Status', field: 'status' },
    { label: 'Date', field: 'date' },
  ];

  const tableRows = [
    { name: 'Project 1', status: 'Complete', date: '2 hours ago' },
    { name: 'Project 2', status: 'Processing', date: '5 hours ago' },
    { name: 'Project 3', status: 'Complete', date: 'Yesterday' },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontSize: '2rem',
            fontWeight: 600,
            color: '#1a1a1a',
            letterSpacing: '-0.02em',
            mb: 1.5,
          }}
        >
          ElevenLabs UI Component Showcase
        </Typography>
        <Typography sx={{ fontSize: '1rem', color: '#666' }}>
          A comprehensive demonstration of all redesigned UI components
        </Typography>
      </Box>

      {/* Section: Buttons */}
      <ElevenLabsCard title="Buttons" subtitle="Different button variants" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <ElevenLabsButton variant="contained">Contained Button</ElevenLabsButton>
          <ElevenLabsButton variant="primary">Primary (Gold)</ElevenLabsButton>
          <ElevenLabsButton variant="outlined">Outlined Button</ElevenLabsButton>
          <ElevenLabsButton variant="text">Text Button</ElevenLabsButton>
          <ElevenLabsButton variant="contained" size="large" startIcon={<CloudUpload />}>
            Large with Icon
          </ElevenLabsButton>
          <ElevenLabsButton variant="contained" loading>
            Loading State
          </ElevenLabsButton>
          <ElevenLabsButton variant="contained" disabled>
            Disabled
          </ElevenLabsButton>
        </Box>
      </ElevenLabsCard>

      {/* Section: Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <ElevenLabsCard title="Simple Card">
            <Typography sx={{ fontSize: '0.875rem', color: '#666' }}>
              This is a basic card component with a title and content area.
            </Typography>
          </ElevenLabsCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <ElevenLabsCard
            title="Card with Action"
            action={
              <ElevenLabsButton variant="text" size="small">
                View All
              </ElevenLabsButton>
            }
          >
            <Typography sx={{ fontSize: '0.875rem', color: '#666' }}>
              This card has an action button in the header.
            </Typography>
          </ElevenLabsCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <ElevenLabsCard subtitle="Subtitle only card">
            <Typography sx={{ fontSize: '0.875rem', color: '#666' }}>
              Cards can have just a subtitle without a main title.
            </Typography>
          </ElevenLabsCard>
        </Grid>
      </Grid>

      {/* Section: Tabs */}
      <ElevenLabsCard title="Tabs" sx={{ mb: 3 }}>
        <ElevenLabsTabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          tabs={[
            { label: 'Upload', icon: <CloudUpload sx={{ fontSize: 16 }} /> },
            { label: 'Record', icon: <Mic sx={{ fontSize: 16 }} /> },
            { label: 'Playback', icon: <PlayArrow sx={{ fontSize: 16 }} /> },
          ]}
        />
        <Box sx={{ mt: 3 }}>
          <Typography sx={{ fontSize: '0.875rem', color: '#666' }}>
            Active tab: {['Upload', 'Record', 'Playback'][activeTab]}
          </Typography>
        </Box>
      </ElevenLabsCard>

      {/* Section: Text Fields */}
      <ElevenLabsCard title="Text Input Fields" sx={{ mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ElevenLabsTextField
              label="Single Line Input"
              placeholder="Enter some text..."
              value={textValue}
              onChange={(e) => setText(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ElevenLabsTextField
              label="Disabled Input"
              value="This field is disabled"
              disabled
            />
          </Grid>
          <Grid item xs={12}>
            <ElevenLabsTextField
              multiline
              rows={4}
              label="Multi-line Text Area"
              placeholder="Enter longer text here..."
              value={textValue}
              onChange={(e) => setText(e.target.value)}
            />
          </Grid>
        </Grid>
      </ElevenLabsCard>

      {/* Section: File Upload */}
      <ElevenLabsCard title="File Upload" sx={{ mb: 3 }}>
        <ElevenLabsFileUpload
          onFileSelect={(file) => setSelectedFile(file)}
          selectedFile={selectedFile}
          onClearFile={() => setSelectedFile(null)}
          accept="audio/*,video/*"
        >
          Audio & video files, up to 100MB
        </ElevenLabsFileUpload>
      </ElevenLabsCard>

      {/* Section: Table */}
      <ElevenLabsCard title="Table / List View" sx={{ mb: 3 }}>
        <ElevenLabsTable
          columns={tableColumns}
          rows={tableRows}
          onRowClick={(row) => alert(`Clicked: ${row.name}`)}
        />
      </ElevenLabsCard>

      {/* Section: Settings Panel */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <ElevenLabsCard title="Main Content Area">
            <Typography sx={{ fontSize: '0.875rem', color: '#666', mb: 2 }}>
              This would be your main content area, while the settings panel stays on the
              right side.
            </Typography>
            <ElevenLabsButton variant="primary" onClick={() => setModalOpen(true)}>
              Open Modal Demo
            </ElevenLabsButton>
          </ElevenLabsCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <ElevenLabsSettingsPanel>
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#1a1a1a', mb: 3 }}>
              Settings Panel
            </Typography>

            <SettingSection title="Controls">
              <SettingSlider
                label="Slider Control"
                value={sliderValue}
                onChange={(e, v) => setSliderValue(v)}
                min={0}
                max={100}
              />

              <SettingSelect
                label="Dropdown Select"
                value={selectValue}
                onChange={(e) => setSelectValue(e.target.value)}
                options={[
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                ]}
              />

              <SettingToggle
                label="Toggle Switch"
                checked={toggleValue}
                onChange={(e) => setToggleValue(e.target.checked)}
                description="This is a description for the toggle"
              />
            </SettingSection>

            <ElevenLabsButton variant="contained" fullWidth>
              Apply Settings
            </ElevenLabsButton>
          </ElevenLabsSettingsPanel>
        </Grid>
      </Grid>

      {/* Modal Demo */}
      <ElevenLabsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Modal Dialog"
        subtitle="This is a clean, centered modal with rounded corners"
      >
        <Typography sx={{ fontSize: '0.875rem', color: '#666', mb: 3 }}>
          Modals are perfect for focused tasks like uploads, confirmations, or settings
          that need user attention.
        </Typography>

        <ElevenLabsTabs
          value={0}
          onChange={() => {}}
          tabs={[{ label: 'Tab 1' }, { label: 'Tab 2' }, { label: 'Tab 3' }]}
        />

        <Box sx={{ mt: 3 }}>
          <ElevenLabsTextField
            label="Example Input"
            placeholder="Enter something..."
            fullWidth
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
            mt: 4,
            pt: 3,
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <ElevenLabsButton variant="outlined" onClick={() => setModalOpen(false)}>
            Cancel
          </ElevenLabsButton>
          <ElevenLabsButton
            variant="contained"
            startIcon={<CheckCircle />}
            onClick={() => setModalOpen(false)}
          >
            Confirm
          </ElevenLabsButton>
        </Box>
      </ElevenLabsModal>

      {/* Usage Instructions */}
      <ElevenLabsCard title="Usage Instructions" sx={{ bgcolor: '#f5f5f5' }}>
        <Typography sx={{ fontSize: '0.875rem', color: '#666', mb: 2 }}>
          All components are imported from:{' '}
          <code
            style={{
              background: '#e8e8e8',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.8125rem',
            }}
          >
            ../components/ElevenLabsUI
          </code>
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: '#666', mb: 2 }}>
          For detailed documentation and usage examples, see:
        </Typography>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#666' }}>
          <li>
            <code>ELEVENLABS_REDESIGN_GUIDE.md</code> - Comprehensive guide
          </li>
          <li>
            <code>DESIGN_IMPLEMENTATION_SUMMARY.md</code> - Visual summary
          </li>
          <li>
            <code>src/components/Redesigned/</code> - Example page implementations
          </li>
        </ul>
      </ElevenLabsCard>
    </Box>
  );
}
