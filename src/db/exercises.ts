import { getDB } from './init';
import { generateUUID, getCurrentTimestamp } from './utils';
import type { Exercise, ExerciseInput } from './types';

// Create a new exercise
export async function createExercise(input: ExerciseInput): Promise<Exercise> {
  const db = await getDB();
  const exercise: Exercise = {
    ...input,
    id: generateUUID(),
    createdAt: getCurrentTimestamp(),
  };
  await db.add('exercises', exercise);
  return exercise;
}

// Get an exercise by ID
export async function getExercise(id: string): Promise<Exercise | undefined> {
  const db = await getDB();
  return db.get('exercises', id);
}

// Get an exercise by name
export async function getExerciseByName(name: string): Promise<Exercise | undefined> {
  const db = await getDB();
  return db.getFromIndex('exercises', 'name', name);
}

// Get all exercises
export async function getAllExercises(): Promise<Exercise[]> {
  const db = await getDB();
  return db.getAll('exercises');
}

// Update an exercise
export async function updateExercise(id: string, updates: Partial<ExerciseInput>): Promise<Exercise> {
  const db = await getDB();
  const existing = await db.get('exercises', id);
  if (!existing) {
    throw new Error(`Exercise with id ${id} not found`);
  }
  const updated: Exercise = {
    ...existing,
    ...updates,
  };
  await db.put('exercises', updated);
  return updated;
}

// Delete an exercise
export async function deleteExercise(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('exercises', id);
}

// Check if an exercise name exists
export async function exerciseNameExists(name: string): Promise<boolean> {
  const exercise = await getExerciseByName(name);
  return !!exercise;
}
