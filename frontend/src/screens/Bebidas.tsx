import React, { useState, useEffect } from 'react';
import FavoritesView from '../components/FavoritesView';
import TopView from '../components/TopView';
import CocktailCard from '../components/CocktailCard';
import RecipeDetail from '../components/RecipeDetail';
import CommentsOverlay from '../components/CommentsOverlay';
import TopBar from '../components/TopBar';
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

  // Cargar bebidas desde Firestore (con retry para ERR_QUIC_PROTOCOL_ERROR)
  useEffect(() => {
    let cancelado = false;

    const intentarCarga = async (intentos = 0): Promise<void> => {
      if (cancelado) return;
      try {
        const querySnapshot = await getDocs(collection(db, 'bebidas'));
        if (cancelado) return;
        const bebidasData: Cocktail[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Los documentos tienen campos en inglés directamente
          const category = data.category || data.categoria || (data.alcohol_tipo ? data.alcohol_tipo[0] : 'Varios');

          bebidasData.push({
            id: doc.id,  // Siempre usamos el ID del documento
            name: data.name || data.nombre || 'Trago sin nombre',
            description: data.description || data.descripcion || '',
            image: data.image || data.imagen_url || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b',
            rating: data.rating || 0,
            abv: data.abv || (data.graduacion ? `${data.graduacion}%` : '0%'),
            difficulty: data.difficulty || data.dificultad || 'Media',
            likes: data.likes || 0,
            comments: typeof data.comments === 'number' ? data.comments : (parseInt(String(data.comments)) || 0),
            category,
            ingredients: Array.isArray(data.ingredients)
              ? data.ingredients.map((i: any) => typeof i === 'string' ? { item: i, amount: '' } : i)
              : (Array.isArray(data.ingredientes)
                  ? data.ingredientes.map((i: any) => typeof i === 'string' ? { item: i, amount: '' } : i)
                  : []),
            instructions: data.instructions || data.pasos || []
          });
        });


        setAllCocktails(bebidasData);
        setCocktails(bebidasData);

        if (user?.uid) {
          await cargarLikesYSaves(user.uid);
        }
      } catch (error: any) {
        // Retry automático para errores de red QUIC/conexión (máx 3 intentos)
        const esErrorDeRed = error?.code === 'unavailable' || String(error).includes('QUIC') || String(error).includes('network');
        if (esErrorDeRed && intentos < 3 && !cancelado) {
          console.warn(`Reintentando carga de bebidas (intento ${intentos + 1}/3)...`);
          await new Promise(r => setTimeout(r, 1500 * (intentos + 1)));
          return intentarCarga(intentos + 1);
        }
        console.error('Error cargando bebidas:', error);
        setAllCocktails([]);
        setCocktails([]);
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    intentarCarga();
    return () => { cancelado = true; };
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
        const category = data.category || data.categoria || (data.alcohol_tipo ? data.alcohol_tipo[0] : 'Varios');
        
        // Contar comentarios reales
        const q = query(collection(db, `bebidas/${bebidaId}/comentarios`));
        const commentSnapshot = await getDocs(q);
        const realCommentCount = commentSnapshot.size;
        
        const bebidaActualizada: Cocktail = {
          id: docSnap.id,
          name: data.name || data.nombre || 'Trago sin nombre',
          description: data.description || data.descripcion || '',
          image: data.image || data.imagen_url || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b',
          rating: data.rating || 0,
          abv: data.abv || (data.graduacion ? `${data.graduacion}%` : '0%'),
          difficulty: data.difficulty || data.dificultad || 'Media',
          likes: data.likes || 0,
          comments: realCommentCount,
          category,
          ingredients: Array.isArray(data.ingredients)
            ? data.ingredients.map((i: any) => typeof i === 'string' ? { item: i, amount: '' } : i)
            : (Array.isArray(data.ingredientes)
                ? data.ingredientes.map((i: any) => typeof i === 'string' ? { item: i, amount: '' } : i)
                : []),
          instructions: data.instructions || data.pasos || []
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
    <div className="flex flex-col bg-[#020617] text-white overflow-hidden" style={{ height: '100dvh' }}>
      
      {/* TOPBAR — Componente unificado */}
      {currentScreen !== AppScreen.RECIPE && (
        <>
          <TopBar 
            titulo="TRAGOS" 
            icono="🍹" 
            color="#a855f7" 
            onVolver={goBack} 
          />
          <div className="topbar-spacer" />
        </>
      )}

      {/* CONTENIDO PRINCIPAL — flex-1 para que llene el espacio entre header y nav */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
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

        {/* FEED — Carrusel horizontal tipo Tinder */}
        {currentScreen === AppScreen.FEED && (
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Filtros */}
            <div className="px-4 pt-2 pb-2 border-b border-white/5 shrink-0">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all"
              >
                <span className="material-symbols-outlined text-base">tune</span>
                Filtros
                <span className={`material-symbols-outlined text-base transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}>expand_more</span>
              </button>

              {showAdvancedFilters && (
                <div className="mt-3 space-y-3 pb-2">
                  <div>
                    <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase">Dificultad</p>
                    <div className="flex gap-2">
                      {['Fácil', 'Medio', 'Difícil'].map(diff => (
                        <button key={diff} onClick={() => handleDifficultyFilter(selectedDifficulty === diff ? null : diff)}
                          className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all border ${selectedDifficulty === diff ? 'bg-green-600/80 text-white border-green-500' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase">Graduación</p>
                    <div className="flex gap-2">
                      {[{ label: '<15%', val: 'bajo' }, { label: '15-30%', val: 'medio' }, { label: '>30%', val: 'alto' }].map(abv => (
                        <button key={abv.val} onClick={() => handleAbvFilter(selectedAbvRange === abv.val ? null : abv.val)}
                          className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all border ${selectedAbvRange === abv.val ? 'bg-orange-600/80 text-white border-orange-500' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                          {abv.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(selectedDifficulty || selectedAbvRange || selectedTaste) && (
                    <button onClick={() => { setSelectedDifficulty(null); setSelectedAbvRange(null); setSelectedTaste(null); applyAllFilters(null, null, null); }}
                      className="w-full px-2 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-slate-400 transition-all">
                      Limpiar filtros
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Cards — scroll horizontal snap, cada card ocupa toda la pantalla */}
            <div className="flex-1 flex overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth">
              {cocktails.length > 0 ? (
                cocktails.map(cocktail => (
                  <div key={cocktail.id} className="min-w-full h-full flex-shrink-0 snap-center snap-always p-3">
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
                ))
              ) : (
                <div className="min-w-full flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-5xl block mb-2 opacity-20">local_bar</span>
                    <p>No hay tragos con esos filtros.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentScreen === AppScreen.FAVORITES && <FavoritesView onCocktailClick={openRecipe} savedIds={savedIds} allCocktails={allCocktails} />}
        {currentScreen === AppScreen.TOP && <TopView onCocktailClick={openRecipe} allCocktails={allCocktails} />}
      </main>

      {/* BARRA DE NAVEGACIÓN — shrink-0, parte del flujo normal, NUNCA flota sobre el contenido */}
      {currentScreen !== AppScreen.RECIPE && (
        <nav className="shrink-0 border-t border-white/10 px-6 pt-2 pb-3 flex justify-around items-center bg-[#020617] z-50">
          <button onClick={() => setCurrentScreen(AppScreen.FEED)} className={`flex flex-col items-center gap-0.5 px-5 py-1 rounded-xl transition-colors ${currentScreen === AppScreen.FEED ? 'text-purple-400' : 'text-slate-500'}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: currentScreen === AppScreen.FEED ? "'FILL' 1" : "'FILL' 0" }}>explore</span>
            <span className="text-[9px] font-bold uppercase tracking-wider">Explorar</span>
          </button>
          <button onClick={() => setCurrentScreen(AppScreen.TOP)} className={`flex flex-col items-center gap-0.5 px-5 py-1 rounded-xl transition-colors ${currentScreen === AppScreen.TOP ? 'text-purple-400' : 'text-slate-500'}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: currentScreen === AppScreen.TOP ? "'FILL' 1" : "'FILL' 0" }}>stars</span>
            <span className="text-[9px] font-bold uppercase tracking-wider">Top</span>
          </button>
          <button onClick={() => setCurrentScreen(AppScreen.FAVORITES)} className={`flex flex-col items-center gap-0.5 px-5 py-1 rounded-xl transition-colors ${currentScreen === AppScreen.FAVORITES ? 'text-purple-400' : 'text-slate-500'}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: currentScreen === AppScreen.FAVORITES ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
            <span className="text-[9px] font-bold uppercase tracking-wider">Guardados</span>
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
            refrescarBebida(selectedCocktail.id);
          }} 
          isLiked={likedIds.has(selectedCocktail.id)} 
          isSaved={savedIds.has(selectedCocktail.id)} 
          onLike={() => toggleLike(selectedCocktail.id)} 
          onSave={() => toggleSave(selectedCocktail.id)} 
        />
      )}

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