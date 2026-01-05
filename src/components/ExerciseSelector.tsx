import { useState, useEffect } from 'react';
import { getAllExercises, createExercise } from '@/db/exercises';
import type { Exercise } from '@/db/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ExerciseForm } from '@/components/exercises/ExerciseForm';

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
  const [newExerciseWeightUnit, setNewExerciseWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [newExerciseSteps, setNewExerciseSteps] = useState('1');

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
    setNewExerciseWeightUnit('kg');
    setNewExerciseSteps('1');
    setShowCreateForm(true);
  };

  const handleCreateNew = async () => {
    if (!newExerciseName.trim()) return;

    const steps = parseFloat(newExerciseSteps);
    if (isNaN(steps) || steps <= 0) {
      alert('Steps must be a positive number');
      return;
    }

    try {
      const newExercise = await createExercise({
        name: newExerciseName.trim(),
        description: newExerciseDescription.trim() || undefined,
        bodyPart: newExerciseBodyPart.trim() || undefined,
        weightUnit: newExerciseWeightUnit,
        steps: steps,
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
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      {exercise.bodyPart && (
                        <>
                          <span>{exercise.bodyPart}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{exercise.weightUnit} / {exercise.steps} step</span>
                    </div>
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
          <div className="mt-2">
            <ExerciseForm
              name={newExerciseName}
              bodyPart={newExerciseBodyPart}
              weightUnit={newExerciseWeightUnit}
              steps={newExerciseSteps}
              description={newExerciseDescription}
              onNameChange={setNewExerciseName}
              onBodyPartChange={setNewExerciseBodyPart}
              onWeightUnitChange={setNewExerciseWeightUnit}
              onStepsChange={setNewExerciseSteps}
              onDescriptionChange={setNewExerciseDescription}
              autoFocusName={true}
            />
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
