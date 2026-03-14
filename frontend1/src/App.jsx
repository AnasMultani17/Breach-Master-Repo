import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import AllCandidates from "./pages/AllCandidates";
import JobBoard from "./pages/JobBoard";
import JobPortal from "./pages/JobPortal";
import UploadPage from "./pages/UploadPage";
import { ToastProvider } from "./components/Toast";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/dashboard" element={<AllCandidates />} />
          <Route path="/jobs" element={<JobBoard />} />
          <Route path="/portal" element={<JobPortal />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
