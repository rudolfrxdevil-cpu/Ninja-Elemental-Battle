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
    { color: NinjaColor.RED, name: 'Kai', element: 'Fire', highlight: 'bg-red-500' },
    { color: NinjaColor.BLUE, name: 'Jay', element: 'Lightning', highlight: 'bg-blue-500' },
    { color: NinjaColor.GREEN, name: 'Lloyd', element: 'Energy', highlight: 'bg-green-500' },
    { color: NinjaColor.BLACK, name: 'Cole', element: 'Earth', highlight: 'bg-gray-700' },
    { color: NinjaColor.WHITE, name: 'Zane', element: 'Ice', highlight: 'bg-gray-200' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900 text-white p-8 relative overflow-hidden">
      {/* Background Decorative Circles */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 rounded-full bg-red-600 blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 rounded-full bg-blue-600 blur-3xl opacity-20 animate-pulse delay-700" />

      <h1 className="ninja-font text-6xl mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-600 drop-shadow-lg text-center z-10">
        Ninja Battle
      </h1>
      <h2 className="text-xl text-gray-400 mb-8 tracking-widest uppercase z-10">Tournament of Elements</h2>

      <div className="bg-gray-800/80 p-6 rounded-lg border border-gray-600 max-w-2xl text-center mb-8 shadow-xl backdrop-blur-sm z-10">
        <p className="italic text-yellow-100 text-lg">"{wisdom}"</p>
        <p className="text-right text-sm text-gray-400 mt-2">- Sensei Wu</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-10 z-10">
        {ninjas.map((ninja) => (
          <button
            key={ninja.color}
            onClick={() => setSelected(ninja.color)}
            className={`
              group relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-300 transform
              ${selected === ninja.color 
                ? 'border-yellow-400 bg-gray-700 scale-110 shadow-[0_0_25px_rgba(250,204,21,0.4)] z-20' 
                : 'border-transparent bg-gray-800/50 hover:bg-gray-700 hover:scale-105 hover:shadow-lg opacity-80 hover:opacity-100'}
            `}
          >
            {/* Ninja Avatar */}
            <div className="relative w-20 h-24 mb-2 flex flex-col items-center">
                {/* Head */}
                <div 
                    className="relative w-12 h-12 rounded-lg shadow-md z-10 overflow-hidden transition-transform duration-300 group-hover:-translate-y-1"
                    style={{ backgroundColor: ninja.color }}
                >
                    {/* Face Opening */}
                    <div className="absolute top-3 left-1 right-1 h-4 bg-yellow-400 rounded-sm flex items-center justify-center gap-2 shadow-inner">
                        {/* Eyes */}
                        <div className={`w-1.5 h-1.5 bg-black rounded-full transition-transform duration-300 ${selected === ninja.color ? 'scale-110' : ''}`}></div>
                        <div className={`w-1.5 h-1.5 bg-black rounded-full transition-transform duration-300 ${selected === ninja.color ? 'scale-110' : ''}`}></div>
                        
                        {/* Eye brow expression (furious/determined) */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-black/10"></div>
                    </div>
                </div>

                {/* Body */}
                <div 
                    className="relative w-16 h-14 -mt-2 rounded-t-xl shadow-lg flex flex-col items-center transition-all duration-300"
                    style={{ backgroundColor: ninja.color }}
                >
                     {/* Neck Shadow */}
                    <div className="w-full h-1 bg-black/20"></div>
                    
                    {/* Robe Fold details */}
                    <div className="absolute top-1 w-full flex justify-center opacity-30">
                        <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-black"></div>
                    </div>

                    {/* Gold Emblem */}
                    <div className={`mt-3 w-5 h-5 rounded-full bg-yellow-400 border-2 border-yellow-600 shadow-sm flex items-center justify-center transition-transform duration-500 ${selected === ninja.color ? 'rotate-180' : ''}`}>
                         {/* Elemental Symbol abstraction */}
                         <div className="w-2 h-2 bg-yellow-600 rounded-full opacity-80"></div>
                    </div>

                    {/* Belt */}
                    <div className="absolute bottom-0 w-full h-2 bg-black"></div>
                    
                    {/* Arms hint */}
                    <div className="absolute -left-1 top-2 w-2 h-8 rounded-l-md brightness-90" style={{ backgroundColor: ninja.color }}></div>
                    <div className="absolute -right-1 top-2 w-2 h-8 rounded-r-md brightness-90" style={{ backgroundColor: ninja.color }}></div>
                </div>
            </div>

            <span className={`font-bold text-lg mt-2 ${selected === ninja.color ? 'text-yellow-400' : 'text-gray-200'}`}>{ninja.name}</span>
            <span className="text-xs text-gray-400 uppercase tracking-wider">{ninja.element}</span>
            
            {/* Selection Indicator Glow */}
            {selected === ninja.color && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-yellow-500/10 to-transparent pointer-events-none animate-pulse"></div>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={() => onStart(selected)}
        className="px-12 py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-full text-2xl font-bold shadow-lg hover:shadow-red-500/50 hover:scale-105 transition-all active:scale-95 uppercase tracking-wider z-10"
      >
        Enter the Dojo
      </button>
      
      <div className="mt-8 text-sm text-gray-500 z-10">
        <p>Controls: <span className="text-white font-mono bg-gray-700 px-1 rounded">WASD</span> to Move/Jump • <span className="text-white font-mono bg-gray-700 px-1 rounded">F</span> Punch • <span className="text-white font-mono bg-gray-700 px-1 rounded">G</span> Kick • <span className="text-white font-mono bg-gray-700 px-1 rounded">H</span> Spinjitzu</p>
      </div>
    </div>
  );
};

export default Menu;