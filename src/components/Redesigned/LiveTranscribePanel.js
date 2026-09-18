import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Typography, IconButton, Stack } from '@mui/material';
import { Mic, Stop, DeleteOutline, GraphicEq } from '@mui/icons-material';
import ElevenLabsButton from '../ElevenLabsUI/ElevenLabsButton';
import { realtimeTranscribeWsUrl } from '../../services/api';
import { DEFAULT_ASR_LANG, toAsrLang } from '../../constants/asrLanguages';

const SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4096;

/** Linear resample Float32 PCM to a target rate (always send 16 kHz to ASR). */
function downsampleToRate(floatSamples, inputRate, outputRate = SAMPLE_RATE) {
  if (!floatSamples?.length) return floatSamples;
  if (!inputRate || Math.abs(inputRate - outputRate) < 1) {
    return floatSamples;
  }
  const ratio = inputRate / outputRate;
  const outLength = Math.max(1, Math.floor(floatSamples.length / ratio));
  const output = new Float32Array(outLength);
  for (let i = 0; i < outLength; i += 1) {
    const srcIndex = i * ratio;
    const i0 = Math.floor(srcIndex);
    const i1 = Math.min(i0 + 1, floatSamples.length - 1);
    const t = srcIndex - i0;
    output[i] = floatSamples[i0] * (1 - t) + floatSamples[i1] * t;
  }
  return output;
}

function floatTo16BitPCM(floatSamples) {
  const buffer = new ArrayBuffer(floatSamples.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < floatSamples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, floatSamples[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(buffer);
}

function eventText(event) {
  return String(
    event?.text
    || event?.transcript
    || event?.partial
    || event?.final
    || event?.result
    || ''
  ).trim();
}

function isSpeechStart(event) {
  return event?.type === 'recording_start' || event?.event === 'speech_started';
}

function isSpeechStop(event) {
  return event?.type === 'recording_stop' || event?.event === 'speech_stopped';
}

function isInterim(event) {
  if (event?.is_final === true || event?.speech_final === true) return false;
  return (
    event?.type === 'realtime'
    || event?.type === 'partial'
    || event?.type === 'interim'
    || (Boolean(eventText(event)) && event?.is_final === false)
  );
}

function isFinal(event) {
  return (
    event?.type === 'fullSentence'
    || event?.type === 'final'
    || event?.is_final === true
    || event?.speech_final === true
  );
}

export default function LiveTranscribePanel({
  language = DEFAULT_ASR_LANG,
  silenceDuration = 0.5,
  vadSensitivity = 0.4,
}) {
  const [status, setStatus] = useState('idle');
  const [statusText, setStatusText] = useState('Click the microphone to start live recognition');
  const [interim, setInterim] = useState('');
  const [finals, setFinals] = useState([]);
  const [error, setError] = useState('');

  const socketRef = useRef(null);
  const audioRef = useRef({
    context: null,
    stream: null,
    processor: null,
    input: null,
    analyser: null,
    gain: null,
  });
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const readyRef = useRef(false);
  const languageRef = useRef(toAsrLang(language));
  const silenceRef = useRef(silenceDuration);
  const vadRef = useRef(vadSensitivity);
  const interimRef = useRef('');

  languageRef.current = toAsrLang(language);
  silenceRef.current = silenceDuration;
  vadRef.current = vadSensitivity;

  const sendJson = useCallback((payload) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  }, []);

  const stopVisualizer = useCallback(() => {
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
    const w = canvas.width / ratio;
    const h = canvas.height / ratio;
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, w, h);
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.strokeStyle = '#E8A020';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, []);

  const drawVisualizer = useCallback(() => {
    const analyser = audioRef.current.analyser;
    const canvas = canvasRef.current;
    if (!drawingRef.current || !analyser || !canvas) return;
    const ctx = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
    const w = canvas.width / ratio;
    const h = canvas.height / ratio;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, w, h);
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, '#E8A020');
    gradient.addColorStop(1, '#F5C451');
    ctx.lineWidth = 2;
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    const sliceWidth = w / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i += 1) {
      const v = dataArray[i] / 128.0;
      const y = (v * h) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    requestAnimationFrame(drawVisualizer);
  }, []);

  const stopMic = useCallback(() => {
    drawingRef.current = false;
    const audio = audioRef.current;
    if (audio.processor) {
      audio.processor.disconnect();
      audio.processor.onaudioprocess = null;
    }
    if (audio.gain) audio.gain.disconnect();
    if (audio.input) audio.input.disconnect();
    if (audio.stream) audio.stream.getTracks().forEach((track) => track.stop());
    if (audio.context) audio.context.close().catch(() => {});
    audioRef.current = {
      context: null,
      stream: null,
      processor: null,
      input: null,
      analyser: null,
      gain: null,
    };
    stopVisualizer();
  }, [stopVisualizer]);

  const closeSocket = useCallback(() => {
    const socket = socketRef.current;
    socketRef.current = null;
    readyRef.current = false;
    if (socket && socket.readyState < 2) {
      try {
        socket.close();
      } catch (_) {
        /* ignore */
      }
    }
  }, []);

  const handleServerEvent = useCallback((event) => {
    if (!event || typeof event !== 'object') return;
    if (event.source === 'control' || event.type === 'ready') return;
    if (event.type === 'error') {
      setError(event.message || 'ASR connection error');
      setStatus('error');
      return;
    }

    const now = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    if (isSpeechStart(event)) {
      setInterim('Listening…');
      interimRef.current = '';
      return;
    }
    if (isInterim(event)) {
      const text = eventText(event);
      if (text) {
        interimRef.current = text;
        setInterim(text);
      }
      return;
    }
    if (isSpeechStop(event)) {
      return;
    }
    if (isFinal(event)) {
      let finalText = eventText(event);
      const prev = (interimRef.current || '').trim();
      if (prev && prev !== 'Listening…') {
        const prevWords = prev.split(/\s+/).filter(Boolean).length;
        const eventWords = finalText.split(/\s+/).filter(Boolean).length;
        if (prevWords > eventWords + 2) finalText = prev;
      }
      if (finalText) {
        setFinals((rows) => [...rows, { text: finalText, at: now }]);
      }
      setInterim('');
      interimRef.current = '';
      return;
    }
    // Fallback: any payload with text updates interim so unknown schemas still show.
    const fallback = eventText(event);
    if (fallback) {
      interimRef.current = fallback;
      setInterim(fallback);
    }
  }, []);

  const startMic = useCallback(async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: true,
      },
    });
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    let audioContext;
    try {
      audioContext = new AudioContextClass({ sampleRate: SAMPLE_RATE });
    } catch (_) {
      audioContext = new AudioContextClass();
    }
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const input = audioContext.createMediaStreamSource(mediaStream);
    input.connect(analyser);

    const processor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);
    const gain = audioContext.createGain();
    gain.gain.value = 0;
    input.connect(processor);
    processor.connect(gain);
    gain.connect(audioContext.destination);

    const inputRate = audioContext.sampleRate || SAMPLE_RATE;
    processor.onaudioprocess = (e) => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN || !readyRef.current) return;
      const samples = e.inputBuffer.getChannelData(0);
      const pcm16k = downsampleToRate(samples, inputRate, SAMPLE_RATE);
      socket.send(floatTo16BitPCM(pcm16k));
    };

    audioRef.current = {
      context: audioContext,
      stream: mediaStream,
      processor,
      input,
      analyser,
      gain,
    };

    const canvas = canvasRef.current;
    if (canvas) {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d').scale(ratio, ratio);
    }
    drawingRef.current = true;
    drawVisualizer();
    // Always advertise 16 kHz — we downsample before send regardless of AudioContext rate.
    sendJson({ type: 'config', sampleRate: SAMPLE_RATE, language: languageRef.current });
  }, [drawVisualizer, sendJson]);

  const disconnect = useCallback(() => {
    sendJson({ type: 'call_method', method: 'abort' });
    stopMic();
    closeSocket();
    setStatus('idle');
    setStatusText('Click the microphone to start live recognition');
  }, [closeSocket, sendJson, stopMic]);

  const connectAndListen = useCallback(async () => {
    setError('');
    setStatus('connecting');
    setStatusText('Connecting to speech recognition…');
    const lang = languageRef.current;
    const socket = new WebSocket(realtimeTranscribeWsUrl(lang, SAMPLE_RATE));
    socket.binaryType = 'arraybuffer';
    socketRef.current = socket;

    socket.onopen = () => {
      setStatusText('Waiting for ASR engine…');
    };

    socket.onmessage = (event) => {
      let payload = event.data;
      try {
        payload = JSON.parse(event.data);
      } catch (_) {
        return;
      }
      if (payload?.type === 'ready') {
        readyRef.current = true;
        sendJson({ type: 'config', sampleRate: SAMPLE_RATE, language: languageRef.current });
        sendJson({
          type: 'set_parameter',
          parameter: 'post_speech_silence_duration',
          value: Number(silenceRef.current),
        });
        sendJson({
          type: 'set_parameter',
          parameter: 'silero_sensitivity',
          value: Number(vadRef.current),
        });
        setStatus('live');
        setStatusText('Listening — speak now');
        return;
      }
      handleServerEvent(payload);
    };

    socket.onerror = () => {
      setError('Could not reach the realtime speech service');
      setStatus('error');
      setStatusText('Connection failed');
    };

    socket.onclose = () => {
      readyRef.current = false;
      stopMic();
      if (socketRef.current === socket) socketRef.current = null;
      setStatus((current) => (current === 'error' ? current : 'idle'));
      setStatusText('Click the microphone to start live recognition');
    };

    try {
      await startMic();
    } catch (err) {
      setError(err?.message || 'Microphone access was denied');
      setStatus('error');
      closeSocket();
    }
  }, [closeSocket, handleServerEvent, sendJson, startMic, stopMic]);

  const toggleLive = useCallback(() => {
    if (status === 'live' || status === 'connecting') {
      disconnect();
      return;
    }
    connectAndListen();
  }, [connectAndListen, disconnect, status]);

  useEffect(() => {
    if (status !== 'live') return;
    sendJson({ type: 'set_language', language: toAsrLang(language) });
  }, [language, sendJson, status]);

  useEffect(() => {
    if (status !== 'live') return;
    sendJson({
      type: 'set_parameter',
      parameter: 'post_speech_silence_duration',
      value: Number(silenceDuration),
    });
  }, [sendJson, silenceDuration, status]);

  useEffect(() => {
    if (status !== 'live') return;
    sendJson({
      type: 'set_parameter',
      parameter: 'silero_sensitivity',
      value: Number(vadSensitivity),
    });
  }, [sendJson, status, vadSensitivity]);

  useEffect(() => () => {
    stopMic();
    closeSocket();
  }, [closeSocket, stopMic]);

  useEffect(() => {
    stopVisualizer();
  }, [stopVisualizer]);

  const isLive = status === 'live' || status === 'connecting';

  return (
    <Box>
      <Stack alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <IconButton
          onClick={toggleLive}
          sx={{
            width: 72,
            height: 72,
            border: '1px solid',
            borderColor: isLive ? '#ef4444' : '#e8e8e8',
            bgcolor: isLive ? 'rgba(239,68,68,0.08)' : '#fff',
            '&:hover': { bgcolor: isLive ? 'rgba(239,68,68,0.12)' : '#fafafa' },
          }}
        >
          {isLive ? <Stop sx={{ color: '#ef4444' }} /> : <Mic sx={{ color: '#1a1a1a' }} />}
        </IconButton>
        <Typography sx={{ fontSize: '0.8125rem', color: '#666', fontWeight: 600, textAlign: 'center' }}>
          {statusText}
        </Typography>
        {error ? (
          <Typography sx={{ fontSize: '0.75rem', color: '#ef4444', textAlign: 'center' }}>{error}</Typography>
        ) : null}
      </Stack>

      <Box
        sx={{
          height: 72,
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1px solid #e8e8e8',
          bgcolor: '#111',
          mb: 2,
        }}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </Box>

      <Box
        sx={{
          minHeight: 220,
          maxHeight: 320,
          overflowY: 'auto',
          border: '1px solid #e8e8e8',
          borderRadius: '12px',
          p: 2,
          bgcolor: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
        }}
      >
        {!finals.length && !interim ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 5, color: '#999' }} spacing={1}>
            <GraphicEq sx={{ fontSize: 28, opacity: 0.5 }} />
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>No live transcripts yet</Typography>
            <Typography sx={{ fontSize: '0.75rem', maxWidth: 280, textAlign: 'center' }}>
              Connect and speak. Interim text appears as you talk; finals commit after a short silence.
            </Typography>
          </Stack>
        ) : null}

        {finals.map((row, index) => (
          <Box
            key={`${row.at}-${index}`}
            sx={{
              border: '1px solid rgba(34,197,94,0.25)',
              bgcolor: '#fff',
              borderRadius: '10px',
              p: 1.5,
            }}
          >
            <Typography sx={{ fontSize: '0.65rem', color: '#16a34a', fontWeight: 800, letterSpacing: '0.04em', mb: 0.5 }}>
              FINAL · {row.at}
            </Typography>
            <Typography sx={{ fontSize: '0.9375rem', color: '#1a1a1a', lineHeight: 1.55 }}>{row.text}</Typography>
          </Box>
        ))}

        {interim ? (
          <Box
            sx={{
              border: '1px solid rgba(232,160,32,0.35)',
              bgcolor: 'rgba(232,160,32,0.06)',
              borderRadius: '10px',
              p: 1.5,
            }}
          >
            <Typography sx={{ fontSize: '0.65rem', color: '#C47F10', fontWeight: 800, letterSpacing: '0.04em', mb: 0.5 }}>
              INTERIM
            </Typography>
            <Typography sx={{ fontSize: '0.9375rem', color: '#1a1a1a', lineHeight: 1.55 }}>{interim}</Typography>
          </Box>
        ) : null}
      </Box>

      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
        <ElevenLabsButton
          variant="outlined"
          disabled={!isLive}
          onClick={() => sendJson({ type: 'call_method', method: 'abort' })}
        >
          Abort speech
        </ElevenLabsButton>
        <ElevenLabsButton
          variant="outlined"
          startIcon={<DeleteOutline />}
          onClick={() => {
            setFinals([]);
            setInterim('');
            interimRef.current = '';
            sendJson({ type: 'call_method', method: 'clear_audio_queue' });
          }}
        >
          Clear
        </ElevenLabsButton>
      </Stack>
    </Box>
  );
}
