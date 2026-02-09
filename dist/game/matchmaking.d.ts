/**
 * Matchmaking System
 * ELO-based rating system with queue management
 */
export interface QueueEntry {
    user_id: string;
    agent_id: string;
    rating: number;
    queued_at: number;
}
declare class MatchmakingQueue {
    private queue;
    private tickInterval;
    private readonly SKILL_RANGE;
    private readonly QUEUE_TIMEOUT;
    /**
     * Add player to queue
     */
    addToQueue(userId: string, agentId: string, rating: number): Promise<void>;
    /**
     * Remove player from queue
     */
    removeFromQueue(userId: string): Promise<void>;
    /**
     * Find match for a player
     * Returns matching opponent or null if no match found
     */
    private findMatch;
    /**
     * Try to match all queued players
     */
    tryMatchPlayers(): Promise<Array<{
        player1: QueueEntry;
        player2: QueueEntry;
    }>>;
    /**
     * Get queue size
     */
    getQueueSize(): number;
    /**
     * Get average wait time
     */
    getAverageWaitTime(): number;
    /**
     * Start the matchmaking tick loop
     */
    startMatchmaking(tickIntervalMs?: number): void;
    /**
     * Stop the matchmaking tick loop
     */
    stopMatchmaking(): void;
}
export declare const matchmakingQueue: MatchmakingQueue;
/**
 * Update player rating after battle
 */
export declare function updatePlayerRating(userId: string, ratingChange: number): Promise<void>;
/**
 * Update leaderboard (call periodically)
 */
export declare function updateLeaderboard(): Promise<void>;
export {};
//# sourceMappingURL=matchmaking.d.ts.map