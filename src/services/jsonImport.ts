// Dev-only JSON import for exercises and training templates.
// Everything is validated first; nothing is written if any entry is invalid.

import { createExercise, getAllExercises } from "@/db/exercises";
import {
  createTrainingTemplate,
  getAllTrainingTemplates,
} from "@/db/trainingTemplates";
import type { ExerciseInput } from "@/db/types";
import type { WeightUnit } from "@/components/exercises/ExerciseForm";

export const WEIGHT_UNITS: WeightUnit[] = ["kg", "lb", "seconds", "bodyweight"];

export const EXERCISES_EXAMPLE = `[
  {
    "name": "Bench Press",
    "bodyPart": "Chest",
    "description": "Flat barbell bench press",
    "weightUnit": "kg",
    "steps": 2.5,
    "defaultWeight": 40
  },
  { "name": "Plank", "bodyPart": "Core", "weightUnit": "seconds" }
]`;

export const TEMPLATES_EXAMPLE = `[
  {
    "name": "Push Day",
    "description": "Chest, shoulders, triceps",
    "exercises": ["Bench Press", "Shoulder Press", "Dips"]
  }
]`;

const quoteList = (values: string[]) =>
  values.map((v) => JSON.stringify(v)).join(", ");

// Plain-text instructions for the clipboard, e.g. to hand to an LLM that
// generates the JSON.
export function exerciseImportInstructions(bodyParts: string[]): string {
  return `Create a JSON array of exercises for the Pumpel workout tracker.
Output only the JSON, no explanations.

Each entry is an object with these fields:
- "name" (required): string, must be unique
- "bodyPart": string. ${
    bodyParts.length
      ? `Prefer one of the existing body parts: ${quoteList(bodyParts)}`
      : `For example "Chest"`
  }
- "description": string
- "weightUnit": one of ${quoteList(WEIGHT_UNITS)} (default "kg")
- "steps": number > 0, the weight increment (default 1)
- "defaultWeight": number >= 0, starting weight for new rounds (default 0)

Example:
${EXERCISES_EXAMPLE}`;
}

export function templateImportInstructions(exerciseNames: string[]): string {
  return `Create a JSON array of training templates for the Pumpel workout tracker.
Output only the JSON, no explanations.

Each entry is an object with these fields:
- "name" (required): string
- "description": string
- "exercises": array of exercise names, in training order. Only use names from this list: ${
    exerciseNames.length ? quoteList(exerciseNames) : "(no exercises exist yet)"
  }

Example:
${TEMPLATES_EXAMPLE}`;
}

export interface ImportResult {
  imported: number;
  skipped: string[]; // names skipped because they already exist
}

function parseArray(json: string): Record<string, unknown>[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new Error(
      `Invalid JSON: ${error instanceof Error ? error.message : error}`,
    );
  }
  // Also accept a single object for convenience.
  const items = Array.isArray(parsed) ? parsed : [parsed];
  if (items.length === 0) throw new Error("The list is empty.");
  items.forEach((item, i) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw new Error(`Entry ${i + 1}: must be an object.`);
    }
  });
  return items as Record<string, unknown>[];
}

function optionalString(
  item: Record<string, unknown>,
  key: string,
  label: string,
): string | undefined {
  const value = item[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string")
    throw new Error(`${label}: "${key}" must be a string.`);
  return value.trim() || undefined;
}

function requiredName(item: Record<string, unknown>, index: number): string {
  const name = typeof item.name === "string" ? item.name.trim() : "";
  if (!name) throw new Error(`Entry ${index + 1}: "name" is required.`);
  return name;
}

export async function importExercisesFromJson(
  json: string,
): Promise<ImportResult> {
  const items = parseArray(json);
  const existing = new Set(
    (await getAllExercises()).map((e) => e.name.toLowerCase()),
  );

  const toCreate: ExerciseInput[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();

  items.forEach((item, i) => {
    const name = requiredName(item, i);
    const label = `Entry ${i + 1} ("${name}")`;

    const weightUnit = item.weightUnit ?? "kg";
    if (!WEIGHT_UNITS.includes(weightUnit as WeightUnit)) {
      throw new Error(
        `${label}: "weightUnit" must be one of ${WEIGHT_UNITS.join(", ")}.`,
      );
    }

    const steps = item.steps ?? 1;
    if (typeof steps !== "number" || !(steps > 0)) {
      throw new Error(`${label}: "steps" must be a number greater than 0.`);
    }

    const defaultWeight = item.defaultWeight ?? 0;
    if (typeof defaultWeight !== "number" || defaultWeight < 0) {
      throw new Error(`${label}: "defaultWeight" must be a number ≥ 0.`);
    }

    const key = name.toLowerCase();
    if (seen.has(key)) {
      throw new Error(`${label}: name appears more than once in the import.`);
    }
    seen.add(key);

    if (existing.has(key)) {
      skipped.push(name);
      return;
    }

    toCreate.push({
      name,
      bodyPart: optionalString(item, "bodyPart", label),
      description: optionalString(item, "description", label),
      type: optionalString(item, "type", label),
      weightUnit: weightUnit as WeightUnit,
      steps,
      defaultWeight,
    });
  });

  for (const input of toCreate) {
    await createExercise(input);
  }
  return { imported: toCreate.length, skipped };
}

export async function importTemplatesFromJson(
  json: string,
): Promise<ImportResult> {
  const items = parseArray(json);
  const [exercises, templates] = await Promise.all([
    getAllExercises(),
    getAllTrainingTemplates(),
  ]);
  const exerciseById = new Map(exercises.map((e) => [e.id, e.id]));
  const exerciseByName = new Map(
    exercises.map((e) => [e.name.toLowerCase(), e.id]),
  );
  const existing = new Set(templates.map((t) => t.name.toLowerCase()));

  const toCreate: {
    name: string;
    description?: string;
    exerciseIds: string[];
  }[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();

  items.forEach((item, i) => {
    const name = requiredName(item, i);
    const label = `Entry ${i + 1} ("${name}")`;

    const refs = item.exercises ?? [];
    if (!Array.isArray(refs) || refs.some((r) => typeof r !== "string")) {
      throw new Error(
        `${label}: "exercises" must be a list of exercise names.`,
      );
    }

    const unknown: string[] = [];
    const exerciseIds = (refs as string[]).map((ref) => {
      const id =
        exerciseById.get(ref) ?? exerciseByName.get(ref.trim().toLowerCase());
      if (!id) unknown.push(ref);
      return id!;
    });
    if (unknown.length) {
      throw new Error(
        `${label}: unknown exercise${unknown.length > 1 ? "s" : ""}: ${unknown.join(", ")}. Import or create them first.`,
      );
    }

    const key = name.toLowerCase();
    if (seen.has(key)) {
      throw new Error(`${label}: name appears more than once in the import.`);
    }
    seen.add(key);

    if (existing.has(key)) {
      skipped.push(name);
      return;
    }

    toCreate.push({
      name,
      description: optionalString(item, "description", label),
      exerciseIds,
    });
  });

  for (const input of toCreate) {
    await createTrainingTemplate(input);
  }
  return { imported: toCreate.length, skipped };
}
