import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDB } from '@/db/init';
import { getAllExercises } from '@/db/exercises';
import { getAllTrainings } from '@/db/trainings';
import { getAllSets } from '@/db/sets';
import { getAllRounds } from '@/db/rounds';
import { getUser, updateUserName } from '@/db/user';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor, ChevronLeft } from 'lucide-react';

export function AccountPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [userName, setUserName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [dbInfo, setDbInfo] = useState<{
    createdAt: number | null;
    exerciseCount: number;
    trainingCount: number;
    setCount: number;
    roundCount: number;
  }>({
    createdAt: null,
    exerciseCount: 0,
    trainingCount: 0,
    setCount: 0,
    roundCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [user, exercises, trainings, sets, rounds] = await Promise.all([
        getUser(),
        getAllExercises(),
        getAllTrainings(),
        getAllSets(),
        getAllRounds(),
      ]);

      if (user) {
        setUserName(user.name);
      }

      // Get the earliest createdAt timestamp across all data
      const allTimestamps = [
        ...exercises.map((e) => e.createdAt),
        ...trainings.map((t) => t.createdAt),
        ...sets.map((s) => s.createdAt),
        ...rounds.map((r) => r.createdAt),
      ];

      const earliestTimestamp = allTimestamps.length > 0 ? Math.min(...allTimestamps) : null;

      setDbInfo({
        createdAt: earliestTimestamp,
        exerciseCount: exercises.length,
        trainingCount: trainings.length,
        setCount: sets.length,
        roundCount: rounds.length,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditName = () => {
    setNewName(userName);
    setEditingName(true);
  };

  const handleSaveName = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      alert('Name cannot be empty.');
      return;
    }

    try {
      await updateUserName(trimmedName);
      setUserName(trimmedName);
      setEditingName(false);
    } catch (error) {
      console.error('Error updating name:', error);
      alert('Failed to update name. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingName(false);
    setNewName('');
  };

  const handleExport = async () => {
    try {
      const [user, exercises, trainings, sets, rounds] = await Promise.all([
        getUser(),
        getAllExercises(),
        getAllTrainings(),
        getAllSets(),
        getAllRounds(),
      ]);

      const exportData = {
        version: 2,
        exportedAt: Date.now(),
        data: {
          user,
          exercises,
          trainings,
          sets,
          rounds,
        },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pumpel-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setImportFile(file);
        setShowImportConfirm(true);
      }
    };
    input.click();
  };

  const handleImportConfirm = async () => {
    if (!importFile) return;

    try {
      const text = await importFile.text();
      const importData = JSON.parse(text);

      if (!importData.version || !importData.data) {
        alert('Invalid backup file format.');
        return;
      }

      const db = await getDB();
      const tx = db.transaction(['user', 'exercises', 'trainings', 'sets', 'rounds'], 'readwrite');

      // Clear existing data
      await Promise.all([
        tx.objectStore('user').clear(),
        tx.objectStore('exercises').clear(),
        tx.objectStore('trainings').clear(),
        tx.objectStore('sets').clear(),
        tx.objectStore('rounds').clear(),
      ]);

      // Import new data
      const { user, exercises, trainings, sets, rounds } = importData.data;

      const promises = [
        ...exercises.map((e: any) => tx.objectStore('exercises').add(e)),
        ...trainings.map((t: any) => tx.objectStore('trainings').add(t)),
        ...sets.map((s: any) => tx.objectStore('sets').add(s)),
        ...rounds.map((r: any) => tx.objectStore('rounds').add(r)),
      ];

      // Add user if present in backup
      if (user) {
        promises.push(tx.objectStore('user').add(user));
      }

      await Promise.all(promises);

      await tx.done;

      setShowImportConfirm(false);
      setImportFile(null);
      await loadData();
      alert('Data imported successfully!');
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Error importing data. Please check the file and try again.');
    }
  };

  const handleDeleteAll = async () => {
    try {
      const db = await getDB();
      const tx = db.transaction(['exercises', 'trainings', 'sets', 'rounds'], 'readwrite');

      await Promise.all([
        tx.objectStore('exercises').clear(),
        tx.objectStore('trainings').clear(),
        tx.objectStore('sets').clear(),
        tx.objectStore('rounds').clear(),
      ]);

      await tx.done;

      setShowDeleteConfirm(false);
      await loadData();
      alert('All data deleted successfully!');
    } catch (error) {
      console.error('Error deleting data:', error);
      alert('Error deleting data. Please try again.');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pt-5">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Account</h1>
      </div>

      {/* User Profile */}
      <Card size="sm" className="mb-6">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {editingName ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newName.trim()) {
                      handleSaveName();
                    } else if (e.key === 'Escape') {
                      handleCancelEdit();
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveName} disabled={!newName.trim()} className="flex-1">
                  Save
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Name</p>
                <p className="font-medium">{userName}</p>
              </div>
              <Button onClick={handleEditName} variant="outline" size="sm">
                Edit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card size="sm" className="mb-6">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className="flex items-center justify-center gap-2"
              >
                <Sun className="size-4" />
                <span>Light</span>
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className="flex items-center justify-center gap-2"
              >
                <Moon className="size-4" />
                <span>Dark</span>
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                onClick={() => setTheme('system')}
                className="flex items-center justify-center gap-2"
              >
                <Monitor className="size-4" />
                <span>System</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card size="sm" className="mb-6">
        <CardHeader>
          <CardTitle>About Pumpel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">100% Local</strong> - All your data is stored
              locally in your browser using IndexedDB.
            </p>
            <p>
              <strong className="text-foreground">No Cloud</strong> - Your workout data never
              leaves your device.
            </p>
            <p>
              <strong className="text-foreground">No Server</strong> - This app runs entirely in
              your browser.
            </p>
            <p>
              <strong className="text-foreground">No Cost</strong> - Free forever, no subscriptions
              or hidden fees.
            </p>
            <p>
              <strong className="text-foreground">Open Source</strong> - Available on{' '}
              <a
                href="https://github.com/nico-martin/pumpel"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub
              </a>{' '}
              under MIT license.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Database Info */}
      <Card size="sm" className="mb-6">
        <CardHeader>
          <CardTitle>Database Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dbInfo.createdAt && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">First Data Entry</span>
                <span className="font-medium">{formatDate(dbInfo.createdAt)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Exercises</span>
              <span className="font-medium">{dbInfo.exerciseCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Trainings</span>
              <span className="font-medium">{dbInfo.trainingCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sets</span>
              <span className="font-medium">{dbInfo.setCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rounds</span>
              <span className="font-medium">{dbInfo.roundCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button variant="outline" className="w-full" onClick={handleExport}>
              Export Database
            </Button>
            <Button variant="outline" className="w-full" onClick={handleImportClick}>
              Import Database
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Confirmation */}
      <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import Database</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all existing data with the data from the backup file. This action
              cannot be undone. Make sure you have a backup of your current data before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setImportFile(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportConfirm}>Import</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Data</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all data? This will permanently remove all exercises,
              trainings, sets, and rounds. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} variant="destructive">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
