import React, { useState, useEffect } from 'react';
import FavoritesView from '../components/FavoritesView';
import TopView from '../components/TopView';
import CocktailCard from '../components/CocktailCard';
import RecipeDetail from '../components/RecipeDetail';
import CommentsOverlay from '../components/CommentsOverlay';
import { Cocktail, AppScreen } from '../types';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase'; 
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, query } from 'firebase/firestore';

interface BebidasProps {
  volver?: () => void;
}

const Bebidas: React.FC<BebidasProps> = ({ volver }) => {
  const { user } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.FEED);
  const [allCocktails, setAllCocktails] = useState<Cocktail[]>([]);
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null);
  
  // 🔥 Nuevo estado para manejar los comentarios directamente desde el feed
  const [commentCocktail, setCommentCocktail] = useState<Cocktail | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [openCommentsOnEntry, setOpenCommentsOnEntry] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedAbvRange, setSelectedAbvRange] = useState<string | null>(null);
  const [selectedTaste, setSelectedTaste] = useState<string | null>(null);

  // Cargar bebidas desde Firestore
  useEffect(() => {
    const cargarBebidas = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'bebidas'));
        const bebidasData: Cocktail[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const category = data.categoria || data.category || (data.alcohol_tipo ? data.alcohol_tipo[0] : 'Varios');
          
          bebidasData.push({
            id: doc.id,
            name: data.nombre || data.name || 'Trago sin nombre',
            description: data.descripcion || data.description || '',
            image: data.imagen_url || data.image || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b',
            rating: data.rating || 0,
            abv: data.graduacion ? `${data.graduacion}%` : (data.abv || '0%'),
            difficulty: data.dificultad || data.difficulty || 'Media',
            likes: data.likes || 0,
            comments: typeof data.comments === 'string' ? parseInt(data.comments) || 0 : (data.comments || 0),
            category: category,
            ingredients: Array.isArray(data.ingredientes) ? data.ingredientes.map((i: any) => typeof i === 'string' ? { item: i, amount: '' } : i) : [],
            instructions: data.pasos || data.instructions || []
          });
        });

        setAllCocktails(bebidasData);
        setCocktails(bebidasData);
        
        if (user?.uid) {
          await cargarLikesYSaves(user.uid);
        }
      } catch (error) {
        console.error('Error cargando bebidas:', error);
        setAllCocktails([]);
        setCocktails([]);
      } finally {
        setLoading(false);
      }
    };

    cargarBebidas();
  }, [user?.uid]);

  const cargarLikesYSaves = async (uid: string) => {
    try {
      const likesSnapshot = await getDocs(collection(db, `usuarios/${uid}/likes`));
      const newLikedIds = new Set<string>();
      likesSnapshot.forEach((doc) => newLikedIds.add(doc.id));
      setLikedIds(newLikedIds);

      const savesSnapshot = await getDocs(collection(db, `usuarios/${uid}/saves`));
      const newSavedIds = new Set<string>();
      savesSnapshot.forEach((doc) => newSavedIds.add(doc.id));
      setSavedIds(newSavedIds);
    } catch (error) {
      console.error('Error cargando likes/saves:', error);
    }
  };

  // Función para refrescar datos de una bebida específica
  const refrescarBebida = async (bebidaId: string) => {
    try {
      const docRef = doc(db, 'bebidas', bebidaId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const category = data.categoria || data.category || (data.alcohol_tipo ? data.alcohol_tipo[0] : 'Varios');
        
        // Contar comentarios reales
        const q = query(collection(db, `bebidas/${bebidaId}/comentarios`));
        const commentSnapshot = await getDocs(q);
        const realCommentCount = commentSnapshot.size;
        
        const bebidaActualizada: Cocktail = {
          id: docSnap.id,
          name: data.nombre || data.name || 'Trago sin nombre',
          description: data.descripcion || data.description || '',
          image: data.imagen_url || data.image || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b',
          rating: data.rating || 0,
          abv: data.graduacion ? `${data.graduacion}%` : (data.abv || '0%'),
          difficulty: data.dificultad || data.difficulty || 'Media',
          likes: data.likes || 0,
          comments: realCommentCount,
          category: category,
          ingredients: Array.isArray(data.ingredientes) ? data.ingredientes.map((i: any) => typeof i === 'string' ? { item: i, amount: '' } : i) : [],
          instructions: data.pasos || data.instructions || []
        };
        
        setCocktails(prev => prev.map(c => c.id === bebidaId ? bebidaActualizada : c));
        setAllCocktails(prev => prev.map(c => c.id === bebidaId ? bebidaActualizada : c));
      }
    } catch (error) {
      console.error('Error refrescando bebida:', error);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    setCurrentScreen(AppScreen.SEARCH);
    
    if (!searchQuery.trim()) {
      setCocktails(allCocktails);
      setIsSearching(false);
      return;
    }

    const searchTerm = searchQuery.toLowerCase();
    const results = allCocktails.filter(c =>
      c.name.toLowerCase().includes(searchTerm) ||
      (c.category || '').toLowerCase().includes(searchTerm)
    );
    setCocktails(results);
    setIsSearching(false);
  };

  const handleDifficultyFilter = (difficulty: string | null) => {
    setSelectedDifficulty(difficulty);
    applyAllFilters(difficulty, selectedAbvRange, selectedTaste);
  };

  const handleAbvFilter = (abvRange: string | null) => {
    setSelectedAbvRange(abvRange);
    applyAllFilters(selectedDifficulty, abvRange, selectedTaste);
  };

  const handleTasteFilter = (taste: string | null) => {
    setSelectedTaste(taste);
    applyAllFilters(selectedDifficulty, selectedAbvRange, taste);
  };

  const applyAllFilters = (
    difficulty: string | null,
    abvRange: string | null,
    taste: string | null
  ) => {
    let filtered = allCocktails;

    // Filtro por dificultad
    if (difficulty) {
      filtered = filtered.filter(c => c.difficulty === difficulty);
    }

    // Filtro por rango de ABV
    if (abvRange) {
      filtered = filtered.filter(c => {
        const abvNum = parseInt(c.abv);
        if (abvRange === 'bajo') return abvNum < 15;
        if (abvRange === 'medio') return abvNum >= 15 && abvNum < 30;
        if (abvRange === 'alto') return abvNum >= 30;
        return true;
      });
    }

    // Filtro por sabor (basado en descripción o nombre)
    if (taste) {
      filtered = filtered.filter(c => {
        const text = (c.name + ' ' + c.description).toLowerCase();
        if (taste === 'dulce') return text.includes('dulce') || text.includes('azúcar') || text.includes('chocolate');
        if (taste === 'amargo') return text.includes('amargo') || text.includes('bitter') || text.includes('café');
        return true;
      });
    }

    setCocktails(filtered);
  };

  const openRecipe = (cocktail: Cocktail, showComments: boolean = false) => {
    setSelectedCocktail(cocktail);
    setOpenCommentsOnEntry(showComments);
    setCurrentScreen(AppScreen.RECIPE);
  };

  // 🔥 ARREGLO DE LIKES: Ahora suma y resta de verdad
  const toggleLike = async (id: string) => {
    if (!user?.uid) {
      alert('Debes estar logueado para dar like');
      return;
    }

    const isLiked = likedIds.has(id);
    
    // 1. Actualización visual instantánea (Optimistic UI)
    setLikedIds(prev => { 
      const next = new Set(prev); 
      if (isLiked) next.delete(id); else next.add(id); 
      return next; 
    });

    const updateLikesCount = (prev: Cocktail[]) => prev.map(c => {
      if (c.id === id) {
        const currentLikes = typeof c.likes === 'number' ? c.likes : parseInt(String(c.likes).replace(/\D/g, '')) || 0;
        const newLikes = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
        return { ...c, likes: newLikes as any };
      }
      return c;
    });

    setCocktails(updateLikesCount);
    setAllCocktails(updateLikesCount);

    // 2. Guardar en Base de Datos
    const likeRef = doc(db, `usuarios/${user.uid}/likes`, id);
    try {
      if (isLiked) {
        await deleteDoc(likeRef);
      } else {
        await setDoc(likeRef, { bebidaId: id, timestamp: new Date() });
      }
      
      // 3. Actualizar el contador de likes en la bebida
      const bebidaRef = doc(db, 'bebidas', id);
      const cocktailActual = allCocktails.find(c => c.id === id);
      if (cocktailActual) {
        const currentLikes = typeof cocktailActual.likes === 'number' ? cocktailActual.likes : parseInt(String(cocktailActual.likes).replace(/\D/g, '')) || 0;
        const newLikes = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
        await setDoc(bebidaRef, { likes: newLikes }, { merge: true });
      }
      
      // 4. Refrescar los datos de la bebida
      await refrescarBebida(id);
    } catch (error) {
      console.error('Error al cambiar like:', error);
    }
  };

  // 🔥 ARREGLO DE GUARDADOS
  const toggleSave = async (id: string) => {
    if (!user?.uid) {
      alert('Debes estar logueado para guardar');
      return;
    }

    const isSaved = savedIds.has(id);
    
    setSavedIds(prev => { 
      const next = new Set(prev); 
      if (isSaved) next.delete(id); else next.add(id); 
      return next; 
    });

    const saveRef = doc(db, `usuarios/${user.uid}/saves`, id);
    try {
      if (isSaved) await deleteDoc(saveRef);
      else await setDoc(saveRef, { bebidaId: id, timestamp: new Date() });
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  const goBack = () => {
    if (currentScreen !== AppScreen.FEED) {
      setCurrentScreen(AppScreen.FEED);
      setSearchQuery('');
    } else if (volver) {
      volver();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#020617] text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="animate-pulse">Preparando la barra...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#020617] text-white transition-colors duration-300">
      
      {/* HEADER */}
      {currentScreen !== AppScreen.RECIPE && (
        <header className="px-6 pt-14 pb-4 flex items-center justify-between z-50 bg-[#020617]/80 backdrop-blur-md border-b border-white/5 shrink-0">
          <button 
            onClick={goBack} 
            className={`w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 transition-opacity ${(currentScreen === AppScreen.FEED && !volver) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <span className="material-symbols-outlined text-white">chevron_left</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xl">🍹</span>
            <h1 className="font-extrabold text-xl tracking-tight uppercase">Tragos</h1>
          </div>
          
          <button onClick={() => setCurrentScreen(AppScreen.SEARCH)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white active:scale-90 transition-transform">
            <span className="material-symbols-outlined">search</span>
          </button>
        </header>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 relative overflow-hidden">
        
        {/* PANTALLA: BÚSQUEDA */}
        {currentScreen === AppScreen.SEARCH && (
          <div className="absolute inset-0 z-40 bg-[#020617] p-6 flex flex-col">
            <form onSubmit={handleSearch} className="relative mb-6">
              <input autoFocus type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value.trim()) setCocktails(allCocktails); }} placeholder="Busca un cóctel..." className="w-full bg-white/10 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-slate-400 shadow-inner" />
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            </form>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-semibold text-slate-400 animate-pulse">Buscando en la barra...</p>
                </div>
              ) : cocktails.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                  {cocktails.map(cocktail => (
                    <div key={cocktail.id} onClick={() => openRecipe(cocktail)} className="bg-white/5 p-4 rounded-3xl flex gap-4 cursor-pointer active:scale-95 transition-transform border border-white/5 hover:bg-white/10">
                      <img src={cocktail.image} className="w-20 h-20 rounded-2xl object-cover" alt={cocktail.name} />
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="font-bold text-white text-lg">{cocktail.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold">{cocktail.abv}</span>
                          <span className="text-[10px] text-slate-400">{cocktail.category}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-slate-500">
                  <span className="material-symbols-outlined text-5xl block mb-2 opacity-20">local_bar</span>
                  <p>Sin resultados.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🔥 PANTALLA FEED: ESTILO TINDER/REELS FULL-SCREEN SNAP 🔥 */}
        {currentScreen === AppScreen.FEED && (
          <div className="h-full flex flex-col">
            {/* Botón de Filtros Avanzados */}
            <div className="px-6 pt-4 pb-2 border-b border-white/5">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all"
              >
                <span className="material-symbols-outlined text-lg">tune</span>
                Filtros
                <span className={`material-symbols-outlined text-lg transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}>expand_more</span>
              </button>

              {/* Filtros Desplegables */}
              {showAdvancedFilters && (
                <div className="mt-4 space-y-4 pb-4">
                  {/* Dificultad */}
                  <div>
                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Dificultad</p>
                    <div className="flex gap-2">
                      {['Fácil', 'Medio', 'Difícil'].map(diff => (
                        <button
                          key={diff}
                          onClick={() => handleDifficultyFilter(selectedDifficulty === diff ? null : diff)}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                            selectedDifficulty === diff
                              ? 'bg-green-600/80 text-white border-green-500'
                              : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ABV */}
                  <div>
                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Graduación Alcohólica</p>
                    <div className="flex gap-2">
                      {[{ label: 'Bajo (<15%)', val: 'bajo' }, { label: 'Medio (15-30%)', val: 'medio' }, { label: 'Alto (>30%)', val: 'alto' }].map(abv => (
                        <button
                          key={abv.val}
                          onClick={() => handleAbvFilter(selectedAbvRange === abv.val ? null : abv.val)}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                            selectedAbvRange === abv.val
                              ? 'bg-orange-600/80 text-white border-orange-500'
                              : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {abv.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sabor */}
                  <div>
                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Sabor</p>
                    <div className="flex gap-2">
                      {['Dulce', 'Amargo'].map(taste => (
                        <button
                          key={taste}
                          onClick={() => handleTasteFilter(selectedTaste === taste.toLowerCase() ? null : taste.toLowerCase())}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                            selectedTaste === taste.toLowerCase()
                              ? 'bg-pink-600/80 text-white border-pink-500'
                              : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {taste}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Botón Limpiar Filtros */}
                  {(selectedDifficulty || selectedAbvRange || selectedTaste) && (
                    <button
                      onClick={() => {
                        setSelectedDifficulty(null);
                        setSelectedAbvRange(null);
                        setSelectedTaste(null);
                        applyAllFilters(null, null, null);
                      }}
                      className="w-full px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 transition-all"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Contenedor Carrusel Horizontal (Snap) */}
            <div className="flex-1 flex overflow-x-auto no-scrollbar snap-x snap-mandatory pt-2 scroll-smooth">
              {cocktails.length > 0 ? (
                cocktails.map(cocktail => (
                  <div key={cocktail.id} className="w-full h-full flex-shrink-0 snap-center snap-always px-4 pb-28">
                    <div className="w-full h-full relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-[32px] opacity-0 group-hover:opacity-30 transition duration-500 blur-lg"></div>
                      <CocktailCard 
                        cocktail={cocktail} 
                        onClick={openRecipe} 
                        isLiked={likedIds.has(cocktail.id)} 
                        isSaved={savedIds.has(cocktail.id)} 
                        onLike={() => toggleLike(cocktail.id)} 
                        onSave={() => toggleSave(cocktail.id)} 
                        onComment={() => setCommentCocktail(cocktail)} 
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-full flex items-center justify-center text-slate-500 pt-20">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-5xl block mb-2 opacity-20">local_bar</span>
                    <p>No hay tragos con esos filtros.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* OTRAS PANTALLAS (Le pasamos allCocktails para que funcione el filtro) */}
        {currentScreen === AppScreen.FAVORITES && <FavoritesView onCocktailClick={openRecipe} savedIds={savedIds} allCocktails={allCocktails} />}
        {currentScreen === AppScreen.TOP && <TopView onCocktailClick={openRecipe} allCocktails={allCocktails} />}
      </main>

      {/* BARRA DE NAVEGACIÓN INFERIOR */}
      {currentScreen !== AppScreen.RECIPE && (
        <nav className="glass-morphism border-t border-white/5 rounded-t-[32px] px-10 pt-4 pb-8 flex justify-between items-center z-50 absolute bottom-0 w-full safe-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.5)] bg-[#020617]/90 backdrop-blur-xl">
          <button onClick={() => setCurrentScreen(AppScreen.FEED)} className={`flex flex-col items-center gap-1 transition-colors ${currentScreen === AppScreen.FEED ? 'text-purple-500' : 'text-slate-400'}`}>
            <span className={`material-symbols-outlined text-2xl ${currentScreen === AppScreen.FEED ? 'filled' : ''}`} style={currentScreen === AppScreen.FEED ? { fontVariationSettings: "'FILL' 1" } : {}}>explore</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Explorar</span>
          </button>
          <button onClick={() => setCurrentScreen(AppScreen.TOP)} className={`flex flex-col items-center gap-1 transition-colors ${currentScreen === AppScreen.TOP ? 'text-purple-500' : 'text-slate-400'}`}>
            <span className={`material-symbols-outlined text-2xl ${currentScreen === AppScreen.TOP ? 'filled' : ''}`} style={currentScreen === AppScreen.TOP ? { fontVariationSettings: "'FILL' 1" } : {}}>stars</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Top</span>
          </button>
          <button onClick={() => setCurrentScreen(AppScreen.FAVORITES)} className={`flex flex-col items-center gap-1 transition-colors ${currentScreen === AppScreen.FAVORITES ? 'text-purple-500' : 'text-slate-400'}`}>
            <span className={`material-symbols-outlined text-2xl ${currentScreen === AppScreen.FAVORITES ? 'filled' : ''}`} style={currentScreen === AppScreen.FAVORITES ? { fontVariationSettings: "'FILL' 1" } : {}}>bookmark</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Guardados</span>
          </button>
        </nav>
      )}

      {/* MODAL: DETALLE DEL TRAGO */}
      {selectedCocktail && currentScreen === AppScreen.RECIPE && (
        <RecipeDetail 
          cocktail={selectedCocktail} 
          initialShowComments={openCommentsOnEntry} 
          onClose={() => { 
            setCurrentScreen(AppScreen.FEED); 
            setOpenCommentsOnEntry(false);
            // Refrescar la bebida cuando se cierra la receta
            refrescarBebida(selectedCocktail.id);
          }} 
          isLiked={likedIds.has(selectedCocktail.id)} 
          isSaved={savedIds.has(selectedCocktail.id)} 
          onLike={() => toggleLike(selectedCocktail.id)} 
          onSave={() => toggleSave(selectedCocktail.id)} 
        />
      )}

      {/* 🔥 MODAL: COMENTARIOS (Se abre directo desde el feed) */}
      {commentCocktail && (
        <CommentsOverlay 
          onClose={() => setCommentCocktail(null)} 
          bebidaId={commentCocktail.id}
        />
      )}
    </div>
  );
};

export default Bebidas;