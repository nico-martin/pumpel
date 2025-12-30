import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllExercises, updateExercise, deleteExercise } from '@/db/exercises';
import { getSetsByExerciseId } from '@/db/sets';
import { getUser } from '@/db/user';
import type { Exercise } from '@/db/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Trash2, Edit, ChevronLeft } from 'lucide-react';

const BODY_PARTS = [
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Legs',
  'Core',
  'Cardio',
  'Full Body',
];

export function ExercisesPage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editName, setEditName] = useState('');
  const [editBodyPart, setEditBodyPart] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    loadExercises();
    loadUserName();
  }, []);

  const loadUserName = async () => {
    const user = await getUser();
    if (user) {
      setUserName(user.name);
    }
  };

  const loadExercises = async () => {
    try {
      setLoading(true);
      const allExercises = await getAllExercises();
      setExercises(allExercises);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setEditName(exercise.name);
    setEditBodyPart(exercise.bodyPart || '');
    setEditDescription(exercise.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingExercise || !editName.trim()) return;

    try {
      await updateExercise(editingExercise.id, {
        name: editName.trim(),
        bodyPart: editBodyPart.trim() || undefined,
        description: editDescription.trim() || undefined,
      });
      setEditingExercise(null);
      await loadExercises();
    } catch (error) {
      console.error('Error updating exercise:', error);
    }
  };

  const handleDeleteClick = async (exerciseId: string) => {
    // Check if exercise is used in any sets
    const sets = await getSetsByExerciseId(exerciseId);
    if (sets.length > 0) {
      setDeleteError(`Cannot delete this exercise. It is used in ${sets.length} set(s).`);
      setDeleteConfirmId(exerciseId);
      return;
    }

    setDeleteError(null);
    setDeleteConfirmId(exerciseId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId || deleteError) return;

    try {
      await deleteExercise(deleteConfirmId);
      setDeleteConfirmId(null);
      await loadExercises();
    } catch (error) {
      console.error('Error deleting exercise:', error);
    }
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
      <div className="flex items-center gap-2 mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Exercises</h1>
      </div>
      <p className="text-muted-foreground mb-6 ml-12">{userName}'s exercise library</p>

      {exercises.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No exercises yet, {userName}. Create one during a training session.
        </p>
      ) : (
        <div className="space-y-3">
          {exercises.map((exercise) => (
            <Card key={exercise.id} size="sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-0.5">
                    <span>{exercise.name}</span>
                    {exercise.bodyPart && (
                      <span className="text-xs text-muted-foreground font-normal">
                        {exercise.bodyPart}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => handleEditClick(exercise)}
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="destructive"
                      onClick={() => handleDeleteClick(exercise.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              {exercise.description && (
                <CardContent>
                  <p className="text-xs text-muted-foreground">{exercise.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <AlertDialog open={!!editingExercise} onOpenChange={() => setEditingExercise(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Exercise</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1 text-left">
                Name
              </label>
              <Input
                placeholder="Exercise name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1 text-left">
                Body Part
              </label>
              <Select value={editBodyPart} onValueChange={setEditBodyPart}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select body part" />
                </SelectTrigger>
                <SelectContent>
                  {BODY_PARTS.map((part) => (
                    <SelectItem key={part} value={part}>
                      {part}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1 text-left">
                Description (optional)
              </label>
              <Textarea
                placeholder="Exercise instructions or notes..."
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveEdit}>
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteError ? 'Cannot Delete Exercise' : 'Delete Exercise'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError || 'Are you sure you want to delete this exercise? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {deleteError ? (
              <AlertDialogAction onClick={() => setDeleteConfirmId(null)}>
                OK
              </AlertDialogAction>
            ) : (
              <>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">
                  Delete
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
