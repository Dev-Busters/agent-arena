/**
 * BSP (Binary Space Partitioning) Dungeon Generator
 * 
 * Creates sophisticated room layouts by recursively splitting the map space
 * into partitions, placing rooms within leaf nodes, and connecting them
 * with corridors. Supports room types, decorations, and special features.
 * 
 * Algorithm:
 * 1. Start with full map as root node
 * 2. Recursively split into left/right or top/bottom partitions
 * 3. Place rooms in leaf partitions with padding
 * 4. Connect sibling rooms with corridors (L-shaped or straight)
 * 5. Assign room types based on position, depth, and difficulty
 * 6. Place features (doors, traps, treasure, exits) within rooms
 */

import SeededRandom from "seedrandom";

// ─── Tile Types ──────────────────────────────────────────────────────────────

export enum Tile {
  WALL = 0,
  FLOOR = 1,
  EXIT = 2,
  DOOR = 3,
  CORRIDOR = 4,
  TRAP = 5,
  TREASURE = 6,
  PILLAR = 7,
  WATER = 8,
  LAVA = 9,
  ENTRANCE = 10,
}

// ─── Room Types ──────────────────────────────────────────────────────────────

export type RoomType =
  | "entrance"       // Starting room - safe, no enemies
  | "normal"         // Standard combat room
  | "treasure"       // Contains loot chests
  | "trap"           // Filled with traps and hazards
  | "boss"           // Boss encounter room (large)
  | "shrine"         // Healing / buff shrine
  | "armory"         // Equipment drops
  | "library"        // XP bonus room
  | "exit"           // Floor exit room
  | "secret";        // Hidden room with rare loot

export interface BSPRoom {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  type: RoomType;
  connections: number[];  // IDs of connected rooms
  features: RoomFeature[];
  explored: boolean;
}

export interface RoomFeature {
  type: "chest" | "trap" | "shrine" | "pillar" | "water" | "lava" | "torch" | "bookshelf";
  x: number;
  y: number;
}

export interface Corridor {
  id: number;
  from: number;  // Room ID
  to: number;    // Room ID
  points: Array<{ x: number; y: number }>;
  hasDoor: boolean;
}

export interface BSPDungeonMap {
  width: number;
  height: number;
  tiles: number[][];
  rooms: BSPRoom[];
  corridors: Corridor[];
  entrance: { x: number; y: number };
  exit: { x: number; y: number };
  seed: number;
  depth: number;
  roomCount: number;
}

// ─── BSP Tree Node ───────────────────────────────────────────────────────────

interface BSPNode {
  x: number;
  y: number;
  width: number;
  height: number;
  left: BSPNode | null;
  right: BSPNode | null;
  room: BSPRoom | null;
  splitHorizontal: boolean;
}

// ─── Configuration ───────────────────────────────────────────────────────────

export interface BSPConfig {
  width: number;
  height: number;
  minPartitionSize: number;     // Minimum partition dimension before stopping split
  maxPartitionSize: number;     // Force split if partition exceeds this
  minRoomSize: number;          // Minimum room dimension
  roomPadding: number;          // Min padding between room edge and partition edge
  maxDepthSplits: number;       // Maximum BSP tree depth
  corridorWidth: number;        // Width of corridors (1 or 2)
  doorChance: number;           // Chance of placing a door between rooms (0-1)
  trapChance: number;           // Chance of trap rooms
  treasureChance: number;       // Chance of treasure rooms
  secretRoomChance: number;     // Chance of hidden rooms branching off corridors
  featureDensity: number;       // How many features per room (0-1 scale)
  bossRoomMinSize: number;      // Minimum size for boss room
}

const DEFAULT_CONFIG: BSPConfig = {
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
  bossRoomMinSize: 8,
};

// ─── Difficulty Scaling ──────────────────────────────────────────────────────

type DungeonDifficulty = "easy" | "normal" | "hard" | "nightmare";

function getConfigForDifficulty(
  difficulty: DungeonDifficulty,
  depth: number
): Partial<BSPConfig> {
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
        doorChance: 0.2,
      };
    case "normal":
      return {
        width: 80,
        height: 40,
        maxDepthSplits: 5,
        trapChance: 0.12 * baseScale,
        treasureChance: 0.18,
        secretRoomChance: 0.08,
        doorChance: 0.35,
      };
    case "hard":
      return {
        width: 90,
        height: 45,
        maxDepthSplits: 6,
        trapChance: 0.2 * baseScale,
        treasureChance: 0.12,
        secretRoomChance: 0.12,
        doorChance: 0.5,
      };
    case "nightmare":
      return {
        width: 100,
        height: 50,
        maxDepthSplits: 7,
        trapChance: 0.25 * baseScale,
        treasureChance: 0.1,
        secretRoomChance: 0.15,
        doorChance: 0.6,
      };
  }
}

// ─── BSP Dungeon Generator ──────────────────────────────────────────────────

export class BSPDungeonGenerator {
  private config: BSPConfig;
  private rng: () => number;
  private tiles: number[][];
  private rooms: BSPRoom[] = [];
  private corridors: Corridor[] = [];
  private nextRoomId = 0;
  private nextCorridorId = 0;

  constructor(config: Partial<BSPConfig> = {}, seed: number = Date.now()) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rng = SeededRandom(seed.toString());
    this.tiles = [];
  }

  /**
   * Main generation entry point
   */
  generate(difficulty: DungeonDifficulty, depth: number, seed: number): BSPDungeonMap {
    // Re-seed for deterministic generation
    this.rng = SeededRandom(seed.toString());

    // Apply difficulty overrides
    const diffConfig = getConfigForDifficulty(difficulty, depth);
    this.config = { ...DEFAULT_CONFIG, ...diffConfig };

    // Reset state
    this.rooms = [];
    this.corridors = [];
    this.nextRoomId = 0;
    this.nextCorridorId = 0;

    // Initialize tile grid (all walls)
    this.initTiles();

    // Build BSP tree
    const root = this.createBSPNode(
      1, 1,
      this.config.width - 2,
      this.config.height - 2
    );
    this.splitNode(root, 0);

    // Place rooms in leaf nodes
    this.placeRooms(root);

    // Connect rooms via BSP tree structure
    this.connectRooms(root);

    // Assign room types
    this.assignRoomTypes(difficulty, depth);

    // Place features within rooms
    this.placeFeatures();

    // Place entrance and exit
    const entrance = this.placeEntrance();
    const exit = this.placeExit();

    // Optionally add secret rooms
    this.addSecretRooms();

    // Carve everything into the tile grid
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
      roomCount: this.rooms.length,
    };
  }

  // ─── Tile Grid ───────────────────────────────────────────────────────

  private initTiles(): void {
    this.tiles = [];
    for (let y = 0; y < this.config.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.config.width; x++) {
        this.tiles[y][x] = Tile.WALL;
      }
    }
  }

  // ─── BSP Tree Construction ───────────────────────────────────────────

  private createBSPNode(x: number, y: number, w: number, h: number): BSPNode {
    return {
      x, y, width: w, height: h,
      left: null, right: null, room: null,
      splitHorizontal: false,
    };
  }

  private splitNode(node: BSPNode, depth: number): void {
    // Stop conditions
    if (depth >= this.config.maxDepthSplits) return;
    if (node.width <= this.config.minPartitionSize * 2 &&
        node.height <= this.config.minPartitionSize * 2) return;

    // Determine split direction
    let splitH: boolean;
    if (node.width > node.height * 1.25) {
      splitH = false; // Split vertically (wide partition)
    } else if (node.height > node.width * 1.25) {
      splitH = true;  // Split horizontally (tall partition)
    } else {
      splitH = this.rng() > 0.5;
    }

    node.splitHorizontal = splitH;

    const maxSize = (splitH ? node.height : node.width) - this.config.minPartitionSize;
    if (maxSize <= this.config.minPartitionSize) return; // Can't split further

    // Choose split point with some randomness (avoid extreme edges)
    const minSplit = this.config.minPartitionSize;
    const range = maxSize - minSplit;
    const split = minSplit + Math.floor(this.rng() * range);

    if (splitH) {
      // Horizontal split
      node.left = this.createBSPNode(node.x, node.y, node.width, split);
      node.right = this.createBSPNode(node.x, node.y + split, node.width, node.height - split);
    } else {
      // Vertical split
      node.left = this.createBSPNode(node.x, node.y, split, node.height);
      node.right = this.createBSPNode(node.x + split, node.y, node.width - split, node.height);
    }

    // Recurse
    this.splitNode(node.left, depth + 1);
    this.splitNode(node.right, depth + 1);
  }

  // ─── Room Placement ──────────────────────────────────────────────────

  private placeRooms(node: BSPNode): void {
    if (node.left || node.right) {
      // Not a leaf - recurse
      if (node.left) this.placeRooms(node.left);
      if (node.right) this.placeRooms(node.right);
      return;
    }

    // Leaf node - place a room
    const padding = this.config.roomPadding;
    const minSize = this.config.minRoomSize;

    const maxW = node.width - padding * 2;
    const maxH = node.height - padding * 2;

    if (maxW < minSize || maxH < minSize) return; // Partition too small

    // Room size: random between min and max, biased toward larger
    const roomW = minSize + Math.floor(this.rng() * (maxW - minSize + 1));
    const roomH = minSize + Math.floor(this.rng() * (maxH - minSize + 1));

    // Room position within partition (with padding)
    const roomX = node.x + padding + Math.floor(this.rng() * (maxW - roomW + 1));
    const roomY = node.y + padding + Math.floor(this.rng() * (maxH - roomH + 1));

    const room: BSPRoom = {
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
      explored: false,
    };

    node.room = room;
    this.rooms.push(room);
  }

  // ─── Room Connection (Corridors) ─────────────────────────────────────

  private connectRooms(node: BSPNode): void {
    if (!node.left || !node.right) return;

    // Recurse first to connect deeper nodes
    this.connectRooms(node.left);
    this.connectRooms(node.right);

    // Find closest rooms between left and right subtrees
    const leftRooms = this.getLeafRooms(node.left);
    const rightRooms = this.getLeafRooms(node.right);

    if (leftRooms.length === 0 || rightRooms.length === 0) return;

    // Find the pair of rooms closest to each other
    let bestDist = Infinity;
    let bestLeft: BSPRoom = leftRooms[0];
    let bestRight: BSPRoom = rightRooms[0];

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

    // Create corridor between them
    this.createCorridor(bestLeft, bestRight);
  }

  private getLeafRooms(node: BSPNode): BSPRoom[] {
    if (node.room) return [node.room];
    const rooms: BSPRoom[] = [];
    if (node.left) rooms.push(...this.getLeafRooms(node.left));
    if (node.right) rooms.push(...this.getLeafRooms(node.right));
    return rooms;
  }

  private createCorridor(from: BSPRoom, to: BSPRoom): void {
    const points: Array<{ x: number; y: number }> = [];
    const x1 = from.centerX;
    const y1 = from.centerY;
    const x2 = to.centerX;
    const y2 = to.centerY;

    // L-shaped corridor: horizontal then vertical, or vice versa
    if (this.rng() > 0.5) {
      // Horizontal first, then vertical
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        points.push({ x, y: y1 });
      }
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        points.push({ x: x2, y });
      }
    } else {
      // Vertical first, then horizontal
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        points.push({ x: x1, y });
      }
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        points.push({ x, y: y2 });
      }
    }

    const hasDoor = this.rng() < this.config.doorChance;

    const corridor: Corridor = {
      id: this.nextCorridorId++,
      from: from.id,
      to: to.id,
      points,
      hasDoor,
    };

    // Register connections
    if (!from.connections.includes(to.id)) from.connections.push(to.id);
    if (!to.connections.includes(from.id)) to.connections.push(from.id);

    this.corridors.push(corridor);
  }

  // ─── Room Type Assignment ────────────────────────────────────────────

  private assignRoomTypes(difficulty: DungeonDifficulty, depth: number): void {
    if (this.rooms.length === 0) return;

    // First room = entrance
    this.rooms[0].type = "entrance";

    // Last room = exit
    if (this.rooms.length > 1) {
      this.rooms[this.rooms.length - 1].type = "exit";
    }

    // Assign boss room (largest remaining room, if deep enough)
    if (depth >= 3 && this.rooms.length >= 4) {
      const candidates = this.rooms.slice(1, -1); // Exclude entrance/exit
      const largest = candidates.reduce((best, room) =>
        (room.width * room.height > best.width * best.height) ? room : best
      );
      if (largest.width >= this.config.bossRoomMinSize || 
          largest.height >= this.config.bossRoomMinSize) {
        largest.type = "boss";
      }
    }

    // Assign other types to remaining "normal" rooms
    for (const room of this.rooms) {
      if (room.type !== "normal") continue;

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
      // else stays "normal"
    }
  }

  // ─── Feature Placement ───────────────────────────────────────────────

  private placeFeatures(): void {
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

  private placeTreasureFeatures(room: BSPRoom, max: number): void {
    const count = Math.max(1, Math.min(max, 3));
    for (let i = 0; i < count; i++) {
      room.features.push({
        type: "chest",
        x: room.x + 1 + Math.floor(this.rng() * (room.width - 2)),
        y: room.y + 1 + Math.floor(this.rng() * (room.height - 2)),
      });
    }
    // Add torches for atmosphere
    this.addCornerTorches(room);
  }

  private placeTrapFeatures(room: BSPRoom, max: number): void {
    const count = Math.max(2, Math.min(max, 5));
    for (let i = 0; i < count; i++) {
      room.features.push({
        type: "trap",
        x: room.x + 1 + Math.floor(this.rng() * (room.width - 2)),
        y: room.y + 1 + Math.floor(this.rng() * (room.height - 2)),
      });
    }
  }

  private placeShrineFeatures(room: BSPRoom): void {
    room.features.push({
      type: "shrine",
      x: room.centerX,
      y: room.centerY,
    });
    this.addCornerTorches(room);
  }

  private placeLibraryFeatures(room: BSPRoom, max: number): void {
    const count = Math.max(2, Math.min(max, 4));
    for (let i = 0; i < count; i++) {
      room.features.push({
        type: "bookshelf",
        x: room.x + 1 + Math.floor(this.rng() * (room.width - 2)),
        y: room.y + (i % 2 === 0 ? 0 : room.height - 1), // Along walls
      });
    }
  }

  private placeBossFeatures(room: BSPRoom): void {
    // Pillars in boss room
    if (room.width >= 6 && room.height >= 6) {
      const px = Math.floor(room.width / 4);
      const py = Math.floor(room.height / 4);
      room.features.push(
        { type: "pillar", x: room.x + px, y: room.y + py },
        { type: "pillar", x: room.x + room.width - px - 1, y: room.y + py },
        { type: "pillar", x: room.x + px, y: room.y + room.height - py - 1 },
        { type: "pillar", x: room.x + room.width - px - 1, y: room.y + room.height - py - 1 },
      );
    }
    this.addCornerTorches(room);
  }

  private placeNormalFeatures(room: BSPRoom, max: number): void {
    if (this.rng() < 0.3) {
      this.addCornerTorches(room);
    }
    // Small chance of a pillar
    if (room.width >= 5 && room.height >= 5 && this.rng() < 0.2) {
      room.features.push({
        type: "pillar",
        x: room.centerX,
        y: room.centerY,
      });
    }
    // Rare water feature
    if (this.rng() < 0.08) {
      room.features.push({
        type: "water",
        x: room.centerX,
        y: room.centerY,
      });
    }
  }

  private addCornerTorches(room: BSPRoom): void {
    if (room.width >= 3 && room.height >= 3) {
      room.features.push(
        { type: "torch", x: room.x, y: room.y },
        { type: "torch", x: room.x + room.width - 1, y: room.y },
        { type: "torch", x: room.x, y: room.y + room.height - 1 },
        { type: "torch", x: room.x + room.width - 1, y: room.y + room.height - 1 },
      );
    }
  }

  // ─── Entrance / Exit ─────────────────────────────────────────────────

  private placeEntrance(): { x: number; y: number } {
    const room = this.rooms.find(r => r.type === "entrance") || this.rooms[0];
    if (!room) return { x: 1, y: 1 };
    return { x: room.centerX, y: room.centerY };
  }

  private placeExit(): { x: number; y: number } {
    const room = this.rooms.find(r => r.type === "exit") || this.rooms[this.rooms.length - 1];
    if (!room) return { x: this.config.width - 2, y: this.config.height - 2 };
    return { x: room.centerX, y: room.centerY };
  }

  // ─── Secret Rooms ────────────────────────────────────────────────────

  private addSecretRooms(): void {
    // Attempt to branch secret rooms off existing corridors
    for (const corridor of [...this.corridors]) {
      if (this.rng() >= this.config.secretRoomChance) continue;

      // Pick a midpoint of the corridor
      const midIdx = Math.floor(corridor.points.length / 2);
      const mid = corridor.points[midIdx];
      if (!mid) continue;

      // Try to carve a small secret room nearby
      const dirs = [
        { dx: 0, dy: -1 }, // up
        { dx: 0, dy: 1 },  // down
        { dx: -1, dy: 0 }, // left
        { dx: 1, dy: 0 },  // right
      ];

      const dir = dirs[Math.floor(this.rng() * dirs.length)];
      const secretW = 3 + Math.floor(this.rng() * 3);
      const secretH = 3 + Math.floor(this.rng() * 3);
      const sx = mid.x + dir.dx * 3;
      const sy = mid.y + dir.dy * 3;

      // Bounds check
      if (sx < 2 || sy < 2 ||
          sx + secretW >= this.config.width - 2 ||
          sy + secretH >= this.config.height - 2) continue;

      // Check for overlap with existing rooms
      if (this.overlapsAnyRoom(sx, sy, secretW, secretH)) continue;

      const secretRoom: BSPRoom = {
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
            y: Math.floor(sy + secretH / 2),
          },
        ],
        explored: false,
      };

      this.rooms.push(secretRoom);

      // Connect secret room to the corridor's source room
      const sourceRoom = this.rooms.find(r => r.id === corridor.from);
      if (sourceRoom) {
        this.createCorridor(sourceRoom, secretRoom);
      }
    }
  }

  private overlapsAnyRoom(x: number, y: number, w: number, h: number): boolean {
    const pad = 1;
    for (const room of this.rooms) {
      if (x - pad < room.x + room.width &&
          x + w + pad > room.x &&
          y - pad < room.y + room.height &&
          y + h + pad > room.y) {
        return true;
      }
    }
    return false;
  }

  // ─── Tile Carving ────────────────────────────────────────────────────

  private carveTiles(): void {
    // Carve rooms
    for (const room of this.rooms) {
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          if (this.inBounds(x, y)) {
            this.tiles[y][x] = Tile.FLOOR;
          }
        }
      }

      // Carve features
      for (const feat of room.features) {
        if (!this.inBounds(feat.x, feat.y)) continue;
        switch (feat.type) {
          case "trap":
            this.tiles[feat.y][feat.x] = Tile.TRAP;
            break;
          case "chest":
            this.tiles[feat.y][feat.x] = Tile.TREASURE;
            break;
          case "pillar":
            this.tiles[feat.y][feat.x] = Tile.PILLAR;
            break;
          case "water":
            this.tiles[feat.y][feat.x] = Tile.WATER;
            break;
          // torches, bookshelves, shrines render as floor with metadata
        }
      }
    }

    // Carve corridors
    for (const corridor of this.corridors) {
      for (const point of corridor.points) {
        if (this.inBounds(point.x, point.y)) {
          // Don't overwrite room floors
          if (this.tiles[point.y][point.x] === Tile.WALL) {
            this.tiles[point.y][point.x] = Tile.CORRIDOR;
          }
          // Widen corridor if config says so
          if (this.config.corridorWidth >= 2) {
            for (const [dx, dy] of [[0, 1], [1, 0]]) {
              const nx = point.x + dx;
              const ny = point.y + dy;
              if (this.inBounds(nx, ny) && this.tiles[ny][nx] === Tile.WALL) {
                this.tiles[ny][nx] = Tile.CORRIDOR;
              }
            }
          }
        }
      }

      // Place doors at corridor endpoints if applicable
      if (corridor.hasDoor && corridor.points.length > 0) {
        const doorPoint = corridor.points[0];
        if (this.inBounds(doorPoint.x, doorPoint.y)) {
          this.tiles[doorPoint.y][doorPoint.x] = Tile.DOOR;
        }
      }
    }

    // Place entrance and exit markers
    const entrance = this.placeEntrance();
    const exit = this.placeExit();
    if (this.inBounds(entrance.x, entrance.y)) {
      this.tiles[entrance.y][entrance.x] = Tile.ENTRANCE;
    }
    if (this.inBounds(exit.x, exit.y)) {
      this.tiles[exit.y][exit.x] = Tile.EXIT;
    }
  }

  private inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.config.width && y >= 0 && y < this.config.height;
  }
}

// ─── Convenience Function ────────────────────────────────────────────────────

/**
 * Generate a BSP dungeon map (drop-in replacement for the old generateDungeon)
 */
export function generateBSPDungeon(
  seed: number,
  difficulty: DungeonDifficulty,
  depth: number,
  _playerLevel: number
): BSPDungeonMap {
  const generator = new BSPDungeonGenerator({}, seed);
  return generator.generate(difficulty, depth, seed);
}

/**
 * Convert BSPDungeonMap to the legacy DungeonMap format for backward compatibility
 */
export function bspToLegacyFormat(bspMap: BSPDungeonMap): {
  width: number;
  height: number;
  tiles: number[][];
  rooms: Array<{ id: number; x: number; y: number; width: number; height: number }>;
  visited: Set<number>;
} {
  return {
    width: bspMap.width,
    height: bspMap.height,
    tiles: bspMap.tiles,
    rooms: bspMap.rooms.map(r => ({
      id: r.id,
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
    })),
    visited: new Set(),
  };
}

/**
 * Get room adjacency graph for pathfinding
 */
export function getRoomGraph(map: BSPDungeonMap): Map<number, number[]> {
  const graph = new Map<number, number[]>();
  for (const room of map.rooms) {
    graph.set(room.id, [...room.connections]);
  }
  return graph;
}

/**
 * Find shortest path between two rooms using BFS
 */
export function findRoomPath(
  graph: Map<number, number[]>,
  startId: number,
  endId: number
): number[] | null {
  const visited = new Set<number>();
  const queue: Array<{ id: number; path: number[] }> = [
    { id: startId, path: [startId] },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.id === endId) return current.path;
    if (visited.has(current.id)) continue;
    visited.add(current.id);

    const neighbors = graph.get(current.id) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        queue.push({ id: neighbor, path: [...current.path, neighbor] });
      }
    }
  }

  return null;
}

/**
 * ASCII visualization for debugging
 */
export function dungeonToASCII(map: BSPDungeonMap): string {
  const chars: Record<number, string> = {
    [Tile.WALL]: "█",
    [Tile.FLOOR]: ".",
    [Tile.EXIT]: "▼",
    [Tile.DOOR]: "+",
    [Tile.CORRIDOR]: "#",
    [Tile.TRAP]: "^",
    [Tile.TREASURE]: "$",
    [Tile.PILLAR]: "O",
    [Tile.WATER]: "~",
    [Tile.LAVA]: "≈",
    [Tile.ENTRANCE]: "▲",
  };

  let output = "";
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      output += chars[map.tiles[y][x]] || "?";
    }
    output += "\n";
  }
  return output;
}
