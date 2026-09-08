import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  List,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Box,
  IconButton,
  Tooltip,
  Drawer,
  ListItem,
  ListItemText,
  ListSubheader,
  Divider,
  Chip,
  useTheme,
  ThemeProvider,
  createTheme,
  useMediaQuery,
  Grid,
  Fab,
  Alert,
  Card,
  CardContent,
  Stack,
  alpha
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MenuIcon from '@mui/icons-material/Menu';
import InfoIcon from '@mui/icons-material/Info';
import HttpIcon from '@mui/icons-material/Http';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Enhanced animations
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-10px) rotate(1deg); }
  66% { transform: translateY(5px) rotate(-1deg); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const slideUp = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(30px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0px); 
  }
`;

const borderGlow = keyframes`
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
`;

const rotate = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Floating background elements
const FloatingElement = ({ size, position, delay, color = '#f59e0b' }) => (
  <Box
    sx={{
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color}20, ${color}05)`,
      border: `1px solid ${color}15`,
      ...position,
      animation: `${float} ${3 + Math.random() * 2}s ease-in-out infinite`,
      animationDelay: delay,
      zIndex: 0,
    }}
  />
);

// Categorized endpoints with updated structure
const categorizedEndpoints = {
  'Text Translation': [
  {
    method: "POST",
    path: "/translate",
    description: "Translate text content with multilingual support.",
    parameters: {
      type: "multipart/form-data",
      fields: {
        user_id: {
          type: "string",
          required: true,
          description: "Unique identifier for the user"
        },
        source_lang: {
          type: "string",
          required: true,
          description: "Source language code of the text"
        },
        target_langs: {
          type: "array",
          required: true,
          description: "Array of target language codes for translation"
        },
        doc: {
          type: "string",
          required: true,
          description: "Text content to be translated"
        },
        title: {
          type: "string",
          required: true,
          description: "Title for the translation"
        }
      }
    }
  },
  {
    method: "POST",
    path: "/translate_document",
    description: "Translate document files with multilingual support.",
    parameters: {
      type: "multipart/form-data",
      fields: {
        user_id: {
          type: "string",
          required: true,
          description: "Unique identifier for the user"
        },
        source_lang: {
          type: "string",
          required: true,
          description: "Source language code of the document"
        },
        target_langs: {
          type: "array",
          required: true,
          description: "Array of target language codes for translation"
        },
        title: {
          type: "string",
          required: true,
          description: "Title for the document translation"
        },
        file: {
          type: "file",
          required: true,
          description: "Document file to be translated"
        }
      }
    }
  },
  ],
  'Voice Recognition': [
    {
      method: "POST",
      path: "/upload",
      description: "Upload audio/video files for transcription.",
      parameters: {
        type: "multipart/form-data",
        fields: {
          user_id: {
            type: "string",
            required: true,
            description: "Unique identifier for the user"
          },
          source_lang: {
            type: "string",
            required: true,
            description: "Source language of the audio/video"
          },
          target_langs: {
            type: "array",
            required: true,
            description: "Target languages for translation"
          },
          audio_file: {
            type: "file",
            required: true,
            description: "Audio or video file to transcribe"
          }
        }
      }
    },
    {
      method: "POST",
      path: "/upload_recorded_audio",
      description: "Upload recorded audio for transcription.",
      parameters: {
        type: "multipart/form-data",
        fields: {
          user_id: {
            type: "string",
            required: true,
            description: "Unique identifier for the user"
          },
          source_lang: {
            type: "string",
            required: true,
            description: "Source language of the recorded audio"
          },
          target_langs: {
            type: "array",
            required: true,
            description: "Target languages for translation"
          },
          recorded_audio: {
            type: "file",
            required: true,
            description: "Recorded audio file"
          }
        }
      }
    }
  ],
  'Text to Speech': [
    {
      method: "POST",
      path: "/synthesize",
      description: "Convert text to speech with multilingual support.",
      parameters: {
        type: "multipart/form-data",
        fields: {
          user_id: { type: "string", required: true, description: "Unique identifier for the user" },
          source_lang: { type: "string", required: true, description: "Source language of the text" },
          target_langs: { type: "array", required: true, description: "Target languages for speech synthesis" },
          doc: { type: "string", required: true, description: "Text content to convert to speech" },
          title: { type: "string", required: true, description: "Title for the synthesis" }
        }
      }
    },
    {
      method: "POST",
      path: "/v1/audio/speech/stream",
      description: "Stream HTTP audio synthesis with ultra-low latency.",
      parameters: {
        type: "application/json",
        fields: {
          text: { type: "string", required: true, description: "Text content to convert to speech (e.g. 'Ugandan Jacob...')" },
          speaker_id: { type: "string", required: true, description: "The underlying speaker ID (e.g. 'pcm_female_4')" },
          temperature: { type: "float", required: false, description: "Generation randomness (default: 0.1)" }
        }
      }
    },
    {
      method: "WS",
      path: "/v1/audio/speech/stream/ws",
      description: "Real-time full-duplex WebSocket TTS generation.",
      parameters: {
        type: "websocket",
        fields: {
          input: { type: "string", required: true, description: "Text chunk to stream" },
          voice: { type: "string", required: true, description: "The underlying speaker ID" },
          temperature: { type: "float", required: false, description: "Algorithm variability" },
          segment_id: { type: "string", required: true, description: "Unique segment correlation ID" }
        }
      }
    },
    {
      method: "POST",
      path: "/v1/audio/speech/clone/upload",
      description: "Generate ad-hoc voice cloned audio from a reference audio file.",
      parameters: {
        type: "multipart/form-data-clone",
        fields: {
          reference_audio: { type: "file", required: true, description: "Clean audio recording of the speaker to clone" },
          text: { type: "string", required: true, description: "The target text to synthesize using the voice" },
          reference_text: { type: "string", required: false, description: "Transcript of the reference audio" },
          temperature: { type: "float", required: false, description: "Randomness (default 0.7)" }
        }
      }
    }
  ],
  'Voice to Voice': [
    {
      method: "POST",
      path: "/voice_translation",
      description: "Translate voice content to another language.",
      parameters: {
        type: "multipart/form-data",
        fields: {
          user_id: {
            type: "string",
            required: true,
            description: "Unique identifier for the user"
          },
          source_lang: {
            type: "string",
            required: true,
            description: "Source language of the voice"
          },
          target_langs: {
            type: "array",
            required: true,
            description: "Target languages for voice translation"
          },
          audio_file: {
            type: "file",
            required: true,
            description: "Audio file for voice translation"
          }
        }
      }
    }
  ],
  'Summarization': [
    {
      method: "POST",
      path: "/surmarize",
      description: "Summarize text content.",
      parameters: {
        type: "multipart/form-data",
        fields: {
          user_id: {
            type: "string",
            required: true,
            description: "Unique identifier for the user"
          },
          source_lang: {
            type: "string",
            required: true,
            description: "Source language of the text"
          },
          doc: {
            type: "string",
            required: true,
            description: "Text content to summarize"
          }
        }
      }
    },
    {
      method: "POST",
      path: "/summarize_document",
      description: "Summarize document content.",
      parameters: {
        type: "multipart/form-data",
        fields: {
          user_id: {
            type: "string",
            required: true,
            description: "Unique identifier for the user"
          },
          source_lang: {
            type: "string",
            required: true,
            description: "Source language of the document"
          },
          file: {
            type: "file",
            required: true,
            description: "Document file to summarize"
          }
        }
      }
    }
  ],
  'History & Analytics': [
    {
      method: "POST",
      path: "/get_translations",
      description: "Retrieve all translations for a user.",
      parameters: {
        user_id: "string"
      }
    },
    {
      method: "POST",
      path: "/get_translation",
      description: "Retrieve a specific translation.",
      parameters: {
        doc_id: "string"
      }
    },
    {
      method: "POST",
      path: "/get_voices",
      description: "Retrieve all voice translations for a user.",
      parameters: {
        user_id: "string"
      }
    },
    {
      method: "POST",
      path: "/get_ttsvoice",
      description: "Retrieve a specific voice translation.",
      parameters: {
        doc_id: "string"
      }
    }
  ],
};

const ParameterCard = ({ name, details }) => (
  <Card 
    variant="outlined" 
    sx={{ 
      mb: 2,
      position: 'relative',
      '&:hover': {
        borderColor: '#f59e0b',
        backgroundColor: alpha('#f59e0b', 0.02),
      },
      transition: 'all 0.2s ease-in-out',
      borderRadius: '12px',
      border: '1px solid rgba(245, 158, 11, 0.1)',
    }}
  >
    <CardContent>
      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
        <Typography variant="subtitle1" fontWeight="bold" color="#f59e0b">
          {name}
        </Typography>
        <Chip
          label={details.required ? 'Required' : 'Optional'}
          color={details.required ? 'primary' : 'default'}
          size="small"
          sx={{ 
            fontWeight: 500,
            backgroundColor: details.required ? alpha('#f59e0b', 0.1) : alpha('#666666', 0.1),
            color: details.required ? '#f59e0b' : '#666666',
          }}
        />
        <Chip
          label={details.type}
          variant="outlined"
          size="small"
          sx={{ 
            borderColor: '#f59e0b',
            color: '#f59e0b',
          }}
        />
      </Stack>
      <Typography 
        variant="body2" 
        color="text.secondary"
        sx={{
          lineHeight: 1.6,
          maxWidth: '90%',
        }}
      >
        {details.description}
      </Typography>
    </CardContent>
  </Card>
);

const ParametersSection = ({ parameters }) => {
  if (!parameters) return null;

  if (parameters.type && parameters.type.includes("multipart") && parameters.fields) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Content-Type: {parameters.type}
        </Typography>
        {Object.entries(parameters.fields).map(([fieldName, fieldDetails]) => (
          <ParameterCard
            key={fieldName}
            name={fieldName}
            details={fieldDetails}
          />
        ))}
      </Box>
    );
  }

  if (parameters.type === "application/json" || parameters.type === "websocket") {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Content-Type: {parameters.type}
        </Typography>
        {Object.entries(parameters.fields).map(([fieldName, fieldDetails]) => (
          <ParameterCard
            key={fieldName}
            name={fieldName}
            details={fieldDetails}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      {Object.entries(parameters).map(([paramName, paramType]) => (
        <ParameterCard
          key={paramName}
          name={paramName}
          details={{ type: paramType, required: true, description: `${paramName} parameter` }}
        />
      ))}
    </Box>
  );
};

const generateCodeSnippets = (endpoint) => {
  const baseUrl = (process.env.REACT_APP_API_URL || 'https://api.phosaico.com').replace(/\/$/, '');
  const isJson = endpoint.parameters?.type === "application/json";
  const isWs = endpoint.parameters?.type === "websocket";
  const isClone = endpoint.parameters?.type === "multipart/form-data-clone";

  let curlExample, pythonExample, javascriptExample;

  if (isWs) {
    const wsUrl = baseUrl.replace('http', 'ws');
    curlExample = `# Not supported natively via cURL
# Try using wscat:
wscat -c "${wsUrl}${endpoint.path}"`;

    pythonExample = `import asyncio
import websockets
import json
import wave

async def generate_speech():
    uri = "${wsUrl}${endpoint.path}"
    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({
            "input": "Your target text",
            "voice": "lug_female_8",
            "temperature": 0.1,
            "segment_id": "test_ws"
        }))
        audio_data = bytearray()
        while True:
            message = await ws.recv()
            if isinstance(message, bytes):
                audio_data.extend(message)
            else:
                data = json.loads(message)
                if data.get("type") == "end": break
        with wave.open("out.wav", "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000)
            w.writeframes(bytes(audio_data))

asyncio.run(generate_speech())`;

    javascriptExample = `const socket = new WebSocket("${wsUrl}${endpoint.path}");
socket.onopen = () => {
    socket.send(JSON.stringify({
        input: "Target text", voice: "lug_female_8", temperature: 0.1, segment_id: "test"
    }));
};
socket.onmessage = async (e) => {
    if (e.data instanceof Blob) {
        console.log("Received audio chunk:", e.data.size);
    } else {
        const ctl = JSON.parse(await e.data);
        if(ctl.type === 'end') console.log('Finished streaming');
    }
};`;

  } else if (isJson) {
    curlExample = `curl -X POST "${baseUrl}${endpoint.path}" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"Hello World","speaker_id":"pcm_female_4","temperature":0.1}' \\
  --output test_output.wav`;

    pythonExample = `import requests

url = "${baseUrl}${endpoint.path}"
payload = {
    "text": "Hello World",
    "speaker_id": "pcm_female_4",
    "temperature": 0.1
}
with requests.post(url, json=payload, stream=True) as response:
    with open("test.wav", "wb") as f:
        for chunk in response.iter_content(8192):
            f.write(chunk)`;

    javascriptExample = `fetch("${baseUrl}${endpoint.path}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({text: "Hello World", speaker_id: "pcm_female_4", temperature: 0.1})
})
.then(res => res.blob())
.then(blob => {
  const audioUrl = URL.createObjectURL(blob);
  new Audio(audioUrl).play();
});`;

  } else if (isClone) {
    curlExample = `curl -X POST "${baseUrl}${endpoint.path}" \\
  -H "Content-Type: multipart/form-data" \\
  -F "reference_audio=@audio_sample.wav" \\
  -F "text=Hello World" \\
  -F "temperature=0.8" \\
  --output clone.wav`;

    pythonExample = `import requests

url = "${baseUrl}${endpoint.path}"
files = {'reference_audio': open('audio_sample.wav', 'rb')}
data = {'text': 'Hello World', 'temperature': 0.8}

response = requests.post(url, files=files, data=data, stream=True)
with open("clone.wav", "wb") as f:
    for chunk in response.iter_content(8192):
        f.write(chunk)`;

    javascriptExample = `const formData = new FormData();
formData.append('reference_audio', fileInput.files[0]);
formData.append('text', 'Hello World');
formData.append('temperature', 0.8);

fetch('${baseUrl}${endpoint.path}', {
  method: 'POST',
  body: formData
})
.then(res => res.blob())
.then(blob => console.log('Received audio blob:', blob));`;

  } else {
    // Default form data
    curlExample = `curl -X POST "${baseUrl}${endpoint.path}" \\
  -H "Content-Type: multipart/form-data" \\
  -F "user_id=your_user_id" \\
  -F "source_lang=en" \\
  -F "target_langs=lg" \\
  -F "doc=Hello World"`;

    pythonExample = `import requests

url = "${baseUrl}${endpoint.path}"
files = {
    'user_id': (None, 'your_user_id'),
    'source_lang': (None, 'en'),
    'target_langs': (None, 'lg'),
    'doc': (None, 'Hello World')
}

response = requests.post(url, files=files)
print(response.json())`;

    javascriptExample = `const formData = new FormData();
formData.append('user_id', 'your_user_id');
formData.append('source_lang', 'en');
formData.append('target_langs', 'lg');
formData.append('doc', 'Hello World');

fetch('${baseUrl}${endpoint.path}', {
  method: 'POST',
  body: formData
})
.then(res => res.json())
.then(data => console.log(data));`;
  }

  return { curl: curlExample, python: pythonExample, javascript: javascriptExample };
};

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`code-tabpanel-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <SyntaxHighlighter
        language={language}
        style={atomDark}
        customStyle={{
          margin: 0,
          borderRadius: '12px',
          padding: '16px',
        }}
      >
        {code}
      </SyntaxHighlighter>
      <Tooltip title={copied ? "Copied!" : "Copy to clipboard"} placement="top">
        <IconButton
          onClick={handleCopy}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: '#111111',
            backgroundColor: 'rgba(245, 158, 11, 0.8)',
            '&:hover': {
              backgroundColor: '#f59e0b',
            },
          }}
        >
          <ContentCopyIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

const Documentation = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeEndpoint, setActiveEndpoint] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const scrollToEndpoint = (endpointPath) => {
    const element = document.getElementById(endpointPath.replace(/\//g, '_'));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActiveEndpoint(endpointPath);
    if (!isDesktop) {
      setDrawerOpen(false);
    }
  };

  const languages = ['curl', 'python', 'javascript'];

  const NavigationContent = () => (
    <Box sx={{ height: '100%', overflowY: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#f59e0b' }}>
        API Services
      </Typography>
      <List sx={{ py: 0 }}>
        {Object.entries(categorizedEndpoints).map(([category, endpoints]) => (
          <React.Fragment key={category}>
            <ListSubheader
              sx={{
                bgcolor: 'rgba(245, 158, 11, 0.05)',
                fontWeight: 'bold',
                color: '#f59e0b',
                borderRadius: '8px',
                mb: 1,
              }}
            >
              {category}
            </ListSubheader>
            {endpoints.map((endpoint) => (
              <ListItem
                key={endpoint.path}
                button
                selected={activeEndpoint === endpoint.path}
                onClick={() => scrollToEndpoint(endpoint.path)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    color: '#f59e0b',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(245, 158, 11, 0.05)',
                  },
                }}
              >
                <ListItemText
                  primary={endpoint.path}
                  secondary={endpoint.description}
                  primaryTypographyProps={{
                    variant: 'body2',
                    sx: { fontWeight: 'medium' },
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    sx: { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
                  }}
                />
              </ListItem>
            ))}
            <Divider sx={{ my: 2, borderColor: 'rgba(245, 158, 11, 0.1)' }} />
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  return (
      <Box sx={{ 
        display: 'flex', 
        minHeight: '100vh', 
        background: 'transparent',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Floating background elements */}
        <FloatingElement size="120px" position={{ top: '10%', left: '5%' }} delay="0s" />
        <FloatingElement size="80px" position={{ top: '60%', left: '10%' }} delay="1s" color="#d97706" />
        <FloatingElement size="100px" position={{ top: '20%', right: '15%' }} delay="0.5s" />
        <FloatingElement size="60px" position={{ bottom: '30%', right: '5%' }} delay="1.5s" color="#fbbf24" />
        <FloatingElement size="140px" position={{ bottom: '10%', left: '20%' }} delay="2s" />
        
        {/* Main gradient overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: 'radial-gradient(ellipse at center, rgba(245, 158, 11, 0.1) 0%, transparent 70%)',
            zIndex: 1,
          }}
        />

        <Container maxWidth="xl" sx={{ mt: 4, mb: 4, position: 'relative', zIndex: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={9}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', background: 'rgba(17, 17, 17, 0.95)', backdropFilter: 'blur(10px)' }}>
                <Box sx={{mb:5, p:4}}>
                  <Box sx={{mb:4}}>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 700, 
                        mb: 2,
                        background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #b45309 100%)',
                        backgroundSize: '200% 200%',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        animation: isVisible ? `${shimmer} 3s ease-in-out infinite` : 'none',
                        transform: isVisible ? 'translateY(0)' : 'translateY(50px)',
                        opacity: isVisible ? 1 : 0,
                        transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      Avoices API Documentation
                    </Typography>
                    <Typography 
                      sx={{ 
                        color: '#666666', 
                        mb: 6, 
                        fontSize: '1.1rem', 
                        lineHeight: 1.6,
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                        transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
                      }}
                    >
                      Welcome to our comprehensive API suite for multilingual content processing. This documentation provides detailed information about our REST APIs that enable powerful translation, transcription, and content transformation capabilities.
                    </Typography>
                    
                    <Stack sx={{ mb: 6 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#f59e0b', mb: 2 }}>
                        Core Features
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {['Text Translation', 'Voice to Text', 'Video Transcription', 'Text Summarization', 'Text to Speech', 'Voice Translation'].map((feature, index) => (
                          <Chip 
                            key={feature}
                            label={feature} 
                            sx={{ 
                              backgroundColor: 'rgba(245, 158, 11, 0.1)', 
                              color: '#f59e0b',
                              animation: `${slideUp} 0.6s ease-out forwards`,
                              animationDelay: `${index * 0.1}s`,
                              opacity: 0,
                            }} 
                          />
                        ))}
                      </Box>
                    </Stack>
                  </Box>
                </Box>
                
                {Object.entries(categorizedEndpoints).map(([category, endpoints]) => (
                  <Box key={category} sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#f59e0b' }}>
                      {category}
                    </Typography>
                    <List sx={{ py: 0 }}>
                      {endpoints.map((endpoint, index) => (
                        <Accordion
                           key={index}
                           id={endpoint.path.replace(/\//g, '_')}
                           sx={{ mb: 2, borderRadius: '12px !important' }}
                        >
                          <AccordionSummary 
                            expandIcon={<ExpandMoreIcon sx={{ color: '#f59e0b' }} />}
                            sx={{
                              backgroundColor: 'rgba(245, 158, 11, 0.02)',
                              borderRadius: '12px',
                              '&:hover': {
                                backgroundColor: 'rgba(245, 158, 11, 0.05)',
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              <Chip 
                                label={endpoint.method}
                                color="primary"
                                size="small"
                                sx={{ mr: 2, fontWeight: 'bold', backgroundColor: '#f59e0b' }}
                              />
                              <Typography variant="subtitle1" sx={{ fontWeight: 'medium', color: '#f59e0b' }}>
                                {endpoint.path}
                              </Typography>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Typography variant="body1" paragraph sx={{ color: '#666666' }}>
                              {endpoint.description}
                            </Typography>
                            
                            <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: 'bold', color: '#f59e0b' }}>
                              Parameters
                            </Typography>
                            <ParametersSection parameters={endpoint.parameters} />

                            <Typography variant="h6" gutterBottom sx={{ mt: 3, fontWeight: 'bold', color: '#f59e0b' }}>
                              Code Examples
                            </Typography>
                            <Box sx={{ borderBottom: 1, borderColor: 'rgba(245, 158, 11, 0.1)', mb: 2 }}>
                              <Tabs 
                                value={selectedTab}
                                onChange={handleTabChange}
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{
                                  '& .MuiTab-root': {
                                    color: '#666666',
                                    fontWeight: 600,
                                    '&.Mui-selected': {
                                      color: '#f59e0b',
                                    },
                                  },
                                  '& .MuiTabs-indicator': {
                                    backgroundColor: '#f59e0b',
                                  },
                                }}
                              >
                                {languages.map((lang, i) => (
                                  <Tab 
                                    key={i}
                                    label={lang.toUpperCase()}
                                    sx={{ textTransform: 'uppercase', fontWeight: 'medium' }}
                                  />
                                ))}
                              </Tabs>
                            </Box>
                            
                            {languages.map((lang, i) => (
                              <TabPanel key={i} value={selectedTab} index={i}>
                                <CodeBlock
                                  code={generateCodeSnippets(endpoint)[lang]}
                                  language={lang}
                                />
                              </TabPanel>
                            ))}
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </List>
                  </Box>
                ))}
              </Paper>
            </Grid>

            {/* Desktop Navigation */}
            {isDesktop && (
              <Grid item lg={3}>
                <Paper
                  elevation={0}
                  sx={{
                    position: 'sticky',
                    top: 16,
                    p: 2,
                    borderRadius: '16px',
                    maxHeight: 'calc(100vh - 32px)',
                    overflowY: 'auto',
                    backgroundColor: 'rgba(17, 17, 17, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(245, 158, 11, 0.1)',
                  }}
                >
                  <NavigationContent />
                </Paper>
              </Grid>
            )}
          </Grid>

          {/* Mobile Navigation */}
          {!isDesktop && (
            <>
              <Fab
                color="primary"
                aria-label="menu"
                onClick={() => setDrawerOpen(true)}
                sx={{
                  position: 'fixed',
                  bottom: 16,
                  right: 16,
                  backgroundColor: '#f59e0b',
                  '&:hover': {
                    backgroundColor: '#d97706',
                  },
                }}
              >
                <MenuIcon />
              </Fab>
              <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
              >
                <NavigationContent />
              </Drawer>
            </>
          )}
        </Container>
      </Box>
  );
};

export default Documentation;