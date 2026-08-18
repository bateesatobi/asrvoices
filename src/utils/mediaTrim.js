/** Client-side audio trim helpers (fallback when server trim unavailable). */

function encodeWav(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const samples = audioBuffer.length;
  const blockAlign = (numChannels * bitDepth) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i += 1) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  const channels = [];
  for (let i = 0; i < numChannels; i += 1) channels.push(audioBuffer.getChannelData(i));

  for (let i = 0; i < samples; i += 1) {
    for (let ch = 0; ch < numChannels; ch += 1) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export async function fetchMediaArrayBuffer(url) {
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) throw new Error('Could not fetch media for trimming');
  return response.arrayBuffer();
}

export async function trimAudioClientSide(url, startSec, endSec) {
  const arrayBuffer = await fetchMediaArrayBuffer(url);
  const audioCtx = new AudioContext();
  try {
    const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    const sampleRate = decoded.sampleRate;
    const startSample = Math.max(0, Math.floor(startSec * sampleRate));
    const endSample = Math.min(decoded.length, Math.floor(endSec * sampleRate));
    const length = Math.max(0, endSample - startSample);
    const sliced = audioCtx.createBuffer(decoded.numberOfChannels, length, sampleRate);
    for (let ch = 0; ch < decoded.numberOfChannels; ch += 1) {
      sliced.copyToChannel(
        decoded.getChannelData(ch).subarray(startSample, endSample),
        ch
      );
    }
    return encodeWav(sliced);
  } finally {
    await audioCtx.close();
  }
}

export function downloadBlobFile(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename || 'trimmed.wav';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}

export function guessMediaExtension(url, video = false) {
  if (!url) return video ? '.mp4' : '.mp3';
  const lower = url.split('?')[0].toLowerCase();
  if (lower.endsWith('.wav')) return '.wav';
  if (lower.endsWith('.mp3')) return '.mp3';
  if (lower.endsWith('.m4a')) return '.m4a';
  if (lower.endsWith('.webm')) return '.webm';
  if (lower.endsWith('.mov')) return '.mov';
  if (lower.endsWith('.mp4')) return '.mp4';
  return video ? '.mp4' : '.mp3';
}

export function formatTrimLabel(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 10);
  return `${m}:${String(s).padStart(2, '0')}.${ms}`;
}
