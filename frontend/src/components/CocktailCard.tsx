import React, { useState } from 'react';
import { Cocktail } from '../types';

interface CocktailCardProps {
  cocktail: Cocktail;
  onClick: (cocktail: Cocktail) => void;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
  onComment: () => void;
}

const CocktailCard: React.FC<CocktailCardProps> = ({ 
  cocktail, onClick, isLiked, isSaved, onLike, onSave, onComment 
}) => {
  const [imgError, setImgError] = useState(false);

  // URL fallback si falla la imagen
  const bgImage = imgError || !cocktail.image 
    ? 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80' 
    : cocktail.image;

  return (
    <div 
      className="relative w-full h-full rounded-[32px] overflow-hidden shadow-2xl cursor-pointer group active:scale-95 transition-transform duration-200 bg-gray-900 border border-white/10"
      onClick={() => onClick(cocktail)}
      style={{ isolation: 'isolate' }}
    >
      {/* 1. IMAGEN DE FONDO */}
      <img 
        src={bgImage} 
        alt={cocktail.name}
        onError={() => setImgError(true)}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        style={{ zIndex: 0 }}
      />
      
      {/* 2. DEGRADADO OSCURO */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none"
        style={{ zIndex: 1 }}
      ></div>

      {/* 3. CONTENIDO CON MÁRGENES */}
      <div className="absolute inset-0 flex flex-col justify-end px-6 pb-6 pt-4 z-10" style={{ zIndex: 10 }}>
        <h2 className="text-3xl font-black text-white leading-none mb-3 drop-shadow-lg text-left line-clamp-2">
          {cocktail.name}
        </h2>

        <div className="flex flex-wrap gap-2 mb-5">
          <span className="backdrop-blur-md bg-white/20 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10">
            {cocktail.abv}
          </span>
          <span className="backdrop-blur-md bg-white/20 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10">
            {cocktail.difficulty}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={(e) => { e.stopPropagation(); onLike(); }} className="flex flex-col items-center gap-1 group/btn text-white/80 hover:text-white transition-colors">
              <span className={`material-icons-round text-3xl ${isLiked ? 'text-red-500' : ''}`}>
                {isLiked ? 'favorite' : 'favorite_border'}
              </span>
              <span className="text-[10px] font-bold">{typeof cocktail.likes === 'number' ? cocktail.likes : parseInt(String(cocktail.likes).replace(/\D/g, '')) || 0}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onComment(); }} className="flex flex-col items-center gap-1 group/btn text-white/80 hover:text-white transition-colors">
              <span className="material-icons-round text-3xl">chat_bubble_outline</span>
              <span className="text-[10px] font-bold">{cocktail.comments || 0}</span>
            </button>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onSave(); }} className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border transition-all active:scale-90 ${isSaved ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}>
            <span className="material-icons-round text-xl">{isSaved ? 'bookmark' : 'bookmark_border'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CocktailCard;