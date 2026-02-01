export enum GameScreen {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export enum NinjaColor {
  RED = '#ef4444',    // Kai
  BLUE = '#3b82f6',   // Jay
  GREEN = '#22c55e',  // Lloyd
  BLACK = '#1f2937',  // Cole
  WHITE = '#f3f4f6',  // Zane
}

export enum ActionState {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  JUMPING = 'JUMPING',
  ATTACKING = 'ATTACKING',
  SPINJITZU = 'SPINJITZU',
  HIT = 'HIT',
  DEAD = 'DEAD',
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  energy: number; // For Spinjitzu
  maxEnergy: number;
  facing: 1 | -1; // 1 right, -1 left
  color: NinjaColor;
  actionState: ActionState;
  attackCooldown: number;
  frameTimer: number; // For animation visual
  name: string;
  isAi: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface GameContextType {
  screen: GameScreen;
  setScreen: (s: GameScreen) => void;
  winner: string | null;
  setWinner: (w: string | null) => void;
  selectedNinja: NinjaColor;
  setSelectedNinja: (c: NinjaColor) => void;
  battleLog: string;
  setBattleLog: (s: string) => void;
}