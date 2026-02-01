import React from 'react';
import { PlayerState, NinjaColor } from '../types';

interface HUDProps {
  p1: PlayerState;
  p2: PlayerState;
}

const HealthBar: React.FC<{ player: PlayerState, isRight?: boolean }> = ({ player, isRight }) => {
  const healthPercent = Math.max(0, (player.hp / player.maxHp) * 100);
  const energyPercent = Math.max(0, (player.energy / player.maxEnergy) * 100);

  return (
    <div className={`flex flex-col w-1/3 ${isRight ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-center gap-4 mb-1 ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
        <div 
            className="w-12 h-12 rounded border-2 border-white shadow-md flex items-center justify-center font-bold text-xl bg-gray-800 relative overflow-hidden"
        >
             <div className="absolute inset-0 opacity-50" style={{ backgroundColor: player.color }}></div>
             <span className="relative z-10">{player.name.charAt(0)}</span>
        </div>
        <div className="flex flex-col gap-1 w-full">
            <span className="font-bold text-lg uppercase tracking-wider text-shadow-sm">{player.name}</span>
            {/* Health Bar */}
            <div className="w-64 h-6 bg-gray-900 rounded-sm border border-gray-600 relative overflow-hidden">
                <div 
                    className="h-full transition-all duration-200 ease-out relative"
                    style={{ 
                        width: `${healthPercent}%`, 
                        backgroundColor: healthPercent < 20 ? '#ef4444' : '#eab308' 
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                </div>
            </div>
             {/* Energy Bar */}
             <div className="w-48 h-3 bg-gray-900 rounded-sm border border-gray-600 relative overflow-hidden">
                <div 
                    className="h-full bg-blue-500 transition-all duration-200 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    style={{ width: `${energyPercent}%` }}
                />
            </div>
        </div>
      </div>
    </div>
  );
};

const HUD: React.FC<HUDProps> = ({ p1, p2 }) => {
  return (
    <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-10">
      <HealthBar player={p1} />
      
      <div className="flex flex-col items-center">
        <div className="bg-gray-900/80 px-4 py-2 rounded-b-lg border-x border-b border-yellow-500/30 text-2xl font-bold ninja-font text-yellow-400">
             VS
        </div>
      </div>

      <HealthBar player={p2} isRight />
    </div>
  );
};

export default HUD;