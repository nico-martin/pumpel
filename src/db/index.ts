// Main database export file
// This file provides a centralized access point for all database operations

// Database initialization
export { initDB, getDB, closeDB } from './init';
export type { WorkoutTrackerDB } from './init';

// Types
export type {
  Exercise,
  Training,
  Set,
  Round,
  ExerciseInput,
  TrainingInput,
  SetInput,
  RoundInput,
  SetWithExercise,
  SetWithRounds,
  TrainingWithDetails,
  ExerciseHistory,
} from './types';

// Exercise operations
export {
  createExercise,
  getExercise,
  getExerciseByName,
  getAllExercises,
  updateExercise,
  deleteExercise,
  exerciseNameExists,
} from './exercises';

// Training operations
export {
  createTraining,
  getTraining,
  getAllTrainings,
  getTrainingsByStartTime,
  getTrainingsByDateRange,
  updateTraining,
  deleteTraining,
} from './trainings';

// Set operations
export {
  createSet,
  getSet,
  getSetsByTrainingId,
  getSetsByExerciseId,
  getSetsByExerciseAndTraining,
  updateSet,
  deleteSet,
  deleteSetsByTrainingId,
} from './sets';

// Round operations
export {
  createRound,
  getRound,
  getRoundsBySetId,
  updateRound,
  deleteRound,
  deleteRoundsBySetId,
} from './rounds';

// Complex queries
export {
  getTrainingWithDetails,
  getExerciseHistory,
  getLastUsedWeightForExercise,
  addCompleteTraining,
} from './queries';
export type { CompleteTrainingInput } from './queries';

// Utilities
export { generateUUID, getCurrentTimestamp } from './utils';
