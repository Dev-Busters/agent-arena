/**
 * Crafting Routes
 * Handle gear crafting, material management
 */
import { Router } from 'express';
import { query } from '../../database/connection.js';
import { verifyToken } from '../auth.js';
import { generateCraftedGear } from '../../game/crafting.js';
import { MATERIALS } from '../../game/materials.js';
import SeededRandom from 'seedrandom';
const router = Router();
/**
 * GET /api/crafting/materials
 * Get player's material inventory
 */
router.get('/materials', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        // Get current agent
        const agentResult = await query('SELECT id FROM agents WHERE user_id = $1', [userId]);
        if (agentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        const agentId = agentResult.rows[0].id;
        // Get materials
        const materialsResult = await query('SELECT * FROM material_inventory WHERE agent_id = $1 ORDER BY material_id', [agentId]);
        const materials = materialsResult.rows.map((row) => ({
            materialId: row.material_id,
            quantity: row.quantity,
            ...MATERIALS[row.material_id]
        }));
        res.json(materials);
    }
    catch (error) {
        console.error('Materials fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch materials' });
    }
});
/**
 * POST /api/crafting/craft
 * Craft a new gear piece
 */
router.post('/craft', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { slot, materials: inputMaterials } = req.body;
        if (!slot || !inputMaterials || inputMaterials.length === 0) {
            return res.status(400).json({ error: 'Invalid crafting request' });
        }
        // Get agent
        const agentResult = await query('SELECT id FROM agents WHERE user_id = $1', [userId]);
        if (agentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        const agentId = agentResult.rows[0].id;
        // Verify player has enough materials
        for (const { materialId, quantity } of inputMaterials) {
            const inv = await query('SELECT quantity FROM material_inventory WHERE agent_id = $1 AND material_id = $2', [agentId, materialId]);
            if (inv.rows.length === 0 || inv.rows[0].quantity < quantity) {
                return res.status(400).json({ error: `Not enough ${materialId}` });
            }
        }
        // Deduct materials
        for (const { materialId, quantity } of inputMaterials) {
            await query('UPDATE material_inventory SET quantity = quantity - $1 WHERE agent_id = $2 AND material_id = $3', [quantity, agentId, materialId]);
        }
        // Generate gear
        const rng = SeededRandom(agentId + Date.now());
        const craftedGear = generateCraftedGear(slot, inputMaterials, rng);
        // Save to database
        const gearResult = await query(`INSERT INTO crafted_gear (agent_id, name, slot, base_rarity, affixes, total_stats, visual_effect)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`, [
            agentId,
            craftedGear.name,
            craftedGear.slot,
            craftedGear.baseRarity,
            JSON.stringify(craftedGear.affixes),
            JSON.stringify(craftedGear.totalStats),
            craftedGear.visualEffect
        ]);
        res.json({
            success: true,
            gear: {
                id: gearResult.rows[0].id,
                name: gearResult.rows[0].name,
                slot: gearResult.rows[0].slot,
                rarity: gearResult.rows[0].base_rarity,
                stats: gearResult.rows[0].total_stats,
                visualEffect: gearResult.rows[0].visual_effect
            }
        });
    }
    catch (error) {
        console.error('Crafting error:', error);
        res.status(500).json({ error: 'Crafting failed' });
    }
});
/**
 * GET /api/crafting/gear
 * Get player's crafted gear
 */
router.get('/gear', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        // Get agent
        const agentResult = await query('SELECT id FROM agents WHERE user_id = $1', [userId]);
        if (agentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        const agentId = agentResult.rows[0].id;
        // Get gear
        const gearResult = await query('SELECT * FROM crafted_gear WHERE agent_id = $1 ORDER BY created_at DESC', [agentId]);
        const gear = gearResult.rows.map((row) => ({
            id: row.id,
            name: row.name,
            slot: row.slot,
            rarity: row.base_rarity,
            affixes: row.affixes,
            stats: row.total_stats,
            visualEffect: row.visual_effect,
            equipped: row.equipped
        }));
        res.json(gear);
    }
    catch (error) {
        console.error('Gear fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch gear' });
    }
});
/**
 * POST /api/crafting/equip/:gearId
 * Equip a gear piece
 */
router.post('/equip/:gearId', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { gearId } = req.params;
        // Get agent
        const agentResult = await query('SELECT id FROM agents WHERE user_id = $1', [userId]);
        if (agentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        const agentId = agentResult.rows[0].id;
        // Get gear
        const gearResult = await query('SELECT * FROM crafted_gear WHERE id = $1 AND agent_id = $2', [gearId, agentId]);
        if (gearResult.rows.length === 0) {
            return res.status(404).json({ error: 'Gear not found' });
        }
        const gear = gearResult.rows[0];
        // Unequip other gear in same slot
        await query('UPDATE crafted_gear SET equipped = false WHERE agent_id = $1 AND slot = $2', [agentId, gear.slot]);
        // Equip this gear
        await query('UPDATE crafted_gear SET equipped = true WHERE id = $1', [gearId]);
        res.json({ success: true, message: `${gear.name} equipped` });
    }
    catch (error) {
        console.error('Equip error:', error);
        res.status(500).json({ error: 'Failed to equip gear' });
    }
});
export default router;
//# sourceMappingURL=crafting.routes.js.map