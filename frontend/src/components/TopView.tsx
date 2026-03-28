import React from 'react';
import { Cocktail } from '../types';

interface TopViewProps {
  onCocktailClick: (cocktail: Cocktail) => void;
  onSearchClick: () => void;
  onBackClick: () => void;
  allCocktails?: Cocktail[];
}

const TopView: React.FC<TopViewProps> = ({ onCocktailClick, allCocktails = [] }) => {
  // Ordenar tragos por likes descendente
  const topCocktails = [...allCocktails].sort((a, b) => {
    const likesA = typeof a.likes === 'number' ? a.likes : parseInt(String(a.likes).replace(/\D/g, '')) || 0;
    const likesB = typeof b.likes === 'number' ? b.likes : parseInt(String(b.likes).replace(/\D/g, '')) || 0;
    return likesB - likesA;
  });

  return (
    <div className="h-full flex flex-col bg-[#020617] text-white">
      <main className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-4 pb-40 pt-4">
        {topCocktails.length > 0 ? (
          topCocktails.map((cocktail, index) => (
            <div 
              key={cocktail.id} 
              onClick={() => onCocktailClick(cocktail)}
              className="glass-card rounded-[24px] p-4 flex items-center gap-4 relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer"
            >
              {index === 0 && (
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 blur-3xl rounded-full"></div>
              )}
              <div className="w-12 flex flex-col items-center justify-center shrink-0">
                <span className={`text-4xl font-black italic ${index < 3 ? 'text-primary neon-text' : 'text-white/40'}`}>
                  {index + 1}
                </span>
              </div>
              <div className="relative w-20 h-20 shrink-0">
                <img 
                  alt={cocktail.name} 
                  className="w-full h-full object-cover rounded-2xl shadow-lg" 
                  src={cocktail.image} 
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold truncate">{cocktail.name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-yellow-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-xs font-semibold text-slate-300">{cocktail.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-red-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    <span className="text-xs font-semibold text-slate-300">{typeof cocktail.likes === 'number' ? cocktail.likes : parseInt(String(cocktail.likes).replace(/\D/g, '')) || 0}</span>
                  </div>
                </div>
                <div className="mt-2 flex gap-1">
                  <span className="bg-white/5 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold text-slate-400">
                    {cocktail.category}
                  </span>
                  <span className="bg-white/5 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold text-slate-400">
                    {cocktail.abv}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-64 text-slate-500">
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl block mb-2 opacity-20">trending_up</span>
              <p>Cargando tragos...</p>
            </div>
          </div>
        )}
      </main>

      <button className="fixed bottom-32 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 z-50 active:scale-90 transition-transform">
        <span className="material-symbols-outlined text-2xl">tune</span>
      </button>
      
      <style>{`
        .neon-text {
          text-shadow: 0 0 10px rgba(168, 85, 247, 0.8), 0 0 20px rgba(168, 85, 247, 0.4);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        }
        .glass-card:hover {
          border: 1px solid rgba(168, 85, 247, 0.3);
        }
      `}</style>
    </div>
  );
};

export default TopView;
