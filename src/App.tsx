import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StartScreen } from '@/components/StartScreen';
import { ExercisesPage } from '@/components/ExercisesPage';
import { StatsPage } from '@/components/StatsPage';
import { AccountPage } from '@/components/AccountPage';
import { TrainingPage } from '@/pages/TrainingPage';
import { Navigation } from '@/components/Navigation';
import { NameSetupModal } from '@/components/NameSetupModal';
import { PWAUpdatePrompt } from '@/components/PWAUpdatePrompt';
import { getUser, saveUser } from '@/db/user';

export function App() {
  const [showNameSetup, setShowNameSetup] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const user = await getUser();
      setShowNameSetup(!user);
    } catch (error) {
      console.error('Error checking user:', error);
      setShowNameSetup(true);
    } finally {
      setIsCheckingUser(false);
    }
  };

  const handleSaveName = async (name: string) => {
    try {
      await saveUser({ name });
      setShowNameSetup(false);
    } catch (error) {
      console.error('Error saving user name:', error);
      alert('Failed to save your name. Please try again.');
    }
  };

  if (isCheckingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <NameSetupModal open={showNameSetup} onSave={handleSaveName} />
      <PWAUpdatePrompt />
      <div className="mx-auto max-w-2xl">
        <Navigation />
        <Routes>
          <Route path="/" element={<StartScreen />} />
          <Route path="/training/:id" element={<TrainingPage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;