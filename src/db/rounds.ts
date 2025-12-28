import { getDB } from './init';
import { generateUUID, getCurrentTimestamp } from './utils';
import type { Round, RoundInput } from './types';

// Create a new round
export async function createRound(input: RoundInput): Promise<Round> {
  const db = await getDB();
  const round: Round = {
    ...input,
    id: generateUUID(),
    createdAt: getCurrentTimestamp(),
  };
  await db.add('rounds', round);
  return round;
}

// Get a round by ID
export async function getRound(id: string): Promise<Round | undefined> {
  const db = await getDB();
  return db.get('rounds', id);
}

// Get all rounds
export async function getAllRounds(): Promise<Round[]> {
  const db = await getDB();
  return db.getAll('rounds');
}

// Get all rounds for a set
export async function getRoundsBySetId(setId: string): Promise<Round[]> {
  const db = await getDB();
  const rounds = await db.getAllFromIndex('rounds', 'setId', setId);
  return rounds.sort((a, b) => a.orderInSet - b.orderInSet);
}

// Update a round
export async function updateRound(id: string, updates: Partial<RoundInput>): Promise<Round> {
  const db = await getDB();
  const existing = await db.get('rounds', id);
  if (!existing) {
    throw new Error(`Round with id ${id} not found`);
  }
  const updated: Round = {
    ...existing,
    ...updates,
  };
  await db.put('rounds', updated);
  return updated;
}

// Delete a round
export async function deleteRound(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('rounds', id);
}

// Delete all rounds for a set
export async function deleteRoundsBySetId(setId: string): Promise<void> {
  const db = await getDB();
  const rounds = await getRoundsBySetId(setId);
  const tx = db.transaction('rounds', 'readwrite');
  await Promise.all(rounds.map((round) => tx.store.delete(round.id)));
  await tx.done;
}
