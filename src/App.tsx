import { useState, useEffect } from 'react';
import { StartScreen } from '@/components/StartScreen';
import { ExercisesPage } from '@/components/ExercisesPage';
import { StatsPage } from '@/components/StatsPage';
import { AccountPage } from '@/components/AccountPage';
import { Navigation } from '@/components/Navigation';
import { NameSetupModal } from '@/components/NameSetupModal';
import { PWAUpdatePrompt } from '@/components/PWAUpdatePrompt';
import { getUser, saveUser } from '@/db/user';

type Page = 'training' | 'exercises' | 'stats' | 'account';

export function App() {
  const [currentPage, setCurrentPage] = useState<Page>('training');
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
    <>
      <NameSetupModal open={showNameSetup} onSave={handleSaveName} />
      <PWAUpdatePrompt />
      <div className="mx-auto max-w-2xl">
        <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
        {currentPage === 'training' && <StartScreen />}
        {currentPage === 'exercises' && <ExercisesPage />}
        {currentPage === 'stats' && <StatsPage />}
        {currentPage === 'account' && <AccountPage />}
      </div>
    </>
  );
}

export default App;