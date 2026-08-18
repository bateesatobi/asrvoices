import React, { useState, useEffect, useRef } from 'react';
import { BASE_URL } from '../services/api';

/**
 * Async Transcription Upload Component
 * 
 * Handles video/audio uploads with background processing and real-time progress tracking.
 * Uses job polling to show progress without blocking the UI.
 */
const AsyncTranscriptionUpload = ({ userId, fileType = 'video', onComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(null);
  
  // Job tracking
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [jobDetails, setJobDetails] = useState(null);
  
  // Polling
  const pollIntervalRef = useRef(null);
  
  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setCompleted(false);
    }
  };
  
  const startJobPolling = (jobId) => {
    // Poll every 2 seconds
    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/jobs/${jobId}?user_id=${userId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to get job status: ${response.status}`);
        }
        
        const jobData = await response.json();
        setJobDetails(jobData);
        setProgress(jobData.progress || 0);
        setProgressMessage(jobData.progress_message || '');
        
        // Check if job is complete
        if (jobData.status === 'completed') {
          clearInterval(pollIntervalRef.current);
          setProcessing(false);
          setCompleted(true);
          
          if (onComplete) {
            onComplete(jobData.result);
          }
        } else if (jobData.status === 'failed') {
          clearInterval(pollIntervalRef.current);
          setProcessing(false);
          setError(jobData.error || 'Transcription failed');
        }
      } catch (err) {
        console.error('Polling error:', err);
        // Don't stop polling on transient errors
      }
    }, 2000);
  };
  
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append(fileType === 'video' ? 'video_file' : 'audio_file', file);
      formData.append('user_id', userId);
      formData.append('source_lang', 'en'); // TODO: Make this configurable
      formData.append('response_format', 'json');
      
      const endpoint = fileType === 'video' 
        ? '/extract_audio_from_video/async' 
        : '/upload_audio/async';
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }
      
      const data = await response.json();
      
      // Upload complete, now process in background
      setUploading(false);
      setProcessing(true);
      setJobId(data.job_id);
      setProgress(0);
      setProgressMessage('Starting transcription...');
      
      // Start polling for job status
      startJobPolling(data.job_id);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
      setUploading(false);
    }
  };
  
  const handleCancel = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    setProcessing(false);
    setProgress(0);
    setProgressMessage('');
    setJobId(null);
  };
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  return (
    <div className="async-transcription-upload" style={styles.container}>
      <h3 style={styles.title}>
        Upload {fileType === 'video' ? 'Video' : 'Audio'} for Transcription
      </h3>
      
      {/* File Selection */}
      {!uploading && !processing && !completed && (
        <div style={styles.uploadSection}>
          <input
            type="file"
            accept={fileType === 'video' ? 'video/*' : 'audio/*'}
            onChange={handleFileChange}
            style={styles.fileInput}
          />
          
          {file && (
            <div style={styles.fileInfo}>
              <p><strong>Selected:</strong> {file.name}</p>
              <p><strong>Size:</strong> {formatFileSize(file.size)}</p>
            </div>
          )}
          
          <button
            onClick={handleUpload}
            disabled={!file}
            style={{
              ...styles.button,
              ...(! file ? styles.buttonDisabled : {})
            }}
          >
            Upload and Transcribe
          </button>
        </div>
      )}
      
      {/* Uploading State */}
      {uploading && (
        <div style={styles.statusSection}>
          <div style={styles.spinner}></div>
          <p style={styles.statusText}>Uploading {file.name}...</p>
          <p style={styles.statusSubtext}>Please wait, this may take a moment</p>
        </div>
      )}
      
      {/* Processing State with Progress */}
      {processing && (
        <div style={styles.statusSection}>
          <div style={styles.progressContainer}>
            <div style={{...styles.progressBar, width: `${progress}%`}}></div>
            <span style={styles.progressText}>{progress}%</span>
          </div>
          
          <p style={styles.statusText}>{progressMessage || 'Processing...'}</p>
          
          {jobDetails && (
            <div style={styles.jobDetails}>
              <p><small>Job ID: {jobId}</small></p>
              <p><small>Status: {jobDetails.status}</small></p>
            </div>
          )}
          
          <button
            onClick={handleCancel}
            style={{...styles.button, ...styles.buttonSecondary}}
          >
            Cancel
          </button>
        </div>
      )}
      
      {/* Completed State */}
      {completed && jobDetails && (
        <div style={styles.statusSection}>
          <div style={styles.successIcon}>✓</div>
          <p style={styles.statusText}>Transcription Complete!</p>
          
          {jobDetails.result && (
            <div style={styles.resultInfo}>
              <p><strong>Document ID:</strong> {jobDetails.result.doc_id}</p>
              <p><strong>Title:</strong> {jobDetails.result.title}</p>
              {jobDetails.result.transcript_length && (
                <p><strong>Length:</strong> {jobDetails.result.transcript_length} characters</p>
              )}
              {jobDetails.result.segments_count && (
                <p><strong>Segments:</strong> {jobDetails.result.segments_count}</p>
              )}
            </div>
          )}
          
          <button
            onClick={() => {
              setFile(null);
              setCompleted(false);
              setJobDetails(null);
              setJobId(null);
            }}
            style={styles.button}
          >
            Upload Another File
          </button>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div style={styles.errorSection}>
          <p style={styles.errorText}>❌ {error}</p>
          <button
            onClick={() => {
              setError(null);
              setUploading(false);
              setProcessing(false);
            }}
            style={styles.button}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

// Styles
const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  title: {
    marginBottom: '20px',
    color: '#333',
    textAlign: 'center'
  },
  uploadSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  fileInput: {
    padding: '10px',
    border: '2px dashed #ccc',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  fileInfo: {
    padding: '10px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    border: '1px solid #e0e0e0'
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s'
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  buttonSecondary: {
    backgroundColor: '#6c757d'
  },
  statusSection: {
    textAlign: 'center',
    padding: '20px'
  },
  spinner: {
    width: '50px',
    height: '50px',
    margin: '0 auto 20px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  progressContainer: {
    position: 'relative',
    width: '100%',
    height: '30px',
    backgroundColor: '#e0e0e0',
    borderRadius: '15px',
    overflow: 'hidden',
    marginBottom: '15px'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#28a745',
    transition: 'width 0.5s ease',
    borderRadius: '15px'
  },
  progressText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontWeight: 'bold',
    color: '#333'
  },
  statusText: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px'
  },
  statusSubtext: {
    fontSize: '14px',
    color: '#666'
  },
  jobDetails: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    border: '1px solid #e0e0e0'
  },
  successIcon: {
    fontSize: '60px',
    color: '#28a745',
    marginBottom: '15px'
  },
  resultInfo: {
    textAlign: 'left',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
    marginBottom: '20px'
  },
  errorSection: {
    textAlign: 'center',
    padding: '20px'
  },
  errorText: {
    color: '#dc3545',
    fontSize: '16px',
    marginBottom: '15px'
  }
};

// Add CSS animation for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default AsyncTranscriptionUpload;
