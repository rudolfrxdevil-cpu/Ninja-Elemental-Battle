import React, { useEffect, useState } from 'react';
import { NinjaColor, GameScreen } from '../types';
import { getSenseiWisdom } from '../services/geminiService';

interface MenuProps {
  onStart: (selectedColor: NinjaColor) => void;
}

const Menu: React.FC<MenuProps> = ({ onStart }) => {
  const [wisdom, setWisdom] = useState<string>("Loading Sensei's wisdom...");
  const [selected, setSelected] = useState<NinjaColor>(NinjaColor.RED);

  useEffect(() => {
    let mounted = true;
    getSenseiWisdom().then(text => {
      if (mounted) setWisdom(text);
    });
    return () => { mounted = false; };
  }, []);

  const ninjas = [
    { color: NinjaColor.RED, name: 'Kai', element: 'Fire' },
    { color: NinjaColor.BLUE, name: 'Jay', element: 'Lightning' },
    { color: NinjaColor.GREEN, name: 'Lloyd', element: 'Energy' },
    { color: NinjaColor.BLACK, name: 'Cole', element: 'Earth' },
    { color: NinjaColor.WHITE, name: 'Zane', element: 'Ice' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900 text-white p-8 relative overflow-hidden">
      {/* Background Decorative Circles */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 rounded-full bg-red-600 blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 rounded-full bg-blue-600 blur-3xl opacity-20 animate-pulse delay-700" />

      <h1 className="ninja-font text-6xl mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-600 drop-shadow-lg text-center">
        Ninja Battle
      </h1>
      <h2 className="text-xl text-gray-400 mb-8 tracking-widest uppercase">Tournament of Elements</h2>

      <div className="bg-gray-800/80 p-6 rounded-lg border border-gray-600 max-w-2xl text-center mb-8 shadow-xl backdrop-blur-sm">
        <p className="italic text-yellow-100 text-lg">"{wisdom}"</p>
        <p className="text-right text-sm text-gray-400 mt-2">- Sensei Wu</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        {ninjas.map((ninja) => (
          <button
            key={ninja.color}
            onClick={() => setSelected(ninja.color)}
            className={`
              flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105
              ${selected === ninja.color 
                ? 'border-yellow-400 bg-gray-700 shadow-[0_0_20px_rgba(250,204,21,0.3)]' 
                : 'border-transparent bg-gray-800 hover:bg-gray-750'}
            `}
          >
            <div 
              className="w-16 h-16 rounded mb-3 shadow-lg" 
              style={{ backgroundColor: ninja.color }}
            >
              <div className="w-full h-1/3 bg-yellow-400 mt-2 relative">
                 {/* Ninja Eyes Visor */}
                 <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-black rounded-full"></div>
                 <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-black rounded-full"></div>
              </div>
            </div>
            <span className="font-bold text-lg">{ninja.name}</span>
            <span className="text-xs text-gray-400 uppercase">{ninja.element}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => onStart(selected)}
        className="px-12 py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-full text-2xl font-bold shadow-lg hover:shadow-red-500/50 hover:scale-105 transition-all active:scale-95 uppercase tracking-wider"
      >
        Enter the Dojo
      </button>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>Controls: <span className="text-white font-mono bg-gray-700 px-1 rounded">WASD</span> to Move/Jump • <span className="text-white font-mono bg-gray-700 px-1 rounded">F</span> Punch • <span className="text-white font-mono bg-gray-700 px-1 rounded">G</span> Kick • <span className="text-white font-mono bg-gray-700 px-1 rounded">H</span> Spinjitzu</p>
      </div>
    </div>
  );
};

export default Menu;