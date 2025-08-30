
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import Dashboard from './components/pages/Dashboard';
import SyllabusUploader from './components/pages/SyllabusUploader';
import StudyPlanner from './components/pages/StudyPlanner';
import AITutor from './components/pages/AITutor';
import ApiKeyBanner from './components/ui/ApiKeyBanner';

function App() {
  return (
    <AppProvider>
      <HashRouter>
        <div className="flex flex-col h-screen">
            <ApiKeyBanner />
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="syllabus" element={<SyllabusUploader />} />
                <Route path="plan" element={<StudyPlanner />} />
                <Route path="tutor" element={<AITutor />} />
              </Route>
            </Routes>
        </div>
      </HashRouter>
    </AppProvider>
  );
}

export default App;
