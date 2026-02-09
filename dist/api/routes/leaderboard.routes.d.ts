/**
 * Leaderboard Routes
 * Multi-category leaderboard with agent info, class filtering, and search
 */
declare const router: import("express-serve-static-core").Router;
/**
 * Update ELO rating after a battle
 * Called internally after battles complete
 */
export declare function updateEloRating(winnerId: string, loserId: string, kFactor?: number): Promise<void>;
export default router;
//# sourceMappingURL=leaderboard.routes.d.ts.map