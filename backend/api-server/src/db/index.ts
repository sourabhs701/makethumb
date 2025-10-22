import { drizzle } from 'drizzle-orm/d1';
import { Env } from '../lib/types';

export function getDB(env: Env) {
    return drizzle(env.DB);
}
