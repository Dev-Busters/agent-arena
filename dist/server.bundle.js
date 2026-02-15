// src/server.ts
import dns from "dns";
import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import dotenv2 from "dotenv";

// src/api/routes/auth.routes.ts
import { Router } from "express";

// src/api/auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";

// src/database/connection.ts
import dotenv from "dotenv";
import pg from "pg";
dotenv.config();
var { Pool } = pg;
console.log("\u{1F680} [DB] Initializing connection pool...");
console.log("\u{1F680} [DB] DATABASE_URL set:", !!process.env.DATABASE_URL);
if (!process.env.DATABASE_URL) {
  console.error("\u274C [DB] FATAL: DATABASE_URL environment variable is not set!");
  console.error("\u274C [DB] Please ensure DATABASE_URL is configured in your environment.");
  console.error("\u274C [DB] Example: DATABASE_URL=postgresql://user:password@localhost:5432/dbname");
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DATABASE_POOL_SIZE || "10"),
  idleTimeoutMillis: 3e4,
  connectionTimeoutMillis: 5e3,
  // Increased from 2000 to 5000 for better Railway compatibility
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});
pool.on("error", (err) => {
  console.error("\u274C [DB] Unexpected error on idle client", err);
});
pool.on("connect", () => {
  console.log("\u2705 [DB] Pool connection established");
});
console.log("\u{1F680} [DB] Connection pool initialized");
var query = (text, params) => {
  return pool.query(text, params);
};
var connection_default = pool;

// src/api/auth.ts
var RegisterSchema = z.object({
  email: z.string().email("Invalid email"),
  username: z.string().min(3).max(50),
  password: z.string().min(8, "Password must be at least 8 characters")
});
var LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string()
});
async function register(data) {
  const validated = RegisterSchema.parse(data);
  const existingUser = await connection_default.query(
    "SELECT id FROM users WHERE email = $1 OR username = $2",
    [validated.email, validated.username]
  );
  if (existingUser.rows.length > 0) {
    throw new Error("Email or username already in use");
  }
  const passwordHash = await bcrypt.hash(validated.password, 12);
  const result = await connection_default.query(
    `INSERT INTO users (email, username, password_hash, gold)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, username, level, gold`,
    [validated.email, validated.username, passwordHash, 1e3]
  );
  const user = result.rows[0];
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      level: user.level
    }
  };
}
async function login(data) {
  const validated = LoginSchema.parse(data);
  const result = await connection_default.query(
    "SELECT id, email, username, level, password_hash FROM users WHERE email = $1 AND deleted_at IS NULL",
    [validated.email]
  );
  if (result.rows.length === 0) {
    throw new Error("Invalid credentials");
  }
  const user = result.rows[0];
  const passwordValid = await bcrypt.compare(validated.password, user.password_hash);
  if (!passwordValid) {
    throw new Error("Invalid credentials");
  }
  await connection_default.query(
    "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
    [user.id]
  );
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      level: user.level
    }
  };
}
function verifyToken(token) {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret-change-in-production"
    );
    return decoded;
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
}
function generateToken(user) {
  const expiryHours = 24;
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username
  };
  return jwt.sign(payload, process.env.JWT_SECRET || "dev-secret-change-in-production", {
    expiresIn: `${expiryHours}h`
  });
}
function generateRefreshToken(user) {
  const payload = {
    id: user.id,
    type: "refresh"
  };
  return jwt.sign(payload, process.env.JWT_SECRET || "dev-secret-change-in-production", {
    expiresIn: "7d"
  });
}
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization header" });
  }
  const token = authHeader.substring(7);
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
}

// src/api/routes/auth.routes.ts
var router = Router();
router.post("/register", async (req, res) => {
  try {
    const result = await register(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.post("/login", async (req, res) => {
  try {
    const result = await login(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});
router.post("/refresh", (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }
    const payload = verifyToken(refreshToken);
    if (payload.type !== "refresh") {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
    const newToken = generateToken(payload);
    res.json({ token: newToken });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});
var auth_routes_default = router;

// src/api/routes/oauth.routes.ts
import { Router as Router2 } from "express";

// src/api/oauth.ts
import jwt2 from "jsonwebtoken";
async function findOrCreateOAuthUser(profile) {
  const existingOAuth = await connection_default.query(
    `SELECT u.* FROM users u
     JOIN user_oauth_accounts oa ON u.id = oa.user_id
     WHERE oa.provider = $1 AND oa.provider_id = $2`,
    [profile.provider, profile.providerId]
  );
  if (existingOAuth.rows.length > 0) {
    const user2 = existingOAuth.rows[0];
    return {
      user: user2,
      isNew: false
    };
  }
  const existingEmail = await connection_default.query(
    "SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL",
    [profile.email]
  );
  let user;
  let isNew = false;
  if (existingEmail.rows.length > 0) {
    user = existingEmail.rows[0];
  } else {
    const username = await generateUniqueUsername(profile.username);
    try {
      const result = await connection_default.query(
        `INSERT INTO users (email, username, password_hash, gold)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [profile.email, username, "OAUTH_USER", 1e3]
      );
      user = result.rows[0];
      isNew = true;
    } catch (err) {
      if (err.code === "23505") {
        const existing = await connection_default.query(
          "SELECT * FROM users WHERE email = $1",
          [profile.email]
        );
        user = existing.rows[0];
        isNew = false;
      } else {
        throw err;
      }
    }
  }
  await connection_default.query(
    `INSERT INTO user_oauth_accounts (user_id, provider, provider_id, avatar_url)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (provider, provider_id) DO UPDATE SET avatar_url = $4`,
    [user.id, profile.provider, profile.providerId, profile.avatar]
  );
  return { user, isNew };
}
async function generateUniqueUsername(baseUsername) {
  let username = baseUsername.toLowerCase().replace(/[^a-z0-9_]/g, "").substring(0, 40);
  if (!username || username.length < 3) {
    username = "player";
  }
  const existing = await connection_default.query(
    "SELECT id FROM users WHERE username = $1",
    [username]
  );
  if (existing.rows.length === 0) {
    return username;
  }
  const suffix = Math.floor(Math.random() * 9999);
  return `${username}${suffix}`;
}
function generateOAuthTokens(user) {
  const token = jwt2.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username
    },
    process.env.JWT_SECRET || "dev-secret-change-in-production",
    { expiresIn: "24h" }
  );
  const refreshToken = jwt2.sign(
    { id: user.id, type: "refresh" },
    process.env.JWT_SECRET || "dev-secret-change-in-production",
    { expiresIn: "7d" }
  );
  return { token, refreshToken };
}
async function verifyGoogleToken(idToken) {
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      console.error("Invalid JWT format");
      return null;
    }
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf-8")
    );
    return {
      provider: "google",
      providerId: payload.sub,
      email: payload.email,
      username: payload.name || payload.email.split("@")[0],
      avatar: payload.picture
    };
  } catch (error) {
    console.error("Google token verification failed:", error);
    return null;
  }
}
async function exchangeDiscordCode(code, redirectUri) {
  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID || "",
        client_secret: process.env.DISCORD_CLIENT_SECRET || "",
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri
      })
    });
    if (!tokenResponse.ok) {
      console.error("Discord token exchange failed");
      return null;
    }
    const tokens = await tokenResponse.json();
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });
    if (!userResponse.ok) {
      console.error("Discord user fetch failed");
      return null;
    }
    const discordUser = await userResponse.json();
    return {
      provider: "discord",
      providerId: discordUser.id,
      email: discordUser.email,
      username: discordUser.username,
      avatar: discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : void 0
    };
  } catch (error) {
    console.error("Discord OAuth failed:", error);
    return null;
  }
}

// src/api/routes/oauth.routes.ts
var router2 = Router2();
router2.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "Missing ID token" });
    }
    const profile = await verifyGoogleToken(idToken);
    if (!profile) {
      return res.status(401).json({ error: "Invalid Google token" });
    }
    const { user, isNew } = await findOrCreateOAuthUser(profile);
    const { token, refreshToken } = generateOAuthTokens(user);
    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        level: user.level,
        avatar: profile.avatar
      },
      isNew
    });
  } catch (err) {
    console.error("Google OAuth error:", err);
    res.status(500).json({ error: "OAuth authentication failed" });
  }
});
router2.post("/discord", async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Missing authorization code" });
    }
    const profile = await exchangeDiscordCode(
      code,
      redirectUri || `${process.env.FRONTEND_URL}/auth/discord/callback`
    );
    if (!profile) {
      return res.status(401).json({ error: "Discord authentication failed" });
    }
    const { user, isNew } = await findOrCreateOAuthUser(profile);
    const { token, refreshToken } = generateOAuthTokens(user);
    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        level: user.level,
        avatar: profile.avatar
      },
      isNew
    });
  } catch (err) {
    console.error("Discord OAuth error:", err);
    res.status(500).json({ error: "OAuth authentication failed" });
  }
});
router2.get("/oauth-urls", (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: `${frontendUrl}/auth/google/callback`,
    response_type: "token id_token",
    scope: "openid email profile",
    nonce: Math.random().toString(36).substring(2)
  })}`;
  const discordUrl = `https://discord.com/api/oauth2/authorize?${new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID || "",
    redirect_uri: `${frontendUrl}/auth/discord/callback`,
    response_type: "code",
    scope: "identify email"
  })}`;
  res.json({
    google: googleUrl,
    discord: discordUrl
  });
});
var oauth_routes_default = router2;

// src/api/routes/agent.routes.ts
import { Router as Router3 } from "express";
import { z as z2 } from "zod";
var router3 = Router3();
router3.use(authMiddleware);
var CreateAgentSchema = z2.object({
  class: z2.enum(["warrior", "mage", "rogue", "paladin"])
});
var BASE_STATS = {
  warrior: { max_hp: 120, attack: 15, defense: 12, speed: 8, accuracy: 85, evasion: 5 },
  mage: { max_hp: 80, attack: 10, defense: 8, speed: 12, accuracy: 90, evasion: 8 },
  rogue: { max_hp: 100, attack: 14, defense: 8, speed: 15, accuracy: 95, evasion: 12 },
  paladin: { max_hp: 110, attack: 12, defense: 15, speed: 9, accuracy: 88, evasion: 6 }
};
router3.post("/", async (req, res) => {
  try {
    const user = req.user;
    const validated = CreateAgentSchema.parse(req.body);
    const existing = await connection_default.query(
      "SELECT id FROM agents WHERE user_id = $1 AND deleted_at IS NULL",
      [user.id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "You already have an active agent" });
    }
    const stats = BASE_STATS[validated.class];
    const result = await connection_default.query(
      `INSERT INTO agents (
        user_id, name, class, level, experience,
        max_hp, current_hp, attack, defense, speed, accuracy, evasion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, user_id, name, class, level, experience, max_hp, current_hp,
                attack, defense, speed, accuracy, evasion, created_at`,
      [
        user.id,
        user.username,
        validated.class,
        1,
        0,
        stats.max_hp,
        stats.max_hp,
        stats.attack,
        stats.defense,
        stats.speed,
        stats.accuracy,
        stats.evasion
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router3.get("/me/current", async (req, res) => {
  try {
    const user = req.user;
    console.log("\u{1F464} [AGENT] Fetching current agent for user:", user.id);
    const result = await connection_default.query(
      `SELECT a.*, 
              COALESCE(
                array_agg(
                  json_build_object('id', e.id, 'slot', e.slot, 'item_id', e.item_id, 'item_name', i.name)
                ) FILTER (WHERE e.id IS NOT NULL),
                '{}'
              ) AS equipment
       FROM agents a
       LEFT JOIN equipment e ON a.id = e.agent_id
       LEFT JOIN items i ON e.item_id = i.id
       WHERE a.user_id = $1 AND a.deleted_at IS NULL
       GROUP BY a.id
       LIMIT 1`,
      [user.id]
    );
    if (result.rows.length === 0) {
      console.log("\u{1F464} [AGENT] No active agent found for user:", user.id);
      return res.status(404).json({ error: "No active agent" });
    }
    console.log("\u2705 [AGENT] Agent found:", result.rows[0].id);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("\u274C [AGENT] /me/current error:", {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    res.status(500).json({ error: err.message });
  }
});
router3.get("/:id", async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const result = await connection_default.query(
      `SELECT a.*, 
              COALESCE(
                array_agg(
                  json_build_object('id', e.id, 'slot', e.slot, 'item_id', e.item_id, 'item_name', i.name)
                ) FILTER (WHERE e.id IS NOT NULL),
                '{}'
              ) AS equipment
       FROM agents a
       LEFT JOIN equipment e ON a.id = e.agent_id
       LEFT JOIN items i ON e.item_id = i.id
       WHERE a.id = $1 AND a.user_id = $2 AND a.deleted_at IS NULL
       GROUP BY a.id`,
      [id, user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Agent not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router3.put("/:id", async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    const result = await connection_default.query(
      `UPDATE agents SET name = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
       RETURNING id, user_id, name, class, level, experience, max_hp, current_hp,
                 attack, defense, speed, accuracy, evasion, updated_at`,
      [name, id, user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Agent not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router3.delete("/:id", async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const result = await connection_default.query(
      `UPDATE agents SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [id, user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Agent not found" });
    }
    res.json({ message: "Agent deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
var agent_routes_default = router3;

// src/api/routes/battle.routes.ts
import { Router as Router4 } from "express";

// src/game/battle.ts
import { v4 as uuidv4 } from "uuid";
function createBattle(agent1, agent2) {
  return {
    id: uuidv4(),
    agent1: JSON.parse(JSON.stringify(agent1)),
    // Deep copy
    agent2: JSON.parse(JSON.stringify(agent2)),
    turns: [],
    winner_id: null,
    status: "in_progress",
    started_at: Date.now(),
    ended_at: null,
    duration_ms: 0
  };
}
function getActionOrder(battle) {
  const speed1 = battle.agent1.stats.speed + Math.random() * 5;
  const speed2 = battle.agent2.stats.speed + Math.random() * 5;
  return speed1 >= speed2 ? [battle.agent1.id, battle.agent2.id] : [battle.agent2.id, battle.agent1.id];
}
function calculateHitChance(attacker, defender) {
  const baseChance = 0.85;
  const accuracyBonus = (attacker.stats.accuracy - 50) / 100 * 0.15;
  const evasionPenalty = (defender.stats.evasion - 50) / 100 * 0.15;
  const defendBonus = defender.defended ? -0.15 : 0;
  const finalChance = Math.max(0.2, Math.min(0.95, baseChance + accuracyBonus - evasionPenalty + defendBonus));
  return finalChance;
}
function calculateDamage(attacker, defender) {
  const critChance = Math.min(0.25, 0.1 + (attacker.stats.accuracy - 80) / 200);
  const isCritical = Math.random() < critChance;
  let damage = Math.floor(attacker.stats.attack * 1.1) - Math.floor(defender.stats.defense * 0.9);
  const variance = Math.floor(Math.random() * 31 - 15);
  damage += variance;
  if (isCritical) {
    damage = Math.floor(damage * 1.5);
  }
  if (defender.defended) {
    damage = Math.floor(damage * 0.6);
  }
  if (defender.effects.includes("bleed")) {
    damage = Math.floor(damage * 0.85);
  }
  damage = Math.max(1, damage);
  return { damage, critical: isCritical };
}
function applyEffect(agent, effect) {
  if (!agent.effects.includes(effect)) {
    agent.effects.push(effect);
  }
}
function processAttack(attacker, defender, battle) {
  const hitChance = calculateHitChance(attacker, defender);
  const missed = Math.random() > hitChance;
  if (missed) {
    return {
      type: "attack",
      agent_id: attacker.id,
      target_id: defender.id,
      damage: 0,
      critical: false,
      missed: true,
      timestamp: Date.now()
    };
  }
  const { damage, critical } = calculateDamage(attacker, defender);
  defender.stats.current_hp = Math.max(0, defender.stats.current_hp - damage);
  if (critical && Math.random() < 0.3) {
    applyEffect(defender, "bleed");
  }
  return {
    type: "attack",
    agent_id: attacker.id,
    target_id: defender.id,
    damage,
    critical,
    missed: false,
    timestamp: Date.now()
  };
}
function processDefend(agent) {
  agent.defended = true;
  return {
    type: "defend",
    agent_id: agent.id,
    target_id: agent.id,
    critical: false,
    missed: false,
    timestamp: Date.now()
  };
}
function applyEndOfTurnEffects(agent) {
  let damageDealt = 0;
  if (agent.effects.includes("bleed")) {
    const bleedDamage = Math.floor(agent.stats.max_hp * 0.05);
    agent.stats.current_hp = Math.max(0, agent.stats.current_hp - bleedDamage);
    damageDealt += bleedDamage;
  }
  if (agent.effects.includes("burn")) {
    const burnDamage = Math.floor(agent.stats.max_hp * 0.08);
    agent.stats.current_hp = Math.max(0, agent.stats.current_hp - burnDamage);
    damageDealt += burnDamage;
  }
  if (agent.effects.includes("poison")) {
    const poisonDamage = Math.floor(agent.stats.max_hp * 0.03);
    agent.stats.current_hp = Math.max(0, agent.stats.current_hp - poisonDamage);
    damageDealt += poisonDamage;
  }
  agent.defended = false;
  return damageDealt;
}
function checkWinCondition(battle) {
  if (battle.agent1.stats.current_hp <= 0) {
    return battle.agent2.id;
  }
  if (battle.agent2.stats.current_hp <= 0) {
    return battle.agent1.id;
  }
  return null;
}
function processTurn(battle, agent1Action, agent2Action) {
  const turnNumber = battle.turns.length + 1;
  const actions = [];
  const order = getActionOrder(battle);
  for (const agentId of order) {
    const attacker = agentId === battle.agent1.id ? battle.agent1 : battle.agent2;
    const defender = agentId === battle.agent1.id ? battle.agent2 : battle.agent1;
    const action = agentId === battle.agent1.id ? agent1Action : agent2Action;
    if (action.type === "attack") {
      const battleAction = processAttack(attacker, defender, battle);
      actions.push(battleAction);
    } else if (action.type === "defend") {
      const battleAction = processDefend(attacker);
      actions.push(battleAction);
    }
    const winner = checkWinCondition(battle);
    if (winner) {
      battle.winner_id = winner;
      battle.status = "completed";
      battle.ended_at = Date.now();
      battle.duration_ms = battle.ended_at - battle.started_at;
      break;
    }
  }
  if (battle.status !== "completed") {
    applyEndOfTurnEffects(battle.agent1);
    applyEndOfTurnEffects(battle.agent2);
    const winner = checkWinCondition(battle);
    if (winner) {
      battle.winner_id = winner;
      battle.status = "completed";
      battle.ended_at = Date.now();
      battle.duration_ms = battle.ended_at - battle.started_at;
    }
  }
  const turn = {
    turn_number: turnNumber,
    actions,
    timestamp: Date.now()
  };
  battle.turns.push(turn);
  return turn;
}

// src/api/routes/battle.routes.ts
var router4 = Router4();
router4.use(authMiddleware);
router4.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await connection_default.query(
      `SELECT
        b.id, b.agent1_id, b.agent2_id, b.winner_id,
        a1.name as agent1_name, a1.class as agent1_class, u1.username as agent1_user,
        a2.name as agent2_name, a2.class as agent2_class, u2.username as agent2_user,
        b.battle_log, b.duration_ms, b.experience_awarded, b.gold_awarded,
        b.rating_change, b.created_at, b.completed_at, b.status
      FROM battles b
      LEFT JOIN agents a1 ON b.agent1_id = a1.id
      LEFT JOIN agents a2 ON b.agent2_id = a2.id
      LEFT JOIN users u1 ON a1.user_id = u1.id
      LEFT JOIN users u2 ON a2.user_id = u2.id
      WHERE b.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Battle not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router4.get("/user/history", async (req, res) => {
  try {
    const user = req.user;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const result = await connection_default.query(
      `SELECT
        b.id, b.winner_id,
        CASE WHEN b.agent1_id IN (
          SELECT id FROM agents WHERE user_id = $1
        ) THEN a1.name ELSE a2.name END as my_agent,
        CASE WHEN b.agent1_id IN (
          SELECT id FROM agents WHERE user_id = $1
        ) THEN a2.name ELSE a1.name END as opponent_agent,
        CASE WHEN (b.agent1_id IN (
          SELECT id FROM agents WHERE user_id = $1
        ) AND b.winner_id = b.agent1_id) OR
        (b.agent2_id IN (
          SELECT id FROM agents WHERE user_id = $1
        ) AND b.winner_id = b.agent2_id)
        THEN 'win' ELSE 'loss' END as result,
        b.duration_ms, b.experience_awarded, b.gold_awarded,
        b.created_at
      FROM battles b
      LEFT JOIN agents a1 ON b.agent1_id = a1.id
      LEFT JOIN agents a2 ON b.agent2_id = a2.id
      WHERE (a1.user_id = $1 OR a2.user_id = $1) AND b.status = 'completed'
      ORDER BY b.created_at DESC
      LIMIT $2 OFFSET $3`,
      [user.id, limit, offset]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router4.post("/simulate", async (req, res) => {
  try {
    const { agent1_id, agent2_id } = req.body;
    const agents = await connection_default.query(
      "SELECT * FROM agents WHERE id = ANY($1)",
      [[agent1_id, agent2_id]]
    );
    if (agents.rows.length !== 2) {
      return res.status(400).json({ error: "Invalid agents" });
    }
    const agent1Data = agents.rows[0];
    const agent2Data = agents.rows[1];
    const agent1 = {
      id: agent1Data.id,
      user_id: agent1Data.user_id,
      name: agent1Data.name,
      class: agent1Data.class,
      stats: {
        max_hp: agent1Data.max_hp,
        current_hp: agent1Data.max_hp,
        attack: agent1Data.attack,
        defense: agent1Data.defense,
        speed: agent1Data.speed,
        accuracy: agent1Data.accuracy,
        evasion: agent1Data.evasion
      },
      effects: [],
      defended: false
    };
    const agent2 = {
      id: agent2Data.id,
      user_id: agent2Data.user_id,
      name: agent2Data.name,
      class: agent2Data.class,
      stats: {
        max_hp: agent2Data.max_hp,
        current_hp: agent2Data.max_hp,
        attack: agent2Data.attack,
        defense: agent2Data.defense,
        speed: agent2Data.speed,
        accuracy: agent2Data.accuracy,
        evasion: agent2Data.evasion
      },
      effects: [],
      defended: false
    };
    const battle = createBattle(agent1, agent2);
    let maxTurns = 50;
    while (battle.status === "in_progress" && maxTurns > 0) {
      const action1 = Math.random() > 0.8 ? "defend" : "attack";
      const action2 = Math.random() > 0.8 ? "defend" : "attack";
      processTurn(battle, { type: action1 }, { type: action2 });
      maxTurns--;
    }
    res.json(battle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
var battle_routes_default = router4;

// src/api/routes/leaderboard.routes.ts
import { Router as Router5 } from "express";
var router5 = Router5();
router5.get("/", async (req, res) => {
  try {
    const category = req.query.category || "rating";
    const classFilter = req.query.class || "all";
    const search = req.query.search || "";
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const offset = parseInt(req.query.offset) || 0;
    let orderBy;
    switch (category) {
      case "wins":
        orderBy = "COALESCE(l.wins, 0) DESC";
        break;
      case "depth":
        orderBy = "a.level DESC";
        break;
      case "gold":
        orderBy = "COALESCE(l.rating, 1000) DESC";
        break;
      case "rating":
      default:
        orderBy = "COALESCE(l.rating, 1000) DESC";
    }
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    if (classFilter && classFilter !== "all") {
      conditions.push(`a.class = $${paramIndex}`);
      params.push(classFilter);
      paramIndex++;
    }
    if (search) {
      conditions.push(`(u.username ILIKE $${paramIndex} OR a.name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const query2 = `
      SELECT 
        u.id as user_id,
        u.username,
        a.id as agent_id,
        a.name as agent_name,
        a.class,
        a.level,
        COALESCE(l.rating, 1000) as rating,
        COALESCE(l.wins, 0) as wins,
        COALESCE(l.losses, 0) as losses,
        1 as max_depth,
        0 as total_gold,
        CASE WHEN COALESCE(l.wins, 0) + COALESCE(l.losses, 0) > 0 
          THEN ROUND((COALESCE(l.wins, 0)::numeric / (COALESCE(l.wins, 0) + COALESCE(l.losses, 0))) * 100)
          ELSE 0 
        END as win_rate
      FROM users u
      JOIN agents a ON a.user_id = u.id
      LEFT JOIN leaderboard l ON l.user_id = u.id
      ${whereClause}
      ORDER BY ${orderBy}, a.level DESC, u.username ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);
    const result = await connection_default.query(query2, params);
    const leaderboard = result.rows.map((row, index) => ({
      rank: offset + index + 1,
      ...row
    }));
    const countQuery = `
      SELECT COUNT(*) as count
      FROM users u
      JOIN agents a ON a.user_id = u.id
      LEFT JOIN leaderboard l ON l.user_id = u.id
      ${whereClause}
    `;
    const countResult = await connection_default.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT u.id) as total_players,
        SUM(COALESCE(l.wins, 0)) as total_wins,
        MAX(COALESCE(a.max_depth, 1)) as deepest_floor,
        SUM(COALESCE(a.total_gold, 0)) as total_gold_earned
      FROM users u
      JOIN agents a ON a.user_id = u.id
      LEFT JOIN leaderboard l ON l.user_id = u.id
    `;
    const statsResult = await connection_default.query(statsQuery);
    res.json({
      leaderboard,
      pagination: {
        limit,
        offset,
        total
      },
      stats: statsResult.rows[0],
      category
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(400).json({ error: err.message });
  }
});
router5.get("/user/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const userQuery = `
      SELECT 
        u.id as user_id,
        u.username,
        a.id as agent_id,
        a.name as agent_name,
        a.class,
        a.level,
        COALESCE(l.rating, 1000) as rating,
        COALESCE(l.wins, 0) as wins,
        COALESCE(l.losses, 0) as losses,
        COALESCE(a.max_depth, 1) as max_depth,
        COALESCE(a.total_gold, 0) as total_gold
      FROM users u
      JOIN agents a ON a.user_id = u.id
      LEFT JOIN leaderboard l ON l.user_id = u.id
      WHERE u.id = $1
    `;
    const userResult = await connection_default.query(userQuery, [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = userResult.rows[0];
    const rankQueries = {
      rating: `SELECT COUNT(*) + 1 as rank FROM leaderboard WHERE rating > $1`,
      wins: `SELECT COUNT(*) + 1 as rank FROM leaderboard WHERE wins > $1`,
      depth: `SELECT COUNT(*) + 1 as rank FROM agents WHERE max_depth > $1`,
      gold: `SELECT COUNT(*) + 1 as rank FROM agents WHERE total_gold > $1`
    };
    const ranks = {};
    const ratingRank = await connection_default.query(rankQueries.rating, [user.rating]);
    ranks.rating = parseInt(ratingRank.rows[0].rank);
    const winsRank = await connection_default.query(rankQueries.wins, [user.wins]);
    ranks.wins = parseInt(winsRank.rows[0].rank);
    const depthRank = await connection_default.query(rankQueries.depth, [user.max_depth]);
    ranks.depth = parseInt(depthRank.rows[0].rank);
    const goldRank = await connection_default.query(rankQueries.gold, [user.total_gold]);
    ranks.gold = parseInt(goldRank.rows[0].rank);
    const nearbyQuery = `
      SELECT 
        u.id as user_id,
        u.username,
        a.name as agent_name,
        a.class,
        a.level,
        COALESCE(l.rating, 1000) as rating,
        COALESCE(l.wins, 0) as wins,
        COALESCE(l.losses, 0) as losses
      FROM users u
      JOIN agents a ON a.user_id = u.id
      LEFT JOIN leaderboard l ON l.user_id = u.id
      WHERE COALESCE(l.rating, 1000) BETWEEN $1 - 100 AND $1 + 100
      ORDER BY COALESCE(l.rating, 1000) DESC
      LIMIT 11
    `;
    const nearbyResult = await connection_default.query(nearbyQuery, [user.rating]);
    res.json({
      user,
      ranks,
      nearby: nearbyResult.rows
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router5.get("/top/:count", async (req, res) => {
  try {
    const count = Math.min(parseInt(req.params.count) || 10, 100);
    const category = req.query.category || "rating";
    let orderBy;
    switch (category) {
      case "wins":
        orderBy = "COALESCE(l.wins, 0) DESC";
        break;
      case "depth":
        orderBy = "COALESCE(a.max_depth, 0) DESC";
        break;
      case "gold":
        orderBy = "COALESCE(a.total_gold, 0) DESC";
        break;
      case "rating":
      default:
        orderBy = "COALESCE(l.rating, 1000) DESC";
    }
    const query2 = `
      SELECT 
        u.id as user_id,
        u.username,
        a.name as agent_name,
        a.class,
        a.level,
        COALESCE(l.rating, 1000) as rating,
        COALESCE(l.wins, 0) as wins,
        COALESCE(l.losses, 0) as losses,
        COALESCE(a.max_depth, 1) as max_depth,
        COALESCE(a.total_gold, 0) as total_gold
      FROM users u
      JOIN agents a ON a.user_id = u.id
      LEFT JOIN leaderboard l ON l.user_id = u.id
      ORDER BY ${orderBy}, a.level DESC
      LIMIT $1
    `;
    const result = await connection_default.query(query2, [count]);
    const leaderboard = result.rows.map((row, index) => ({
      rank: index + 1,
      ...row
    }));
    res.json(leaderboard);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
var leaderboard_routes_default = router5;

// src/api/routes/costs.routes.ts
import { Router as Router6 } from "express";
var router6 = Router6();
router6.get("/", authMiddleware, async (req, res) => {
  try {
    res.json({
      total_cost: 0,
      daily_cost: 0,
      monthly_cost: 0,
      breakdown: []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
var costs_routes_default = router6;

// src/api/routes/progression.routes.ts
import { Router as Router7 } from "express";

// src/game/loot.ts
import { v4 as uuidv42 } from "uuid";

// src/game/materials.ts
var MATERIALS = {
  // === METALS ===
  iron_ore: {
    id: "iron_ore",
    name: "Iron Ore",
    type: "metal",
    rarity: "common",
    description: "Basic ore for weapon crafting",
    dropRate: 0.3,
    minFloor: 1,
    properties: { attack: 2, defense: 1 }
  },
  steel_ingot: {
    id: "steel_ingot",
    name: "Steel Ingot",
    type: "metal",
    rarity: "uncommon",
    description: "Superior metal for quality gear",
    dropRate: 0.15,
    minFloor: 3,
    properties: { attack: 5, defense: 3 }
  },
  mithril_ore: {
    id: "mithril_ore",
    name: "Mithril Ore",
    type: "metal",
    rarity: "rare",
    description: "Legendary metal with ethereal properties",
    dropRate: 0.08,
    minFloor: 6,
    properties: { attack: 10, defense: 8, speed: 2 }
  },
  adamantite_shard: {
    id: "adamantite_shard",
    name: "Adamantite Shard",
    type: "metal",
    rarity: "epic",
    description: "Unbreakable metal from the deep earth",
    dropRate: 0.04,
    minFloor: 8,
    properties: { attack: 15, defense: 15, accuracy: 5 }
  },
  orichalcum: {
    id: "orichalcum",
    name: "Orichalcum",
    type: "metal",
    rarity: "legendary",
    description: "Divine metal that channels cosmic energy",
    dropRate: 0.01,
    minFloor: 10,
    properties: { attack: 25, defense: 20, speed: 5, accuracy: 10 }
  },
  // === ESSENCES (Magic) ===
  fire_essence: {
    id: "fire_essence",
    name: "Fire Essence",
    type: "essence",
    rarity: "uncommon",
    description: "Captured flame for enchantments",
    dropRate: 0.1,
    minFloor: 2,
    properties: { attack: 3 }
  },
  ice_essence: {
    id: "ice_essence",
    name: "Ice Essence",
    type: "essence",
    rarity: "uncommon",
    description: "Frozen magic for defensive enchantments",
    dropRate: 0.1,
    minFloor: 2,
    properties: { defense: 3 }
  },
  lightning_essence: {
    id: "lightning_essence",
    name: "Lightning Essence",
    type: "essence",
    rarity: "rare",
    description: "Crackling energy for speed enchantments",
    dropRate: 0.08,
    minFloor: 5,
    properties: { speed: 5, attack: 5 }
  },
  shadow_essence: {
    id: "shadow_essence",
    name: "Shadow Essence",
    type: "essence",
    rarity: "epic",
    description: "Darkness embodied, grants evasion",
    dropRate: 0.05,
    minFloor: 7,
    properties: { evasion: 10, accuracy: 3 }
  },
  arcane_essence: {
    id: "arcane_essence",
    name: "Arcane Essence",
    type: "essence",
    rarity: "legendary",
    description: "Pure magic that transcends elements",
    dropRate: 0.02,
    minFloor: 9,
    properties: { attack: 10, defense: 10, accuracy: 10 }
  },
  // === CRYSTALS ===
  quartz_crystal: {
    id: "quartz_crystal",
    name: "Quartz Crystal",
    type: "crystal",
    rarity: "common",
    description: "Basic crystal for reinforcement",
    dropRate: 0.25,
    minFloor: 1,
    properties: { defense: 2 }
  },
  amethyst_crystal: {
    id: "amethyst_crystal",
    name: "Amethyst Crystal",
    type: "crystal",
    rarity: "uncommon",
    description: "Purple crystal enhancing magical power",
    dropRate: 0.12,
    minFloor: 4,
    properties: { attack: 4, accuracy: 2 }
  },
  sapphire_gem: {
    id: "sapphire_gem",
    name: "Sapphire Gem",
    type: "crystal",
    rarity: "rare",
    description: "Blue gem granting water resistance",
    dropRate: 0.06,
    minFloor: 5,
    properties: { defense: 8, speed: 2 }
  },
  emerald_gem: {
    id: "emerald_gem",
    name: "Emerald Gem",
    type: "crystal",
    rarity: "epic",
    description: "Green gem of vitality and growth",
    dropRate: 0.03,
    minFloor: 7,
    properties: { defense: 12, accuracy: 5 }
  },
  diamond_core: {
    id: "diamond_core",
    name: "Diamond Core",
    type: "crystal",
    rarity: "legendary",
    description: "Hardest substance, ultimate defense",
    dropRate: 0.01,
    minFloor: 10,
    properties: { defense: 25, attack: 10 }
  },
  // === SPECIAL ===
  dragon_scale: {
    id: "dragon_scale",
    name: "Dragon Scale",
    type: "gem",
    rarity: "epic",
    description: "Shed scale from an ancient dragon",
    dropRate: 0.02,
    minFloor: 9,
    properties: { defense: 15, attack: 10 }
  },
  void_shard: {
    id: "void_shard",
    name: "Void Shard",
    type: "catalyst",
    rarity: "legendary",
    description: "Fragment of the void itself",
    dropRate: 5e-3,
    minFloor: 10,
    properties: { attack: 20, evasion: 15 }
  }
};

// src/game/loot.ts
var RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary", "mythic"];
var RARITY_WEIGHTS = {
  common: 5500,
  uncommon: 2500,
  rare: 1200,
  epic: 550,
  legendary: 200,
  mythic: 50
};
var MAX_AFFIXES = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 6
};
var RARITY_STAT_MULT = {
  common: 1,
  uncommon: 1.2,
  rare: 1.5,
  epic: 1.9,
  legendary: 2.5,
  mythic: 3.5
};
var RARITY_VALUE_MULT = {
  common: 1,
  uncommon: 2,
  rare: 5,
  epic: 12,
  legendary: 30,
  mythic: 100
};
function getRarityIndex(r) {
  return RARITY_ORDER.indexOf(r);
}
var PREFIX_POOL = [
  // Tier 1 – Common
  { id: "sturdy", name: "Sturdy", slot: "prefix", tier: 1, rarity: "common", bonuses: { defense: 3 }, description: "Slightly reinforced" },
  { id: "keen", name: "Keen", slot: "prefix", tier: 1, rarity: "common", bonuses: { attack: 3 }, description: "Sharpened edge" },
  { id: "quick", name: "Quick", slot: "prefix", tier: 1, rarity: "common", bonuses: { speed: 2 }, description: "Light and agile" },
  { id: "tough", name: "Tough", slot: "prefix", tier: 1, rarity: "common", bonuses: { hp: 15 }, description: "Durable construction" },
  // Tier 2 – Uncommon
  { id: "mighty", name: "Mighty", slot: "prefix", tier: 2, rarity: "uncommon", bonuses: { attack: 6, critChance: 2 }, description: "Empowered with force" },
  { id: "reinforced", name: "Reinforced", slot: "prefix", tier: 2, rarity: "uncommon", bonuses: { defense: 6, hp: 10 }, description: "Extra protective layers" },
  { id: "swift", name: "Swift", slot: "prefix", tier: 2, rarity: "uncommon", bonuses: { speed: 5, accuracy: 3 }, description: "Fast and precise" },
  { id: "flaming", name: "Flaming", slot: "prefix", tier: 2, rarity: "uncommon", bonuses: { attack: 8 }, damageType: "fire", visualEffect: "fire", description: "Wreathed in flames" },
  { id: "frozen", name: "Frozen", slot: "prefix", tier: 2, rarity: "uncommon", bonuses: { defense: 8, speed: -1 }, damageType: "ice", visualEffect: "ice", description: "Coated in frost" },
  // Tier 3 – Rare
  { id: "thundering", name: "Thundering", slot: "prefix", tier: 3, rarity: "rare", bonuses: { attack: 10, speed: 8, critChance: 5 }, damageType: "lightning", visualEffect: "lightning", description: "Crackles with lightning" },
  { id: "shadow", name: "Shadow", slot: "prefix", tier: 3, rarity: "rare", bonuses: { evasion: 10, accuracy: 5, critDamage: 15 }, damageType: "shadow", visualEffect: "shadow", description: "Shrouded in darkness" },
  { id: "vampiric", name: "Vampiric", slot: "prefix", tier: 3, rarity: "rare", bonuses: { attack: 7, lifeSteal: 5 }, description: "Drains life force" },
  { id: "thorned", name: "Thorned", slot: "prefix", tier: 3, rarity: "rare", bonuses: { defense: 5, thorns: 8 }, description: "Reflects damage to attackers" },
  // Tier 4 – Epic
  { id: "arcane", name: "Arcane", slot: "prefix", tier: 4, rarity: "epic", bonuses: { attack: 12, defense: 8, accuracy: 10, critChance: 8 }, damageType: "arcane", visualEffect: "arcane", description: "Infused with pure magic" },
  { id: "draconic", name: "Draconic", slot: "prefix", tier: 4, rarity: "epic", bonuses: { attack: 15, defense: 10, hp: 25 }, damageType: "fire", visualEffect: "fire", description: "Forged in dragonfire" },
  { id: "abyssal", name: "Abyssal", slot: "prefix", tier: 4, rarity: "epic", bonuses: { attack: 14, evasion: 8, lifeSteal: 8 }, damageType: "shadow", visualEffect: "shadow", description: "From the depths of the abyss" },
  // Tier 5 – Legendary / Mythic
  { id: "divine", name: "Divine", slot: "prefix", tier: 5, rarity: "legendary", bonuses: { attack: 20, defense: 15, speed: 10, hp: 40 }, damageType: "holy", visualEffect: "holy", description: "Blessed by the gods" },
  { id: "primordial", name: "Primordial", slot: "prefix", tier: 5, rarity: "legendary", bonuses: { attack: 25, critChance: 12, critDamage: 30, lifeSteal: 5 }, description: "Power from creation itself" },
  { id: "cosmic", name: "Cosmic", slot: "prefix", tier: 5, rarity: "mythic", bonuses: { attack: 30, defense: 20, speed: 15, accuracy: 15, critChance: 15, critDamage: 40 }, visualEffect: "cosmic", description: "Channeling stellar energy" }
];
var SUFFIX_POOL = [
  // Tier 1 – Common
  { id: "of_strength", name: "of Strength", slot: "suffix", tier: 1, rarity: "common", bonuses: { attack: 3 }, description: "Grants physical power" },
  { id: "of_iron", name: "of Iron", slot: "suffix", tier: 1, rarity: "common", bonuses: { defense: 3 }, description: "Hard as iron" },
  { id: "of_the_wind", name: "of the Wind", slot: "suffix", tier: 1, rarity: "common", bonuses: { speed: 2 }, description: "Light as the breeze" },
  // Tier 2 – Uncommon
  { id: "of_precision", name: "of Precision", slot: "suffix", tier: 2, rarity: "uncommon", bonuses: { accuracy: 8, critChance: 3 }, description: "Deadly precision" },
  { id: "of_haste", name: "of Haste", slot: "suffix", tier: 2, rarity: "uncommon", bonuses: { speed: 6, evasion: 3 }, description: "Enhances agility" },
  { id: "of_vitality", name: "of Vitality", slot: "suffix", tier: 2, rarity: "uncommon", bonuses: { hp: 25, defense: 2 }, description: "Grants life force" },
  { id: "of_evasion", name: "of Evasion", slot: "suffix", tier: 2, rarity: "uncommon", bonuses: { evasion: 8 }, description: "Grants dodge chance" },
  // Tier 3 – Rare
  { id: "of_the_warrior", name: "of the Warrior", slot: "suffix", tier: 3, rarity: "rare", bonuses: { attack: 10, defense: 5, critDamage: 10 }, description: "Empowers warriors" },
  { id: "of_the_guardian", name: "of the Guardian", slot: "suffix", tier: 3, rarity: "rare", bonuses: { defense: 12, hp: 20, thorns: 5 }, description: "Steadfast protection" },
  { id: "of_the_hunter", name: "of the Hunter", slot: "suffix", tier: 3, rarity: "rare", bonuses: { accuracy: 10, critChance: 8, speed: 3 }, description: "Predator instincts" },
  { id: "of_fortune", name: "of Fortune", slot: "suffix", tier: 3, rarity: "rare", bonuses: { magicFind: 15, evasion: 5 }, description: "Luck favors the bold" },
  // Tier 4 – Epic
  { id: "of_the_titan", name: "of the Titan", slot: "suffix", tier: 4, rarity: "epic", bonuses: { attack: 15, defense: 10, hp: 30, critDamage: 20 }, description: "Titan-forged" },
  { id: "of_the_phantom", name: "of the Phantom", slot: "suffix", tier: 4, rarity: "epic", bonuses: { evasion: 15, speed: 8, critChance: 10, lifeSteal: 3 }, description: "Ghostly agility" },
  { id: "of_the_archmage", name: "of the Archmage", slot: "suffix", tier: 4, rarity: "epic", bonuses: { accuracy: 15, magicFind: 20, critChance: 8 }, description: "Supreme magical knowledge" },
  // Tier 5 – Legendary / Mythic
  { id: "of_infinity", name: "of Infinity", slot: "suffix", tier: 5, rarity: "legendary", bonuses: { attack: 15, defense: 15, accuracy: 10, evasion: 10, critChance: 10, critDamage: 25 }, description: "Limitless power" },
  { id: "of_the_gods", name: "of the Gods", slot: "suffix", tier: 5, rarity: "legendary", bonuses: { attack: 20, defense: 20, hp: 50, magicFind: 25 }, description: "Divinely empowered" },
  { id: "of_oblivion", name: "of Oblivion", slot: "suffix", tier: 5, rarity: "mythic", bonuses: { attack: 25, critChance: 15, critDamage: 50, lifeSteal: 10, magicFind: 30 }, description: "Annihilating force" }
];
var BASE_WEAPONS = [
  { id: "iron_sword", name: "Iron Sword", type: "weapon", baseStats: { attack: 5 }, basePrice: 80, requiredLevel: 1 },
  { id: "steel_blade", name: "Steel Blade", type: "weapon", baseStats: { attack: 8, accuracy: 2 }, basePrice: 150, requiredLevel: 3 },
  { id: "war_axe", name: "War Axe", type: "weapon", baseStats: { attack: 12, critDamage: 10 }, basePrice: 250, requiredLevel: 5 },
  { id: "battle_staff", name: "Battle Staff", type: "weapon", baseStats: { attack: 7, accuracy: 5, speed: 3 }, basePrice: 200, requiredLevel: 4 },
  { id: "longbow", name: "Longbow", type: "weapon", baseStats: { attack: 9, accuracy: 8 }, basePrice: 220, requiredLevel: 4 },
  { id: "curved_dagger", name: "Curved Dagger", type: "weapon", baseStats: { attack: 6, speed: 5, critChance: 5 }, basePrice: 180, requiredLevel: 3 },
  { id: "great_hammer", name: "Great Hammer", type: "weapon", baseStats: { attack: 15, speed: -3, critDamage: 15 }, basePrice: 300, requiredLevel: 6 },
  { id: "runic_wand", name: "Runic Wand", type: "weapon", baseStats: { attack: 10, accuracy: 10, critChance: 3 }, basePrice: 350, requiredLevel: 7 },
  { id: "obsidian_blade", name: "Obsidian Blade", type: "weapon", baseStats: { attack: 18, critChance: 5, critDamage: 20 }, basePrice: 500, requiredLevel: 9 },
  { id: "void_scythe", name: "Void Scythe", type: "weapon", baseStats: { attack: 22, lifeSteal: 3, critDamage: 25 }, basePrice: 700, requiredLevel: 10 }
];
var BASE_ARMORS = [
  { id: "leather_vest", name: "Leather Vest", type: "armor", baseStats: { defense: 4, speed: 1 }, basePrice: 60, requiredLevel: 1 },
  { id: "iron_mail", name: "Iron Mail", type: "armor", baseStats: { defense: 8 }, basePrice: 140, requiredLevel: 3 },
  { id: "steel_plate", name: "Steel Plate", type: "armor", baseStats: { defense: 12, speed: -2 }, basePrice: 250, requiredLevel: 5 },
  { id: "chain_hauberk", name: "Chain Hauberk", type: "armor", baseStats: { defense: 10, evasion: 3 }, basePrice: 200, requiredLevel: 4 },
  { id: "mage_robe", name: "Mage Robe", type: "armor", baseStats: { defense: 5, speed: 3, accuracy: 3 }, basePrice: 180, requiredLevel: 4 },
  { id: "scale_armor", name: "Scale Armor", type: "armor", baseStats: { defense: 15, hp: 15 }, basePrice: 350, requiredLevel: 6 },
  { id: "enchanted_plate", name: "Enchanted Plate", type: "armor", baseStats: { defense: 18, hp: 20, thorns: 3 }, basePrice: 500, requiredLevel: 8 },
  { id: "shadow_cloak", name: "Shadow Cloak", type: "armor", baseStats: { defense: 8, evasion: 12, speed: 5 }, basePrice: 450, requiredLevel: 7 },
  { id: "dragonscale_mail", name: "Dragonscale Mail", type: "armor", baseStats: { defense: 22, hp: 30 }, basePrice: 650, requiredLevel: 9 },
  { id: "void_vestments", name: "Void Vestments", type: "armor", baseStats: { defense: 20, evasion: 10, lifeSteal: 2 }, basePrice: 700, requiredLevel: 10 }
];
var BASE_ACCESSORIES = [
  { id: "copper_ring", name: "Copper Ring", type: "accessory", baseStats: { attack: 2 }, basePrice: 40, requiredLevel: 1 },
  { id: "silver_ring", name: "Silver Ring", type: "accessory", baseStats: { speed: 3 }, basePrice: 80, requiredLevel: 2 },
  { id: "jade_amulet", name: "Jade Amulet", type: "accessory", baseStats: { accuracy: 5, evasion: 3 }, basePrice: 150, requiredLevel: 3 },
  { id: "gold_bracers", name: "Gold Bracers", type: "accessory", baseStats: { defense: 4, attack: 3 }, basePrice: 200, requiredLevel: 4 },
  { id: "ruby_pendant", name: "Ruby Pendant", type: "accessory", baseStats: { attack: 6, critChance: 3 }, basePrice: 280, requiredLevel: 5 },
  { id: "sapphire_crown", name: "Sapphire Crown", type: "accessory", baseStats: { defense: 6, hp: 20 }, basePrice: 320, requiredLevel: 6 },
  { id: "emerald_cloak", name: "Emerald Cloak", type: "accessory", baseStats: { evasion: 8, magicFind: 10 }, basePrice: 400, requiredLevel: 7 },
  { id: "obsidian_belt", name: "Obsidian Belt", type: "accessory", baseStats: { defense: 5, hp: 15, thorns: 5 }, basePrice: 350, requiredLevel: 6 },
  { id: "phoenix_feather", name: "Phoenix Feather", type: "accessory", baseStats: { speed: 8, critChance: 5, lifeSteal: 2 }, basePrice: 500, requiredLevel: 8 },
  { id: "void_gem", name: "Void Gem", type: "accessory", baseStats: { attack: 10, accuracy: 8, critDamage: 15 }, basePrice: 600, requiredLevel: 9 }
];
var BASE_CONSUMABLES = [
  { id: "health_potion", name: "Health Potion", type: "consumable", baseStats: { hp: 50 }, basePrice: 30, requiredLevel: 1 },
  { id: "greater_health_potion", name: "Greater Health Potion", type: "consumable", baseStats: { hp: 120 }, basePrice: 80, requiredLevel: 5 },
  { id: "elixir_of_power", name: "Elixir of Power", type: "consumable", baseStats: { attack: 10 }, basePrice: 100, requiredLevel: 3, flavorText: "Temporarily boosts attack" },
  { id: "elixir_of_iron", name: "Elixir of Iron", type: "consumable", baseStats: { defense: 10 }, basePrice: 100, requiredLevel: 3, flavorText: "Temporarily boosts defense" },
  { id: "elixir_of_haste", name: "Elixir of Haste", type: "consumable", baseStats: { speed: 10 }, basePrice: 100, requiredLevel: 3, flavorText: "Temporarily boosts speed" },
  { id: "scroll_of_fortune", name: "Scroll of Fortune", type: "consumable", baseStats: { magicFind: 50 }, basePrice: 200, requiredLevel: 5, flavorText: "Increases loot quality for one encounter" }
];
var BASE_ITEM_POOLS = {
  weapon: BASE_WEAPONS,
  armor: BASE_ARMORS,
  accessory: BASE_ACCESSORIES,
  consumable: BASE_CONSUMABLES
};
var UNIQUE_ITEMS = [
  {
    id: "excalibur",
    name: "Excalibur",
    type: "weapon",
    fixedStats: { attack: 40, accuracy: 15, critChance: 10, critDamage: 30, hp: 25 },
    fixedAffixes: ["divine"],
    damageType: "holy",
    visualEffect: "holy",
    flavorText: "The blade that chose its wielder, forged in the light of a dying star.",
    price: 1e4,
    requiredLevel: 10,
    dropWeight: 5,
    minFloor: 8
  },
  {
    id: "frostmourne",
    name: "Frostmourne",
    type: "weapon",
    fixedStats: { attack: 35, lifeSteal: 10, critChance: 8, speed: -2 },
    fixedAffixes: ["frozen"],
    damageType: "ice",
    visualEffect: "ice",
    flavorText: "Whomever wields this blade shall command the dead.",
    price: 9e3,
    requiredLevel: 9,
    dropWeight: 5,
    minFloor: 7
  },
  {
    id: "thunderfury",
    name: "Thunderfury, Blessed Blade of the Windseeker",
    type: "weapon",
    fixedStats: { attack: 30, speed: 12, accuracy: 10, critChance: 12 },
    fixedAffixes: ["thundering"],
    damageType: "lightning",
    visualEffect: "lightning",
    flavorText: "Did someone say [Thunderfury]?",
    price: 9500,
    requiredLevel: 9,
    dropWeight: 4,
    minFloor: 8
  },
  {
    id: "aegis_of_the_immortal",
    name: "Aegis of the Immortal",
    type: "armor",
    fixedStats: { defense: 45, hp: 60, thorns: 10, lifeSteal: 3 },
    fixedAffixes: ["divine"],
    damageType: "holy",
    visualEffect: "holy",
    flavorText: "An impenetrable shield said to have turned aside the wrath of gods.",
    price: 12e3,
    requiredLevel: 10,
    dropWeight: 4,
    minFloor: 9
  },
  {
    id: "shadow_mantle",
    name: "Shadow Mantle",
    type: "armor",
    fixedStats: { defense: 20, evasion: 25, speed: 10, critChance: 8 },
    fixedAffixes: ["shadow"],
    damageType: "shadow",
    visualEffect: "shadow",
    flavorText: "Woven from the fabric of midnight itself.",
    price: 8e3,
    requiredLevel: 8,
    dropWeight: 6,
    minFloor: 6
  },
  {
    id: "eye_of_eternity",
    name: "Eye of Eternity",
    type: "accessory",
    fixedStats: { attack: 15, defense: 10, accuracy: 15, magicFind: 40, critChance: 8 },
    fixedAffixes: ["arcane"],
    damageType: "arcane",
    visualEffect: "arcane",
    flavorText: "Gazing into its depths reveals every timeline at once.",
    price: 15e3,
    requiredLevel: 10,
    dropWeight: 3,
    minFloor: 9
  },
  {
    id: "ring_of_the_leech_king",
    name: "Ring of the Leech King",
    type: "accessory",
    fixedStats: { attack: 12, lifeSteal: 15, critChance: 5, hp: 30 },
    fixedAffixes: ["vampiric"],
    damageType: "shadow",
    visualEffect: "shadow",
    flavorText: "Its previous owner never truly died.",
    price: 7e3,
    requiredLevel: 7,
    dropWeight: 6,
    minFloor: 5
  }
];
var ITEM_SETS = [
  {
    id: "dragonslayer",
    name: "Dragonslayer's Regalia",
    pieces: ["dragonslayer_blade", "dragonslayer_plate", "dragonslayer_helm"],
    setBonuses: [
      { piecesRequired: 2, bonuses: { attack: 10, defense: 10 }, description: "+10 ATK, +10 DEF" },
      { piecesRequired: 3, bonuses: { critChance: 15, critDamage: 30, hp: 40 }, description: "+15% Crit, +30% Crit DMG, +40 HP" }
    ]
  },
  {
    id: "shadow_assassin",
    name: "Shadow Assassin's Garb",
    pieces: ["shadow_fang", "shadow_mantle", "shadow_band"],
    setBonuses: [
      { piecesRequired: 2, bonuses: { evasion: 15, speed: 8 }, description: "+15 EVA, +8 SPD" },
      { piecesRequired: 3, bonuses: { critChance: 20, lifeSteal: 8, magicFind: 15 }, description: "+20% Crit, +8% Lifesteal, +15% MF" }
    ]
  },
  {
    id: "arcane_scholar",
    name: "Arcane Scholar's Vestments",
    pieces: ["arcane_staff", "arcane_robe", "eye_of_eternity"],
    setBonuses: [
      { piecesRequired: 2, bonuses: { accuracy: 15, magicFind: 20 }, description: "+15 ACC, +20% MF" },
      { piecesRequired: 3, bonuses: { attack: 20, critDamage: 40, hp: 30 }, description: "+20 ATK, +40% Crit DMG, +30 HP" }
    ]
  }
];
var SET_PIECE_DEFS = [
  // Dragonslayer set
  { id: "dragonslayer_blade", name: "Dragonslayer's Blade", type: "weapon", fixedStats: { attack: 28, critChance: 8, critDamage: 20 }, fixedAffixes: ["draconic"], damageType: "fire", visualEffect: "fire", flavorText: "Bathed in the blood of a hundred dragons.", price: 6e3, requiredLevel: 8, dropWeight: 8, minFloor: 7 },
  { id: "dragonslayer_plate", name: "Dragonslayer's Plate", type: "armor", fixedStats: { defense: 30, hp: 40, thorns: 5 }, fixedAffixes: ["draconic"], damageType: "fire", visualEffect: "fire", flavorText: "Forged from dragon bones and tempered in flame.", price: 6e3, requiredLevel: 8, dropWeight: 8, minFloor: 7 },
  { id: "dragonslayer_helm", name: "Dragonslayer's Helm", type: "accessory", fixedStats: { defense: 12, attack: 8, hp: 25, critDamage: 15 }, fixedAffixes: ["draconic"], damageType: "fire", visualEffect: "fire", flavorText: "The visage of the beast, claimed as a trophy.", price: 5e3, requiredLevel: 8, dropWeight: 8, minFloor: 7 },
  // Shadow Assassin set
  { id: "shadow_fang", name: "Shadow Fang", type: "weapon", fixedStats: { attack: 20, speed: 10, critChance: 12, lifeSteal: 3 }, fixedAffixes: ["shadow"], damageType: "shadow", visualEffect: "shadow", flavorText: "It strikes before you see it.", price: 5500, requiredLevel: 7, dropWeight: 8, minFloor: 6 },
  { id: "shadow_band", name: "Shadow Band", type: "accessory", fixedStats: { evasion: 12, speed: 6, critChance: 8, magicFind: 10 }, fixedAffixes: ["shadow"], damageType: "shadow", visualEffect: "shadow", flavorText: "Slip between the cracks of reality.", price: 4500, requiredLevel: 7, dropWeight: 8, minFloor: 6 },
  // Arcane Scholar set
  { id: "arcane_staff", name: "Staff of the Archmage", type: "weapon", fixedStats: { attack: 22, accuracy: 15, critChance: 6, magicFind: 15 }, fixedAffixes: ["arcane"], damageType: "arcane", visualEffect: "arcane", flavorText: "Knowledge is the ultimate weapon.", price: 5500, requiredLevel: 8, dropWeight: 8, minFloor: 7 },
  { id: "arcane_robe", name: "Robe of the Archmage", type: "armor", fixedStats: { defense: 15, accuracy: 12, hp: 25, magicFind: 20 }, fixedAffixes: ["arcane"], damageType: "arcane", visualEffect: "arcane", flavorText: "Woven with threads of pure mana.", price: 5500, requiredLevel: 8, dropWeight: 8, minFloor: 7 }
];
var ALL_UNIQUES = [...UNIQUE_ITEMS, ...SET_PIECE_DEFS];
var ENEMY_LOOT_TABLES = {
  goblin: {
    id: "goblin",
    name: "Goblin Loot",
    entries: [
      { weight: 60, itemPool: "weapon", maxAffixes: 1 },
      { weight: 30, itemPool: "consumable", maxAffixes: 0 },
      { weight: 10, itemPool: "accessory", maxAffixes: 1 }
    ],
    goldRange: [30, 80],
    xpRange: [60, 120],
    bonusDropChance: 0.1
  },
  skeleton: {
    id: "skeleton",
    name: "Skeleton Loot",
    entries: [
      { weight: 50, itemPool: "weapon", maxAffixes: 1 },
      { weight: 40, itemPool: "armor", maxAffixes: 1 },
      { weight: 10, itemPool: "accessory", maxAffixes: 1 }
    ],
    goldRange: [50, 100],
    xpRange: [100, 180],
    bonusDropChance: 0.15
  },
  orc: {
    id: "orc",
    name: "Orc Loot",
    entries: [
      { weight: 45, itemPool: "weapon", maxAffixes: 2 },
      { weight: 35, itemPool: "armor", maxAffixes: 2 },
      { weight: 15, itemPool: "consumable", maxAffixes: 0 },
      { weight: 5, itemPool: "accessory", maxAffixes: 1 }
    ],
    goldRange: [80, 150],
    xpRange: [180, 300],
    bonusDropChance: 0.2
  },
  wraith: {
    id: "wraith",
    name: "Wraith Loot",
    entries: [
      { weight: 30, itemPool: "weapon", maxAffixes: 2 },
      { weight: 20, itemPool: "armor", maxAffixes: 2 },
      { weight: 30, itemPool: "accessory", maxAffixes: 2 },
      { weight: 20, itemPool: "consumable", maxAffixes: 0 }
    ],
    goldRange: [100, 200],
    xpRange: [300, 500],
    bonusDropChance: 0.25
  },
  boss_skeleton: {
    id: "boss_skeleton",
    name: "Skeletal Lord Loot",
    entries: [
      { weight: 35, itemPool: "weapon", minAffixes: 1, maxAffixes: 3 },
      { weight: 35, itemPool: "armor", minAffixes: 1, maxAffixes: 3 },
      { weight: 20, itemPool: "accessory", minAffixes: 1, maxAffixes: 2 },
      { weight: 10, itemPool: "consumable", maxAffixes: 0 }
    ],
    guaranteedDrops: 2,
    goldRange: [300, 600],
    xpRange: [800, 1200],
    bonusDropChance: 0.4
  },
  boss_dragon: {
    id: "boss_dragon",
    name: "Ancient Dragon Loot",
    entries: [
      { weight: 30, itemPool: "weapon", minAffixes: 2, maxAffixes: 4 },
      { weight: 30, itemPool: "armor", minAffixes: 2, maxAffixes: 4 },
      { weight: 25, itemPool: "accessory", minAffixes: 1, maxAffixes: 3 },
      { weight: 15, itemPool: "consumable", maxAffixes: 0 }
    ],
    guaranteedDrops: 3,
    goldRange: [700, 1200],
    xpRange: [2e3, 3e3],
    bonusDropChance: 0.5
  },
  boss_lich: {
    id: "boss_lich",
    name: "Lich King Loot",
    entries: [
      { weight: 25, itemPool: "weapon", minAffixes: 2, maxAffixes: 4 },
      { weight: 25, itemPool: "armor", minAffixes: 2, maxAffixes: 4 },
      { weight: 30, itemPool: "accessory", minAffixes: 2, maxAffixes: 3 },
      { weight: 20, itemPool: "consumable", maxAffixes: 0 }
    ],
    guaranteedDrops: 3,
    goldRange: [600, 1e3],
    xpRange: [1600, 2400],
    bonusDropChance: 0.5
  }
};
var ZONE_LOOT_MODIFIERS = {
  boss_chamber: { rarityBoost: 1.5, bonusMaterials: ["adamantite_shard", "dragon_scale"], bonusDropChance: 0.3 },
  treasure_vault: { rarityBoost: 2, bonusMaterials: ["diamond_core", "arcane_essence"], bonusDropChance: 0.5 },
  cursed_hall: { rarityBoost: 1.4, bonusMaterials: ["shadow_essence", "void_shard"], bonusDropChance: 0.2 },
  dragon_lair: { rarityBoost: 1.8, bonusMaterials: ["dragon_scale", "orichalcum"], bonusDropChance: 0.4 },
  arcane_sanctum: { rarityBoost: 1.7, bonusMaterials: ["arcane_essence", "emerald_gem"], bonusDropChance: 0.35 },
  shadow_den: { rarityBoost: 1.6, bonusMaterials: ["shadow_essence", "sapphire_gem"], bonusDropChance: 0.25 }
};
function rollRarity(rng, ctx) {
  const mfMult = 1 + ctx.magicFind / 100;
  const zoneMult = ctx.rarityBoost;
  const weights = RARITY_ORDER.map((r) => {
    let w = RARITY_WEIGHTS[r];
    if (r !== "common") {
      w = Math.round(w * mfMult * zoneMult);
    }
    return [r, w];
  });
  const totalWeight = weights.reduce((s, [, w]) => s + w, 0);
  let roll = Math.floor(rng() * totalWeight);
  for (const [rarity, weight] of weights) {
    roll -= weight;
    if (roll < 0)
      return rarity;
  }
  return "common";
}
function selectBaseItem(type, ctx, rng) {
  const pool2 = BASE_ITEM_POOLS[type];
  const eligible = pool2.filter((t) => t.requiredLevel <= ctx.playerLevel + 2);
  if (eligible.length === 0)
    return pool2[0];
  const weighted = eligible.map((t) => ({
    template: t,
    weight: 1 + Math.max(0, t.requiredLevel - 1) * (ctx.depth / 5)
  }));
  const totalWeight = weighted.reduce((s, w) => s + w.weight, 0);
  let roll = rng() * totalWeight;
  for (const w of weighted) {
    roll -= w.weight;
    if (roll <= 0)
      return w.template;
  }
  return eligible[eligible.length - 1];
}
function rollAffixes(rarity, itemLevel, rng, minAffixes, maxAffixesOverride, guaranteedAffixId) {
  const maxAllowed = maxAffixesOverride !== void 0 ? Math.min(maxAffixesOverride, MAX_AFFIXES[rarity]) : MAX_AFFIXES[rarity];
  if (maxAllowed <= 0)
    return [];
  const min = minAffixes ?? (getRarityIndex(rarity) >= 3 ? 1 : 0);
  const count = Math.max(min, Math.floor(rng() * (maxAllowed + 1)));
  if (count <= 0)
    return [];
  const affixes = [];
  const usedIds = /* @__PURE__ */ new Set();
  if (guaranteedAffixId) {
    const found = [...PREFIX_POOL, ...SUFFIX_POOL].find((a) => a.id === guaranteedAffixId);
    if (found) {
      affixes.push(found);
      usedIds.add(found.id);
    }
  }
  const maxTier = Math.min(5, Math.ceil(itemLevel / 2));
  for (let i = affixes.length; i < count; i++) {
    const wantPrefix = i % 2 === 0;
    const pool2 = wantPrefix ? PREFIX_POOL : SUFFIX_POOL;
    const rarityIdx = getRarityIndex(rarity);
    const eligible = pool2.filter(
      (a) => a.tier <= maxTier && !usedIds.has(a.id) && getRarityIndex(a.rarity) <= rarityIdx + 1
    );
    if (eligible.length === 0)
      continue;
    const weighted = eligible.map((a) => ({
      affix: a,
      weight: a.tier === maxTier ? 3 : getRarityIndex(a.rarity) === rarityIdx ? 2 : 1
    }));
    const totalW = weighted.reduce((s, w) => s + w.weight, 0);
    let roll = rng() * totalW;
    for (const w of weighted) {
      roll -= w.weight;
      if (roll <= 0) {
        affixes.push(w.affix);
        usedIds.add(w.affix.id);
        break;
      }
    }
  }
  return affixes;
}
function buildItem(base, rarity, affixes, itemLevel) {
  const statMult = RARITY_STAT_MULT[rarity];
  const stats = {};
  for (const [key, val] of Object.entries(base.baseStats)) {
    stats[key] = Math.round(val * statMult);
  }
  for (const affix of affixes) {
    for (const [key, val] of Object.entries(affix.bonuses)) {
      stats[key] = (stats[key] || 0) + val;
    }
  }
  const prefixes = affixes.filter((a) => a.slot === "prefix");
  const suffixes = affixes.filter((a) => a.slot === "suffix");
  const prefixStr = prefixes.map((a) => a.name).join(" ");
  const suffixStr = suffixes.map((a) => a.name).join(" ");
  const name = [prefixStr, base.name, suffixStr].filter(Boolean).join(" ");
  const price = Math.round(base.basePrice * RARITY_VALUE_MULT[rarity] * (1 + affixes.length * 0.3));
  const visualAffix = affixes.filter((a) => a.visualEffect).sort((a, b) => b.tier - a.tier)[0];
  return {
    id: uuidv42(),
    name,
    type: base.type,
    rarity,
    itemLevel,
    stats,
    affixes,
    damageType: visualAffix?.damageType,
    visualEffect: visualAffix?.visualEffect,
    flavorText: base.flavorText,
    price,
    requiredLevel: base.requiredLevel
  };
}
function tryUniqueItem(ctx, rng) {
  const basePct = ctx.isBoss ? 0.08 : 0.02;
  const mfBonus = ctx.magicFind / 1e3;
  const uniqueChance = basePct + mfBonus;
  if (rng() > uniqueChance)
    return null;
  const eligible = ALL_UNIQUES.filter((u) => u.minFloor <= ctx.depth);
  if (eligible.length === 0)
    return null;
  const totalWeight = eligible.reduce((s, u) => s + u.dropWeight, 0);
  let roll = rng() * totalWeight;
  let chosen = null;
  for (const u of eligible) {
    roll -= u.dropWeight;
    if (roll <= 0) {
      chosen = u;
      break;
    }
  }
  if (!chosen)
    return null;
  const affixes = [];
  for (const affixId of chosen.fixedAffixes) {
    const found = [...PREFIX_POOL, ...SUFFIX_POOL].find((a) => a.id === affixId);
    if (found)
      affixes.push(found);
  }
  const setId = ITEM_SETS.find((s) => s.pieces.includes(chosen.id))?.id;
  const item = {
    id: uuidv42(),
    name: chosen.name,
    type: chosen.type,
    rarity: "legendary",
    itemLevel: ctx.depth + ctx.playerLevel,
    stats: { ...chosen.fixedStats },
    affixes,
    setId,
    isUnique: true,
    damageType: chosen.damageType,
    visualEffect: chosen.visualEffect,
    flavorText: chosen.flavorText,
    price: chosen.price,
    requiredLevel: chosen.requiredLevel,
    soulbound: true
  };
  return item;
}
function generateSingleItem(entry, ctx, rng) {
  const type = entry.itemPool || "weapon";
  const rarity = entry.rarityOverride || rollRarity(rng, ctx);
  const itemLevel = ctx.depth + ctx.playerLevel;
  const base = selectBaseItem(type, ctx, rng);
  const affixes = rollAffixes(
    rarity,
    itemLevel,
    rng,
    entry.minAffixes,
    entry.maxAffixes,
    entry.guaranteedAffix
  );
  return buildItem(base, rarity, affixes, itemLevel);
}
function generateLootFromTable(table, ctx, rng) {
  const difficultyMult = {
    easy: 0.7,
    normal: 1,
    hard: 1.15,
    nightmare: 1.4
  };
  const depthBonus = Math.pow(1.12, ctx.depth - 1);
  const mult = (difficultyMult[ctx.difficulty] || 1) * depthBonus;
  const goldBase = table.goldRange[0] + rng() * (table.goldRange[1] - table.goldRange[0]);
  const xpBase = table.xpRange[0] + rng() * (table.xpRange[1] - table.xpRange[0]);
  const gold = Math.round(goldBase * mult);
  const xp = Math.round(xpBase * mult);
  const items = [];
  const guaranteed = table.guaranteedDrops || 0;
  for (let i = 0; i < guaranteed; i++) {
    const unique = tryUniqueItem(ctx, rng);
    if (unique) {
      items.push(unique);
      continue;
    }
    const entry = weightedSelect(table.entries, rng);
    if (entry)
      items.push(generateSingleItem(entry, ctx, rng));
  }
  const baseDropChance = 0.4 + ctx.depth / 10 * 0.3 + ((difficultyMult[ctx.difficulty] || 1) - 1) * 0.2;
  if (rng() < baseDropChance) {
    const unique = tryUniqueItem(ctx, rng);
    if (unique) {
      items.push(unique);
    } else {
      const entry = weightedSelect(table.entries, rng);
      if (entry)
        items.push(generateSingleItem(entry, ctx, rng));
    }
  }
  if (table.bonusDropChance && rng() < table.bonusDropChance) {
    const entry = weightedSelect(table.entries, rng);
    if (entry)
      items.push(generateSingleItem(entry, ctx, rng));
  }
  const materials = [];
  const zoneModifier = ctx.zoneType ? ZONE_LOOT_MODIFIERS[ctx.zoneType] : null;
  const materialsForFloor = Object.values(MATERIALS).filter((m) => m.minFloor <= ctx.depth);
  if (rng() < 0.5 && materialsForFloor.length > 0) {
    const material = materialsForFloor[Math.floor(rng() * materialsForFloor.length)];
    const quantity = Math.floor(rng() * 3) + 1;
    materials.push({ materialId: material.id, quantity });
  }
  if (zoneModifier && rng() < zoneModifier.bonusDropChance) {
    const bonusMats = zoneModifier.bonusMaterials;
    const mat = bonusMats[Math.floor(rng() * bonusMats.length)];
    if (MATERIALS[mat]) {
      materials.push({ materialId: mat, quantity: Math.floor(rng() * 2) + 1 });
    }
  }
  return {
    id: uuidv42(),
    gold,
    xp,
    items,
    materials
  };
}
function generateLoot(gold, xp, difficulty, depth, rng, enemyType, magicFind, zoneType, isBoss) {
  const ctx = {
    difficulty,
    depth,
    playerLevel: Math.max(1, Math.floor(depth * 1.2)),
    magicFind: magicFind || 0,
    rarityBoost: zoneType && ZONE_LOOT_MODIFIERS[zoneType] ? ZONE_LOOT_MODIFIERS[zoneType].rarityBoost : 1,
    zoneType,
    isBoss: isBoss || false
  };
  const table = enemyType && ENEMY_LOOT_TABLES[enemyType] ? ENEMY_LOOT_TABLES[enemyType] : {
    id: "generic",
    name: "Generic Loot",
    entries: [
      { weight: 40, itemPool: "weapon", maxAffixes: 2 },
      { weight: 30, itemPool: "armor", maxAffixes: 2 },
      { weight: 20, itemPool: "accessory", maxAffixes: 1 },
      { weight: 10, itemPool: "consumable", maxAffixes: 0 }
    ],
    goldRange: [gold * 0.8, gold * 1.2],
    xpRange: [xp * 0.8, xp * 1.2],
    bonusDropChance: 0.15
  };
  if (!enemyType || !ENEMY_LOOT_TABLES[enemyType]) {
    table.goldRange = [gold * 0.8, gold * 1.2];
    table.xpRange = [xp * 0.8, xp * 1.2];
  }
  return generateLootFromTable(table, ctx, rng);
}
function weightedSelect(entries, rng) {
  const totalWeight = entries.reduce((s, e) => s + e.weight, 0);
  if (totalWeight <= 0)
    return null;
  let roll = rng() * totalWeight;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0)
      return entry;
  }
  return entries[entries.length - 1];
}
function xpForNextLevel(level) {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}
function calculateLevelUp(currentLevel, currentXp, gainedXp) {
  let level = currentLevel;
  let xp = currentXp + gainedXp;
  const startLevel = currentLevel;
  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level += 1;
  }
  return {
    newLevel: level,
    newXp: xp,
    levelsGained: level - startLevel
  };
}

// src/api/routes/progression.routes.ts
var router7 = Router7();
router7.post("/dungeon-rewards", verifyToken, async (req, res) => {
  try {
    const { agentId, gold, xp } = req.body;
    const userId = req.user.id;
    const agentResult = await query(
      "SELECT * FROM agents WHERE id = $1 AND user_id = $2",
      [agentId, userId]
    );
    if (agentResult.rows.length === 0) {
      return res.status(404).json({ error: "Agent not found" });
    }
    const agent = agentResult.rows[0];
    const levelUpData = calculateLevelUp(
      agent.level,
      agent.experience,
      xp
    );
    await query(
      `UPDATE agents 
       SET level = $1, experience = $2, current_hp = max_hp
       WHERE id = $3`,
      [levelUpData.newLevel, levelUpData.newXp, agentId]
    );
    await query(
      `UPDATE users 
       SET gold = gold + $1
       WHERE id = $2`,
      [gold, userId]
    );
    res.json({
      success: true,
      level: levelUpData.newLevel,
      experience: levelUpData.newXp,
      levelUp: levelUpData.levelsGained > 0,
      gold
    });
  } catch (error) {
    console.error("Progression error:", error);
    res.status(500).json({ error: "Failed to save progression" });
  }
});
router7.get("/agent/:agentId", async (req, res) => {
  try {
    const { agentId } = req.params;
    const result = await query(
      "SELECT id, level, experience, current_hp, max_hp FROM agents WHERE id = $1",
      [agentId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Agent not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Fetch progression error:", error);
    res.status(500).json({ error: "Failed to fetch progression" });
  }
});
var progression_routes_default = router7;

// src/api/routes/crafting.routes.ts
import { Router as Router8 } from "express";

// src/game/crafting.ts
import { v4 as uuidv43 } from "uuid";
var BASE_GEAR = {
  weapon: ["Blade", "Sword", "Axe", "Spear", "Staff", "Bow", "Wand"],
  armor: ["Plate", "Mail", "Coat", "Robe", "Leather", "Chain", "Vestments"],
  accessory: ["Ring", "Amulet", "Crown", "Belt", "Cloak", "Bracers", "Helm"]
};
var PREFIXES = [
  {
    id: "mighty",
    name: "Mighty",
    type: "prefix",
    rarity: "common",
    bonuses: { attack: 5 },
    description: "Increases attack power"
  },
  {
    id: "reinforced",
    name: "Reinforced",
    type: "prefix",
    rarity: "common",
    bonuses: { defense: 5 },
    description: "Strengthens defenses"
  },
  {
    id: "swift",
    name: "Swift",
    type: "prefix",
    rarity: "uncommon",
    bonuses: { speed: 5, accuracy: 3 },
    description: "Increases speed and accuracy"
  },
  {
    id: "flaming",
    name: "Flaming",
    type: "prefix",
    rarity: "uncommon",
    bonuses: { attack: 8 },
    description: "Wreathed in flames",
    visualEffect: "fire"
  },
  {
    id: "frozen",
    name: "Frozen",
    type: "prefix",
    rarity: "uncommon",
    bonuses: { defense: 8 },
    description: "Infused with ice",
    visualEffect: "ice"
  },
  {
    id: "thundering",
    name: "Thundering",
    type: "prefix",
    rarity: "rare",
    bonuses: { attack: 10, speed: 8 },
    description: "Crackles with lightning",
    visualEffect: "lightning"
  },
  {
    id: "shadow",
    name: "Shadow",
    type: "prefix",
    rarity: "rare",
    bonuses: { evasion: 10, accuracy: 5 },
    description: "Shrouded in darkness",
    visualEffect: "shadow"
  },
  {
    id: "arcane",
    name: "Arcane",
    type: "prefix",
    rarity: "epic",
    bonuses: { attack: 12, defense: 8, accuracy: 10 },
    description: "Infused with pure magic",
    visualEffect: "arcane"
  },
  {
    id: "divine",
    name: "Divine",
    type: "prefix",
    rarity: "legendary",
    bonuses: { attack: 20, defense: 15, speed: 10 },
    description: "Blessed by the gods"
  }
];
var SUFFIXES = [
  {
    id: "of_strength",
    name: "of Strength",
    type: "suffix",
    rarity: "common",
    bonuses: { attack: 3 },
    description: "Grants physical power"
  },
  {
    id: "of_protection",
    name: "of Protection",
    type: "suffix",
    rarity: "common",
    bonuses: { defense: 3 },
    description: "Provides defense"
  },
  {
    id: "of_accuracy",
    name: "of Accuracy",
    type: "suffix",
    rarity: "uncommon",
    bonuses: { accuracy: 8 },
    description: "Grants precision"
  },
  {
    id: "of_haste",
    name: "of Haste",
    type: "suffix",
    rarity: "uncommon",
    bonuses: { speed: 6 },
    description: "Speeds up the wearer"
  },
  {
    id: "of_evasion",
    name: "of Evasion",
    type: "suffix",
    rarity: "uncommon",
    bonuses: { evasion: 8 },
    description: "Grants dodge chance"
  },
  {
    id: "of_the_warrior",
    name: "of the Warrior",
    type: "suffix",
    rarity: "rare",
    bonuses: { attack: 10, defense: 5 },
    description: "Empowers warriors"
  },
  {
    id: "of_the_guardian",
    name: "of the Guardian",
    type: "suffix",
    rarity: "rare",
    bonuses: { defense: 12, speed: 3 },
    description: "Strengthens protection"
  },
  {
    id: "of_fortune",
    name: "of Fortune",
    type: "suffix",
    rarity: "epic",
    bonuses: { accuracy: 15, evasion: 5 },
    description: "Grants luck"
  },
  {
    id: "of_infinity",
    name: "of Infinity",
    type: "suffix",
    rarity: "legendary",
    bonuses: { attack: 15, defense: 15, accuracy: 10, evasion: 10 },
    description: "Grants unlimited power"
  }
];
function generateCraftedGear(slot, materials, rng) {
  const avgRarity = calculateMaterialRarity(materials);
  const baseNames = BASE_GEAR[slot];
  const baseName = baseNames[Math.floor(rng() * baseNames.length)];
  const affixCount = avgRarity === "legendary" ? 3 : avgRarity === "epic" ? 2 : 1;
  const affixes = [];
  if (affixCount >= 1) {
    const prefix = selectAffix(PREFIXES, avgRarity, rng);
    affixes.push(prefix);
  }
  if (affixCount >= 2) {
    const suffix = selectAffix(SUFFIXES, avgRarity, rng);
    affixes.push(suffix);
  }
  if (affixCount >= 3) {
    const special = selectAffix([...PREFIXES, ...SUFFIXES], "legendary", rng);
    affixes.push(special);
  }
  const totalStats = {};
  affixes.forEach((affix) => {
    Object.entries(affix.bonuses).forEach(([key, value]) => {
      totalStats[key] = (totalStats[key] || 0) + value;
    });
  });
  materials.forEach(({ materialId }) => {
    const material = MATERIALS[materialId];
    if (material) {
      Object.entries(material.properties).forEach(([key, value]) => {
        totalStats[key] = (totalStats[key] || 0) + value;
      });
    }
  });
  const visualEffect = affixes.find((a) => a.visualEffect)?.visualEffect;
  const nameString = affixes.map((a) => a.name).join(" ") + ` ${baseName}`;
  return {
    id: uuidv43(),
    name: nameString,
    slot,
    baseRarity: avgRarity,
    baseMaterials: materials,
    affixes,
    totalStats,
    visualEffect,
    createdAt: Date.now()
  };
}
function calculateMaterialRarity(materials) {
  const rarityMap = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5
  };
  const avgScore = materials.reduce((sum, { materialId }) => {
    const material = MATERIALS[materialId];
    return sum + (rarityMap[material.rarity] || 1);
  }, 0) / materials.length;
  if (avgScore >= 4.5)
    return "legendary";
  if (avgScore >= 3.5)
    return "epic";
  if (avgScore >= 2.5)
    return "rare";
  if (avgScore >= 1.5)
    return "uncommon";
  return "common";
}
function selectAffix(pool2, targetRarity, rng) {
  const rarityMap = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5
  };
  const targetScore = rarityMap[targetRarity] || 3;
  const filtered = pool2.filter((a) => {
    const score = rarityMap[a.rarity];
    return Math.abs(score - targetScore) <= 2;
  });
  return filtered[Math.floor(rng() * filtered.length)] || pool2[0];
}

// src/api/routes/crafting.routes.ts
import SeededRandom from "seedrandom";
var router8 = Router8();
router8.get("/materials", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const agentResult = await query(
      "SELECT id FROM agents WHERE user_id = $1",
      [userId]
    );
    if (agentResult.rows.length === 0) {
      return res.status(404).json({ error: "Agent not found" });
    }
    const agentId = agentResult.rows[0].id;
    const materialsResult = await query(
      "SELECT * FROM material_inventory WHERE agent_id = $1 ORDER BY material_id",
      [agentId]
    );
    const materials = materialsResult.rows.map((row) => ({
      materialId: row.material_id,
      quantity: row.quantity,
      ...MATERIALS[row.material_id]
    }));
    res.json(materials);
  } catch (error) {
    console.error("Materials fetch error:", error);
    res.status(500).json({ error: "Failed to fetch materials" });
  }
});
router8.post("/craft", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { slot, materials: inputMaterials } = req.body;
    if (!slot || !inputMaterials || inputMaterials.length === 0) {
      return res.status(400).json({ error: "Invalid crafting request" });
    }
    const agentResult = await query(
      "SELECT id FROM agents WHERE user_id = $1",
      [userId]
    );
    if (agentResult.rows.length === 0) {
      return res.status(404).json({ error: "Agent not found" });
    }
    const agentId = agentResult.rows[0].id;
    for (const { materialId, quantity } of inputMaterials) {
      const inv = await query(
        "SELECT quantity FROM material_inventory WHERE agent_id = $1 AND material_id = $2",
        [agentId, materialId]
      );
      if (inv.rows.length === 0 || inv.rows[0].quantity < quantity) {
        return res.status(400).json({ error: `Not enough ${materialId}` });
      }
    }
    for (const { materialId, quantity } of inputMaterials) {
      await query(
        "UPDATE material_inventory SET quantity = quantity - $1 WHERE agent_id = $2 AND material_id = $3",
        [quantity, agentId, materialId]
      );
    }
    const rng = SeededRandom(agentId + Date.now());
    const craftedGear = generateCraftedGear(slot, inputMaterials, rng);
    const gearResult = await query(
      `INSERT INTO crafted_gear (agent_id, name, slot, base_rarity, affixes, total_stats, visual_effect)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        agentId,
        craftedGear.name,
        craftedGear.slot,
        craftedGear.baseRarity,
        JSON.stringify(craftedGear.affixes),
        JSON.stringify(craftedGear.totalStats),
        craftedGear.visualEffect
      ]
    );
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
  } catch (error) {
    console.error("Crafting error:", error);
    res.status(500).json({ error: "Crafting failed" });
  }
});
router8.get("/gear", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const agentResult = await query(
      "SELECT id FROM agents WHERE user_id = $1",
      [userId]
    );
    if (agentResult.rows.length === 0) {
      return res.status(404).json({ error: "Agent not found" });
    }
    const agentId = agentResult.rows[0].id;
    const gearResult = await query(
      "SELECT * FROM crafted_gear WHERE agent_id = $1 ORDER BY created_at DESC",
      [agentId]
    );
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
  } catch (error) {
    console.error("Gear fetch error:", error);
    res.status(500).json({ error: "Failed to fetch gear" });
  }
});
router8.post("/equip/:gearId", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { gearId } = req.params;
    const agentResult = await query(
      "SELECT id FROM agents WHERE user_id = $1",
      [userId]
    );
    if (agentResult.rows.length === 0) {
      return res.status(404).json({ error: "Agent not found" });
    }
    const agentId = agentResult.rows[0].id;
    const gearResult = await query(
      "SELECT * FROM crafted_gear WHERE id = $1 AND agent_id = $2",
      [gearId, agentId]
    );
    if (gearResult.rows.length === 0) {
      return res.status(404).json({ error: "Gear not found" });
    }
    const gear = gearResult.rows[0];
    await query(
      "UPDATE crafted_gear SET equipped = false WHERE agent_id = $1 AND slot = $2",
      [agentId, gear.slot]
    );
    await query(
      "UPDATE crafted_gear SET equipped = true WHERE id = $1",
      [gearId]
    );
    res.json({ success: true, message: `${gear.name} equipped` });
  } catch (error) {
    console.error("Equip error:", error);
    res.status(500).json({ error: "Failed to equip gear" });
  }
});
var crafting_routes_default = router8;

// src/game/matchmaking.ts
var MatchmakingQueue = class {
  constructor() {
    this.queue = /* @__PURE__ */ new Map();
    // user_id -> entry
    this.tickInterval = null;
    this.SKILL_RANGE = 150;
    // +/- rating range for matching
    this.QUEUE_TIMEOUT = 3e4;
  }
  // 30 seconds before expanding range
  /**
   * Add player to queue
   */
  async addToQueue(userId, agentId, rating) {
    if (this.queue.has(userId)) {
      throw new Error("Already in queue");
    }
    const entry = {
      user_id: userId,
      agent_id: agentId,
      rating,
      queued_at: Date.now()
    };
    this.queue.set(userId, entry);
    await connection_default.query(
      `INSERT INTO matchmaking_queue (user_id, agent_id, rating, queued_at)
       VALUES ($1, $2, $3, to_timestamp($4::float / 1000))
       ON CONFLICT (user_id) DO UPDATE SET
       agent_id = $2, rating = $3, queued_at = to_timestamp($4::float / 1000)`,
      [userId, agentId, rating, entry.queued_at]
    );
    console.log(`\u{1F464} ${userId} joined queue (rating: ${rating})`);
  }
  /**
   * Remove player from queue
   */
  async removeFromQueue(userId) {
    this.queue.delete(userId);
    await connection_default.query(
      "DELETE FROM matchmaking_queue WHERE user_id = $1",
      [userId]
    );
    console.log(`\u{1F464} ${userId} left queue`);
  }
  /**
   * Find match for a player
   * Returns matching opponent or null if no match found
   */
  findMatch(entry) {
    const timeInQueue = Date.now() - entry.queued_at;
    let skillRange = this.SKILL_RANGE;
    if (timeInQueue > this.QUEUE_TIMEOUT) {
      skillRange = this.SKILL_RANGE * 2;
    }
    if (timeInQueue > this.QUEUE_TIMEOUT * 2) {
      skillRange = 999999;
    }
    for (const [otherUserId, otherEntry] of this.queue.entries()) {
      if (otherUserId === entry.user_id)
        continue;
      const ratingDiff = Math.abs(otherEntry.rating - entry.rating);
      if (ratingDiff <= skillRange) {
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
    const matched = /* @__PURE__ */ new Set();
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
        console.log(
          `\u{1F3AE} Match found: ${entry.user_id} (${entry.rating}) vs ${opponent.user_id} (${opponent.rating})`
        );
      }
    }
    for (const userId of matched) {
      this.queue.delete(userId);
    }
    for (const userId of matched) {
      await connection_default.query(
        "DELETE FROM matchmaking_queue WHERE user_id = $1",
        [userId]
      );
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
    const totalWait = Array.from(this.queue.values()).reduce(
      (sum, entry) => sum + (now - entry.queued_at),
      0
    );
    return Math.round(totalWait / this.queue.size);
  }
  /**
   * Start the matchmaking tick loop
   */
  startMatchmaking(tickIntervalMs = 5e3) {
    if (this.tickInterval)
      return;
    console.log(`\u{1F504} Matchmaking started (tick: ${tickIntervalMs}ms)`);
    this.tickInterval = setInterval(async () => {
      try {
        const matches = await this.tryMatchPlayers();
        if (matches.length > 0) {
          console.log(`\u2705 ${matches.length} match(es) found`);
        }
      } catch (err) {
        console.error("\u274C Matchmaking error:", err);
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
      console.log("\u{1F6D1} Matchmaking stopped");
    }
  }
};
var matchmakingQueue = new MatchmakingQueue();
async function updateLeaderboard() {
  await connection_default.query(`
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
  console.log("\u{1F4CA} Leaderboard updated");
}

// src/sockets/game.socket.ts
var activeBattles = /* @__PURE__ */ new Map();
function setupGameSockets(io2) {
  io2.on("connection", (socket) => {
    console.log(`\u{1F3AE} Player connected: ${socket.id}`);
    socket.on("join_queue", async (data, callback) => {
      try {
        const userId = socket.user?.id;
        if (!userId) {
          return callback({ error: "Not authenticated" });
        }
        const agentResult = await connection_default.query(
          "SELECT * FROM agents WHERE id = $1 AND user_id = $2",
          [data.agent_id, userId]
        );
        if (agentResult.rows.length === 0) {
          return callback({ error: "Agent not found" });
        }
        const agent = agentResult.rows[0];
        await matchmakingQueue.addToQueue(userId, data.agent_id, data.rating);
        socket.join("matchmaking");
        callback({ ok: true, message: "Joined queue" });
        const queueSize = matchmakingQueue.getQueueSize();
        const avgWait = matchmakingQueue.getAverageWaitTime();
        io2.to("matchmaking").emit("queue_status", {
          size: queueSize,
          average_wait_ms: avgWait
        });
      } catch (err) {
        console.error("Join queue error:", err);
        callback({ error: err.message });
      }
    });
    socket.on("leave_queue", async (callback) => {
      try {
        const userId = socket.user?.id;
        if (!userId)
          return;
        await matchmakingQueue.removeFromQueue(userId);
        socket.leave("matchmaking");
        const queueSize = matchmakingQueue.getQueueSize();
        io2.to("matchmaking").emit("queue_status", { size: queueSize });
        callback({ ok: true });
      } catch (err) {
        console.error("Leave queue error:", err);
        callback({ error: err.message });
      }
    });
    socket.on("join_battle", async (data, callback) => {
      try {
        const battle = activeBattles.get(data.battle_id);
        if (!battle) {
          return callback({ error: "Battle not found" });
        }
        socket.join(data.battle_id);
        socket.battleId = data.battle_id;
        callback({
          ok: true,
          battle: {
            id: battle.id,
            agent1: battle.agent1,
            agent2: battle.agent2,
            status: battle.status
          }
        });
        socket.to(data.battle_id).emit("player_joined", {
          message: "Another player joined the battle"
        });
      } catch (err) {
        console.error("Join battle error:", err);
        callback({ error: err.message });
      }
    });
    socket.on("start_battle", async (data, callback) => {
      try {
        const agents = await connection_default.query(
          "SELECT * FROM agents WHERE id = ANY($1)",
          [[data.agent1_id, data.agent2_id]]
        );
        if (agents.rows.length !== 2) {
          return callback({ error: "Invalid agents" });
        }
        const agent1Data = agents.rows[0];
        const agent2Data = agents.rows[1];
        const battleAgent1 = {
          id: agent1Data.id,
          user_id: agent1Data.user_id,
          name: agent1Data.name,
          class: agent1Data.class,
          stats: {
            max_hp: agent1Data.max_hp,
            current_hp: agent1Data.current_hp,
            attack: agent1Data.attack,
            defense: agent1Data.defense,
            speed: agent1Data.speed,
            accuracy: agent1Data.accuracy,
            evasion: agent1Data.evasion
          },
          effects: [],
          defended: false
        };
        const battleAgent2 = {
          id: agent2Data.id,
          user_id: agent2Data.user_id,
          name: agent2Data.name,
          class: agent2Data.class,
          stats: {
            max_hp: agent2Data.max_hp,
            current_hp: agent2Data.current_hp,
            attack: agent2Data.attack,
            defense: agent2Data.defense,
            speed: agent2Data.speed,
            accuracy: agent2Data.accuracy,
            evasion: agent2Data.evasion
          },
          effects: [],
          defended: false
        };
        const battle = createBattle(battleAgent1, battleAgent2);
        activeBattles.set(battle.id, battle);
        socket.battleId = battle.id;
        io2.to(battle.id).emit("battle_start", {
          battle_id: battle.id,
          agent1: battleAgent1,
          agent2: battleAgent2
        });
        callback({ ok: true, battle_id: battle.id });
      } catch (err) {
        console.error("Start battle error:", err);
        callback({ error: err.message });
      }
    });
    socket.on("action", async (data, callback) => {
      try {
        const battle = activeBattles.get(data.battle_id);
        if (!battle) {
          return callback({ error: "Battle not found" });
        }
        const userId = socket.user?.id;
        const isAgent1 = battle.agent1.user_id === userId;
        const actor = isAgent1 ? battle.agent1 : battle.agent2;
        const target = isAgent1 ? battle.agent2 : battle.agent1;
        if (!["attack", "defend", "ability"].includes(data.action)) {
          return callback({ error: "Invalid action" });
        }
        let actionResult = {
          type: data.action,
          actor_id: actor.id,
          actor_name: actor.name,
          target_id: target.id,
          target_name: target.name,
          damage: 0,
          message: "",
          critical: false,
          missed: false,
          targetHP: target.stats.current_hp,
          targetEffects: target.effects,
          timestamp: Date.now()
        };
        switch (data.action) {
          case "attack": {
            const baseDamage = actor.stats.attack * (0.8 + Math.random() * 0.4);
            const isCritical = Math.random() < 0.15;
            const damage = Math.floor(
              isCritical ? baseDamage * 1.5 : baseDamage
            );
            const isMissed = Math.random() > actor.stats.accuracy / 100;
            if (isMissed) {
              actionResult.damage = 0;
              actionResult.missed = true;
              actionResult.message = `${actor.name}'s attack missed!`;
            } else {
              const actualDamage = Math.max(1, damage - target.stats.defense / 2);
              target.stats.current_hp = Math.max(0, target.stats.current_hp - actualDamage);
              actionResult.damage = Math.floor(actualDamage);
              actionResult.critical = isCritical;
              actionResult.targetHP = target.stats.current_hp;
              actionResult.message = isCritical ? `\u26A1 ${actor.name} CRITICAL HIT ${actor.name}! ${Math.floor(actualDamage)} damage!` : `${actor.name} attacks ${target.name} for ${Math.floor(actualDamage)} damage!`;
            }
            break;
          }
          case "defend": {
            actor.defended = true;
            actionResult.message = `${actor.name} takes a defensive stance!`;
            break;
          }
          case "ability": {
            const abilityCost = Math.floor(actor.stats.max_hp * 0.1);
            actor.stats.current_hp = Math.max(1, actor.stats.current_hp - abilityCost);
            const baseDamage = actor.stats.attack * 1.8;
            const damage = Math.floor(baseDamage);
            const actualDamage = Math.max(5, damage - target.stats.defense / 4);
            target.stats.current_hp = Math.max(0, target.stats.current_hp - actualDamage);
            actionResult.damage = Math.floor(actualDamage);
            actionResult.targetHP = target.stats.current_hp;
            actionResult.message = `\u2728 ${actor.name} uses Special Ability! ${Math.floor(actualDamage)} damage!`;
            break;
          }
        }
        actionResult.targetEffects = target.effects;
        if (target.stats.current_hp <= 0) {
          battle.winner_id = actor.id;
          battle.status = "completed";
          battle.ended_at = Date.now();
          battle.duration_ms = battle.ended_at - battle.started_at;
          io2.to(data.battle_id).emit("battle_end", {
            battle_id: data.battle_id,
            winner_id: actor.id,
            winner_name: actor.name,
            loser_name: target.name,
            message: `${actor.name} wins!`,
            battle_log: battle
          });
          activeBattles.delete(data.battle_id);
        } else {
          io2.to(data.battle_id).emit("action_result", actionResult);
          setTimeout(() => {
            const nextPlayer = isAgent1 ? battle.agent2.user_id : battle.agent1.user_id;
            const nextSocket = io2.sockets.sockets.get(socket.id);
            io2.to(data.battle_id).emit("turn_start", {
              current_actor_id: isAgent1 ? battle.agent2.id : battle.agent1.id,
              agent1_hp: battle.agent1.stats.current_hp,
              agent2_hp: battle.agent2.stats.current_hp
            });
          }, 1e3);
        }
        callback({ ok: true });
      } catch (err) {
        console.error("Action error:", err);
        callback({ error: err.message });
      }
    });
    socket.on("surrender", async (data, callback) => {
      try {
        const battle = activeBattles.get(data.battle_id);
        if (!battle) {
          return callback({ error: "Battle not found" });
        }
        const userId = socket.user?.id;
        const winner = battle.agent1.user_id === userId ? battle.agent2.user_id : battle.agent1.user_id;
        battle.winner_id = battle.agent1.user_id === winner ? battle.agent1.id : battle.agent2.id;
        battle.status = "completed";
        battle.ended_at = Date.now();
        battle.duration_ms = battle.ended_at - battle.started_at;
        io2.to(data.battle_id).emit("battle_end", {
          winner_id: battle.winner_id,
          battle_log: battle
        });
        activeBattles.delete(data.battle_id);
        callback({ ok: true });
      } catch (err) {
        console.error("Surrender error:", err);
        callback({ error: err.message });
      }
    });
    socket.on("disconnect", async () => {
      try {
        const userId = socket.user?.id;
        if (userId) {
          await matchmakingQueue.removeFromQueue(userId);
          console.log(`\u{1F464} Player disconnected: ${socket.id}`);
        }
      } catch (err) {
        console.error("Disconnect cleanup error:", err);
      }
    });
  });
}

// src/sockets/dungeon.socket.ts
import { v4 as uuidv44 } from "uuid";

// src/game/dungeon.ts
import * as ROT from "rot-js";
import SeededRandom3 from "seedrandom";

// src/game/bsp-dungeon.ts
import SeededRandom2 from "seedrandom";
var DEFAULT_CONFIG = {
  width: 80,
  height: 40,
  minPartitionSize: 8,
  maxPartitionSize: 24,
  minRoomSize: 4,
  roomPadding: 1,
  maxDepthSplits: 6,
  corridorWidth: 1,
  doorChance: 0.4,
  trapChance: 0.15,
  treasureChance: 0.15,
  secretRoomChance: 0.1,
  featureDensity: 0.3,
  bossRoomMinSize: 8
};
function getConfigForDifficulty(difficulty, depth) {
  const baseScale = 1 + (depth - 1) * 0.05;
  switch (difficulty) {
    case "easy":
      return {
        width: 60,
        height: 30,
        maxDepthSplits: 4,
        trapChance: 0.05,
        treasureChance: 0.25,
        secretRoomChance: 0.05,
        doorChance: 0.2
      };
    case "normal":
      return {
        width: 80,
        height: 40,
        maxDepthSplits: 5,
        trapChance: 0.12 * baseScale,
        treasureChance: 0.18,
        secretRoomChance: 0.08,
        doorChance: 0.35
      };
    case "hard":
      return {
        width: 90,
        height: 45,
        maxDepthSplits: 6,
        trapChance: 0.2 * baseScale,
        treasureChance: 0.12,
        secretRoomChance: 0.12,
        doorChance: 0.5
      };
    case "nightmare":
      return {
        width: 100,
        height: 50,
        maxDepthSplits: 7,
        trapChance: 0.25 * baseScale,
        treasureChance: 0.1,
        secretRoomChance: 0.15,
        doorChance: 0.6
      };
  }
}
var BSPDungeonGenerator = class {
  constructor(config = {}, seed = Date.now()) {
    this.rooms = [];
    this.corridors = [];
    this.nextRoomId = 0;
    this.nextCorridorId = 0;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rng = SeededRandom2(seed.toString());
    this.tiles = [];
  }
  /**
   * Main generation entry point
   */
  generate(difficulty, depth, seed) {
    this.rng = SeededRandom2(seed.toString());
    const diffConfig = getConfigForDifficulty(difficulty, depth);
    this.config = { ...DEFAULT_CONFIG, ...diffConfig };
    this.rooms = [];
    this.corridors = [];
    this.nextRoomId = 0;
    this.nextCorridorId = 0;
    this.initTiles();
    const root = this.createBSPNode(
      1,
      1,
      this.config.width - 2,
      this.config.height - 2
    );
    this.splitNode(root, 0);
    this.placeRooms(root);
    this.connectRooms(root);
    this.assignRoomTypes(difficulty, depth);
    this.placeFeatures();
    const entrance = this.placeEntrance();
    const exit = this.placeExit();
    this.addSecretRooms();
    this.carveTiles();
    return {
      width: this.config.width,
      height: this.config.height,
      tiles: this.tiles,
      rooms: this.rooms,
      corridors: this.corridors,
      entrance,
      exit,
      seed,
      depth,
      roomCount: this.rooms.length
    };
  }
  // ─── Tile Grid ───────────────────────────────────────────────────────
  initTiles() {
    this.tiles = [];
    for (let y = 0; y < this.config.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.config.width; x++) {
        this.tiles[y][x] = 0 /* WALL */;
      }
    }
  }
  // ─── BSP Tree Construction ───────────────────────────────────────────
  createBSPNode(x, y, w, h) {
    return {
      x,
      y,
      width: w,
      height: h,
      left: null,
      right: null,
      room: null,
      splitHorizontal: false
    };
  }
  splitNode(node, depth) {
    if (depth >= this.config.maxDepthSplits)
      return;
    if (node.width <= this.config.minPartitionSize * 2 && node.height <= this.config.minPartitionSize * 2)
      return;
    let splitH;
    if (node.width > node.height * 1.25) {
      splitH = false;
    } else if (node.height > node.width * 1.25) {
      splitH = true;
    } else {
      splitH = this.rng() > 0.5;
    }
    node.splitHorizontal = splitH;
    const maxSize = (splitH ? node.height : node.width) - this.config.minPartitionSize;
    if (maxSize <= this.config.minPartitionSize)
      return;
    const minSplit = this.config.minPartitionSize;
    const range = maxSize - minSplit;
    const split = minSplit + Math.floor(this.rng() * range);
    if (splitH) {
      node.left = this.createBSPNode(node.x, node.y, node.width, split);
      node.right = this.createBSPNode(node.x, node.y + split, node.width, node.height - split);
    } else {
      node.left = this.createBSPNode(node.x, node.y, split, node.height);
      node.right = this.createBSPNode(node.x + split, node.y, node.width - split, node.height);
    }
    this.splitNode(node.left, depth + 1);
    this.splitNode(node.right, depth + 1);
  }
  // ─── Room Placement ──────────────────────────────────────────────────
  placeRooms(node) {
    if (node.left || node.right) {
      if (node.left)
        this.placeRooms(node.left);
      if (node.right)
        this.placeRooms(node.right);
      return;
    }
    const padding = this.config.roomPadding;
    const minSize = this.config.minRoomSize;
    const maxW = node.width - padding * 2;
    const maxH = node.height - padding * 2;
    if (maxW < minSize || maxH < minSize)
      return;
    const roomW = minSize + Math.floor(this.rng() * (maxW - minSize + 1));
    const roomH = minSize + Math.floor(this.rng() * (maxH - minSize + 1));
    const roomX = node.x + padding + Math.floor(this.rng() * (maxW - roomW + 1));
    const roomY = node.y + padding + Math.floor(this.rng() * (maxH - roomH + 1));
    const room = {
      id: this.nextRoomId++,
      x: roomX,
      y: roomY,
      width: roomW,
      height: roomH,
      centerX: Math.floor(roomX + roomW / 2),
      centerY: Math.floor(roomY + roomH / 2),
      type: "normal",
      connections: [],
      features: [],
      explored: false
    };
    node.room = room;
    this.rooms.push(room);
  }
  // ─── Room Connection (Corridors) ─────────────────────────────────────
  connectRooms(node) {
    if (!node.left || !node.right)
      return;
    this.connectRooms(node.left);
    this.connectRooms(node.right);
    const leftRooms = this.getLeafRooms(node.left);
    const rightRooms = this.getLeafRooms(node.right);
    if (leftRooms.length === 0 || rightRooms.length === 0)
      return;
    let bestDist = Infinity;
    let bestLeft = leftRooms[0];
    let bestRight = rightRooms[0];
    for (const lr of leftRooms) {
      for (const rr of rightRooms) {
        const dist = Math.abs(lr.centerX - rr.centerX) + Math.abs(lr.centerY - rr.centerY);
        if (dist < bestDist) {
          bestDist = dist;
          bestLeft = lr;
          bestRight = rr;
        }
      }
    }
    this.createCorridor(bestLeft, bestRight);
  }
  getLeafRooms(node) {
    if (node.room)
      return [node.room];
    const rooms = [];
    if (node.left)
      rooms.push(...this.getLeafRooms(node.left));
    if (node.right)
      rooms.push(...this.getLeafRooms(node.right));
    return rooms;
  }
  createCorridor(from, to) {
    const points = [];
    const x1 = from.centerX;
    const y1 = from.centerY;
    const x2 = to.centerX;
    const y2 = to.centerY;
    if (this.rng() > 0.5) {
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        points.push({ x, y: y1 });
      }
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        points.push({ x: x2, y });
      }
    } else {
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        points.push({ x: x1, y });
      }
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        points.push({ x, y: y2 });
      }
    }
    const hasDoor = this.rng() < this.config.doorChance;
    const corridor = {
      id: this.nextCorridorId++,
      from: from.id,
      to: to.id,
      points,
      hasDoor
    };
    if (!from.connections.includes(to.id))
      from.connections.push(to.id);
    if (!to.connections.includes(from.id))
      to.connections.push(from.id);
    this.corridors.push(corridor);
  }
  // ─── Room Type Assignment ────────────────────────────────────────────
  assignRoomTypes(difficulty, depth) {
    if (this.rooms.length === 0)
      return;
    this.rooms[0].type = "entrance";
    if (this.rooms.length > 1) {
      this.rooms[this.rooms.length - 1].type = "exit";
    }
    if (depth >= 3 && this.rooms.length >= 4) {
      const candidates = this.rooms.slice(1, -1);
      const largest = candidates.reduce(
        (best, room) => room.width * room.height > best.width * best.height ? room : best
      );
      if (largest.width >= this.config.bossRoomMinSize || largest.height >= this.config.bossRoomMinSize) {
        largest.type = "boss";
      }
    }
    for (const room of this.rooms) {
      if (room.type !== "normal")
        continue;
      const roll = this.rng();
      const trapThreshold = this.config.trapChance;
      const treasureThreshold = trapThreshold + this.config.treasureChance;
      const shrineThreshold = treasureThreshold + 0.08;
      const armoryThreshold = shrineThreshold + 0.08;
      const libraryThreshold = armoryThreshold + 0.06;
      if (roll < trapThreshold) {
        room.type = "trap";
      } else if (roll < treasureThreshold) {
        room.type = "treasure";
      } else if (roll < shrineThreshold) {
        room.type = "shrine";
      } else if (roll < armoryThreshold) {
        room.type = "armory";
      } else if (roll < libraryThreshold) {
        room.type = "library";
      }
    }
  }
  // ─── Feature Placement ───────────────────────────────────────────────
  placeFeatures() {
    for (const room of this.rooms) {
      const area = room.width * room.height;
      const maxFeatures = Math.max(1, Math.floor(area * this.config.featureDensity * 0.1));
      switch (room.type) {
        case "treasure":
          this.placeTreasureFeatures(room, maxFeatures);
          break;
        case "trap":
          this.placeTrapFeatures(room, maxFeatures);
          break;
        case "shrine":
          this.placeShrineFeatures(room);
          break;
        case "library":
          this.placeLibraryFeatures(room, maxFeatures);
          break;
        case "boss":
          this.placeBossFeatures(room);
          break;
        default:
          this.placeNormalFeatures(room, maxFeatures);
          break;
      }
    }
  }
  placeTreasureFeatures(room, max) {
    const count = Math.max(1, Math.min(max, 3));
    for (let i = 0; i < count; i++) {
      room.features.push({
        type: "chest",
        x: room.x + 1 + Math.floor(this.rng() * (room.width - 2)),
        y: room.y + 1 + Math.floor(this.rng() * (room.height - 2))
      });
    }
    this.addCornerTorches(room);
  }
  placeTrapFeatures(room, max) {
    const count = Math.max(2, Math.min(max, 5));
    for (let i = 0; i < count; i++) {
      room.features.push({
        type: "trap",
        x: room.x + 1 + Math.floor(this.rng() * (room.width - 2)),
        y: room.y + 1 + Math.floor(this.rng() * (room.height - 2))
      });
    }
  }
  placeShrineFeatures(room) {
    room.features.push({
      type: "shrine",
      x: room.centerX,
      y: room.centerY
    });
    this.addCornerTorches(room);
  }
  placeLibraryFeatures(room, max) {
    const count = Math.max(2, Math.min(max, 4));
    for (let i = 0; i < count; i++) {
      room.features.push({
        type: "bookshelf",
        x: room.x + 1 + Math.floor(this.rng() * (room.width - 2)),
        y: room.y + (i % 2 === 0 ? 0 : room.height - 1)
        // Along walls
      });
    }
  }
  placeBossFeatures(room) {
    if (room.width >= 6 && room.height >= 6) {
      const px = Math.floor(room.width / 4);
      const py = Math.floor(room.height / 4);
      room.features.push(
        { type: "pillar", x: room.x + px, y: room.y + py },
        { type: "pillar", x: room.x + room.width - px - 1, y: room.y + py },
        { type: "pillar", x: room.x + px, y: room.y + room.height - py - 1 },
        { type: "pillar", x: room.x + room.width - px - 1, y: room.y + room.height - py - 1 }
      );
    }
    this.addCornerTorches(room);
  }
  placeNormalFeatures(room, max) {
    if (this.rng() < 0.3) {
      this.addCornerTorches(room);
    }
    if (room.width >= 5 && room.height >= 5 && this.rng() < 0.2) {
      room.features.push({
        type: "pillar",
        x: room.centerX,
        y: room.centerY
      });
    }
    if (this.rng() < 0.08) {
      room.features.push({
        type: "water",
        x: room.centerX,
        y: room.centerY
      });
    }
  }
  addCornerTorches(room) {
    if (room.width >= 3 && room.height >= 3) {
      room.features.push(
        { type: "torch", x: room.x, y: room.y },
        { type: "torch", x: room.x + room.width - 1, y: room.y },
        { type: "torch", x: room.x, y: room.y + room.height - 1 },
        { type: "torch", x: room.x + room.width - 1, y: room.y + room.height - 1 }
      );
    }
  }
  // ─── Entrance / Exit ─────────────────────────────────────────────────
  placeEntrance() {
    const room = this.rooms.find((r) => r.type === "entrance") || this.rooms[0];
    if (!room)
      return { x: 1, y: 1 };
    return { x: room.centerX, y: room.centerY };
  }
  placeExit() {
    const room = this.rooms.find((r) => r.type === "exit") || this.rooms[this.rooms.length - 1];
    if (!room)
      return { x: this.config.width - 2, y: this.config.height - 2 };
    return { x: room.centerX, y: room.centerY };
  }
  // ─── Secret Rooms ────────────────────────────────────────────────────
  addSecretRooms() {
    for (const corridor of [...this.corridors]) {
      if (this.rng() >= this.config.secretRoomChance)
        continue;
      const midIdx = Math.floor(corridor.points.length / 2);
      const mid = corridor.points[midIdx];
      if (!mid)
        continue;
      const dirs = [
        { dx: 0, dy: -1 },
        // up
        { dx: 0, dy: 1 },
        // down
        { dx: -1, dy: 0 },
        // left
        { dx: 1, dy: 0 }
        // right
      ];
      const dir = dirs[Math.floor(this.rng() * dirs.length)];
      const secretW = 3 + Math.floor(this.rng() * 3);
      const secretH = 3 + Math.floor(this.rng() * 3);
      const sx = mid.x + dir.dx * 3;
      const sy = mid.y + dir.dy * 3;
      if (sx < 2 || sy < 2 || sx + secretW >= this.config.width - 2 || sy + secretH >= this.config.height - 2)
        continue;
      if (this.overlapsAnyRoom(sx, sy, secretW, secretH))
        continue;
      const secretRoom = {
        id: this.nextRoomId++,
        x: sx,
        y: sy,
        width: secretW,
        height: secretH,
        centerX: Math.floor(sx + secretW / 2),
        centerY: Math.floor(sy + secretH / 2),
        type: "secret",
        connections: [],
        features: [
          {
            type: "chest",
            x: Math.floor(sx + secretW / 2),
            y: Math.floor(sy + secretH / 2)
          }
        ],
        explored: false
      };
      this.rooms.push(secretRoom);
      const sourceRoom = this.rooms.find((r) => r.id === corridor.from);
      if (sourceRoom) {
        this.createCorridor(sourceRoom, secretRoom);
      }
    }
  }
  overlapsAnyRoom(x, y, w, h) {
    const pad = 1;
    for (const room of this.rooms) {
      if (x - pad < room.x + room.width && x + w + pad > room.x && y - pad < room.y + room.height && y + h + pad > room.y) {
        return true;
      }
    }
    return false;
  }
  // ─── Tile Carving ────────────────────────────────────────────────────
  carveTiles() {
    for (const room of this.rooms) {
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          if (this.inBounds(x, y)) {
            this.tiles[y][x] = 1 /* FLOOR */;
          }
        }
      }
      for (const feat of room.features) {
        if (!this.inBounds(feat.x, feat.y))
          continue;
        switch (feat.type) {
          case "trap":
            this.tiles[feat.y][feat.x] = 5 /* TRAP */;
            break;
          case "chest":
            this.tiles[feat.y][feat.x] = 6 /* TREASURE */;
            break;
          case "pillar":
            this.tiles[feat.y][feat.x] = 7 /* PILLAR */;
            break;
          case "water":
            this.tiles[feat.y][feat.x] = 8 /* WATER */;
            break;
        }
      }
    }
    for (const corridor of this.corridors) {
      for (const point of corridor.points) {
        if (this.inBounds(point.x, point.y)) {
          if (this.tiles[point.y][point.x] === 0 /* WALL */) {
            this.tiles[point.y][point.x] = 4 /* CORRIDOR */;
          }
          if (this.config.corridorWidth >= 2) {
            for (const [dx, dy] of [[0, 1], [1, 0]]) {
              const nx = point.x + dx;
              const ny = point.y + dy;
              if (this.inBounds(nx, ny) && this.tiles[ny][nx] === 0 /* WALL */) {
                this.tiles[ny][nx] = 4 /* CORRIDOR */;
              }
            }
          }
        }
      }
      if (corridor.hasDoor && corridor.points.length > 0) {
        const doorPoint = corridor.points[0];
        if (this.inBounds(doorPoint.x, doorPoint.y)) {
          this.tiles[doorPoint.y][doorPoint.x] = 3 /* DOOR */;
        }
      }
    }
    const entrance = this.placeEntrance();
    const exit = this.placeExit();
    if (this.inBounds(entrance.x, entrance.y)) {
      this.tiles[entrance.y][entrance.x] = 10 /* ENTRANCE */;
    }
    if (this.inBounds(exit.x, exit.y)) {
      this.tiles[exit.y][exit.x] = 2 /* EXIT */;
    }
  }
  inBounds(x, y) {
    return x >= 0 && x < this.config.width && y >= 0 && y < this.config.height;
  }
};
function generateBSPDungeon(seed, difficulty, depth, _playerLevel) {
  const generator = new BSPDungeonGenerator({}, seed);
  return generator.generate(difficulty, depth, seed);
}
function bspToLegacyFormat(bspMap) {
  return {
    width: bspMap.width,
    height: bspMap.height,
    tiles: bspMap.tiles,
    rooms: bspMap.rooms.map((r) => ({
      id: r.id,
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height
    })),
    visited: /* @__PURE__ */ new Set()
  };
}

// src/game/dungeon.ts
var ENEMY_TEMPLATES = {
  goblin: {
    type: "goblin",
    name: "Goblin",
    baseLevel: 1,
    baseHp: 25,
    baseAttack: 8,
    baseDefense: 3,
    baseSpeed: 12,
    goldDrop: 50,
    xpDrop: 100,
    lootTable: []
  },
  orc: {
    type: "orc",
    name: "Orc",
    baseLevel: 3,
    baseHp: 45,
    baseAttack: 12,
    baseDefense: 6,
    baseSpeed: 9,
    goldDrop: 100,
    xpDrop: 250,
    lootTable: []
  },
  skeleton: {
    type: "skeleton",
    name: "Skeleton",
    baseLevel: 2,
    baseHp: 35,
    baseAttack: 10,
    baseDefense: 4,
    baseSpeed: 11,
    goldDrop: 75,
    xpDrop: 150,
    lootTable: []
  },
  wraith: {
    type: "wraith",
    name: "Wraith",
    baseLevel: 5,
    baseHp: 40,
    baseAttack: 14,
    baseDefense: 2,
    baseSpeed: 15,
    goldDrop: 150,
    xpDrop: 400,
    lootTable: []
  },
  boss_skeleton: {
    type: "boss_skeleton",
    name: "Skeletal Lord",
    baseLevel: 8,
    baseHp: 100,
    baseAttack: 18,
    baseDefense: 8,
    baseSpeed: 10,
    goldDrop: 500,
    xpDrop: 1e3,
    lootTable: []
  },
  boss_dragon: {
    type: "boss_dragon",
    name: "Ancient Dragon",
    baseLevel: 10,
    baseHp: 200,
    baseAttack: 25,
    baseDefense: 12,
    baseSpeed: 12,
    goldDrop: 1e3,
    xpDrop: 2500,
    lootTable: []
  },
  boss_lich: {
    type: "boss_lich",
    name: "Lich King",
    baseLevel: 10,
    baseHp: 150,
    baseAttack: 22,
    baseDefense: 10,
    baseSpeed: 14,
    goldDrop: 800,
    xpDrop: 2e3,
    lootTable: []
  }
};
function generateDungeon(seed, difficulty, depth, playerLevel) {
  console.log("\u{1F3D7}\uFE0F [DUNGEON] Starting BSP-backed generation:", { seed, difficulty, depth, playerLevel });
  try {
    const bspMap = generateBSPDungeon(seed, difficulty, depth, playerLevel);
    const legacy = bspToLegacyFormat(bspMap);
    console.log(`\u2705 [DUNGEON] BSP generation complete: ${bspMap.roomCount} rooms`);
    return legacy;
  } catch (err) {
    console.warn("\u26A0\uFE0F [DUNGEON] BSP generation failed, falling back to Digger:", err.message);
    return generateDungeonLegacy(seed, difficulty, depth, playerLevel);
  }
}
function generateDungeonLegacy(seed, _difficulty, _depth, _playerLevel) {
  const WIDTH = 80;
  const HEIGHT = 24;
  const tiles = [];
  for (let y = 0; y < HEIGHT; y++) {
    tiles[y] = [];
    for (let x = 0; x < WIDTH; x++) {
      tiles[y][x] = 0;
    }
  }
  console.log("\u{1F3D7}\uFE0F [DUNGEON] Falling back to Digger generation:", { WIDTH, HEIGHT });
  const digger = new ROT.Map.Digger(WIDTH, HEIGHT);
  try {
    digger.create((x, y, value) => {
      if (value === 0) {
        tiles[y][x] = 1;
      }
    });
    console.log("\u2705 [DUNGEON] Digger generation complete");
  } catch (err) {
    console.error("\u274C [DUNGEON] Digger.create error:", err.message);
    throw err;
  }
  const rooms = [];
  const rotRooms = digger.getRooms();
  rotRooms.forEach((room, index) => {
    const x1 = room._x1 ?? 0;
    const y1 = room._y1 ?? 0;
    const x2 = room._x2 ?? WIDTH - 1;
    const y2 = room._y2 ?? HEIGHT - 1;
    rooms.push({
      id: index,
      x: x1,
      y: y1,
      width: x2 - x1 + 1,
      height: y2 - y1 + 1
    });
  });
  if (rooms.length > 0) {
    const lastRoom = rooms[rooms.length - 1];
    const exitX = lastRoom.x + Math.floor(lastRoom.width / 2);
    const exitY = lastRoom.y + Math.floor(lastRoom.height / 2);
    tiles[exitY][exitX] = 2;
  }
  return { width: WIDTH, height: HEIGHT, tiles, rooms, visited: /* @__PURE__ */ new Set() };
}
function generateEncounter(roomId, _difficulty, depth, _playerLevel, rng) {
  const enemyCount = Math.min(1 + Math.floor(depth / 2), 4);
  const enemyTypes = [];
  const availableEnemies = [
    "goblin",
    "skeleton",
    "orc",
    "wraith"
  ];
  const isBossRoom = roomId % 5 === 4 && depth >= 3 || depth >= 9;
  if (isBossRoom) {
    if (depth <= 5) {
      enemyTypes.push("boss_skeleton");
    } else if (depth <= 8) {
      enemyTypes.push("boss_dragon");
    } else {
      enemyTypes.push("boss_lich");
    }
    return enemyTypes;
  }
  for (let i = 0; i < enemyCount; i++) {
    const enemy = availableEnemies[Math.floor(rng() * availableEnemies.length)];
    enemyTypes.push(enemy);
  }
  return enemyTypes;
}
function scaleEnemyStats(template, playerLevel, _difficulty) {
  const levelScale = 1 + (playerLevel - template.baseLevel) * 0.1;
  return {
    hp: Math.round(template.baseHp * levelScale),
    attack: Math.round(template.baseAttack * levelScale),
    defense: Math.round(template.baseDefense * levelScale),
    speed: template.baseSpeed
    // Speed doesn't scale
  };
}
function getDifficultyForFloor(floor) {
  if (floor <= 3)
    return "easy";
  if (floor <= 6)
    return "normal";
  if (floor <= 9)
    return "hard";
  return "nightmare";
}
function generateBranchingPaths(floor, seed) {
  if (floor < 5)
    return [];
  const rng = SeededRandom3(seed.toString());
  const pathCount = floor < 8 ? 2 : 3;
  const paths = [];
  const zoneTypes = [
    "boss_chamber",
    "treasure_vault",
    "cursed_hall",
    "dragon_lair",
    "arcane_sanctum",
    "shadow_den"
  ];
  const zoneDescriptions = {
    boss_chamber: "Encounter a powerful boss with high rewards",
    treasure_vault: "Find rare materials and equipment",
    cursed_hall: "Face cursed enemies with unique drops",
    dragon_lair: "Battle dragon-type enemies for legendary gear",
    arcane_sanctum: "Discover magical essences and artifacts",
    shadow_den: "Shadows hold secrets and rare resources"
  };
  const rarityBoosts = [1.3, 1.6, 2];
  for (let i = 0; i < pathCount; i++) {
    const zoneType = zoneTypes[Math.floor(rng() * zoneTypes.length)];
    const rarityBoost = rarityBoosts[Math.floor(rng() * rarityBoosts.length)];
    const baseDiff = getDifficultyForFloor(floor);
    const pathDifficulty = baseDiff === "easy" ? "normal" : baseDiff === "normal" ? "hard" : baseDiff === "hard" ? "nightmare" : "nightmare";
    paths.push({
      pathId: `path-${floor}-${i}`,
      floor,
      description: zoneDescriptions[zoneType],
      zoneType,
      difficulty: pathDifficulty,
      rarityBoost
    });
  }
  return paths;
}
function getSpecialZoneBonus(zoneType) {
  const bonuses = {
    boss_chamber: { goldMult: 1.5, xpMult: 2, rarityMult: 1.5 },
    // Reduced gold from 1.8
    treasure_vault: { goldMult: 2.5, xpMult: 1.5, rarityMult: 2 },
    // Best for materials
    cursed_hall: { goldMult: 1.6, xpMult: 1.8, rarityMult: 1.4 },
    // Unique drops focus
    dragon_lair: { goldMult: 2, xpMult: 2.2, rarityMult: 1.8 },
    // Best for XP
    arcane_sanctum: { goldMult: 1.7, xpMult: 1.9, rarityMult: 1.7 },
    // Boosted gold
    shadow_den: { goldMult: 1.8, xpMult: 1.7, rarityMult: 1.6 }
    // Boosted gold
  };
  return bonuses[zoneType];
}

// src/game/enemy-ai.ts
var AI_PATTERNS = {
  goblin: {
    behavior: "aggressive",
    aggressiveness: 0.7,
    defensiveness: 0.2,
    rangedPreference: 0.3,
    fleeThreshold: 0.2
    // Flees at 20% HP
  },
  skeleton: {
    behavior: "aggressive",
    aggressiveness: 0.8,
    defensiveness: 0.3,
    rangedPreference: 0.2,
    fleeThreshold: 0
    // Undead don't flee
  },
  orc: {
    behavior: "aggressive",
    aggressiveness: 0.9,
    defensiveness: 0.2,
    rangedPreference: 0.1,
    fleeThreshold: 0
    // Orcs fight to death
  },
  wraith: {
    behavior: "ranged",
    aggressiveness: 0.6,
    defensiveness: 0.5,
    rangedPreference: 0.9,
    fleeThreshold: 0.3
  },
  boss_skeleton: {
    behavior: "boss",
    aggressiveness: 1,
    defensiveness: 0.7,
    rangedPreference: 0.4,
    fleeThreshold: 0
    // Bosses never flee
  },
  boss_dragon: {
    behavior: "boss",
    aggressiveness: 1,
    defensiveness: 0.6,
    rangedPreference: 0.8,
    fleeThreshold: 0
  },
  boss_lich: {
    behavior: "boss",
    aggressiveness: 0.8,
    defensiveness: 0.9,
    rangedPreference: 1,
    fleeThreshold: 0
  }
};
function decideEnemyAction(aiPattern, state, rng) {
  const currentHpPercent = state.enemyHp / state.enemyMaxHp;
  if (currentHpPercent < aiPattern.fleeThreshold && aiPattern.fleeThreshold > 0) {
    return "flee";
  }
  const defenseThreshold = 0.5;
  const predictedDamage = state.playerAttack - state.enemyDefense + Math.random() * 10 - 5;
  if (currentHpPercent < defenseThreshold && predictedDamage > state.enemyHp * 0.2) {
    if (aiPattern.defensiveness > rng() && !state.enemyDefended) {
      return "defend";
    }
  }
  if (aiPattern.behavior === "boss") {
    return decideBossAction(aiPattern, state, rng);
  }
  const roll = rng();
  if (aiPattern.rangedPreference > rng()) {
    return "ability";
  }
  if (aiPattern.defensiveness > roll) {
    return "defend";
  }
  if (aiPattern.aggressiveness > roll) {
    return "attack";
  }
  return "attack";
}
function decideBossAction(aiPattern, state, rng) {
  const currentHpPercent = state.enemyHp / state.enemyMaxHp;
  if (currentHpPercent > 0.75) {
    return rng() < 0.7 ? "attack" : "ability";
  }
  if (currentHpPercent > 0.5) {
    const roll = rng();
    if (roll < 0.3)
      return "defend";
    if (roll < 0.6)
      return "ability";
    return "attack";
  }
  if (currentHpPercent > 0.25) {
    const roll = rng();
    if (roll < 0.4)
      return "defend";
    if (roll < 0.7)
      return "ability";
    return "attack";
  }
  return rng() < 0.6 ? "ability" : "attack";
}

// src/game/status-effects.ts
var EFFECT_CONFIG = {
  poison: {
    maxStacks: 5,
    baseDuration: 4,
    maxDuration: 6,
    damagePerStack: 0.02,
    // 2% max HP per stack per turn
    preventsAction: false,
    baseApplyChance: 0.35,
    description: "Deals damage over time. Stacks increase damage.",
    icon: "\u2620\uFE0F",
    color: "green"
  },
  stun: {
    maxStacks: 1,
    baseDuration: 1,
    maxDuration: 2,
    damagePerStack: 0,
    preventsAction: true,
    baseApplyChance: 0.2,
    description: "Target cannot act for the duration.",
    icon: "\u{1F4AB}",
    color: "yellow"
  },
  bleed: {
    maxStacks: 3,
    baseDuration: 3,
    maxDuration: 5,
    damagePerStack: 0.03,
    // 3% max HP per stack per turn
    preventsAction: false,
    baseApplyChance: 0.3,
    description: "Deals damage over time. Reduces healing by 50%.",
    icon: "\u{1FA78}",
    color: "red"
  },
  burn: {
    maxStacks: 3,
    baseDuration: 3,
    maxDuration: 4,
    damagePerStack: 0.04,
    // 4% max HP per stack per turn (highest DoT)
    preventsAction: false,
    baseApplyChance: 0.25,
    description: "Deals high fire damage over time.",
    icon: "\u{1F525}",
    color: "orange"
  },
  defend: {
    maxStacks: 1,
    baseDuration: 1,
    maxDuration: 1,
    damagePerStack: 0,
    preventsAction: false,
    baseApplyChance: 1,
    description: "Reduces incoming damage by 40%.",
    icon: "\u{1F6E1}\uFE0F",
    color: "blue"
  },
  weakness: {
    maxStacks: 3,
    baseDuration: 2,
    maxDuration: 4,
    damagePerStack: 0,
    preventsAction: false,
    baseApplyChance: 0.25,
    description: "Reduces attack power by 10% per stack.",
    icon: "\u{1F480}",
    color: "purple"
  },
  slow: {
    maxStacks: 2,
    baseDuration: 2,
    maxDuration: 3,
    damagePerStack: 0,
    preventsAction: false,
    baseApplyChance: 0.3,
    description: "Reduces speed by 15% per stack.",
    icon: "\u{1F40C}",
    color: "cyan"
  }
};
var ENEMY_EFFECT_ABILITIES = {
  goblin: [
    { effectType: "poison", bonusChance: 0.1, bonusStacks: 0, bonusDuration: 0 }
  ],
  skeleton: [
    { effectType: "bleed", bonusChance: 0.05, bonusStacks: 0, bonusDuration: 0 },
    { effectType: "weakness", bonusChance: 0.1, bonusStacks: 0, bonusDuration: 0 }
  ],
  orc: [
    { effectType: "stun", bonusChance: 0.1, bonusStacks: 0, bonusDuration: 0 },
    { effectType: "bleed", bonusChance: 0.15, bonusStacks: 1, bonusDuration: 0 }
  ],
  wraith: [
    { effectType: "poison", bonusChance: 0.2, bonusStacks: 1, bonusDuration: 1 },
    { effectType: "slow", bonusChance: 0.15, bonusStacks: 0, bonusDuration: 0 }
  ],
  boss_skeleton: [
    { effectType: "bleed", bonusChance: 0.25, bonusStacks: 2, bonusDuration: 1 },
    { effectType: "stun", bonusChance: 0.15, bonusStacks: 0, bonusDuration: 1 },
    { effectType: "weakness", bonusChance: 0.2, bonusStacks: 1, bonusDuration: 1 }
  ],
  boss_dragon: [
    { effectType: "burn", bonusChance: 0.4, bonusStacks: 2, bonusDuration: 1 },
    { effectType: "stun", bonusChance: 0.1, bonusStacks: 0, bonusDuration: 0 }
  ],
  boss_lich: [
    { effectType: "poison", bonusChance: 0.35, bonusStacks: 3, bonusDuration: 2 },
    { effectType: "weakness", bonusChance: 0.3, bonusStacks: 2, bonusDuration: 1 },
    { effectType: "slow", bonusChance: 0.25, bonusStacks: 1, bonusDuration: 1 }
  ]
};
var PLAYER_EFFECT_ABILITIES = {
  warrior: [
    { effectType: "bleed", bonusChance: 0.15, bonusStacks: 0, bonusDuration: 0 },
    { effectType: "stun", bonusChance: 0.05, bonusStacks: 0, bonusDuration: 0 }
  ],
  mage: [
    { effectType: "burn", bonusChance: 0.2, bonusStacks: 1, bonusDuration: 0 },
    { effectType: "slow", bonusChance: 0.1, bonusStacks: 0, bonusDuration: 0 }
  ],
  rogue: [
    { effectType: "poison", bonusChance: 0.25, bonusStacks: 1, bonusDuration: 1 },
    { effectType: "bleed", bonusChance: 0.15, bonusStacks: 0, bonusDuration: 0 }
  ],
  paladin: [
    { effectType: "stun", bonusChance: 0.2, bonusStacks: 0, bonusDuration: 0 },
    { effectType: "burn", bonusChance: 0.1, bonusStacks: 0, bonusDuration: 0 }
  ]
};
function tryApplyEffect(targetEffects, effectType, sourceId, currentTurn, targetDefense = 0, bonusChance = 0, bonusStacks = 0, bonusDuration = 0, rng = Math.random) {
  const config = EFFECT_CONFIG[effectType];
  const defenseResist = Math.min(0.3, targetDefense * 3e-3);
  const finalChance = Math.max(0.05, config.baseApplyChance + bonusChance - defenseResist);
  const roll = rng();
  if (roll > finalChance) {
    return {
      applied: false,
      resisted: true,
      message: `Resisted ${effectType}!`
    };
  }
  const existing = targetEffects.find((e) => e.type === effectType);
  if (existing) {
    const newStacks = Math.min(config.maxStacks, existing.stacks + 1 + bonusStacks);
    existing.stacks = newStacks;
    existing.duration = Math.min(
      config.maxDuration,
      Math.max(existing.duration, config.baseDuration + bonusDuration)
    );
    return {
      applied: true,
      resisted: false,
      message: `${config.icon} ${effectType} stacked to ${newStacks}!`,
      effect: existing
    };
  }
  const newEffect = {
    type: effectType,
    duration: Math.min(config.maxDuration, config.baseDuration + bonusDuration),
    stacks: Math.min(config.maxStacks, 1 + bonusStacks),
    sourceId,
    appliedOnTurn: currentTurn
  };
  targetEffects.push(newEffect);
  return {
    applied: true,
    resisted: false,
    message: `${config.icon} ${effectType} applied! (${newEffect.stacks} stack${newEffect.stacks > 1 ? "s" : ""}, ${newEffect.duration} turns)`,
    effect: newEffect
  };
}
function processStatusEffects(effects, maxHp, currentHp) {
  const results = [];
  const expiredEffects = [];
  let totalDamage = 0;
  let hp = currentHp;
  for (const effect of effects) {
    const config = EFFECT_CONFIG[effect.type];
    let damage = 0;
    if (config.damagePerStack > 0) {
      damage = Math.max(1, Math.floor(maxHp * config.damagePerStack * effect.stacks));
      hp = Math.max(0, hp - damage);
      totalDamage += damage;
    }
    effect.duration -= 1;
    const expired = effect.duration <= 0;
    if (expired) {
      expiredEffects.push(effect.type);
    }
    results.push({
      type: effect.type,
      damage,
      message: damage > 0 ? `${config.icon} ${effect.type} deals ${damage} damage (${effect.stacks} stack${effect.stacks > 1 ? "s" : ""})${expired ? " - expired" : ""}` : expired ? `${config.icon} ${effect.type} expired` : `${config.icon} ${effect.type} active (${effect.duration} turns left)`,
      expired
    });
  }
  const remaining = effects.filter((e) => e.duration > 0);
  effects.length = 0;
  effects.push(...remaining);
  return { newHp: hp, totalDamage, results, expiredEffects };
}
function isStunned(effects) {
  return effects.some((e) => e.type === "stun" && e.duration > 0);
}
function getAttackModifier(effects) {
  const weakness = effects.find((e) => e.type === "weakness");
  if (!weakness)
    return 1;
  return Math.max(0.5, 1 - weakness.stacks * 0.1);
}
function rollAttackEffects(attackerAbilities, targetEffects, sourceId, currentTurn, targetDefense, isCritical, rng = Math.random) {
  const results = [];
  for (const ability of attackerAbilities) {
    const critBonus = isCritical ? 0.15 : 0;
    const result = tryApplyEffect(
      targetEffects,
      ability.effectType,
      sourceId,
      currentTurn,
      targetDefense,
      ability.bonusChance + critBonus,
      ability.bonusStacks,
      ability.bonusDuration,
      rng
    );
    if (result.applied || result.resisted) {
      results.push(result);
    }
  }
  return results;
}
function serializeEffects(effects) {
  return effects.map((e) => {
    const config = EFFECT_CONFIG[e.type];
    return {
      type: e.type,
      duration: e.duration,
      stacks: e.stacks,
      icon: config.icon,
      color: config.color,
      description: config.description,
      preventsAction: config.preventsAction
    };
  });
}

// src/sockets/dungeon.socket.ts
import SeededRandom4 from "seedrandom";
var activeDungeonSessions = /* @__PURE__ */ new Map();
function setupDungeonSockets(io2) {
  io2.on("connection", (socket) => {
    socket.on(
      "start_dungeon",
      async (payload) => {
        try {
          console.log("\u{1F3AE} [DUNGEON] start_dungeon triggered:", { userId: payload.userId, agentId: payload.agentId });
          const { userId, agentId } = payload;
          let agent;
          try {
            const agentResult = await query(
              "SELECT * FROM agents WHERE id = $1 AND user_id = $2",
              [agentId, userId]
            );
            if (agentResult.rows.length === 0) {
              throw new Error("Agent not found");
            }
            agent = agentResult.rows[0];
          } catch (dbError) {
            if (process.env.NODE_ENV === "development") {
              console.log("\u{1F527} [DEV] Database unavailable, using mock agent");
              agent = {
                id: agentId,
                user_id: userId,
                name: "Dev Warrior",
                class: "warrior",
                level: 1,
                current_hp: 100,
                max_hp: 100,
                attack: 15,
                defense: 8,
                speed: 10
              };
            } else {
              socket.emit("dungeon_error", { message: "Agent not found" });
              return;
            }
          }
          const seed = Math.floor(Math.random() * 1e6);
          const floor = 1;
          const difficulty = getDifficultyForFloor(floor);
          let dungeon;
          try {
            console.log("\u{1F504} [DUNGEON] Inserting dungeon with:", { userId, agentId, difficulty, seed });
            const dungeonResult = await query(
              `INSERT INTO dungeons (user_id, agent_id, difficulty, seed, depth, max_depth)
               VALUES ($1, $2, $3::dungeon_difficulty, $4, 1, 10)
               RETURNING *`,
              [userId, agentId, difficulty, seed]
            );
            dungeon = dungeonResult.rows[0];
            console.log("\u2705 [DUNGEON] Dungeon created:", dungeon.id);
          } catch (err) {
            if (process.env.NODE_ENV === "development") {
              console.log("\u{1F527} [DEV] Database unavailable, using mock dungeon");
              dungeon = {
                id: uuidv44(),
                user_id: userId,
                agent_id: agentId,
                difficulty,
                seed,
                depth: 1,
                max_depth: 10,
                gold_collected: 0,
                experience_earned: 0,
                started_at: /* @__PURE__ */ new Date()
              };
            } else {
              console.error("\u274C [DUNGEON] Failed to insert dungeon:", {
                code: err?.code,
                message: err?.message,
                params: [userId, agentId, difficulty, seed]
              });
              throw err;
            }
          }
          const map = generateDungeon(seed, difficulty, floor, agent.level);
          try {
            console.log("\u{1F504} [DUNGEON] Inserting dungeon_progress with map and discovered_rooms");
            await query(
              `INSERT INTO dungeon_progress (dungeon_id, map_data, current_room_id, discovered_rooms)
               VALUES ($1, $2, $3, $4::INT[])`,
              [
                dungeon.id,
                JSON.stringify(map),
                0,
                [0]
                // Starting room
              ]
            );
            console.log("\u2705 [DUNGEON] Dungeon progress created");
          } catch (err) {
            if (process.env.NODE_ENV === "development") {
              console.log("\u{1F527} [DEV] Database unavailable, skipping dungeon_progress insert");
            } else {
              console.error("\u274C [DUNGEON] Failed to insert dungeon_progress:", {
                code: err?.code,
                message: err?.message
              });
              throw err;
            }
          }
          const session = {
            dungeonId: dungeon.id,
            userId,
            agentId,
            agentClass: agent.class || "warrior",
            depth: floor,
            currentRoomId: 0,
            playerHp: agent.current_hp,
            playerMaxHp: agent.max_hp,
            playerAttack: agent.attack || 15,
            playerDefense: agent.defense || 8,
            playerEffects: [],
            turnCount: 0,
            inEncounter: false,
            currentEnemies: []
          };
          activeDungeonSessions.set(socket.id, session);
          socket.emit("dungeon_started", {
            dungeonId: dungeon.id,
            floor,
            difficulty,
            map: {
              width: map.width,
              height: map.height,
              rooms: map.rooms
            },
            playerStats: {
              hp: agent.current_hp,
              maxHp: agent.max_hp,
              level: agent.level
            }
          });
        } catch (error) {
          console.error("\u274C [DUNGEON] start_dungeon error detailed:", {
            message: error?.message,
            code: error?.code,
            detail: error?.detail,
            hint: error?.hint,
            stack: error?.stack
          });
          socket.emit("dungeon_error", {
            message: "Failed to start dungeon: " + error?.message
          });
        }
      }
    );
    socket.on(
      "enter_room",
      async (payload) => {
        try {
          const session = activeDungeonSessions.get(socket.id);
          if (!session) {
            socket.emit("dungeon_error", { message: "No active dungeon" });
            return;
          }
          const { roomId } = payload;
          session.currentRoomId = roomId;
          const rng = SeededRandom4(
            `${session.dungeonId}-room-${roomId}`.toString()
          );
          const hasEncounter = rng() < 0.4;
          if (hasEncounter && !session.inEncounter) {
            const difficulty = getDifficultyForFloor(session.depth);
            const enemyTypes = generateEncounter(
              roomId,
              difficulty,
              session.depth,
              session.playerHp,
              // Simplified: use HP instead of full agent data
              rng
            );
            const enemies = enemyTypes.map((type) => {
              const template = ENEMY_TEMPLATES[type];
              const stats = scaleEnemyStats(
                template,
                1,
                // Simplified: assume level 1 player
                difficulty
              );
              return {
                id: uuidv44(),
                type,
                name: template.name,
                hp: stats.hp,
                maxHp: stats.hp,
                attack: stats.attack,
                defense: stats.defense,
                speed: stats.speed,
                effects: []
              };
            });
            session.inEncounter = true;
            session.currentEnemies = enemies;
            session.turnCount = 0;
            session.playerEffects = [];
            socket.emit("encounter_started", {
              enemies: enemies.map((e) => ({
                id: e.id,
                name: e.name,
                type: e.type,
                hp: e.hp,
                maxHp: e.maxHp,
                effects: []
              })),
              playerEffects: []
            });
          } else {
            socket.emit("room_clear", {
              roomId,
              message: "This room is empty."
            });
          }
        } catch (error) {
          console.error("\u274C [DUNGEON] enter_room error:", {
            message: error?.message,
            code: error?.code,
            detail: error?.detail,
            stack: error?.stack?.split("\n").slice(0, 3).join("\n")
          });
          socket.emit("dungeon_error", {
            message: "Failed to enter room: " + error?.message
          });
        }
      }
    );
    socket.on(
      "dungeon_action",
      async (payload) => {
        try {
          const session = activeDungeonSessions.get(socket.id);
          if (!session || !session.inEncounter) {
            socket.emit("dungeon_error", { message: "No active encounter" });
            return;
          }
          const { action, targetId } = payload;
          session.turnCount++;
          const turnMessages = [];
          const effectEvents = [];
          const playerStunned = isStunned(session.playerEffects);
          let playerDamage = 0;
          let playerCritical = false;
          let playerEffectsApplied = [];
          if (playerStunned) {
            turnMessages.push("\u{1F4AB} You are stunned and cannot act!");
            effectEvents.push({ type: "stun", target: "player", message: "Stunned! Turn skipped." });
          } else if (action === "attack" && targetId) {
            const target = session.currentEnemies.find((e) => e.id === targetId);
            if (target) {
              const atkMod = getAttackModifier(session.playerEffects);
              const baseAtk = Math.floor(session.playerAttack * atkMod);
              const variance = Math.floor(Math.random() * 7) - 3;
              playerCritical = Math.random() < 0.12;
              playerDamage = Math.max(1, baseAtk - Math.floor(target.defense * 0.5) + variance);
              if (playerCritical) {
                playerDamage = Math.floor(playerDamage * 1.5);
                turnMessages.push("\u{1F4A5} Critical hit!");
              }
              target.hp = Math.max(0, target.hp - playerDamage);
              const playerAbilities = PLAYER_EFFECT_ABILITIES[session.agentClass] || PLAYER_EFFECT_ABILITIES.warrior;
              playerEffectsApplied = rollAttackEffects(
                playerAbilities,
                target.effects,
                "player",
                session.turnCount,
                target.defense,
                playerCritical,
                Math.random
              );
              for (const eResult of playerEffectsApplied) {
                turnMessages.push(eResult.message);
                effectEvents.push({
                  type: eResult.effect?.type || "unknown",
                  target: target.id,
                  message: eResult.message
                });
              }
            }
          } else if (action === "defend") {
            session.playerEffects = session.playerEffects.filter((e) => e.type !== "defend");
            session.playerEffects.push({
              type: "defend",
              duration: 1,
              stacks: 1,
              sourceId: "player",
              appliedOnTurn: session.turnCount
            });
            turnMessages.push("\u{1F6E1}\uFE0F You brace for incoming attacks! (40% damage reduction)");
          }
          const enemyActionResults = [];
          for (const enemy of session.currentEnemies.filter((e) => e.hp > 0)) {
            const enemyStunned = isStunned(enemy.effects);
            if (enemyStunned) {
              enemyActionResults.push({
                enemyId: enemy.id,
                enemyName: enemy.name,
                action: "stunned",
                damage: 0,
                effectsApplied: [],
                stunned: true
              });
              turnMessages.push(`\u{1F4AB} ${enemy.name} is stunned!`);
              effectEvents.push({ type: "stun", target: enemy.id, message: `${enemy.name} stunned` });
              continue;
            }
            const aiPattern = AI_PATTERNS[enemy.type] || AI_PATTERNS.goblin;
            const rng = SeededRandom4(enemy.id + session.turnCount);
            const enemyDecision = decideEnemyAction(aiPattern, {
              playerHp: session.playerHp,
              playerMaxHp: session.playerMaxHp,
              playerAttack: session.playerAttack,
              playerDefense: session.playerDefense,
              enemyHp: enemy.hp,
              enemyMaxHp: enemy.maxHp,
              enemyAttack: enemy.attack,
              enemyDefense: enemy.defense,
              playerDefended: session.playerEffects.some((e) => e.type === "defend"),
              enemyDefended: false,
              turnsElapsed: session.turnCount
            }, rng);
            if (enemyDecision === "attack" || enemyDecision === "ability") {
              const atkMod = getAttackModifier(enemy.effects);
              const baseAtk = Math.floor(enemy.attack * atkMod);
              const variance = Math.floor(Math.random() * 7) - 3;
              const enemyCrit = Math.random() < 0.08;
              let enemyDmg = Math.max(1, baseAtk - Math.floor(session.playerDefense * 0.5) + variance);
              if (enemyCrit)
                enemyDmg = Math.floor(enemyDmg * 1.5);
              const isDefending = session.playerEffects.some((e) => e.type === "defend");
              if (isDefending) {
                enemyDmg = Math.floor(enemyDmg * 0.6);
              }
              session.playerHp = Math.max(0, session.playerHp - enemyDmg);
              const enemyAbilities = ENEMY_EFFECT_ABILITIES[enemy.type] || [];
              const enemyEffectsApplied = rollAttackEffects(
                enemyAbilities,
                session.playerEffects,
                enemy.id,
                session.turnCount,
                session.playerDefense,
                enemyCrit,
                Math.random
              );
              for (const eResult of enemyEffectsApplied) {
                turnMessages.push(`${enemy.name}: ${eResult.message}`);
                effectEvents.push({
                  type: eResult.effect?.type || "unknown",
                  target: "player",
                  message: eResult.message
                });
              }
              enemyActionResults.push({
                enemyId: enemy.id,
                enemyName: enemy.name,
                action: enemyDecision,
                damage: enemyDmg,
                effectsApplied: enemyEffectsApplied,
                stunned: false
              });
              if (enemyCrit) {
                turnMessages.push(`\u{1F4A5} ${enemy.name} lands a critical hit for ${enemyDmg} damage!`);
              } else {
                turnMessages.push(`${enemy.name} attacks for ${enemyDmg} damage!`);
              }
            } else if (enemyDecision === "defend") {
              enemy.effects.push({
                type: "defend",
                duration: 1,
                stacks: 1,
                sourceId: enemy.id,
                appliedOnTurn: session.turnCount
              });
              enemyActionResults.push({
                enemyId: enemy.id,
                enemyName: enemy.name,
                action: "defend",
                damage: 0,
                effectsApplied: [],
                stunned: false
              });
              turnMessages.push(`\u{1F6E1}\uFE0F ${enemy.name} takes a defensive stance!`);
            } else {
              enemyActionResults.push({
                enemyId: enemy.id,
                enemyName: enemy.name,
                action: enemyDecision,
                damage: 0,
                effectsApplied: [],
                stunned: false
              });
            }
          }
          const playerDotResult = processStatusEffects(
            session.playerEffects,
            session.playerMaxHp,
            session.playerHp
          );
          session.playerHp = playerDotResult.newHp;
          for (const r of playerDotResult.results) {
            turnMessages.push(`[You] ${r.message}`);
            if (r.damage > 0) {
              effectEvents.push({ type: r.type, target: "player", message: r.message });
            }
          }
          const enemyDotResults = {};
          for (const enemy of session.currentEnemies.filter((e) => e.hp > 0)) {
            const dotResult = processStatusEffects(
              enemy.effects,
              enemy.maxHp,
              enemy.hp
            );
            enemy.hp = dotResult.newHp;
            enemyDotResults[enemy.id] = {
              damage: dotResult.totalDamage,
              messages: dotResult.results.map((r) => r.message)
            };
            for (const r of dotResult.results) {
              turnMessages.push(`[${enemy.name}] ${r.message}`);
              if (r.damage > 0) {
                effectEvents.push({ type: r.type, target: enemy.id, message: r.message });
              }
            }
          }
          session.currentEnemies = session.currentEnemies.filter((e) => e.hp > 0);
          if (session.playerHp <= 0) {
            session.inEncounter = false;
            socket.emit("encounter_lost", {
              message: "You have been defeated!",
              turnMessages,
              effectEvents,
              playerEffects: serializeEffects(session.playerEffects)
            });
            return;
          }
          if (session.currentEnemies.length === 0) {
            const rng = SeededRandom4(session.dungeonId + Date.now());
            let baseGold = 100 * session.depth;
            let baseXp = 200 * session.depth;
            if (session.specialZoneBonus) {
              baseGold = Math.round(baseGold * session.specialZoneBonus.goldMult);
              baseXp = Math.round(baseXp * session.specialZoneBonus.xpMult);
            }
            const difficulty = getDifficultyForFloor(session.depth);
            const loot = generateLoot(
              baseGold,
              baseXp,
              difficulty,
              session.depth,
              rng
            );
            const levelUpData = calculateLevelUp(1, 0, loot.xp);
            session.inEncounter = false;
            socket.emit("encounter_won", {
              gold: loot.gold,
              xp: loot.xp,
              items: loot.items.map((item) => ({
                id: item.id,
                name: item.name,
                type: item.type,
                rarity: item.rarity,
                stats: item.stats
              })),
              materials: loot.materials,
              levelUp: levelUpData.levelsGained > 0,
              newLevel: levelUpData.newLevel,
              totalXp: levelUpData.newXp,
              zoneBonus: session.specialZoneBonus || null,
              turnMessages,
              effectEvents,
              combatStats: {
                turnsElapsed: session.turnCount
              }
            });
          } else {
            socket.emit("turn_result", {
              playerAction: playerStunned ? "stunned" : action,
              playerDamage,
              playerCritical,
              playerHp: session.playerHp,
              playerMaxHp: session.playerMaxHp,
              playerEffects: serializeEffects(session.playerEffects),
              enemies: session.currentEnemies.map((e) => ({
                id: e.id,
                name: e.name,
                type: e.type,
                hp: e.hp,
                maxHp: e.maxHp,
                effects: serializeEffects(e.effects)
              })),
              enemyActions: enemyActionResults,
              enemyDotResults,
              turnMessages,
              effectEvents,
              turnNumber: session.turnCount
            });
          }
        } catch (error) {
          socket.emit("dungeon_error", { message: "Action failed" });
          console.error("dungeon_action error:", error);
        }
      }
    );
    socket.on("flee_encounter", async () => {
      try {
        const session = activeDungeonSessions.get(socket.id);
        if (!session)
          return;
        const fleeChance = 0.5;
        const succeeds = Math.random() < fleeChance;
        if (succeeds) {
          session.inEncounter = false;
          socket.emit("fled_successfully", { message: "You escaped!" });
        } else {
          socket.emit("flee_failed", { message: "Unable to escape!" });
        }
      } catch (error) {
        console.error("flee_encounter error:", error);
      }
    });
    socket.on("next_floor", async (_payload) => {
      try {
        const session = activeDungeonSessions.get(socket.id);
        if (!session)
          return;
        if (session.depth >= 10) {
          socket.emit("dungeon_complete", {
            message: "You reached the bottom of the dungeon!",
            reward: { gold: 5e3, xp: 1e4 }
          });
          activeDungeonSessions.delete(socket.id);
        } else {
          session.depth += 1;
          const difficulty = getDifficultyForFloor(session.depth);
          const seed = Math.floor(Math.random() * 1e6);
          const map = generateDungeon(
            seed,
            difficulty,
            session.depth,
            session.playerHp
          );
          const branchingPaths = generateBranchingPaths(session.depth, seed);
          socket.emit("floor_changed", {
            floor: session.depth,
            difficulty,
            map: {
              width: map.width,
              height: map.height,
              rooms: map.rooms
            },
            branchingPaths: branchingPaths.length > 0 ? branchingPaths : null
          });
        }
      } catch (error) {
        console.error("next_floor error:", error);
      }
    });
    socket.on(
      "choose_path",
      async (payload) => {
        try {
          const session = activeDungeonSessions.get(socket.id);
          if (!session) {
            socket.emit("dungeon_error", { message: "No active dungeon" });
            return;
          }
          const { zoneType } = payload;
          session.specialZone = zoneType;
          session.specialZoneBonus = getSpecialZoneBonus(zoneType);
          const difficulty = getDifficultyForFloor(session.depth);
          const seed = Math.floor(Math.random() * 1e6);
          const map = generateDungeon(
            seed,
            difficulty,
            session.depth,
            session.playerHp
          );
          socket.emit("path_chosen", {
            zoneType,
            zoneDescription: `Entered the ${zoneType.replace(/_/g, " ")}!`,
            map: {
              width: map.width,
              height: map.height,
              rooms: map.rooms
            },
            bonuses: session.specialZoneBonus
          });
        } catch (error) {
          socket.emit("dungeon_error", { message: "Failed to choose path" });
          console.error("choose_path error:", error);
        }
      }
    );
    socket.on("abandon_dungeon", async (_payload) => {
      try {
        const session = activeDungeonSessions.get(socket.id);
        if (!session)
          return;
        await query(
          "UPDATE dungeons SET abandoned_at = CURRENT_TIMESTAMP WHERE id = $1",
          [session.dungeonId]
        );
        activeDungeonSessions.delete(socket.id);
        socket.emit("dungeon_abandoned", { message: "Dungeon abandoned" });
      } catch (error) {
        console.error("abandon_dungeon error:", error);
      }
    });
    socket.on("disconnect", () => {
      activeDungeonSessions.delete(socket.id);
    });
  });
}

// src/server.ts
import cors from "cors";
try {
  dns.setDefaultResultOrder("ipv4first");
  console.log("\u2705 [NETWORK] Set default DNS result order to ipv4first");
} catch (e) {
  console.warn("\u26A0\uFE0F [NETWORK] Could not set default DNS result order (Node version likely too old)");
}
process.on("uncaughtException", (err) => {
  console.error("\u274C [FATAL] Uncaught Exception:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("\u274C [FATAL] Unhandled Promise Rejection:", reason);
});
console.log("\u{1F680} [STARTUP] Loading modules...");
console.log("\u{1F680} [STARTUP] Loading dotenv...");
dotenv2.config();
console.log("\u{1F680} [STARTUP] DATABASE_URL set:", !!process.env.DATABASE_URL);
console.log("\u{1F680} [STARTUP] NODE_ENV:", process.env.NODE_ENV);
console.log("\u{1F680} [STARTUP] Loading socket handlers...");
console.log("\u{1F680} [STARTUP] Loading game modules...");
console.log("\u{1F680} [STARTUP] All modules loaded successfully");
var app = express();
var httpServer = createServer(app);
var io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.SOCKET_IO_CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});
var PORT = process.env.PORT || 3e3;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
var corsOptions = {
  origin: (origin, callback) => {
    const allowed = process.env.SOCKET_IO_CORS_ORIGIN || process.env.CORS_ORIGIN || "*";
    if (allowed === "*" || !origin || origin === allowed) {
      callback(null, true);
    } else {
      console.warn(`\u26A0\uFE0F [CORS] Rejected: ${origin}. Expected: ${allowed}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"]
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (process.env.NODE_ENV === "development" && !token) {
    console.log("\u26A0\uFE0F  [DEV] Allowing unauthenticated socket connection (dev mode)");
    socket.user = {
      id: "dev-user-001",
      email: "dev@test.local",
      username: "DevTester",
      iat: Math.floor(Date.now() / 1e3),
      exp: Math.floor(Date.now() / 1e3) + 86400
    };
    return next();
  }
  if (!token) {
    return next(new Error("Authentication required"));
  }
  try {
    const user = verifyToken(token);
    socket.user = user;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
var serverReady = false;
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});
app.get("/health", (req, res) => {
  try {
    const healthData = {
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      server_ready: serverReady
    };
    try {
      if (matchmakingQueue && typeof matchmakingQueue.getQueueSize === "function") {
        healthData.queue_size = matchmakingQueue.getQueueSize();
      }
    } catch (e) {
    }
    res.status(200).json(healthData);
  } catch (err) {
    console.error("\u274C Health check error:", err);
    res.status(500).json({
      status: "error",
      message: "Health check failed"
    });
  }
});
app.use("/api/auth", auth_routes_default);
app.use("/api/auth", oauth_routes_default);
app.use("/api/agents", agent_routes_default);
app.use("/api/battles", battle_routes_default);
app.use("/api/leaderboard", leaderboard_routes_default);
app.use("/api/costs", costs_routes_default);
app.use("/api/progression", progression_routes_default);
app.use("/api/crafting", crafting_routes_default);
setupGameSockets(io);
setupDungeonSockets(io);
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});
var errorHandler = (err, req, res, next) => {
  console.error("\u274C Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : void 0
  });
};
app.use(errorHandler);
httpServer.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\u274C Port ${PORT} is already in use`);
  } else {
    console.error("\u274C Server error:", err);
  }
  process.exit(1);
});
httpServer.listen(PORT, () => {
  serverReady = true;
  console.log(`\u2705 [READY] Agent Arena server running on port ${PORT}`);
  console.log(`\u{1F4E1} Socket.io ready for connections`);
  console.log(`\u{1F30D} Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`
\u{1F4CA} API endpoints:`);
  console.log(`   Health & Status:`);
  console.log(`     GET  /ping   (simple connectivity check)`);
  console.log(`     GET  /health (detailed health status)`);
  console.log(`   Auth:`);
  console.log(`     POST /api/auth/register`);
  console.log(`     POST /api/auth/login`);
  console.log(`   Agents:`);
  console.log(`     POST /api/agents`);
  console.log(`     GET  /api/agents/me/current`);
  console.log(`     GET  /api/agents/:id`);
  console.log(`   Battles:`);
  console.log(`     GET  /api/battles/:id`);
  console.log(`     GET  /api/battles/user/history`);
  console.log(`     POST /api/battles/simulate`);
  console.log(`   Leaderboard:`);
  console.log(`     GET  /api/leaderboard`);
  console.log(`     GET  /api/leaderboard/user/:user_id`);
  console.log(`     GET  /api/leaderboard/top/:count`);
  console.log(`
\u{1F3AE} Socket.io events:`);
  console.log(`   Battle: join_queue, leave_queue, start_battle, action, surrender`);
  console.log(`   Dungeon: start_dungeon, enter_room, dungeon_action, flee_encounter, next_floor, abandon_dungeon
`);
});
try {
  console.log("\u{1F504} Starting matchmaking service...");
  matchmakingQueue.startMatchmaking(5e3);
  console.log("\u2705 Matchmaking service started successfully");
} catch (err) {
  console.error("\u274C Failed to start matchmaking service:", err);
}
try {
  console.log("\u{1F4CA} Setting up leaderboard update timer...");
  setInterval(async () => {
    try {
      await updateLeaderboard();
    } catch (err) {
      console.error("\u26A0\uFE0F  Leaderboard update error:", err);
    }
  }, 5 * 60 * 1e3);
  console.log("\u2705 Leaderboard update timer initialized");
} catch (err) {
  console.error("\u274C Failed to set up leaderboard updates:", err);
}
console.log("\u2705 [STARTUP] Server fully initialized and ready to receive requests");
(async () => {
  try {
    console.log("\u{1F504} [STARTUP] Running schema cleanup for dungeon tables...");
    await query("DROP TABLE IF EXISTS dungeon_progress CASCADE");
    console.log("\u2713 Dropped dungeon_progress table");
    await query("DROP TABLE IF EXISTS loot_drops CASCADE");
    console.log("\u2713 Dropped loot_drops table");
    await query("DROP TABLE IF EXISTS encounters CASCADE");
    console.log("\u2713 Dropped encounters table");
    await query("DROP TABLE IF EXISTS dungeons CASCADE");
    console.log("\u2713 Dropped dungeons table");
    await query(`
      CREATE TABLE IF NOT EXISTS dungeons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        difficulty dungeon_difficulty DEFAULT 'normal',
        seed INT NOT NULL,
        depth INT DEFAULT 1,
        max_depth INT DEFAULT 1,
        gold_collected INT DEFAULT 0,
        experience_earned INT DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        abandoned_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("\u2713 Created dungeons table");
    await query("CREATE INDEX IF NOT EXISTS idx_dungeons_user_id ON dungeons(user_id)");
    await query("CREATE INDEX IF NOT EXISTS idx_dungeons_agent_id ON dungeons(agent_id)");
    await query("CREATE INDEX IF NOT EXISTS idx_dungeons_difficulty ON dungeons(difficulty)");
    await query(`
      CREATE TABLE IF NOT EXISTS encounters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dungeon_id UUID NOT NULL REFERENCES dungeons(id) ON DELETE CASCADE,
        room_id INT NOT NULL,
        enemy_type VARCHAR(50) NOT NULL,
        enemy_level INT DEFAULT 1,
        enemy_hp INT NOT NULL,
        enemy_max_hp INT NOT NULL,
        enemy_attack INT NOT NULL,
        enemy_defense INT NOT NULL,
        enemy_speed INT NOT NULL,
        enemy_loot_table JSONB DEFAULT '{}',
        encountered_at TIMESTAMP,
        defeated_at TIMESTAMP,
        victory BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("\u2713 Created encounters table");
    await query("CREATE INDEX IF NOT EXISTS idx_encounters_dungeon_id ON encounters(dungeon_id)");
    await query("CREATE INDEX IF NOT EXISTS idx_encounters_room_id ON encounters(room_id)");
    await query(`
      CREATE TABLE IF NOT EXISTS loot_drops (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dungeon_id UUID NOT NULL REFERENCES dungeons(id) ON DELETE CASCADE,
        encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
        item_id UUID REFERENCES items(id),
        gold INT DEFAULT 0,
        experience INT DEFAULT 0,
        found_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        collected BOOLEAN DEFAULT FALSE,
        collected_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("\u2713 Created loot_drops table");
    await query("CREATE INDEX IF NOT EXISTS idx_loot_drops_dungeon_id ON loot_drops(dungeon_id)");
    await query("CREATE INDEX IF NOT EXISTS idx_loot_drops_encounter_id ON loot_drops(encounter_id)");
    await query(`
      CREATE TABLE IF NOT EXISTS dungeon_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dungeon_id UUID NOT NULL REFERENCES dungeons(id) ON DELETE CASCADE UNIQUE,
        map_data JSONB NOT NULL DEFAULT '{}',
        current_room_id INT DEFAULT 1,
        visited_rooms INT[] DEFAULT ARRAY[]::INT[],
        discovered_rooms INT[] DEFAULT ARRAY[]::INT[],
        player_x INT DEFAULT 0,
        player_y INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("\u2713 Created dungeon_progress table");
    await query("CREATE INDEX IF NOT EXISTS idx_dungeon_progress_dungeon_id ON dungeon_progress(dungeon_id)");
    console.log("\u2705 [STARTUP] Dungeon tables recreated successfully (no bad constraints)");
  } catch (err) {
    console.error("\u26A0\uFE0F  [STARTUP] Schema cleanup warning (may be okay):", err.message);
  }
})();
export {
  app,
  io
};
