import React, { useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './UploadPage.css';

const API_BASE = 'http://localhost:8080/api/v1/users';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('idle'); // idle, processing, success, error
  const [progressMsg, setProgressMsg] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  // --- DRAG & DROP HANDLERS ---
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setStatus('idle');
    } else {
      alert("Please upload a PDF file.");
    }
  };

  const handleProcess = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a PDF file.");

    try {
      setStatus('processing');
      setPdfUrl('');
      setProgressMsg('Uploading PDF to Cloudinary...');

      const formData = new FormData();
      formData.append('pdfFile', file);
      if (role) formData.append('appliedRole', role);

      const res = await axios.post(`${API_BASE}/upload-manual`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data || {};
      const url = data.pdfUrl || data.cloudinaryUrl || '';
      setPdfUrl(url);
      setStatus('success');
      setProgressMsg(data.message || 'PDF uploaded. URL stored.');
      setFile(null);
      setRole('');
    } catch (err) {
      console.error("Upload Error:", err);
      setStatus('error');
      const data = err.response?.data;
      setProgressMsg(data?.message || data?.error || "Upload failed. Check backend and .env.");
    }
  };

  const isInteractive = status === 'idle' || status === 'error';

  return (
    <div className="up-page">
      <Navbar />
      <main className="up-main">
        <div className="up-card">
          <h1 className="up-title">Upload PDF</h1>
          <p className="up-subtitle">Upload a PDF. It will be stored in Cloudinary and you will get the PDF URL.</p>

          <form onSubmit={handleProcess}>
            <label className="up-label">Job Role (optional)</label>
            <input
              className="up-input"
              placeholder="e.g. Senior Software Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={status === 'processing'}
            />

            <div
              className={`up-dropzone${!isInteractive ? ' disabled' : ''}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => isInteractive && document.getElementById('fileIn').click()}
            >
              <input id="fileIn" type="file" hidden accept=".pdf" onChange={(e) => { setFile(e.target.files[0]); setStatus('idle'); }} />
              <span className="up-dropzone-icon">{file ? '📄' : '📁'}</span>
              <div className="up-dropzone-text">{file ? file.name : "Drag & Drop Resume PDF here"}</div>
              <div className="up-dropzone-hint">Max file size: 5MB</div>
            </div>

            <button type="submit" className="up-submit" disabled={status === 'processing'}>
              {status === 'processing' ? 'Uploading...' : 'Upload PDF'}
            </button>
          </form>

          {status !== 'idle' && (
            <div className={`up-status up-status--${status}`}>
              {status === 'processing' && "⏳ "}{progressMsg}
              {status === 'success' && pdfUrl && (
                <div style={{ marginTop: 12, wordBreak: 'break-all', fontSize: 14 }}>
                  <strong>PDF URL:</strong><br /><a href={pdfUrl} target="_blank" rel="noopener noreferrer">{pdfUrl}</a>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UploadPage;