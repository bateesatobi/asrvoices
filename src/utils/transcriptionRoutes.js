/** Map a completed background job to its result detail route. */
export function transcriptionResultPath(job) {
  const docId = job?.result?.doc_id || job?.job_id;
  if (!docId) return null;

  const type = String(job?.job_type || '').toLowerCase();
  if (type === 'video_transcription' || type === 'transcribe_video') {
    return `/dashboard/video/${docId}`;
  }
  return `/dashboard/audio/${docId}`;
}

export function transcriptionResultPathForMedia(docId, mediaType = 'audio') {
  if (!docId) return null;
  return mediaType === 'video'
    ? `/dashboard/video/${docId}`
    : `/dashboard/audio/${docId}`;
}
