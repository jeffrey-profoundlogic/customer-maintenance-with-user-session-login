import { PoolType } from '../config/database.js';

interface PoolEntry {
  pool: PoolType;
  username: string;
  lastActivity: number;
}

class SessionPoolManager {
  private pools = new Map<string, PoolEntry>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  startCleanup(timeoutMs: number): void {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    this.cleanupTimer = setInterval(() => {
      const cutoff = Date.now() - timeoutMs;
      for (const [sessionId, entry] of this.pools) {
        if (entry.lastActivity < cutoff) {
          entry.pool.end();
          this.pools.delete(sessionId);
          console.log(`Cleaned up idle pool for user: ${entry.username}`);
        }
      }
    }, 5 * 60 * 1000);
  }

  create(sessionId: string, username: string, pool: PoolType): void {
    this.pools.set(sessionId, { pool, username, lastActivity: Date.now() });
    console.log(`Connection pool created for user: ${username}`);
  }

  get(sessionId: string): PoolType | null {
    return this.pools.get(sessionId)?.pool ?? null;
  }

  touch(sessionId: string): void {
    const entry = this.pools.get(sessionId);
    if (entry) entry.lastActivity = Date.now();
  }

  destroy(sessionId: string): void {
    const entry = this.pools.get(sessionId);
    if (entry) {
      entry.pool.end();
      this.pools.delete(sessionId);
      console.log(`Connection pool destroyed for user: ${entry.username}`);
    }
  }

  destroyAll(): void {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    for (const entry of this.pools.values()) {
      entry.pool.end();
    }
    this.pools.clear();
    console.log('All connection pools destroyed');
  }
}

export const sessionPoolManager = new SessionPoolManager();
