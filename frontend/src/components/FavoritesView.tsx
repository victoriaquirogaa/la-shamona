import React, { useState } from 'react';
import { Cocktail } from '../types';

interface FavoritesViewProps {
  onCocktailClick: (cocktail: Cocktail) => void;
  savedIds: Set<string>;
  allCocktails: Cocktail[]; // 🔥 RECIBIMOS LA LISTA REAL
}

const FavoritesView: React.FC<FavoritesViewProps> = ({ onCocktailClick, savedIds, allCocktails }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const savedCocktails = allCocktails.filter(c => savedIds.has(c.id));

  return (
    <div className="flex flex-col h-full bg-[#020617]">
      <header className="px-5 pt-6 flex flex-col gap-6 z-10 shrink-0">
        <div className="relative">
          <div className="glass-morphism h-14 w-full rounded-2xl flex items-center px-4 gap-3 bg-white/5 border border-white/10">
            <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
            <input 
              className="bg-transparent border-none focus:ring-0 text-white placeholder-slate-400 w-full text-base" 
              placeholder="Busca entre tus guardados..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-4 pb-32 no-scrollbar">
        {savedCocktails.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {savedCocktails
              .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(cocktail => (
              <div 
                key={cocktail.id} 
                className="flex flex-col gap-2 active:scale-95 transition-transform duration-200 cursor-pointer"
                onClick={() => onCocktailClick(cocktail)}
              >
                <div className="relative aspect-[3/4] rounded-[24px] overflow-hidden border border-white/5">
                  <img alt={cocktail.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" src={cocktail.image} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                  
                  <div className="absolute top-3 right-3 bg-white/10 backdrop-blur-md w-8 h-8 rounded-full flex items-center justify-center text-purple-400 border border-white/10">
                    <span className="material-symbols-outlined text-lg filled" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                  </div>
                  
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined filled text-red-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    <span className="text-[10px] font-bold text-white">{typeof cocktail.likes === 'number' ? cocktail.likes : parseInt(String(cocktail.likes).replace(/\D/g, '')) || 0}</span>
                  </div>
                </div>
                <div className="px-1">
                  <h3 className="font-bold text-sm text-white truncate">{cocktail.name}</h3>
                  <p className="text-[10px] text-slate-400 truncate">
                    {cocktail.ingredients?.slice(0, 3).map((i: any) => i.item).join(', ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500">
            <span className="material-symbols-outlined text-5xl mb-4 opacity-20 block">bookmark_border</span>
            <p className="text-sm">Aún no has guardado ningún trago.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default FavoritesView;
