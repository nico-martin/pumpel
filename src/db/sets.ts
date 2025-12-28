import { getDB } from './init';
import { generateUUID, getCurrentTimestamp } from './utils';
import type { Set, SetInput } from './types';

// Create a new set
export async function createSet(input: SetInput): Promise<Set> {
  const db = await getDB();
  const set: Set = {
    ...input,
    id: generateUUID(),
    createdAt: getCurrentTimestamp(),
  };
  await db.add('sets', set);
  return set;
}

// Get a set by ID
export async function getSet(id: string): Promise<Set | undefined> {
  const db = await getDB();
  return db.get('sets', id);
}

// Get all sets for a training
export async function getSetsByTrainingId(trainingId: string): Promise<Set[]> {
  const db = await getDB();
  const sets = await db.getAllFromIndex('sets', 'trainingId', trainingId);
  return sets.sort((a, b) => a.orderInTraining - b.orderInTraining);
}

// Get all sets for an exercise (across all trainings)
export async function getSetsByExerciseId(exerciseId: string): Promise<Set[]> {
  const db = await getDB();
  return db.getAllFromIndex('sets', 'exerciseId', exerciseId);
}

// Get sets for a specific exercise in a specific training
export async function getSetsByExerciseAndTraining(
  exerciseId: string,
  trainingId: string
): Promise<Set[]> {
  const db = await getDB();
  const sets = await db.getAllFromIndex('sets', 'exerciseId-trainingId', [exerciseId, trainingId]);
  return sets.sort((a, b) => a.orderInTraining - b.orderInTraining);
}

// Update a set
export async function updateSet(id: string, updates: Partial<SetInput>): Promise<Set> {
  const db = await getDB();
  const existing = await db.get('sets', id);
  if (!existing) {
    throw new Error(`Set with id ${id} not found`);
  }
  const updated: Set = {
    ...existing,
    ...updates,
  };
  await db.put('sets', updated);
  return updated;
}

// Delete a set
export async function deleteSet(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sets', id);
}

// Delete all sets for a training
export async function deleteSetsByTrainingId(trainingId: string): Promise<void> {
  const db = await getDB();
  const sets = await getSetsByTrainingId(trainingId);
  const tx = db.transaction('sets', 'readwrite');
  await Promise.all(sets.map((set) => tx.store.delete(set.id)));
  await tx.done;
}
