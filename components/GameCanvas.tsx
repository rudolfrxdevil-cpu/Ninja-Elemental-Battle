import React, { useRef, useEffect, useState } from 'react';
import { PlayerState, NinjaColor, ActionState, Particle } from '../types';
import HUD from './HUD';
import { getBattleCommentary } from '../services/geminiService';

// Constants
const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 576;
const GRAVITY = 0.6;
const FRICTION = 0.85;
const MOVE_SPEED = 1.2; // Acceleration
const MAX_SPEED = 8;
const JUMP_FORCE = -14;
const GROUND_Y = 480;
const HITBOX_WIDTH = 50;
const HITBOX_HEIGHT = 90;

interface GameCanvasProps {
  playerColor: NinjaColor;
  onGameOver: (winner: string, commentary: string) => void;
}

// Helper Component for Touch Buttons
interface TouchButtonProps {
  label: React.ReactNode;
  onPress: (pressed: boolean) => void;
  color?: string;
  className?: string;
}

const TouchButton: React.FC<TouchButtonProps> = ({ label, onPress, color = "bg-gray-700", className = "" }) => {
  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onPress(true);
  };
  
  const handleEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onPress(false);
  };

  return (
    <button
      className={`select-none touch-none rounded-xl ${color} bg-opacity-80 text-white font-bold flex items-center justify-center active:scale-90 active:bg-opacity-100 shadow-lg border-2 border-white/20 backdrop-blur-sm transition-transform ${className}`}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {label}
    </button>
  );
};

const createPlayer = (x: number, color: NinjaColor, name: string, isAi: boolean = false, facing: 1 | -1 = 1): PlayerState => ({
  x,
  y: GROUND_Y - HITBOX_HEIGHT,
  vx: 0,
  vy: 0,
  width: HITBOX_WIDTH,
  height: HITBOX_HEIGHT,
  hp: 100,
  maxHp: 100,
  energy: 100,
  maxEnergy: 100,
  facing,
  color,
  actionState: ActionState.IDLE,
  attackCooldown: 0,
  frameTimer: 0,
  name,
  isAi,
});

const GameCanvas: React.FC<GameCanvasProps> = ({ playerColor, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hudState, setHudState] = useState<{ p1: PlayerState, p2: PlayerState } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Mutable game state in refs to avoid React render cycle in game loop
  const gameState = useRef({
    p1: createPlayer(200, playerColor, "Hero"),
    p2: createPlayer(CANVAS_WIDTH - 200, NinjaColor.BLACK, "Shadow", true, -1),
    particles: [] as Particle[],
    gameActive: true,
    keys: {} as Record<string, boolean>,
  });

  // Mobile Detection
  useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Controls handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gameState.current.keys[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      gameState.current.keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Helper to bridge touch to keys
  const setKey = (key: string, pressed: boolean) => {
    gameState.current.keys[key] = pressed;
  };

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const spawnParticles = (x: number, y: number, color: string, count: number, type: 'hit' | 'spin' = 'hit') => {
      for (let i = 0; i < count; i++) {
        gameState.current.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * (type === 'spin' ? 15 : 8),
          vy: (Math.random() - 0.5) * (type === 'spin' ? 15 : 8),
          life: 1.0,
          color,
          size: Math.random() * 4 + 2
        });
      }
    };

    const updatePhysics = (p: PlayerState, enemy: PlayerState, keys: Record<string, boolean>, isP1: boolean) => {
        if (!gameState.current.gameActive) return;
        if (p.actionState === ActionState.DEAD) return;

        // --- INPUT HANDLING ---
        // Cooldown management
        if (p.attackCooldown > 0) p.attackCooldown--;
        if (p.energy < p.maxEnergy) p.energy += 0.1;

        // Reset state if animation finished (simplified frame timer logic)
        if (p.actionState === ActionState.ATTACKING && p.attackCooldown < 10) {
             p.actionState = ActionState.IDLE;
        }
        if (p.actionState === ActionState.SPINJITZU && p.attackCooldown <= 0) {
            p.actionState = ActionState.IDLE;
        }
        if (p.actionState === ActionState.HIT && p.attackCooldown <= 0) {
            p.actionState = ActionState.IDLE;
        }

        // Movement (Only if not in un-cancelable states like HIT)
        const canMove = p.actionState !== ActionState.HIT;
        
        if (canMove) {
            let dx = 0;
            let jump = false;
            let attack = false;
            let kick = false;
            let spin = false;

            if (!p.isAi) {
                if (keys['a']) dx = -1;
                if (keys['d']) dx = 1;
                if (keys['w'] && p.y >= GROUND_Y - p.height - 1) jump = true;
                if (keys['f']) attack = true;
                if (keys['g']) kick = true;
                if (keys['h']) spin = true;
            } else {
                // Simple AI
                const dist = Math.abs(p.x - enemy.x);
                if (dist > 80) {
                    dx = p.x < enemy.x ? 1 : -1;
                } else if (dist < 40) {
                     dx = p.x < enemy.x ? -1 : 1; // Back off
                }
                
                // Face enemy
                p.facing = p.x < enemy.x ? 1 : -1;

                if (dist < 100 && Math.random() < 0.02) attack = true;
                if (dist < 100 && Math.random() < 0.01) kick = true;
                if (dist < 120 && Math.random() < 0.005 && p.energy > 30) spin = true;
            }

            // Apply Horizontal Force
            if (p.actionState !== ActionState.SPINJITZU) {
                p.vx += dx * MOVE_SPEED;
            } else {
                // Spinjitzu moves faster
                p.vx += dx * MOVE_SPEED * 1.5;
            }
            
            // Limit Speed
            p.vx = Math.max(Math.min(p.vx, MAX_SPEED), -MAX_SPEED);

            // Jump
            if (jump) {
                p.vy = JUMP_FORCE;
                p.actionState = ActionState.JUMPING;
            }

            // Facing
            if (dx !== 0) p.facing = dx > 0 ? 1 : -1;

            // Attacks
            if (p.actionState === ActionState.IDLE || p.actionState === ActionState.RUNNING || p.actionState === ActionState.JUMPING) {
                if (spin && p.energy >= 30) {
                    p.actionState = ActionState.SPINJITZU;
                    p.attackCooldown = 60; // Duration
                    p.energy -= 30;
                    spawnParticles(p.x + p.width/2, p.y + p.height/2, p.color, 10, 'spin');
                } else if (kick && p.attackCooldown === 0) {
                    p.actionState = ActionState.ATTACKING;
                    p.attackCooldown = 25;
                    // Kick lunge
                    p.vx = p.facing * 5; 
                } else if (attack && p.attackCooldown === 0) {
                    p.actionState = ActionState.ATTACKING;
                    p.attackCooldown = 20;
                }
            }
        }

        // --- PHYSICS ---
        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= FRICTION;

        // Ground Collision
        if (p.y + p.height >= GROUND_Y) {
            p.y = GROUND_Y - p.height;
            p.vy = 0;
            if (p.actionState === ActionState.JUMPING) p.actionState = ActionState.IDLE;
        }

        // Wall Collision
        if (p.x < 0) { p.x = 0; p.vx = 0; }
        if (p.x + p.width > CANVAS_WIDTH) { p.x = CANVAS_WIDTH - p.width; p.vx = 0; }

        // --- HIT DETECTION ---
        // Simple AABB overlap check for attacks
        if (p.actionState === ActionState.ATTACKING || p.actionState === ActionState.SPINJITZU) {
            // Define active frames for hitbox
            const activeFrame = (p.actionState === ActionState.SPINJITZU) || (p.attackCooldown > 10 && p.attackCooldown < 20);
            
            if (activeFrame) {
                const reach = p.actionState === ActionState.SPINJITZU ? 40 : 30;
                const hitX = p.facing === 1 ? p.x + p.width : p.x - reach;
                const hitBox = { x: hitX, y: p.y, w: reach, h: p.height };

                // Check overlap with enemy
                if (
                    hitBox.x < enemy.x + enemy.width &&
                    hitBox.x + hitBox.w > enemy.x &&
                    hitBox.y < enemy.y + enemy.height &&
                    hitBox.y + hitBox.h > enemy.y
                ) {
                     // Enemy Hit?
                     if (enemy.actionState !== ActionState.HIT && enemy.actionState !== ActionState.DEAD && enemy.attackCooldown <= 0) {
                         // DAMAGE
                         const dmg = p.actionState === ActionState.SPINJITZU ? 15 : 8;
                         enemy.hp -= dmg;
                         enemy.actionState = ActionState.HIT;
                         enemy.attackCooldown = 20; // Stun time
                         enemy.vx = p.facing * 10; // Knockback
                         enemy.vy = -4;
                         
                         // Visuals
                         spawnParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#ffffff', 5, 'hit');
                         spawnParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#ff0000', 3, 'hit');

                         if (enemy.hp <= 0) {
                             enemy.hp = 0;
                             enemy.actionState = ActionState.DEAD;
                             endGame(p, enemy);
                         }
                     }
                }
            }
        }
    };

    const endGame = async (winner: PlayerState, loser: PlayerState) => {
        gameState.current.gameActive = false;
        
        // Let animation play out slightly
        setTimeout(async () => {
             const commentary = await getBattleCommentary(winner.color, loser.color, winner.hp);
             onGameOver(winner.name, commentary);
        }, 1500);
    };

    const drawPlayer = (p: PlayerState) => {
        ctx.save();
        
        // Translation for easy flipping
        ctx.translate(p.x + p.width/2, p.y + p.height/2);
        ctx.scale(p.facing, 1);
        
        // If Hit, flash white
        if (p.actionState === ActionState.HIT) {
            ctx.globalAlpha = 0.5 + Math.random() * 0.5;
        }

        // --- NINJA DRAWING (LEGO STYLE) ---
        const legH = 25;
        // Spinjitzu Effect
        if (p.actionState === ActionState.SPINJITZU) {
             ctx.fillStyle = p.color;
             ctx.globalAlpha = 0.8;
             
             // Tornado shape
             const time = Date.now() / 50;
             const wTop = 60 + Math.sin(time) * 10;
             const wBot = 10;
             
             ctx.beginPath();
             ctx.moveTo(-wTop, -50);
             ctx.lineTo(wTop, -50);
             ctx.lineTo(wBot, 45);
             ctx.lineTo(-wBot, 45);
             ctx.closePath();
             ctx.fill();

             // Swirls
             ctx.strokeStyle = '#ffffff';
             ctx.lineWidth = 2;
             ctx.beginPath();
             ctx.moveTo(-wTop + 10, -30);
             ctx.lineTo(wTop - 10, -10);
             ctx.lineTo(-wBot, 20);
             ctx.stroke();

        } else {
            // Legs
            ctx.fillStyle = '#111';
            // Left leg
            ctx.fillRect(-15, 20, 12, legH);
            // Right leg
            const walkOffset = (p.actionState === ActionState.RUNNING) ? Math.sin(Date.now() / 50) * 5 : 0;
            ctx.fillRect(3, 20 + walkOffset, 12, legH);

            // Torso
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.moveTo(-18, -15); // Top Left
            ctx.lineTo(18, -15);  // Top Right
            ctx.lineTo(15, 20);   // Bot Right
            ctx.lineTo(-15, 20);  // Bot Left
            ctx.closePath();
            ctx.fill();
            
            // Belt/Detail
            ctx.fillStyle = '#000';
            ctx.fillRect(-15, 15, 30, 5);

            // Symbol on Chest
            ctx.fillStyle = '#ffd700'; // Gold
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();

            // Head
            ctx.fillStyle = '#facc15'; // Lego Yellow
            ctx.fillRect(-10, -35, 20, 20);
            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(3, -28, 2, 0, Math.PI*2); // Right eye (facing right)
            ctx.arc(-3, -28, 2, 0, Math.PI*2);
            ctx.fill();
            
            // Mask/Hood
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.moveTo(-12, -37);
            ctx.lineTo(12, -37);
            ctx.lineTo(12, -22); // Eye opening top
            ctx.lineTo(14, -22);
            ctx.lineTo(14, -13);
            ctx.lineTo(-14, -13);
            ctx.lineTo(-14, -22);
            ctx.lineTo(-12, -22);
            ctx.closePath();
            ctx.fill();

            // Arms (Simple rectangles)
            ctx.fillStyle = p.color;
            // Back Arm
            ctx.fillRect(-22, -12, 10, 25);
            // Front Arm (Animated if attacking)
            ctx.save();
            ctx.translate(0, -10);
            if (p.actionState === ActionState.ATTACKING) {
                ctx.rotate(-Math.PI / 2); // Punch
            }
            ctx.fillRect(10, 0, 10, 25);
            // Hand
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(15, 28, 5, 0, Math.PI * 2); 
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();
    };

    const drawParticles = () => {
      for (let i = gameState.current.particles.length - 1; i >= 0; i--) {
        const p = gameState.current.particles[i];
        p.life -= 0.05;
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.life <= 0) {
            gameState.current.particles.splice(i, 1);
            continue;
        }

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    };

    const drawBackground = () => {
        // Sky
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(1, '#1e293b');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Moon
        ctx.fillStyle = '#f8fafc';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#fff';
        ctx.beginPath();
        ctx.arc(CANVAS_WIDTH - 100, 80, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Dojo Floor
        ctx.fillStyle = '#78350f'; // Wood
        ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
        // Floor details
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        for(let i=0; i<CANVAS_WIDTH; i+=60) {
            ctx.beginPath();
            ctx.moveTo(i, GROUND_Y);
            ctx.lineTo(i + 40, CANVAS_HEIGHT);
            ctx.stroke();
        }
        
        // Dojo Back Wall pillars
        ctx.fillStyle = '#b91c1c'; // Red pillars
        for(let i=50; i<CANVAS_WIDTH; i+=200) {
             ctx.fillRect(i, 250, 40, GROUND_Y - 250);
        }
    };

    const render = () => {
        // Clear
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw World
        drawBackground();
        
        // Update & Draw Physics
        updatePhysics(gameState.current.p1, gameState.current.p2, gameState.current.keys, true);
        updatePhysics(gameState.current.p2, gameState.current.p1, gameState.current.keys, false); // AI input is handled inside updatePhysics
        
        drawPlayer(gameState.current.p1);
        drawPlayer(gameState.current.p2);
        drawParticles();

        // Sync State to React (throttled) for HUD
        if (gameState.current.gameActive) {
            setHudState({
                p1: { ...gameState.current.p1 },
                p2: { ...gameState.current.p2 }
            });
        }

        animationFrameId = requestAnimationFrame(render);
    };

    // Start loop
    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [playerColor, onGameOver]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="max-w-full max-h-full shadow-2xl border-4 border-gray-800 rounded-lg object-contain"
      />
      
      {hudState && <HUD p1={hudState.p1} p2={hudState.p2} />}

      {/* Mobile Touch Controls */}
      {isMobile && (
        <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-end pb-8 px-6 select-none">
          <div className="flex justify-between items-end w-full">
            
            {/* Left Stick (Movement) */}
            <div className="flex gap-4 pointer-events-auto">
               <TouchButton 
                 label={<svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>} 
                 onPress={(a) => setKey('a', a)} 
                 className="w-20 h-20"
               />
               <TouchButton 
                 label={<svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>} 
                 onPress={(a) => setKey('d', a)} 
                 className="w-20 h-20"
               />
            </div>

            {/* Right Buttons (Actions) */}
            <div className="pointer-events-auto grid grid-cols-3 gap-4 mb-2">
                 <div className="col-start-2">
                     <TouchButton 
                        label="JUMP" 
                        color="bg-blue-600"
                        onPress={(a) => setKey('w', a)} 
                        className="w-20 h-20 text-xs tracking-widest"
                     />
                 </div>
                 
                 <div className="col-start-1 row-start-2">
                     <TouchButton 
                        label="PUNCH" 
                        color="bg-red-600"
                        onPress={(a) => setKey('f', a)} 
                        className="w-20 h-20 text-xs tracking-widest"
                     />
                 </div>

                 <div className="col-start-2 row-start-2">
                     <TouchButton 
                        label="KICK" 
                        color="bg-orange-600"
                        onPress={(a) => setKey('g', a)} 
                        className="w-20 h-20 text-xs tracking-widest"
                     />
                 </div>

                 <div className="col-start-3 row-start-1 row-span-2 flex items-center">
                    <TouchButton 
                        label="SPIN" 
                        color="bg-purple-600"
                        onPress={(a) => setKey('h', a)} 
                        className="w-24 h-24 rounded-full text-sm font-black tracking-widest border-yellow-400 border-4 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                     />
                 </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;