import { getDB } from "./init";
import { generateUUID, getCurrentTimestamp } from "./utils";
import type { TrainingTemplate, TrainingTemplateInput } from "./types";

// Create a new training template
export async function createTrainingTemplate(
  input: TrainingTemplateInput,
): Promise<TrainingTemplate> {
  const db = await getDB();
  const template: TrainingTemplate = {
    ...input,
    id: generateUUID(),
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
  };
  await db.add("trainingTemplates", template);
  return template;
}

// Get a training template by ID
export async function getTrainingTemplate(
  id: string,
): Promise<TrainingTemplate | undefined> {
  const db = await getDB();
  return db.get("trainingTemplates", id);
}

// Get all training templates
export async function getAllTrainingTemplates(): Promise<TrainingTemplate[]> {
  const db = await getDB();
  const templates = await db.getAll("trainingTemplates");
  return templates.sort((a, b) => b.updatedAt - a.updatedAt);
}

// Update a training template
export async function updateTrainingTemplate(
  id: string,
  updates: Partial<TrainingTemplateInput>,
): Promise<TrainingTemplate> {
  const db = await getDB();
  const existing = await db.get("trainingTemplates", id);
  if (!existing) {
    throw new Error(`Training template with id ${id} not found`);
  }
  const updated: TrainingTemplate = {
    ...existing,
    ...updates,
    updatedAt: getCurrentTimestamp(),
  };
  await db.put("trainingTemplates", updated);
  return updated;
}

// Delete a training template
export async function deleteTrainingTemplate(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("trainingTemplates", id);
}
