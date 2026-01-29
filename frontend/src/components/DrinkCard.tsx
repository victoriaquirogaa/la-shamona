// src/components/DrinkCard.tsx
import { Drink } from "../lib/drinks-data";

type Mode = "row" | "detail";

type Props = {
  drink: Drink;
  mode: Mode;
  index?: number; // para ranking
  gradient: string; // lo calcula Bebidas.tsx
  onClick?: () => void;
};

export default function DrinkCard({ drink, mode, index, gradient, onClick }: Props) {
  if (mode === "detail") {
    return (
      <div
        className="shadow-lg rounded-4 p-3"
        style={{
          width: 360,
          background: gradient,
          color: "#0b0b0b",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div className="rounded-4 overflow-hidden" style={{ background: "rgba(0,0,0,0.15)" }}>
          {drink.image ? (
            <img
              src={drink.image}
              alt={drink.name}
              style={{ width: "100%", height: 190, objectFit: "cover" }}
            />
          ) : (
            <div style={{ width: "100%", height: 190 }} />
          )}
        </div>

        <div className="mt-3">
          <div className="fw-black" style={{ fontSize: 30, lineHeight: 1 }}>
            {drink.name}
          </div>

          <div className="d-flex flex-wrap gap-2 mt-2">
            <span className="badge rounded-pill text-bg-light">
              ⭐ {drink.rating ?? 0}
            </span>
            <span className="badge rounded-pill text-bg-light">
              🍷 {drink.alcoholContent ?? 0}% vol
            </span>
            <span className="badge rounded-pill text-bg-light">
              ⏱️ {drink.preparationTime ?? 0} min
            </span>
            <span className="badge rounded-pill text-bg-light">
              📊 {drink.difficulty ?? "Media"}
            </span>
          </div>

          {drink.alcoholType?.length > 0 && (
            <div className="mt-2">
              <span className="badge rounded-pill text-bg-dark">
                🥃 {drink.alcoholType.join(", ")}
              </span>
            </div>
          )}

          <hr className="my-3" style={{ opacity: 0.2 }} />

          <div className="fw-bold">Ingredientes:</div>
          <ul className="mt-2 mb-3" style={{ paddingLeft: 18 }}>
            {(drink.ingredients ?? []).length === 0 ? (
              <li className="opacity-75">Sin ingredientes cargados</li>
            ) : (
              drink.ingredients!.map((x, i) => <li key={i}>{x}</li>)
            )}
          </ul>

          <div className="fw-bold">Preparación:</div>
          <div className="mt-2" style={{ fontSize: 13, opacity: 0.9 }}>
            {(drink.steps ?? []).length === 0 ? (
              <div>Sin pasos cargados</div>
            ) : (
              drink.steps!.map((s, i) => (
                <div key={i} className="mb-2">
                  <span className="fw-bold">{i + 1}.</span> {s}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // mode === "row"
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-100 text-start border-0 p-0 bg-transparent"
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div
        className="rounded-4 px-3 py-3 d-flex align-items-center gap-3 shadow-sm"
        style={{
          background: gradient,
          color: "#0b0b0b",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        {typeof index === "number" && (
          <div
            className="rounded-3 d-flex align-items-center justify-content-center fw-black"
            style={{
              width: 42,
              height: 42,
              background: "rgba(0,0,0,0.18)",
              fontSize: 18,
            }}
          >
            {index}
          </div>
        )}

        <div
          className="rounded-3 overflow-hidden"
          style={{ width: 56, height: 56, background: "rgba(0,0,0,0.15)" }}
        >
          {drink.image ? (
            <img
              src={drink.image}
              alt={drink.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : null}
        </div>

        <div className="flex-grow-1">
          <div className="fw-black" style={{ fontSize: 18, lineHeight: 1.1 }}>
            {drink.name}
          </div>
          <div className="opacity-75" style={{ fontSize: 13 }}>
            {(drink.alcoholType ?? []).join(", ")}
          </div>

          <div className="d-flex gap-3 mt-1" style={{ fontSize: 12 }}>
            <span>⭐ {drink.rating ?? 0}</span>
            <span>🍷 {drink.alcoholContent ?? 0}%</span>
            <span>⏱️ {drink.preparationTime ?? 0} min</span>
            <span>📊 {drink.difficulty ?? "Media"}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
