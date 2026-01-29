// src/screens/Bebidas.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Container, Spinner, Button, Badge, Form, Modal } from "react-bootstrap";
import { api } from "../lib/api";
import type { Drink } from "../lib/drinks-data";
import { auth } from "../lib/firebase";

interface Props {
  volver: () => void;
}

type ViewMode = "descubrir" | "buscar" | "top";
const DIFFS = ["Facil", "Media", "Dificil"] as const;


const API_URL = "http://127.0.0.1:8000";

// Fallback local (poné una imagen en: frontend/public/tragos/default.jpg)
const FALLBACK_IMG = "/tragos/default.jpg";

// -------- helpers --------
const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();
const toNum = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export default function Bebidas({ volver }: Props) {
  // ---------------------- DATA ----------------------
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------------------- AUTH (likes solo logueado) ----------------------
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);
  const isLogged = !!uid;

  // ---------------------- UI STATE ----------------------
  const [view, setView] = useState<ViewMode>("descubrir");

  // Modal único de filtros
  const [showFilterModal, setShowFilterModal] = useState(false);

  // filtros reales (según campos de firestore)
  // nombre -> "nombre" en firestore (pero en front usamos d.name)
  const [filterName, setFilterName] = useState("");
  // vol% -> "graduacion" en firestore (pero en front usamos d.alcoholContent)
  const [minVol, setMinVol] = useState<number | "">("");
  const [maxVol, setMaxVol] = useState<number | "">("");
  // dificultad -> "dificultad" (pero en front usamos (d as any).difficulty)
  const [diff, setDiff] = useState<string>(""); // "" = todas
  // alcohol -> "alcohol_tipo" (pero en front usamos d.alcoholType)
  const [selectedAlcohols, setSelectedAlcohols] = useState<string[]>([]);

  // ---------------------- DISCOVER INDEX ----------------------
  const [idx, setIdx] = useState(0);

  // ---------------------- DETAIL FULLSCREEN (opción 2) ----------------------
  const [showDetail, setShowDetail] = useState(false);
  const [detailList, setDetailList] = useState<Drink[]>([]);
  const [detailIdx, setDetailIdx] = useState(0);

  // Preparación “tirar la carta”
  const [showPrep, setShowPrep] = useState(false);

const next = () => {
  if (filtered.length === 0) return;
  setIdx((p) => (p + 1) % filtered.length);
  setShowPrep(false);
};

  // Gestos
  const [startX, setStartX] = useState<number | null>(null);
  const [startY, setStartY] = useState<number | null>(null);

  // ---------------------- LOAD ----------------------
  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const data = await api.obtenerTragos();
        setDrinks(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error cargando bebidas:", e);
        setDrinks([]);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  // ---------------------- STARS (likes normalizado a 0..10) ----------------------
  const maxLikes = useMemo(() => {
    return Math.max(1, ...(drinks ?? []).map((d: any) => toNum((d as any).likes, 0)));
  }, [drinks]);

  const getStars = (likes: number) => {
    const stars = (likes * 10) / maxLikes; // 0..10
    return Math.round(stars * 10) / 10; // 1 decimal
  };

  // ---------------------- ALCOHOL OPTIONS ----------------------
  const alcoholOptions = useMemo(() => {
    const set = new Set<string>();
    (drinks ?? []).forEach((d: any) => {
      const arr = (d.alcoholType ?? (d as any).alcohol_tipo ?? []) as string[];
      (arr ?? []).forEach((a) => set.add(a));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [drinks]);

  // ---------------------- FILTERED LIST (por campos reales) ----------------------
  const filtered = useMemo(() => {
    let out = [...(drinks ?? [])];

    // alcohol
    if (selectedAlcohols.length > 0) {
      out = out.filter((d: any) => {
        const arr = (d.alcoholType ?? (d as any).alcohol_tipo ?? []) as string[];
        return (arr ?? []).some((t) => selectedAlcohols.includes(t));
      });
    }

    

    // vol%
    if (minVol !== "") out = out.filter((d: any) => toNum(d.alcoholContent ?? (d as any).graduacion, 0) >= Number(minVol));
    if (maxVol !== "") out = out.filter((d: any) => toNum(d.alcoholContent ?? (d as any).graduacion, 0) <= Number(maxVol));

    // dificultad
    if (diff) {
      out = out.filter((d: any) => String((d as any).difficulty ?? (d as any).dificultad ?? "").trim() === diff);
    }

    return out;
  }, [drinks, selectedAlcohols, filterName, minVol, maxVol, diff]);

  // ---------------------- RANKED (Top por likes, fallback rating) ----------------------
  const ranked = useMemo(() => {
    return [...(drinks ?? [])].sort((a: any, b: any) => {
      const la = toNum((a as any).likes, 0);
      const lb = toNum((b as any).likes, 0);
      if (lb !== la) return lb - la;
      return toNum((b as any).rating, 0) - toNum((a as any).rating, 0);
    });
  }, [drinks]);

  // ---------------------- CURRENT DRINKS ----------------------
  const currentDiscover = filtered.length > 0 ? filtered[idx % filtered.length] : null;

  const currentDetail = useMemo(() => {
    if (!showDetail) return null;
    if (detailList.length === 0) return null;
    return detailList[detailIdx % detailList.length] ?? null;
  }, [showDetail, detailList, detailIdx]);

  // ---------------------- NAV HELPERS ----------------------
  const resetAllFilters = () => {
    setSelectedAlcohols([]);
    setFilterName("");
    setMinVol("");
    setMaxVol("");
    setDiff("");
    setIdx(0);
  };

  const nextDiscover = () => {
    if (filtered.length === 0) return;
    setIdx((p) => (p + 1) % filtered.length);
    setShowPrep(false);
  };

  const openDetail = (list: Drink[], index: number) => {
    setDetailList(list);
    setDetailIdx(Math.max(0, index));
    setShowDetail(true);
    setShowPrep(false);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setDetailList([]);
    setDetailIdx(0);
    setShowPrep(false);
  };

  const nextDetail = () => {
    if (detailList.length === 0) return;
    setDetailIdx((p) => (p + 1) % detailList.length);
    setShowPrep(false);
  };

  // ---------------------- LIKE TOGGLE (1 por usuario) ----------------------
  // Estado local: set de drinks likeados por el usuario (para pintar el corazón y hacer toggle)
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());

  // (Opcional) cuando tengas endpoint GET /usuarios/{uid}/likes, lo cargás acá.
  // Por ahora: lo persistimos en localStorage por uid (sincroniza UI, pero el backend es la verdad).
  useEffect(() => {
    if (!uid) {
      setLikedSet(new Set());
      return;
    }
    const key = `likes_${uid}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      setLikedSet(new Set());
      return;
    }
    try {
      const arr = JSON.parse(raw) as string[];
      setLikedSet(new Set(arr));
    } catch {
      setLikedSet(new Set());
    }
  }, [uid]);

  const persistLikedSet = (next: Set<string>) => {
    if (!uid) return;
    localStorage.setItem(`likes_${uid}`, JSON.stringify(Array.from(next)));
  };

  // Backend esperado: POST /bebidas/{id}/like-toggle con body { uid }
  // Devuelve { id, likes, liked } (liked = true si quedó likeado)
  const toggleLike = async (drinkId: string) => {
    if (!isLogged || !uid) return;

    try {
      const res = await fetch(`${API_URL}/bebidas/${drinkId}/like-toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });

      if (!res.ok) throw new Error(`No se pudo togglear like (${res.status})`);
      const json = await res.json(); // { id, likes, liked }

      // actualizo likes en lista
      setDrinks((prev: any[]) =>
        prev.map((d) => (d.id === drinkId ? { ...d, likes: json.likes } : d))
      );

      // actualizo set local
      setLikedSet((prev) => {
        const next = new Set(prev);
        if (json.liked) next.add(drinkId);
        else next.delete(drinkId);
        persistLikedSet(next);
        return next;
      });
    } catch (e) {
      console.error(e);
      alert("Error al dar like");
    }
  };

  // ---------------------- STYLE (borde con color, sin fondo de color) ----------------------
  const colorForDrink = (d: any) => {
    // si tenés color en BD
    if (d.color) return String(d.color);

    const primary = norm((d.alcoholType?.[0] ?? (d.alcoholType ?? [])[0] ?? (d as any).alcohol_tipo?.[0] ?? ""));
    if (primary.includes("tequila")) return "#f59e0b";
    if (primary.includes("vodka")) return "#fb7185";
    if (primary.includes("whisky") || primary.includes("whiskey")) return "#ea580c";
    if (primary.includes("ron")) return "#22c55e";
    if (primary.includes("gin")) return "#ef4444";
    return "#a855f7";
  };

  const cardShellStyle = (d: any) => ({
    background: "rgba(17,24,39,0.65)", // dark glass
    border: `2px solid ${colorForDrink(d)}`,
    borderRadius: 18,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    backdropFilter: "blur(8px)",
  } as React.CSSProperties);

  // ---------------------- GESTURES (card) ----------------------
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent, onSwipeRight: () => void, onSwipeUp: () => void) => {
    if (startX === null || startY === null) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const dx = endX - startX;
    const dy = endY - startY;

    // derecha
    if (dx > 60 && Math.abs(dy) < 60) {
      onSwipeRight();
    }

    // arriba (dy negativo)
    if (-dy > 60 && Math.abs(dx) < 60) {
      onSwipeUp();
    }

    setStartX(null);
    setStartY(null);
  };

  // ---------------------- IMAGE URL (from firestore imagen_url) ----------------------
  const getImg = (d: any) => {
    // firestore: "imagen_url"
    const url = (d as any).imagen_url ?? (d as any).image ?? (d as any).imagen ?? null;
    return url || FALLBACK_IMG;
  };

  // ---------------------- RENDER: DETAIL FULLSCREEN ----------------------
  const renderDetail = (d: any) => {
    if (!d) return null;

    const likes = toNum((d as any).likes, 0);
    const stars = getStars(likes);
    const liked = isLogged ? likedSet.has(d.id) : false;

    const alcoholArr = (d.alcoholType ?? (d as any).alcohol_tipo ?? []) as string[];
    const alcoholText = (alcoholArr ?? []).join(", ");

    const vol = toNum(d.alcoholContent ?? (d as any).graduacion, 0);
    const mins = toNum(d.preparationTime ?? (d as any).tiempo_min, 0);
    const dif = String((d as any).difficulty ?? (d as any).dificultad ?? "Media");

    const ingredients = ((d as any).ingredients ?? (d as any).ingredientes ?? []) as string[];
    const steps = ((d as any).steps ?? (d as any).pasos ?? []) as string[];

    return (
      <div style={{ minHeight: "100vh", background: "#0b1020", color: "white" }}>
        <Container className="py-3">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <button className="btn btn-link text-white text-decoration-none p-0" onClick={closeDetail}>
              ← Volver
            </button>
            <div className="fw-bold">🍹 Trago</div>
            <div style={{ width: 48 }} />
          </div>

          <div className="d-flex justify-content-center">
            <div
              style={{
                width: "min(520px, 95vw)",
                padding: 14,
                ...cardShellStyle(d),
                position: "relative",
              }}
              onTouchStart={handleTouchStart}
              onTouchEnd={(e) => handleTouchEnd(e, nextDetail, () => setShowPrep(true))}
            >
              {/* Imagen grande */}
              <div style={{ position: "relative" }}>
                <img
                  src={getImg(d)}
                  alt={String(d.name ?? (d as any).nombre)}
                  onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                  style={{
                    width: "100%",
                    height: 260,
                    objectFit: "cover",
                    borderRadius: 14,
                    border: `1px solid rgba(255,255,255,0.12)`,
                  }}
                />

                {/* Like estilo IG/Tinder (bottom-right floating) */}
                <button
                  disabled={!isLogged}
                  onClick={() => toggleLike(d.id)}
                  title={!isLogged ? "Iniciá sesión para dar like" : "Like"}
                  style={{
                    position: "absolute",
                    right: 14,
                    bottom: 14,
                    width: 54,
                    height: 54,
                    borderRadius: 999,
                    border: "none",
                    cursor: isLogged ? "pointer" : "not-allowed",
                    background: "rgba(0,0,0,0.55)",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: liked ? "scale(1.02)" : "scale(1)",
                    transition: "transform .12s ease",
                  }}
                >
                  <span style={{ fontSize: 24, lineHeight: 1 }}>
                    {liked ? "❤️" : "🤍"}
                  </span>
                </button>
              </div>

              {/* Header */}
              <div className="mt-3 d-flex justify-content-between align-items-start gap-3">
                <div style={{ flex: 1 }}>
                  <div className="fw-bold" style={{ fontSize: 28, lineHeight: 1.05 }}>
                    {String(d.name ?? (d as any).nombre)}
                  </div>
                  <div style={{ opacity: 0.8, marginTop: 4 }}>{alcoholText}</div>
                </div>

                <div
                  className="px-3 py-2"
                  style={{
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    fontSize: 13,
                    whiteSpace: "nowrap",
                  }}
                >
                  ❤️ {likes}
                </div>
              </div>

              {/* Métricas */}
              <div className="d-flex flex-wrap gap-3 mt-3" style={{ fontSize: 13, opacity: 0.95 }}>
                <span>⭐ {stars}</span>
                <span>🍷 {vol}% vol</span>
                <span>⏱ {mins} min</span>
                <span>📊 {dif}</span>
              </div>

              <hr style={{ borderColor: "rgba(255,255,255,0.12)" }} />

              {/* Ingredientes */}
              <div>
                <div className="fw-bold mb-2">Ingredientes</div>
                {ingredients?.length ? (
                  <ul style={{ marginBottom: 0 }}>
                    {ingredients.map((it, i) => (
                      <li key={i} style={{ opacity: 0.95 }}>
                        {it}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ opacity: 0.7 }}>Sin ingredientes cargados.</div>
                )}
              </div>

              {/* Preparación (solo con swipe ↑) */}
              {showPrep && (
                <>
                  <hr style={{ borderColor: "rgba(255,255,255,0.12)" }} />
                  <div>
                    <div className="fw-bold mb-2">Preparación</div>
                    {steps?.length ? (
                      <div style={{ opacity: 0.95 }}>
                        {steps.map((s, i) => (
                          <div key={i}>
                            <b>{i + 1}.</b> {s}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ opacity: 0.7 }}>Sin pasos cargados.</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="text-center text-white-50 mt-3" style={{ fontSize: 12 }}>
            👆 Swipe arriba: preparación — 👉 Swipe derecha: siguiente
          </div>

          {!isLogged && (
            <div className="text-center mt-3" style={{ color: "#cbd5e1", fontSize: 13 }}>
              Iniciá sesión para dar likes.
            </div>
          )}
        </Container>
      </div>
    );
  };

  // ---------------------- RENDER: LIST ITEM (Buscar/Top) ----------------------
  const ListRow = ({
    d,
    index,
    list,
    showIndex,
  }: {
    d: any;
    index: number;
    list: Drink[];
    showIndex?: boolean;
  }) => {
    const likes = toNum((d as any).likes, 0);
    const stars = getStars(likes);
    const vol = toNum(d.alcoholContent ?? (d as any).graduacion, 0);
    const dif = String((d as any).difficulty ?? (d as any).dificultad ?? "Media");

    const alcoholArr = (d.alcoholType ?? (d as any).alcohol_tipo ?? []) as string[];
    const alcoholText = (alcoholArr ?? []).join(", ");

    return (
      <div
        role="button"
        onClick={() => openDetail(list, index)}
        className="rounded-4"
        style={{
          ...cardShellStyle(d),
          padding: 14,
          cursor: "pointer",
        }}
      >
        <div className="d-flex gap-3 align-items-center">
          {showIndex && (
            <div
              className="rounded-3 d-flex align-items-center justify-content-center fw-bold"
              style={{
                width: 42,
                height: 42,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "white",
              }}
            >
              {index + 1}
            </div>
          )}

          <img
            src={getImg(d)}
            alt={String(d.name ?? (d as any).nombre)}
            onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
            style={{
              width: 86,
              height: 66,
              objectFit: "cover",
              borderRadius: 12,
              border: `1px solid rgba(255,255,255,0.12)`,
            }}
          />

          <div style={{ flex: 1 }}>
            <div className="fw-bold" style={{ fontSize: 18 }}>
              {String(d.name ?? (d as any).nombre)}
            </div>
            <div style={{ opacity: 0.75, fontSize: 13 }}>{alcoholText}</div>

            <div className="d-flex flex-wrap gap-3 mt-2" style={{ fontSize: 12, opacity: 0.95 }}>
              <span>❤️ {likes}</span>
              <span>⭐ {stars}</span>
              <span>🍷 {vol}%</span>
              <span>📊 {dif}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------- IF DETAIL OPEN, RENDER IT ----------------------
  if (showDetail) {
    return renderDetail(currentDetail);
  }

  // ---------------------- MAIN UI ----------------------
  return (
    <div style={{ minHeight: "100vh", background: "#0b1020", color: "white" }}>
      <Container className="py-3">
        {/* HEADER */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <button className="btn btn-link text-white text-decoration-none p-0" onClick={volver}>
            ← Volver
          </button>

          <div className="fw-bold">🍹 Tragos</div>

          <button
            className="btn btn-link text-white text-decoration-none p-0"
            onClick={resetAllFilters}
            title="Reset"
          >
            ↻
          </button>
        </div>

        {/* TABS */}
        <div className="d-flex gap-2 mb-3">
          <button
            className={`btn flex-fill ${view === "descubrir" ? "btn-primary" : "btn-outline-light"}`}
            onClick={() => {
              setView("descubrir");
              setShowPrep(false);
            }}
            style={{ background: view === "descubrir" ? "#a855f7" : "transparent", borderColor: "#334155" }}
          >
            ✨ Descubrir
          </button>

          <button
            className={`btn flex-fill ${view === "buscar" ? "btn-primary" : "btn-outline-light"}`}
            onClick={() => {
              setView("buscar");
              setShowPrep(false);
            }}
            style={{ background: view === "buscar" ? "#a855f7" : "transparent", borderColor: "#334155" }}
          >
            🔎 Buscar
          </button>

          <button
            className={`btn flex-fill ${view === "top" ? "btn-primary" : "btn-outline-light"}`}
            onClick={() => {
              setView("top");
              setShowPrep(false);
            }}
            style={{ background: view === "top" ? "#a855f7" : "transparent", borderColor: "#334155" }}
          >
            🏆 Top
          </button>
        </div>

        {/* ACTIONS BAR */}
        <div className="d-flex gap-2 mb-3 align-items-center">
          <button
            className="btn btn-outline-light"
            style={{ borderColor: "#334155" }}
            onClick={() => setShowFilterModal(true)}
          >
            🧪 Filtros{" "}
            {(selectedAlcohols.length > 0 || filterName || minVol !== "" || maxVol !== "" || diff) && (
              <Badge bg="secondary" className="ms-2">
                {[
                  selectedAlcohols.length > 0 ? 1 : 0,
                  filterName ? 1 : 0,
                  minVol !== "" ? 1 : 0,
                  maxVol !== "" ? 1 : 0,
                  diff ? 1 : 0,
                ].reduce((a, b) => a + b, 0)}
              </Badge>
            )}
          </button>

          <div className="text-white-50" style={{ fontSize: 12 }}>
            {filtered.length} resultados
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" />
            <div className="mt-2 text-white-50">Cargando bebidas...</div>
          </div>
        )}

        {/* VISTA DESCUBRIR */}
        {!loading && view === "descubrir" && (
          <div className="d-flex flex-column align-items-center" style={{ minHeight: "70vh" }}>
            {!currentDiscover ? (
              <div className="text-center text-white-50 mt-5">
                No hay tragos para mostrar con esos filtros.
                <div className="mt-3">
                  <Button variant="outline-light" onClick={resetAllFilters}>
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    width: "min(520px, 95vw)",
                    padding: 14,
                    ...cardShellStyle(currentDiscover),
                    position: "relative",
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={(e) => handleTouchEnd(e, nextDiscover, () => setShowPrep(true))}
                >
                  {/* Imagen grande */}
                  <div style={{ position: "relative" }}>
                    <img
                      src={getImg(currentDiscover as any)}
                      alt={String((currentDiscover as any).name ?? (currentDiscover as any).nombre)}
                      onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                      style={{
                        width: "100%",
                        height: 260,
                        objectFit: "cover",
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    />

                    {/* Like floating */}
                    <button
                      disabled={!isLogged}
                      onClick={() => toggleLike((currentDiscover as any).id)}
                      title={!isLogged ? "Iniciá sesión para dar like" : "Like"}
                      style={{
                        position: "absolute",
                        right: 14,
                        bottom: 14,
                        width: 54,
                        height: 54,
                        borderRadius: 999,
                        border: "none",
                        cursor: isLogged ? "pointer" : "not-allowed",
                        background: "rgba(0,0,0,0.55)",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: 24, lineHeight: 1 }}>
                        {isLogged && likedSet.has((currentDiscover as any).id) ? "❤️" : "🤍"}
                      </span>
                    </button>
                  </div>

                  <div className="mt-3 d-flex justify-content-between align-items-start gap-3">
                    <div style={{ flex: 1 }}>
                      <div className="fw-bold" style={{ fontSize: 28, lineHeight: 1.05 }}>
                        {String((currentDiscover as any).name ?? (currentDiscover as any).nombre)}
                      </div>
                      <div style={{ opacity: 0.8, marginTop: 4 }}>
                        {(((currentDiscover as any).alcoholType ?? (currentDiscover as any).alcohol_tipo ?? []) as string[]).join(", ")}
                      </div>
                    </div>

                    <div
                      className="px-3 py-2"
                      style={{
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        fontSize: 13,
                        whiteSpace: "nowrap",
                      }}
                    >
                      ❤️ {toNum((currentDiscover as any).likes, 0)}
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-3 mt-3" style={{ fontSize: 13, opacity: 0.95 }}>
                    <span>⭐ {getStars(toNum((currentDiscover as any).likes, 0))}</span>
                    <span>🍷 {toNum((currentDiscover as any).alcoholContent ?? (currentDiscover as any).graduacion, 0)}% vol</span>
                    <span>⏱ {toNum((currentDiscover as any).preparationTime ?? (currentDiscover as any).tiempo_min, 0)} min</span>
                    <span>📊 {String((currentDiscover as any).difficulty ?? (currentDiscover as any).dificultad ?? "Media")}</span>
                  </div>

                  <hr style={{ borderColor: "rgba(255,255,255,0.12)" }} />

                  <div>
                    <div className="fw-bold mb-2">Ingredientes</div>
                    {(((currentDiscover as any).ingredients ?? (currentDiscover as any).ingredientes ?? []) as string[])?.length ? (
                      <ul style={{ marginBottom: 0 }}>
                        {(((currentDiscover as any).ingredients ?? (currentDiscover as any).ingredientes) as string[]).map((it, i) => (
                          <li key={i} style={{ opacity: 0.95 }}>
                            {it}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ opacity: 0.7 }}>Sin ingredientes cargados.</div>
                    )}
                  </div>
                  {/* BOTÓN DESKTOP → SIGUIENTE */}
<button
  onClick={() => {
    next();
    setShowPrep(false);
  }}
  style={{
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(0,0,0,0.35)",
    border: "none",
    color: "white",
    width: 44,
    height: 44,
    borderRadius: "50%",
    fontSize: 20,
    cursor: "pointer",
  }}
  title="Siguiente trago"
>
  ➡️
</button>



{/* BOTÓN DESKTOP ↑ PREPARACIÓN */}
<button
  onClick={() => setShowPrep((p) => !p)}
  style={{
    position: "absolute",
    bottom: 10,
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(0,0,0,0.35)",
    border: "none",
    color: "white",
    padding: "8px 14px",
    borderRadius: 999,
    fontSize: 14,
    cursor: "pointer",
  }}
  title="Ver preparación"
>
  👆 Preparación
</button>



                  {showPrep && (
                    <>
                      <hr style={{ borderColor: "rgba(255,255,255,0.12)" }} />
                      <div>
                        <div className="fw-bold mb-2">Preparación</div>
                        {(((currentDiscover as any).steps ?? (currentDiscover as any).pasos ?? []) as string[])?.length ? (
                          <div style={{ opacity: 0.95 }}>
                            {(((currentDiscover as any).steps ?? (currentDiscover as any).pasos) as string[]).map((s, i) => (
                              <div key={i}>
                                <b>{i + 1}.</b> {s}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ opacity: 0.7 }}>Sin pasos cargados.</div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="text-white-50 mt-3" style={{ fontSize: 12 }}>
                  👆 Swipe arriba: preparación — 👉 Swipe derecha: siguiente
                </div>

                {!isLogged && (
                  <div className="text-center mt-3" style={{ color: "#cbd5e1", fontSize: 13 }}>
                    Iniciá sesión para dar likes.
                  </div>
                )}
              </>
            )}

            
          </div>
        )}

        {/* VISTA BUSCAR (lista) */}
        {!loading && view === "buscar" && (
          <div className="d-flex flex-column gap-3">
            {filtered.length === 0 ? (
              <div className="text-center py-5 text-white-50">No se encontraron resultados.</div>
            ) : (
              filtered.map((d: any, i: number) => <ListRow key={d.id ?? i} d={d} index={i} list={filtered} />)
            )}
          </div>
        )}

        {/* VISTA TOP (ranking) */}
        {!loading && view === "top" && (
          <div className="d-flex flex-column gap-3">
            {ranked.length === 0 ? (
              <div className="text-center py-5 text-white-50">No hay bebidas cargadas.</div>
            ) : (
              ranked.map((d: any, i: number) => <ListRow key={d.id ?? i} d={d} index={i} list={ranked} showIndex />)
            )}
          </div>
        )}

        {/* MODAL ÚNICO DE FILTROS (TODO JUNTO, BLANCO) */}
        <Modal show={showFilterModal} onHide={() => setShowFilterModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Filtros</Modal.Title>
          </Modal.Header>

          <Modal.Body style={{ background: "white" }}>
            {/* Nombre */}
            <Form.Label className="fw-semibold">Nombre</Form.Label>
            <Form.Control
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Filtrar por nombre..."
              className="mb-3"
            />

            {/* Vol min/max */}
            <div className="d-flex gap-2 mb-3">
              <div style={{ flex: 1 }}>
                <Form.Label className="fw-semibold">Vol min</Form.Label>
                <Form.Control
                  value={minVol}
                  onChange={(e) => setMinVol(e.target.value === "" ? "" : Number(e.target.value))}
                  type="number"
                  placeholder="0"
                />
              </div>
              <div style={{ flex: 1 }}>
                <Form.Label className="fw-semibold">Vol max</Form.Label>
                <Form.Control
                  value={maxVol}
                  onChange={(e) => setMaxVol(e.target.value === "" ? "" : Number(e.target.value))}
                  type="number"
                  placeholder="60"
                />
              </div>
            </div>

            {/* Dificultad */}
            <Form.Label className="fw-semibold">Dificultad</Form.Label>
            <Form.Select value={diff} onChange={(e) => setDiff(e.target.value)} className="mb-3">
              <option value="">Todas</option>
              <option value="Fácil">Fácil</option>
              <option value="Media">Media</option>
              <option value="Difícil">Difícil</option>
             
            </Form.Select>

            {/* Alcohol (chips) */}
            <Form.Label className="fw-semibold">Alcohol</Form.Label>
            {alcoholOptions.length === 0 ? (
              <div className="text-muted">No hay alcoholes en los datos.</div>
            ) : (
              <div className="d-flex flex-wrap gap-2">
                {alcoholOptions.map((a) => {
                  const active = selectedAlcohols.includes(a);
                  return (
                    <button
                      key={a}
                      className={`btn btn-sm ${active ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => {
                        setSelectedAlcohols((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
                        setIdx(0);
                      }}
                      type="button"
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            )}
          </Modal.Body>

          <Modal.Footer style={{ background: "white" }}>
            <Button
              variant="outline-secondary"
              onClick={() => {
                resetAllFilters();
              }}
            >
              Limpiar
            </Button>
            <Button variant="primary" onClick={() => setShowFilterModal(false)}>
              Listo
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
}
