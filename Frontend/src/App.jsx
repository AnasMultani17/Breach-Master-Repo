import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import AllCandidates from "./pages/AllCandidates";
import JobBoard from "./pages/JobBoard";
import JobPortal from "./pages/JobPortal";
import UploadPage from "./pages/UploadPage";
import AiHub from "./pages/AiHub";
import ComparePage from "./pages/ComparePage";
import "./App.css";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />

        {/* Your clean, separated routes! */}
        <Route path="/dashboard" element={<AllCandidates />} />
        <Route path="/jobs" element={<JobBoard />} />
        <Route path="/portal" element={<JobPortal />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/ai-hub" element={<AiHub />} />
        <Route path="/compare" element={<ComparePage />} />

        {/* Catch-all: redirect back to home if page doesn't exist */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;