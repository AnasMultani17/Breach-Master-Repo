import { useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCloudArrowUp, HiOutlineDocument, HiOutlineCheckCircle,
  HiOutlineExclamationCircle, HiOutlineSparkles, HiOutlineUser
} from 'react-icons/hi2';
import Navbar from '../components/Navbar';
import { useToast } from '../components/Toast';
import './UploadPage.css';

const API = 'http://localhost:8080/api/v1/users';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('idle'); // idle, uploading, extracting, success, error
  const [pdfUrl, setPdfUrl] = useState('');
  const [candidate, setCandidate] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileRef = useRef(null);
  const toast = useToast();

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setStatus('idle');
    } else {
      toast.error('Only PDF files are accepted');
    }
  };

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setStatus('idle'); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a PDF file'); return; }
    setStatus('uploading');
    setPdfUrl('');
    setCandidate(null);

    try {
      const formData = new FormData();
      formData.append('pdfFile', file);
      if (role) formData.append('appliedRole', role);

      setStatus('extracting');

      const res = await axios.post(`${API}/upload-manual`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });

      const url = res.data?.pdfUrl || '';
      setPdfUrl(url);
      setCandidate(res.data?.candidate || null);
      setStatus('success');
      setFile(null);
      setRole('');
      toast.success(res.data?.extracted ? 'Resume extracted and saved!' : 'Resume uploaded (extraction pending)');
    } catch (err) {
      setStatus('error');
      toast.error(err.response?.data?.message || 'Upload failed');
    }
  };

  const resetForm = () => {
    setFile(null);
    setRole('');
    setStatus('idle');
    setPdfUrl('');
    setCandidate(null);
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        <div className="up-container">
          <motion.div
            className="up-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header */}
            <div className="up-header">
              <div className="up-icon-wrap">
                <HiOutlineCloudArrowUp size={32} />
              </div>
              <h1 className="up-title">Upload Resume</h1>
              <p className="up-subtitle">
                Upload a candidate's resume PDF — AI will extract data and add them to the database
              </p>
            </div>

            <form onSubmit={handleUpload} className="up-form">
              {/* Role Input */}
              <div className="up-field">
                <label>Job Role <span className="up-optional">(optional)</span></label>
                <input
                  className="input"
                  placeholder="e.g. Software Development"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={status === 'uploading' || status === 'extracting'}
                />
              </div>

              {/* Drag & Drop Zone */}
              <div
                className={`up-dropzone ${isDragOver ? 'up-dropzone-active' : ''} ${file ? 'up-dropzone-filled' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !['uploading', 'extracting'].includes(status) && fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  hidden
                  onChange={handleFileSelect}
                />

                {file ? (
                  <div className="up-file-info">
                    <div className="up-file-icon">
                      <HiOutlineDocument size={28} />
                    </div>
                    <div>
                      <p className="up-file-name">{file.name}</p>
                      <p className="up-file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="up-drop-icon">
                      <HiOutlineCloudArrowUp size={40} />
                    </div>
                    <p className="up-drop-title">Drag & Drop your PDF here</p>
                    <p className="up-drop-hint">or click to browse • Max 5MB</p>
                  </>
                )}
              </div>

              {/* Submit */}
              <motion.button
                className="btn btn-ai btn-lg"
                type="submit"
                disabled={['uploading', 'extracting'].includes(status) || !file}
                style={{ width: '100%' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {status === 'uploading' ? (
                  <><span className="spinner" /> Uploading to Cloud...</>
                ) : status === 'extracting' ? (
                  <><span className="spinner" /> <HiOutlineSparkles size={16} /> AI Extracting Data...</>
                ) : (
                  <><HiOutlineCloudArrowUp size={20} /> Upload & Extract</>
                )}
              </motion.button>
            </form>

            {/* Processing Pipeline Status */}
            <AnimatePresence>
              {(status === 'uploading' || status === 'extracting') && (
                <motion.div
                  className="up-pipeline"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className={`up-pipeline-step ${status === 'uploading' || status === 'extracting' ? 'done' : ''}`}>
                    <span className="up-pipeline-dot" /> Upload to Cloudinary
                  </div>
                  <div className={`up-pipeline-step ${status === 'extracting' ? 'active' : ''}`}>
                    <span className="up-pipeline-dot" /> AI Extracting Resume Data
                  </div>
                  <div className="up-pipeline-step">
                    <span className="up-pipeline-dot" /> Save to Database & Sync
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Result */}
            {status === 'success' && (
              <motion.div
                className="up-result up-result-success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <HiOutlineCheckCircle size={24} />
                <div className="up-result-content">
                  <p className="up-result-title">
                    {candidate ? '✅ Extracted & Saved!' : '☁️ Upload Successful!'}
                  </p>

                  {candidate && (
                    <div className="up-candidate-card">
                      <div className="up-candidate-row">
                        <HiOutlineUser size={14} />
                        <strong>{candidate.fullName || 'Unknown'}</strong>
                      </div>
                      {candidate.email && <p className="up-candidate-detail">📧 {candidate.email}</p>}
                      {candidate.applied_role && <p className="up-candidate-detail">💼 {candidate.applied_role}</p>}
                      {candidate.skills && candidate.skills.length > 0 && (
                        <div className="up-candidate-skills">
                          {candidate.skills.slice(0, 8).map((s, i) => (
                            <span key={i} className="badge">{s}</span>
                          ))}
                          {candidate.skills.length > 8 && (
                            <span className="badge badge-overflow">+{candidate.skills.length - 8}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {pdfUrl && (
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="up-result-link">
                      View uploaded PDF →
                    </a>
                  )}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={resetForm}>Upload Another</button>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                className="up-result up-result-error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <HiOutlineExclamationCircle size={24} />
                <div>
                  <p className="up-result-title">Upload Failed</p>
                  <p className="up-result-text">Check the backend server and try again</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={resetForm}>Try Again</button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
