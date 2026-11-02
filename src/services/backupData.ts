import { getAllExercises } from "@/db/exercises";
import { getAllTrainings } from "@/db/trainings";
import { getAllSets } from "@/db/sets";
import { getAllRounds } from "@/db/rounds";
import { getAllTrainingTemplates } from "@/db/trainingTemplates";
import { getUser } from "@/db/user";

export const BACKUP_FORMAT_VERSION = 2;

// Builds the full database snapshot used by both the manual export and the
// automatic Google Drive backups. The format is what the import expects.
export async function buildBackupData() {
  const [user, exercises, trainings, sets, rounds, trainingTemplates] =
    await Promise.all([
      getUser(),
      getAllExercises(),
      getAllTrainings(),
      getAllSets(),
      getAllRounds(),
      getAllTrainingTemplates(),
    ]);

  return {
    version: BACKUP_FORMAT_VERSION,
    exportedAt: Date.now(),
    data: {
      user,
      exercises,
      trainings,
      sets,
      rounds,
      trainingTemplates,
    },
  };
}

export async function buildBackupJson(): Promise<string> {
  return JSON.stringify(await buildBackupData(), null, 2);
}
