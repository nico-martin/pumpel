import { getDB } from './init';
import { generateUUID, getCurrentTimestamp } from './utils';
import type { Training, TrainingInput } from './types';

// Create a new training session
export async function createTraining(input: TrainingInput): Promise<Training> {
  const db = await getDB();
  const training: Training = {
    ...input,
    id: generateUUID(),
    createdAt: getCurrentTimestamp(),
  };
  await db.add('trainings', training);
  return training;
}

// Get a training by ID
export async function getTraining(id: string): Promise<Training | undefined> {
  const db = await getDB();
  return db.get('trainings', id);
}

// Get all trainings
export async function getAllTrainings(): Promise<Training[]> {
  const db = await getDB();
  return db.getAll('trainings');
}

// Get trainings ordered by start time (most recent first)
export async function getTrainingsByStartTime(limit?: number): Promise<Training[]> {
  const db = await getDB();
  const tx = db.transaction('trainings', 'readonly');
  const index = tx.store.index('startTime');

  let trainings = await index.getAll();
  trainings.sort((a, b) => b.startTime - a.startTime); // DESC order

  if (limit) {
    trainings = trainings.slice(0, limit);
  }

  return trainings;
}

// Get trainings within a date range
export async function getTrainingsByDateRange(
  startDate: number,
  endDate: number
): Promise<Training[]> {
  const db = await getDB();
  const tx = db.transaction('trainings', 'readonly');
  const index = tx.store.index('startTime');

  const trainings = await index.getAll(IDBKeyRange.bound(startDate, endDate));
  return trainings.sort((a, b) => b.startTime - a.startTime);
}

// Update a training
export async function updateTraining(id: string, updates: Partial<TrainingInput>): Promise<Training> {
  const db = await getDB();
  const existing = await db.get('trainings', id);
  if (!existing) {
    throw new Error(`Training with id ${id} not found`);
  }
  const updated: Training = {
    ...existing,
    ...updates,
  };
  await db.put('trainings', updated);
  return updated;
}

// Delete a training
export async function deleteTraining(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('trainings', id);
}

// Get the current active training (one that has started but not ended)
export async function getActiveTraining(): Promise<Training | null> {
  const db = await getDB();
  const allTrainings = await db.getAll('trainings');
  const now = getCurrentTimestamp();

  // Find training where startTime <= now and (endTime is 0 or endTime > now)
  const activeTraining = allTrainings.find(
    (training) => training.startTime <= now && (training.endTime === 0 || training.endTime > now)
  );

  return activeTraining || null;
}
