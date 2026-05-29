import mapepire from '@ibm/mapepire-js';
const { Pool } = mapepire;

export type PoolType = InstanceType<typeof Pool>;

export async function createUserPool(username: string, password: string): Promise<PoolType> {
  const host = process.env.IBMI_HOST;
  const port = parseInt(process.env.IBMI_PORT || '8076', 10);

  if (!host) {
    throw new Error('Missing required environment variable: IBMI_HOST');
  }

  const pool = new Pool({
    creds: {
      host,
      user: username,
      password,
      port,
      rejectUnauthorized: false,
    },
    maxSize: 3,
    startingSize: 1,
  });

  await pool.init();
  return pool;
}

export function getLibrary(): string {
  return process.env.IBMI_LIBRARY || 'MYLIB';
}
