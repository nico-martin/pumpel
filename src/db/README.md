# Workout Tracker Database

This database layer provides a complete IndexedDB implementation for the workout tracker app using the `idb` package.

## Structure

- **types.ts** - TypeScript type definitions for all database models
- **init.ts** - Database initialization and schema setup
- **utils.ts** - Utility functions (UUID generation, timestamps)
- **exercises.ts** - CRUD operations for exercises
- **trainings.ts** - CRUD operations for trainings
- **sets.ts** - CRUD operations for sets
- **rounds.ts** - CRUD operations for rounds
- **queries.ts** - Complex query helpers
- **index.ts** - Main export file

## Database Schema

### Stores

1. **exercises** - Exercise definitions (e.g., "Bench Press", "Squats")
2. **trainings** - Training sessions with start/end times
3. **sets** - Sets within a training for a specific exercise
4. **rounds** - Individual rounds within a set (weight + reps)

## Usage Examples

### Initialize Database

```typescript
import { initDB } from './db';

// Initialize on app startup
await initDB();
```

### Create an Exercise

```typescript
import { createExercise } from './db';

const benchPress = await createExercise({
  name: 'Bench Press',
  description: 'Lie on a bench and press the barbell upward',
  type: 'strength'
});
```

### Add a Complete Training Session

```typescript
import { addCompleteTraining } from './db';

const training = await addCompleteTraining({
  training: {
    name: 'Monday Upper Body',
    warmUp: '5 minutes light cardio',
    calmDown: 'Stretching routine',
    startTime: Date.now(),
    endTime: Date.now() + 3600000, // 1 hour later
  },
  exercises: [
    {
      exerciseId: benchPress.id,
      sets: [
        {
          restPeriod: 90, // 90 seconds
          rounds: [
            { weight: 60, reps: 12 },
            { weight: 60, reps: 10 },
            { weight: 60, reps: 8 },
          ]
        },
        {
          restPeriod: 90,
          rounds: [
            { weight: 70, reps: 10 },
            { weight: 70, reps: 8 },
            { weight: 70, reps: 6 },
          ]
        }
      ]
    }
  ]
});
```

### Get Training with All Details

```typescript
import { getTrainingWithDetails } from './db';

const trainingDetails = await getTrainingWithDetails(training.id);
// Returns training with all sets, exercises, and rounds nested
```

### Get Exercise History

```typescript
import { getExerciseHistory } from './db';

const history = await getExerciseHistory(benchPress.id);
// Returns all trainings where this exercise was performed,
// sorted by date (most recent first)
```

### Get Last Used Weight for Exercise

```typescript
import { getLastUsedWeightForExercise } from './db';

const lastUsed = await getLastUsedWeightForExercise(benchPress.id);
// Returns: { weight: 70, reps: 6, date: 1234567890 }
```

### Query Trainings by Date Range

```typescript
import { getTrainingsByDateRange } from './db';

const startOfWeek = Date.now() - (7 * 24 * 60 * 60 * 1000);
const now = Date.now();

const weekTrainings = await getTrainingsByDateRange(startOfWeek, now);
```

## Key Features

- **Auto-generated UUIDs** for all entities
- **Timestamps** for all records (createdAt)
- **Indexes** for efficient querying (exercise names, training dates, etc.)
- **Compound indexes** for querying sets by exercise and training
- **Complex queries** with automatic joining of related data
- **Type-safe** with full TypeScript support

## Notes

- All timestamps are Unix timestamps (milliseconds)
- Exercise names must be unique
- Sets are ordered within trainings via `orderInTraining`
- Rounds are ordered within sets via `orderInSet`
- Weight values should use a consistent unit (kg or lbs) throughout the app
