import * as schema from '@/db/schema';
import { drizzle } from 'drizzle-orm/vercel-postgres';
const db = drizzle({schema});

export default db;