// src/lib/drinks-data.ts
export type Drink = {
  id: string;

  // Normalizados desde backend (/bebidas)
  name: string;
  image?: string | null;

  alcoholType: string[];           // viene de alcohol_tipo
  alcoholContent?: number | null;  // viene de graduacion
  preparationTime?: number | null; // viene de tiempo_min
  rating?: number | null;          // viene de rating
  difficulty?: string | null;      // viene de dificultad

  // Extras opcionales (si los mandás desde el backend)
  ingredients?: string[];
  steps?: string[];
  likes?: number;
  views?: number;
  isPremium?: boolean;

  // UI (si existe, sino generamos)
  color?: string | null;
};
