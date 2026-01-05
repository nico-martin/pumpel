// Type definitions for the workout tracker database

export interface Exercise {
  id: string; // UUID
  name: string;
  description?: string;
  type?: 'strength' | 'cardio' | 'flexibility' | string;
  bodyPart?: string; // e.g., "Chest", "Back", "Legs", etc.
  weightUnit: 'kg' | 'lb'; // Default: 'kg'
  steps: number; // Default: 1
  createdAt: number; // Unix timestamp
}

export interface Training {
  id: string; // UUID
  name?: string;
  warmUp?: string;
  calmDown?: string;
  startTime: number; // Unix timestamp
  endTime: number; // Unix timestamp
  notes?: string;
  createdAt: number; // Unix timestamp
}

export interface Set {
  id: string; // UUID
  trainingId: string;
  exerciseId: string;
  orderInTraining: number;
  restPeriod?: number; // seconds
  notes?: string;
  createdAt: number; // Unix timestamp
}

export interface Round {
  id: string; // UUID
  setId: string;
  orderInSet: number;
  weight: number; // kg or lbs
  reps: number;
  notes?: string;
  createdAt: number; // Unix timestamp
}

// Input types (without generated fields)
export type ExerciseInput = Omit<Exercise, 'id' | 'createdAt' | 'weightUnit' | 'steps'> & {
  weightUnit?: 'kg' | 'lb';
  steps?: number;
};
export type TrainingInput = Omit<Training, 'id' | 'createdAt'>;
export type SetInput = Omit<Set, 'id' | 'createdAt'>;
export type RoundInput = Omit<Round, 'id' | 'createdAt'>;

// Extended types for queries with joined data
export interface SetWithExercise extends Set {
  exercise: Exercise;
}

export interface SetWithRounds extends Set {
  rounds: Round[];
}

export interface TrainingWithDetails extends Training {
  sets: (SetWithExercise & SetWithRounds)[];
}

export interface ExerciseHistory {
  exercise: Exercise;
  history: {
    training: Training;
    sets: SetWithRounds[];
  }[];
}

export interface User {
  id: string; // Always 'user' (single record)
  name: string;
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}

// Input types for user
export type UserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
