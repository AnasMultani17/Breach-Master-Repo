import React, { useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

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

  const styles = {
    container: { fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' },
    main: { padding: '50px 20px', maxWidth: '800px', margin: '0 auto' },
    card: { backgroundColor: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)' },
    dropzone: (isIdle) => ({
      border: '3px dashed #3498db',
      borderRadius: '15px',
      padding: '50px',
      textAlign: 'center',
      backgroundColor: '#f8fbff',
      cursor: isIdle ? 'pointer' : 'not-allowed',
      marginBottom: '30px',
      transition: 'all 0.3s ease'
    }),
    input: { width: '100%', padding: '15px', marginBottom: '20px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '18px', boxSizing: 'border-box' },
    btn: { width: '100%', padding: '18px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer' },
    statusBox: (s) => ({
      marginTop: '25px', padding: '20px', borderRadius: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px',
      backgroundColor: s === 'success' ? '#d4edda' : s === 'error' ? '#f8d7da' : '#e1f5fe',
      color: s === 'success' ? '#155724' : s === 'error' ? '#721c24' : '#01579b'
    })
  };

  return (
    <div style={styles.container}>
      <Navbar />
      <main style={styles.main}>
        <div style={styles.card}>
          <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '10px' }}>Upload PDF</h1>
          <p style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: '40px' }}>Upload a PDF. It will be stored in Cloudinary and you will get the PDF URL.</p>

          <form onSubmit={handleProcess}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Job Role (optional)</label>
            <input 
              style={styles.input} 
              placeholder="e.g. Senior Software Engineer" 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              disabled={status === 'processing'}
            />

            <div 
              style={styles.dropzone(status === 'idle' || status === 'error')}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => (status === 'idle' || status === 'error') && document.getElementById('fileIn').click()}
            >
              <input id="fileIn" type="file" hidden accept=".pdf" onChange={(e) => { setFile(e.target.files[0]); setStatus('idle'); }} />
              <div style={{ fontSize: '60px', marginBottom: '15px' }}>{file ? '📄' : '📁'}</div>
              <h3 style={{ margin: 0 }}>{file ? file.name : "Drag & Drop Resume PDF here"}</h3>
              <p style={{ color: '#95a5a6', marginTop: '10px' }}>Max file size: 5MB</p>
            </div>

            <button type="submit" style={styles.btn} disabled={status === 'processing'}>
              {status === 'processing' ? 'Uploading...' : 'Upload PDF'}
            </button>
          </form>

          {status !== 'idle' && (
            <div style={styles.statusBox(status)}>
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