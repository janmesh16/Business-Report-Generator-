import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { PrintReportPage } from './pages/PrintReportPage';
import { HistoryPage } from './pages/HistoryPage';
import { SharedReportPage } from './pages/SharedReportPage';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isPrintRoute = location.pathname.includes('/print');

  return (
    <div className="min-h-screen flex flex-col bg-earth-bg text-earth-text">
      {!isPrintRoute && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/reports" element={<HistoryPage />} />
          <Route path="/reports/:id" element={<DashboardPage />} />
          <Route path="/reports/:id/print" element={<PrintReportPage />} />
          <Route path="/r/:token" element={<SharedReportPage />} />
        </Routes>
      </main>
      {!isPrintRoute && <Footer />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;

