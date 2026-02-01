import React, { useState } from 'react';
import { GameScreen, NinjaColor } from './types';
import Menu from './components/Menu';
import GameCanvas from './components/GameCanvas';

const App: React.FC = () => {
  const [screen, setScreen] = useState<GameScreen>(GameScreen.MENU);
  const [selectedNinja, setSelectedNinja] = useState<NinjaColor>(NinjaColor.RED);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [battleReport, setBattleReport] = useState<string>('');

  const handleStartGame = (color: NinjaColor) => {
    setSelectedNinja(color);
    setScreen(GameScreen.PLAYING);
  };

  const handleGameOver = (winner: string, commentary: string) => {
    setWinnerName(winner);
    setBattleReport(commentary);
    setScreen(GameScreen.GAME_OVER);
  };

  const handleReturnToMenu = () => {
    setScreen(GameScreen.MENU);
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden flex flex-col">
      {screen === GameScreen.MENU && (
        <Menu onStart={handleStartGame} />
      )}

      {screen === GameScreen.PLAYING && (
        <GameCanvas 
          playerColor={selectedNinja} 
          onGameOver={handleGameOver} 
        />
      )}

      {screen === GameScreen.GAME_OVER && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
           <div className="bg-gray-800 p-8 rounded-2xl border-2 border-yellow-500 max-w-lg w-full text-center shadow-[0_0_50px_rgba(234,179,8,0.3)]">
              <h2 className="ninja-font text-5xl text-yellow-400 mb-4 drop-shadow-md">
                {winnerName} Wins!
              </h2>
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-gray-500 to-transparent my-4"></div>
              <p className="text-gray-300 text-lg italic mb-8 leading-relaxed">
                "{battleReport}"
              </p>
              
              <button 
                onClick={handleReturnToMenu}
                className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full transition-all transform hover:scale-105 shadow-lg"
              >
                Play Again
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;