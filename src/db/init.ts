import { openDB, type IDBPDatabase } from 'idb';
import type { Exercise, Training, Set, Round, User } from './types';

// Define the database schema
export interface WorkoutTrackerDB {
  exercises: {
    key: string;
    value: Exercise;
    indexes: { name: string };
  };
  trainings: {
    key: string;
    value: Training;
    indexes: { startTime: number; endTime: number };
  };
  sets: {
    key: string;
    value: Set;
    indexes: {
      trainingId: string;
      exerciseId: string;
      'exerciseId-trainingId': [string, string];
    };
  };
  rounds: {
    key: string;
    value: Round;
    indexes: { setId: string };
  };
  user: {
    key: string;
    value: User;
  };
}

const DB_NAME = 'workoutTrackerDB';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<WorkoutTrackerDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<WorkoutTrackerDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<WorkoutTrackerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {

      // Create exercises store
      if (!db.objectStoreNames.contains('exercises')) {
        const exercisesStore = db.createObjectStore('exercises', {
          keyPath: 'id',
        });
        exercisesStore.createIndex('name', 'name', { unique: true });
      }

      // Create trainings store
      if (!db.objectStoreNames.contains('trainings')) {
        const trainingsStore = db.createObjectStore('trainings', {
          keyPath: 'id',
        });
        trainingsStore.createIndex('startTime', 'startTime');
        trainingsStore.createIndex('endTime', 'endTime');
      }

      // Create sets store
      if (!db.objectStoreNames.contains('sets')) {
        const setsStore = db.createObjectStore('sets', {
          keyPath: 'id',
        });
        setsStore.createIndex('trainingId', 'trainingId');
        setsStore.createIndex('exerciseId', 'exerciseId');
        setsStore.createIndex('exerciseId-trainingId', ['exerciseId', 'trainingId']);
      }

      // Create rounds store
      if (!db.objectStoreNames.contains('rounds')) {
        const roundsStore = db.createObjectStore('rounds', {
          keyPath: 'id',
        });
        roundsStore.createIndex('setId', 'setId');
      }

      // Create user store (version 2)
      if (!db.objectStoreNames.contains('user')) {
        db.createObjectStore('user', {
          keyPath: 'id',
        });
      }
    },
    blocked() {
      console.warn('Database upgrade blocked. Please close other tabs.');
    },
    blocking() {
      console.warn('Database is blocking a newer version.');
    },
  });

  return dbInstance;
}

export async function getDB(): Promise<IDBPDatabase<WorkoutTrackerDB>> {
  if (!dbInstance) {
    return initDB();
  }
  return dbInstance;
}

export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
