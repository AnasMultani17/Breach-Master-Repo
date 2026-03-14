import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { HiOutlineArrowPath } from 'react-icons/hi2';
import Navbar from '../components/Navbar';
import CandidateCard from '../components/CandidateCard';
import { useToast } from '../components/Toast';
import './AllCandidates.css';

const API = 'http://localhost:8080';

export default function AllCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const toast = useToast();

  const fetchCandidates = async () => {
    try {
      const res = await axios.get(`${API}/api/v1/users/resumes`);
      setCandidates(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchCandidates(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    toast.info('Syncing data sources...');
    try {
      try { await axios.get(`${API}/api/candidates/sync`); } catch {}
      try { await axios.get(`${API}/api/candidates/sync-hrms`); } catch {}
      await fetchCandidates();
      toast.success('Data synced successfully!');
    } catch {
      toast.error('Sync failed');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        {/* Header */}
        <div className="section-header">
          <div>
            <h1 className="section-title">Global Talent Pool</h1>
            <p className="section-subtitle">
              {loading ? 'Loading...' : `${candidates.length} candidate${candidates.length !== 1 ? 's' : ''} in your database`}
            </p>
          </div>
          <motion.button
            className={`btn btn-ghost ${refreshing ? 'btn-spinning' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <HiOutlineArrowPath className={refreshing ? 'icon-spin' : ''} size={18} />
            {refreshing ? 'Syncing...' : 'Sync Sources'}
          </motion.button>
        </div>

        {/* Candidate Grid */}
        {loading ? (
          <div className="grid-candidates">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <div className="empty-state-title">No candidates yet</div>
            <div className="empty-state-text">
              Upload resumes or sync from Gmail/HRMS to start building your talent pool.
            </div>
          </div>
        ) : (
          <div className="grid-candidates">
            {candidates.map((c, i) => (
              <CandidateCard key={c._id} candidate={c} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
