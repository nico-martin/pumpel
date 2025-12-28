import { getDB } from './init';
import type { User, UserInput } from './types';

const USER_ID = 'user'; // Single user record

// Get user data
export async function getUser(): Promise<User | undefined> {
  const db = await getDB();
  return db.get('user', USER_ID);
}

// Create or update user data
export async function saveUser(input: UserInput): Promise<User> {
  const db = await getDB();
  const now = Date.now();

  // Check if user already exists
  const existingUser = await db.get('user', USER_ID);

  const user: User = {
    id: USER_ID,
    name: input.name,
    createdAt: existingUser?.createdAt ?? now,
    updatedAt: now,
  };

  await db.put('user', user);
  return user;
}

// Update user name
export async function updateUserName(name: string): Promise<User> {
  return saveUser({ name });
}

// Check if user exists
export async function hasUser(): Promise<boolean> {
  const user = await getUser();
  return user !== undefined;
}
