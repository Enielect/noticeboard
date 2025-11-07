import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

const connectionString = process.env.POSTGRES_URL_NON_POOLING!;

// Configure with connection limits and timeouts
const client = postgres(connectionString, {
  max: 1,                     // Only 1 connection for free tier
  idle_timeout: 20,           // Close idle connections quickly
  connect_timeout: 10,        // Shorter connection timeout
  transform: {
    undefined: null,          // Handle undefined values
  },
  onnotice: () => {},         // Suppress notices
});

export const db = drizzle(client, { schema });