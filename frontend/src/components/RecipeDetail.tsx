import React, { useState, useEffect } from 'react';
import { Cocktail } from '../types';
import CommentsOverlay from './CommentsOverlay';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface RecipeDetailProps {
  cocktail: Cocktail;
  onClose: () => void;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
  initialShowComments?: boolean;
}

const RecipeDetail: React.FC<RecipeDetailProps> = ({ 
  cocktail, onClose, isLiked, isSaved, onLike, onSave, initialShowComments = false
}) => {
  const [isCommentsOpen, setIsCommentsOpen] = useState(initialShowComments);
  const [currentCocktail, setCurrentCocktail] = useState(cocktail);
  const [realCommentCount, setRealCommentCount] = useState(cocktail.comments || 0);

  useEffect(() => {
    if (initialShowComments) setIsCommentsOpen(true);
  }, [initialShowComments]);

  useEffect(() => {
    setCurrentCocktail(cocktail);
  }, [cocktail]);

  // Cargar comentarios reales cuando se abre el overlay
  useEffect(() => {
    const cargarCommentCount = async () => {
      try {
        const q = query(
          collection(db, `bebidas/${cocktail.id}/comentarios`),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        setRealCommentCount(querySnapshot.size);
      } catch (error) {
        console.error('Error contando comentarios:', error);
        setRealCommentCount(cocktail.comments || 0);
      }
    };

    if (isCommentsOpen) {
      cargarCommentCount();
    }
  }, [isCommentsOpen, cocktail.id]);

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-[#020617] overflow-y-auto no-scrollbar pb-32 animate-in slide-in-from-bottom duration-300">
        {/* Hero Section */}
        <div className="relative h-[35vh] w-full overflow-hidden">
          <img alt={currentCocktail.name} className="absolute inset-0 w-full h-full object-cover" src={currentCocktail.image} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-black/40"></div>
          
          <div className="absolute top-12 left-0 right-0 px-4 flex justify-between items-center z-20">
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white">
              <span className="material-icons-round">expand_more</span>
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="text-4xl font-extrabold mb-4 tracking-tight text-white">{currentCocktail.name}</h1>
            <div className="flex gap-3">
              <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold text-white border border-white/10 bg-white/10 backdrop-blur-md">
                <span className="material-icons-round text-[16px] text-purple-400">local_bar</span> {currentCocktail.abv}
              </div>
              <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold text-white border border-white/10 bg-white/10 backdrop-blur-md">
                <span className="material-icons-round text-[16px] text-green-400">bolt</span> {currentCocktail.difficulty}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 mt-8">
          <h3 className="text-xl font-bold text-white mb-4">Ingredientes</h3>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {currentCocktail.ingredients.map((ing, idx) => (
              <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <span className="material-icons-round text-purple-400 text-xl">water_drop</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{ing.item}</p>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider">{ing.amount}</p>
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-xl font-bold text-white mb-4">Preparación</h3>
          <div className="space-y-4">
            {currentCocktail.instructions.map((step, idx) => (
              <div key={idx} className="bg-white/5 border border-white/5 p-6 rounded-[24px] flex gap-5">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg bg-purple-600 text-white shadow-lg">{idx + 1}</div>
                <p className="text-slate-300 leading-relaxed text-sm pt-2">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Barra Inferior */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#020617]/95 border-t border-white/10 px-6 pt-4 pb-8 z-50 rounded-t-[32px] safe-bottom backdrop-blur-xl">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center gap-6">

                <button onClick={onLike} className="text-white flex flex-col items-center gap-0.5">
                  <span className={`material-icons-round text-[32px] ${isLiked ? 'text-red-500' : ''}`}>{isLiked ? 'favorite' : 'favorite_border'}</span>
                  <span className="text-[10px] font-bold">{typeof currentCocktail.likes === 'number' ? currentCocktail.likes : parseInt(String(currentCocktail.likes).replace(/\D/g, '')) || 0}</span>
                </button>

                <button onClick={() => setIsCommentsOpen(true)} className="text-white flex flex-col items-center gap-0.5">
                  <span className="material-icons-round text-[32px]">chat_bubble_outline</span>
                  <span className="text-[10px] font-bold">{realCommentCount}</span>
                </button>

                <button onClick={onSave} className="text-white flex flex-col items-center gap-0.5">
                  <span className={`material-icons-round text-[32px] ${isSaved ? 'text-primary' : ''}`}>{isSaved ? 'bookmark' : 'bookmark_border'}</span>
                </button>
            </div>
          </div>
        </div>
      </div>
      
      
      {isCommentsOpen && <CommentsOverlay onClose={() => {
        setIsCommentsOpen(false);
        // Recargar comentarios al cerrar para actualizar el contador
        const cargarCommentCount = async () => {
          try {
            const q = query(
              collection(db, `bebidas/${cocktail.id}/comentarios`),
              orderBy('timestamp', 'desc')
            );
            const querySnapshot = await getDocs(q);
            setRealCommentCount(querySnapshot.size);
          } catch (error) {
            console.error('Error contando comentarios:', error);
          }
        };
        cargarCommentCount();
      }} bebidaId={currentCocktail.id} />}
    </>
  );
};

export default RecipeDetail;