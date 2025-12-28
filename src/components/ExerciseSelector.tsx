import { useState, useEffect, useMemo } from 'react';
import { getAllExercises, createExercise } from '@/db/exercises';
import type { Exercise } from '@/db/types';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox';

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void;
  placeholder?: string;
}

export function ExerciseSelector({ onSelect, placeholder = 'Search exercises...' }: ExerciseSelectorProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    const allExercises = await getAllExercises();
    setExercises(allExercises);
  };

  const filteredExercises = useMemo(() => {
    if (!searchValue) return exercises;
    const lower = searchValue.toLowerCase();
    return exercises.filter((ex) => ex.name.toLowerCase().includes(lower));
  }, [exercises, searchValue]);

  const handleCreateNew = async () => {
    if (!searchValue.trim()) return;

    try {
      const newExercise = await createExercise({
        name: searchValue.trim(),
      });
      setExercises((prev) => [...prev, newExercise]);
      setSelectedValue(newExercise.id);
      onSelect(newExercise);
      setSearchValue('');
    } catch (error) {
      console.error('Error creating exercise:', error);
    }
  };

  const handleSelectExercise = (exerciseId: string | null) => {
    setSelectedValue(exerciseId);
    if (exerciseId) {
      const exercise = exercises.find((ex) => ex.id === exerciseId);
      if (exercise) {
        onSelect(exercise);
        setSearchValue('');
      }
    }
  };

  const showCreateOption = searchValue.trim() && !filteredExercises.some(
    (ex) => ex.name.toLowerCase() === searchValue.toLowerCase()
  );

  return (
    <Combobox
      value={selectedValue}
      onValueChange={handleSelectExercise}
      onSearchChange={setSearchValue}
      searchValue={searchValue}
    >
      <ComboboxInput placeholder={placeholder} showClear showTrigger />
      <ComboboxContent>
        <ComboboxList>
          <ComboboxEmpty>No exercises found</ComboboxEmpty>
          {showCreateOption && (
            <ComboboxItem value={`create-${searchValue}`} onSelect={handleCreateNew}>
              Create &quot;{searchValue}&quot;
            </ComboboxItem>
          )}
          {filteredExercises.map((exercise) => (
            <ComboboxItem key={exercise.id} value={exercise.id}>
              {exercise.name}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
