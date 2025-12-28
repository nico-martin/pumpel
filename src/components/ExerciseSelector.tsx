import { useState, useEffect } from 'react';
import { getAllExercises, createExercise } from '@/db/exercises';
import type { Exercise } from '@/db/types';
import { Button } from '@/components/ui/button';
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

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void;
  placeholder?: string;
}

export function ExerciseSelector({ onSelect, placeholder = 'Search or create exercise...' }: ExerciseSelectorProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseDescription, setNewExerciseDescription] = useState('');
  const [newExerciseBodyPart, setNewExerciseBodyPart] = useState('');

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    const allExercises = await getAllExercises();
    setExercises(allExercises);
  };

  const filteredExercises = searchValue
    ? exercises.filter((ex) => ex.name.toLowerCase().includes(searchValue.toLowerCase()))
    : exercises;

  const exactMatch = exercises.find(
    (ex) => ex.name.toLowerCase() === searchValue.toLowerCase()
  );

  const handleOpenCreateForm = () => {
    setNewExerciseName(searchValue.trim());
    setNewExerciseDescription('');
    setNewExerciseBodyPart('');
    setShowCreateForm(true);
  };

  const handleCreateNew = async () => {
    if (!newExerciseName.trim()) return;

    try {
      const newExercise = await createExercise({
        name: newExerciseName.trim(),
        description: newExerciseDescription.trim() || undefined,
        bodyPart: newExerciseBodyPart.trim() || undefined,
      });
      setExercises((prev) => [...prev, newExercise]);
      onSelect(newExercise);
      setSearchValue('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating exercise:', error);
    }
  };

  const handleSelectExercise = (exercise: Exercise) => {
    onSelect(exercise);
    setSearchValue('');
  };

  return (
    <>
      <div className="space-y-3">
        <Input
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          autoFocus
        />

        {searchValue.trim() && !exactMatch && (
          <Button
            onClick={handleOpenCreateForm}
            variant="outline"
            className="w-full justify-start"
          >
            Create &quot;{searchValue.trim()}&quot;
          </Button>
        )}

        <div className="space-y-1 max-h-64 overflow-y-auto">
          {filteredExercises.length > 0 ? (
            filteredExercises.map((exercise) => (
              <div key={exercise.id} className="w-full">
                <Button
                  onClick={() => handleSelectExercise(exercise)}
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <span>{exercise.name}</span>
                    {exercise.bodyPart && (
                      <span className="text-xs text-muted-foreground">
                        {exercise.bodyPart}
                      </span>
                    )}
                  </div>
                </Button>
              </div>
            ))
          ) : searchValue && !exactMatch ? null : (
            <p className="text-xs text-muted-foreground text-center py-4">
              No exercises yet. Start typing to create one.
            </p>
          )}
        </div>
      </div>

      <AlertDialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Exercise</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1 text-left">
                Name
              </label>
              <Input
                placeholder="Exercise name"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1 text-left">
                Body Part
              </label>
              <Select value={newExerciseBodyPart} onValueChange={setNewExerciseBodyPart}>
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
                value={newExerciseDescription}
                onChange={(e) => setNewExerciseDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateNew}>
              Create
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
