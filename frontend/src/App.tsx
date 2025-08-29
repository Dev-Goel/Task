import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import MeetingDetail from "./pages/MeetingDetail";
import MeetingDetailPage from './pages/MeetingDetailPage';
import ExecutiveSummaryPage from './pages/ExecutiveSummaryPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/meeting/:id" element={<MeetingDetail />} />
        <Route path="/meeting/:id/detail" element={<MeetingDetailPage />} />
        <Route path="/meeting/:id/summary" element={<ExecutiveSummaryPage />} />
      </Routes>
    </BrowserRouter>
  );
}
