/**
 * Matchmaking System
 * ELO-based rating system with queue management
 */
import pool from '../database/connection.js';
class MatchmakingQueue {
    constructor() {
        this.queue = new Map(); // user_id -> entry
        this.tickInterval = null;
        this.SKILL_RANGE = 150; // +/- rating range for matching
        this.QUEUE_TIMEOUT = 30000; // 30 seconds before expanding range
    }
    /**
     * Add player to queue
     */
    async addToQueue(userId, agentId, rating) {
        if (this.queue.has(userId)) {
            throw new Error('Already in queue');
        }
        const entry = {
            user_id: userId,
            agent_id: agentId,
            rating,
            queued_at: Date.now()
        };
        this.queue.set(userId, entry);
        // Save to database
        await pool.query(`INSERT INTO matchmaking_queue (user_id, agent_id, rating, queued_at)
       VALUES ($1, $2, $3, to_timestamp($4::float / 1000))
       ON CONFLICT (user_id) DO UPDATE SET
       agent_id = $2, rating = $3, queued_at = to_timestamp($4::float / 1000)`, [userId, agentId, rating, entry.queued_at]);
        console.log(`👤 ${userId} joined queue (rating: ${rating})`);
    }
    /**
     * Remove player from queue
     */
    async removeFromQueue(userId) {
        this.queue.delete(userId);
        await pool.query('DELETE FROM matchmaking_queue WHERE user_id = $1', [userId]);
        console.log(`👤 ${userId} left queue`);
    }
    /**
     * Find match for a player
     * Returns matching opponent or null if no match found
     */
    findMatch(entry) {
        const timeInQueue = Date.now() - entry.queued_at;
        // Expand search range over time
        let skillRange = this.SKILL_RANGE;
        if (timeInQueue > this.QUEUE_TIMEOUT) {
            skillRange = this.SKILL_RANGE * 2; // Double range after 30s
        }
        if (timeInQueue > this.QUEUE_TIMEOUT * 2) {
            skillRange = 999999; // Accept anyone after 60s
        }
        // Find opponent with similar rating
        for (const [otherUserId, otherEntry] of this.queue.entries()) {
            if (otherUserId === entry.user_id)
                continue; // Skip self
            const ratingDiff = Math.abs(otherEntry.rating - entry.rating);
            if (ratingDiff <= skillRange) {
                // Prefer players who've been waiting longer
                if (otherEntry.queued_at <= entry.queued_at) {
                    return otherEntry;
                }
            }
        }
        return null;
    }
    /**
     * Try to match all queued players
     */
    async tryMatchPlayers() {
        const matches = [];
        const matched = new Set();
        // Convert to array and sort by queue time (FIFO)
        const queueArray = Array.from(this.queue.values()).sort((a, b) => a.queued_at - b.queued_at);
        for (const entry of queueArray) {
            if (matched.has(entry.user_id))
                continue;
            const opponent = this.findMatch(entry);
            if (opponent) {
                matches.push({
                    player1: entry,
                    player2: opponent
                });
                matched.add(entry.user_id);
                matched.add(opponent.user_id);
                console.log(`🎮 Match found: ${entry.user_id} (${entry.rating}) vs ${opponent.user_id} (${opponent.rating})`);
            }
        }
        // Remove matched players from queue
        for (const userId of matched) {
            this.queue.delete(userId);
        }
        // Update database
        for (const userId of matched) {
            await pool.query('DELETE FROM matchmaking_queue WHERE user_id = $1', [userId]);
        }
        return matches;
    }
    /**
     * Get queue size
     */
    getQueueSize() {
        return this.queue.size;
    }
    /**
     * Get average wait time
     */
    getAverageWaitTime() {
        if (this.queue.size === 0)
            return 0;
        const now = Date.now();
        const totalWait = Array.from(this.queue.values()).reduce((sum, entry) => sum + (now - entry.queued_at), 0);
        return Math.round(totalWait / this.queue.size);
    }
    /**
     * Start the matchmaking tick loop
     */
    startMatchmaking(tickIntervalMs = 5000) {
        if (this.tickInterval)
            return;
        console.log(`🔄 Matchmaking started (tick: ${tickIntervalMs}ms)`);
        this.tickInterval = setInterval(async () => {
            try {
                const matches = await this.tryMatchPlayers();
                if (matches.length > 0) {
                    console.log(`✅ ${matches.length} match(es) found`);
                }
            }
            catch (err) {
                console.error('❌ Matchmaking error:', err);
            }
        }, tickIntervalMs);
    }
    /**
     * Stop the matchmaking tick loop
     */
    stopMatchmaking() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
            console.log('🛑 Matchmaking stopped');
        }
    }
}
export const matchmakingQueue = new MatchmakingQueue();
/**
 * Update player rating after battle
 */
export async function updatePlayerRating(userId, ratingChange) {
    await pool.query(`UPDATE users SET rating = rating + $1 WHERE id = $2`, [ratingChange, userId]);
    console.log(`📊 ${userId} rating updated: +${ratingChange}`);
}
/**
 * Update leaderboard (call periodically)
 */
export async function updateLeaderboard() {
    await pool.query(`
    DELETE FROM leaderboard;

    INSERT INTO leaderboard (user_id, username, rating, wins, losses, win_rate, updated_at)
    SELECT
      u.id,
      u.username,
      u.rating,
      u.wins,
      u.losses,
      CASE WHEN (u.wins + u.losses) = 0 THEN 0
           ELSE ROUND((u.wins::numeric / (u.wins + u.losses)) * 100, 2)
      END as win_rate,
      CURRENT_TIMESTAMP
    FROM users u
    WHERE u.deleted_at IS NULL
    ORDER BY u.rating DESC, u.wins DESC;

    -- Assign ranks
    UPDATE leaderboard
    SET rank = (
      SELECT COUNT(*) FROM leaderboard l2
      WHERE l2.rating > leaderboard.rating OR
            (l2.rating = leaderboard.rating AND l2.wins > leaderboard.wins)
    ) + 1;
  `);
    console.log('📊 Leaderboard updated');
}
//# sourceMappingURL=matchmaking.js.map