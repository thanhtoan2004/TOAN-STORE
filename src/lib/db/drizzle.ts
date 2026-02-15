import { drizzle } from 'drizzle-orm/mysql2';
import { pool } from './connection';
import * as schema from './schema';

export const db = drizzle(pool, { schema, mode: 'default' });

export type DbClient = typeof db;
