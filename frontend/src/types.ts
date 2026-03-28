export interface Ingredient {
  item: string;
  amount: string;
}

export interface Cocktail {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  abv: string;
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
  likes: string;
  comments: number;
  ingredients: Ingredient[];
  instructions: string[];
  category: string;
}

export enum AppScreen {
  FEED = 'FEED',
  SEARCH = 'SEARCH',
  RECIPE = 'RECIPE',
  FAVORITES = 'FAVORITES',
  TOP = 'TOP'
}