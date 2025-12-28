import { getExercise } from './exercises';
import { getTraining } from './trainings';
import { getSetsByTrainingId, getSetsByExerciseId } from './sets';
import { getRoundsBySetId } from './rounds';
import type {
  Training,
  Set,
  Round,
  TrainingWithDetails,
  ExerciseHistory,
  SetWithExercise,
  SetWithRounds,
  TrainingInput,
  SetInput,
  RoundInput,
} from './types';
import { createTraining } from './trainings';
import { createSet } from './sets';
import { createRound } from './rounds';

// Get a training with all its sets and rounds
export async function getTrainingWithDetails(trainingId: string): Promise<TrainingWithDetails | null> {
  const training = await getTraining(trainingId);
  if (!training) {
    return null;
  }

  const sets = await getSetsByTrainingId(trainingId);

  const setsWithDetails = await Promise.all(
    sets.map(async (set) => {
      const exercise = await getExercise(set.exerciseId);
      const rounds = await getRoundsBySetId(set.id);

      return {
        ...set,
        exercise: exercise!,
        rounds,
      };
    })
  );

  return {
    ...training,
    sets: setsWithDetails,
  };
}

// Get exercise history with all trainings and sets
export async function getExerciseHistory(exerciseId: string): Promise<ExerciseHistory | null> {
  const exercise = await getExercise(exerciseId);
  if (!exercise) {
    return null;
  }

  const sets = await getSetsByExerciseId(exerciseId);

  // Group sets by training
  const trainingMap = new Map<string, Set[]>();
  sets.forEach((set) => {
    const trainingSets = trainingMap.get(set.trainingId) || [];
    trainingSets.push(set);
    trainingMap.set(set.trainingId, trainingSets);
  });

  // Get training details and rounds for each set
  const history = await Promise.all(
    Array.from(trainingMap.entries()).map(async ([trainingId, trainingSets]) => {
      const training = await getTraining(trainingId);
      if (!training) {
        return null;
      }

      const setsWithRounds = await Promise.all(
        trainingSets.map(async (set) => {
          const rounds = await getRoundsBySetId(set.id);
          return {
            ...set,
            rounds,
          };
        })
      );

      return {
        training,
        sets: setsWithRounds,
      };
    })
  );

  // Filter out null entries and sort by training start time (most recent first)
  const validHistory = history.filter((h) => h !== null) as {
    training: Training;
    sets: SetWithRounds[];
  }[];
  validHistory.sort((a, b) => b.training.startTime - a.training.startTime);

  return {
    exercise,
    history: validHistory,
  };
}

// Get the last used weight and reps for a specific exercise
export async function getLastUsedWeightForExercise(
  exerciseId: string,
  excludeTrainingId?: string
): Promise<{ weight: number; reps: number; date: number } | null> {
  const exerciseHistory = await getExerciseHistory(exerciseId);
  if (!exerciseHistory || exerciseHistory.history.length === 0) {
    return null;
  }

  // Filter out the current training if excludeTrainingId is provided
  const filteredHistory = excludeTrainingId
    ? exerciseHistory.history.filter((h) => h.training.id !== excludeTrainingId)
    : exerciseHistory.history;

  if (filteredHistory.length === 0) {
    return null;
  }

  // Get the most recent training (excluding current if specified)
  const mostRecentTraining = filteredHistory[0];

  // Get the last set from that training
  const lastSet = mostRecentTraining.sets[mostRecentTraining.sets.length - 1];

  // Get the last round from that set
  if (lastSet.rounds.length === 0) {
    return null;
  }

  const lastRound = lastSet.rounds[lastSet.rounds.length - 1];

  return {
    weight: lastRound.weight,
    reps: lastRound.reps,
    date: mostRecentTraining.training.startTime,
  };
}

// Helper to add a complete training session with sets and rounds
export interface CompleteTrainingInput {
  training: TrainingInput;
  exercises: {
    exerciseId: string;
    sets: {
      restPeriod?: number;
      notes?: string;
      rounds: {
        weight: number;
        reps: number;
        notes?: string;
      }[];
    }[];
  }[];
}

export async function addCompleteTraining(input: CompleteTrainingInput): Promise<TrainingWithDetails> {
  // Create the training
  const training = await createTraining(input.training);

  // Create all sets and rounds
  let orderInTraining = 0;
  const allSetsWithDetails: (SetWithExercise & SetWithRounds)[] = [];

  for (const exerciseData of input.exercises) {
    const exercise = await getExercise(exerciseData.exerciseId);
    if (!exercise) {
      throw new Error(`Exercise with id ${exerciseData.exerciseId} not found`);
    }

    for (const setData of exerciseData.sets) {
      const setInput: SetInput = {
        trainingId: training.id,
        exerciseId: exerciseData.exerciseId,
        orderInTraining: orderInTraining++,
        restPeriod: setData.restPeriod,
        notes: setData.notes,
      };

      const set = await createSet(setInput);

      // Create all rounds for this set
      const rounds: Round[] = [];
      for (let i = 0; i < setData.rounds.length; i++) {
        const roundData = setData.rounds[i];
        const roundInput: RoundInput = {
          setId: set.id,
          orderInSet: i,
          weight: roundData.weight,
          reps: roundData.reps,
          notes: roundData.notes,
        };
        const round = await createRound(roundInput);
        rounds.push(round);
      }

      allSetsWithDetails.push({
        ...set,
        exercise,
        rounds,
      });
    }
  }

  return {
    ...training,
    sets: allSetsWithDetails,
  };
}
