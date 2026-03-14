import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import AllCandidates from "./pages/AllCandidates";
import JobBoard from "./pages/JobBoard";
import JobPortal from "./pages/JobPortal";
import UploadPage from "./pages/UploadPage";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        
        {/* Your 3 clean, separated routes! */}
        <Route path="/dashboard" element={<AllCandidates />} />
        <Route path="/jobs" element={<JobBoard />} />
        <Route path="/portal" element={<JobPortal />} />
        <Route path="/upload" element={<UploadPage />} />

        {/* Catch-all: redirect back to home if page doesn't exist */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;