import firebase_admin
from firebase_admin import firestore
from database import db 

# Lista de 10 tragos con Fernet, Campari, Vinos, Vodka, Gin, Jäger y Whisky
initial_cocktails = [
  {
    "id": '4',
    "name": 'Fernet con Coca',
    "description": 'El rey de Córdoba. La mezcla perfecta de hierbas amargas y dulzura gaseosa. 70/30, no se discute.',
    "image": 'https://images.unsplash.com/photo-1597075687490-8f673c6c17f6?auto=format&fit=crop&q=80&w=800', # Foto genérica oscura
    "rating": 5.0,
    "abv": '39%',
    "difficulty": 'Fácil',
    "likes": '1M',
    "comments": 999,
    "category": 'Clásicos',
    "ingredients": [
      { "item": 'Fernet Branca', "amount": '30%' },
      { "item": 'Coca-Cola', "amount": '70%' },
      { "item": 'Hielo', "amount": '3 rocas grandes' }
    ],
    "instructions": [
      'Poner hielo en un vaso de trago largo (o botella cortada).',
      'Servir el Fernet primero.',
      'Completar con Coca-Cola despacio para que la espuma no desborde.'
    ]
  },
  {
    "id": '5',
    "name": 'Campari Orange (Garibaldi)',
    "description": 'Un aperitivo rojo pasión, cítrico y refrescante.',
    "image": 'https://images.unsplash.com/photo-1541546339599-ecdbfcf77378?auto=format&fit=crop&q=80&w=800', 
    "rating": 4.5,
    "abv": '25%',
    "difficulty": 'Fácil',
    "likes": '5k',
    "comments": 150,
    "category": 'Aperitivos',
    "ingredients": [
      { "item": 'Campari', "amount": '45ml' },
      { "item": 'Jugo de Naranja', "amount": 'Completar' },
      { "item": 'Rodaja de naranja', "amount": '1' }
    ],
    "instructions": [
      'Llenar un vaso alto con hielo.',
      'Verter el Campari.',
      'Completar con jugo de naranja y decorar.'
    ]
  },
  {
    "id": '6',
    "name": 'Gin Tonic',
    "description": 'Fresco, botánico y elegante. La ginebra en su mejor expresión.',
    "image": 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800',
    "rating": 4.7,
    "abv": '12%',
    "difficulty": 'Fácil',
    "likes": '8k',
    "comments": 320,
    "category": 'Refrescantes',
    "ingredients": [
      { "item": 'Ginebra (Gin)', "amount": '50ml' },
      { "item": 'Agua Tónica', "amount": '150ml' },
      { "item": 'Limón o Pepino', "amount": 'Rodaja' }
    ],
    "instructions": [
      'Copa balón con mucho hielo.',
      'Servir el Gin y luego la tónica suavemente.',
      'Integrar sin batir para no romper las burbujas.'
    ]
  },
  {
    "id": '7',
    "name": 'Jägerbomb',
    "description": 'Energía pura. El shot de Jägermeister cayendo en la bebida energizante.',
    "image": 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800', # Placeholder
    "rating": 4.8,
    "abv": '35%',
    "difficulty": 'Medio',
    "likes": '10k',
    "comments": 500,
    "category": 'Fiesta',
    "ingredients": [
      { "item": 'Jägermeister', "amount": '1 shot' },
      { "item": 'Bebida Energizante (Speed/Red Bull)', "amount": 'Media lata' }
    ],
    "instructions": [
      'Servir la energizante en un vaso ancho.',
      'Servir el Jäger en un vaso de shot.',
      'Dejar caer el shot dentro del vaso grande y beber de fondo.'
    ]
  },
  {
    "id": '8',
    "name": 'Whisky con Cola',
    "description": 'Simple, dulce y con carácter. Un clásico de la noche.',
    "image": 'https://images.unsplash.com/photo-1541546339599-ecdbfcf77378?auto=format&fit=crop&q=80&w=800',
    "rating": 4.2,
    "abv": '15%',
    "difficulty": 'Fácil',
    "likes": '3k',
    "comments": 80,
    "category": 'Clásicos',
    "ingredients": [
      { "item": 'Whisky', "amount": '50ml' },
      { "item": 'Coca-Cola', "amount": 'Completar' },
      { "item": 'Hielo', "amount": 'A gusto' }
    ],
    "instructions": [
      'Vaso corto o largo con hielo.',
      'Verter el whisky.',
      'Completar con cola y remover.'
    ]
  },
  {
    "id": '9',
    "name": 'Vino Tinto con Coca (Kalimotxo)',
    "description": 'Popular y efectivo. La mezcla callejera por excelencia.',
    "image": 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800',
    "rating": 4.0,
    "abv": '7%',
    "difficulty": 'Fácil',
    "likes": '4.5k',
    "comments": 200,
    "category": 'Popular',
    "ingredients": [
      { "item": 'Vino Tinto', "amount": '50%' },
      { "item": 'Coca-Cola', "amount": '50%' },
      { "item": 'Hielo', "amount": 'Mucho' }
    ],
    "instructions": [
      'Mezclar partes iguales en un vaso grande.',
      'Ideal para compartir en jarra.'
    ]
  },
  {
    "id": '10',
    "name": 'Caipiroska',
    "description": 'La prima rusa de la caipirinha. Vodka, lima y azúcar.',
    "image": 'https://images.unsplash.com/photo-1541546339599-ecdbfcf77378?auto=format&fit=crop&q=80&w=800',
    "rating": 4.6,
    "abv": '20%',
    "difficulty": 'Medio',
    "likes": '6k',
    "comments": 120,
    "category": 'Refrescantes',
    "ingredients": [
      { "item": 'Vodka', "amount": '60ml' },
      { "item": 'Lima', "amount": '1 unidad en trozos' },
      { "item": 'Azúcar', "amount": '2 cucharadas' },
      { "item": 'Hielo picado', "amount": 'Llenar vaso' }
    ],
    "instructions": [
      'Machacar la lima con el azúcar en un vaso corto.',
      'Agregar hielo picado hasta el tope.',
      'Verter el vodka y mezclar bien.'
    ]
  },
  {
    "id": '11',
    "name": 'Vino Blanco con Sprite',
    "description": 'Dulce, burbujeante y peligroso si está bien frío.',
    "image": 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800',
    "rating": 4.1,
    "abv": '6%',
    "difficulty": 'Fácil',
    "likes": '2k',
    "comments": 50,
    "category": 'Verano',
    "ingredients": [
      { "item": 'Vino Blanco Dulce', "amount": '60%' },
      { "item": 'Sprite o Soda', "amount": '40%' },
      { "item": 'Limón', "amount": 'Rodaja' }
    ],
    "instructions": [
      'Mucho hielo en un vaso o copa.',
      'Servir el vino y completar con gaseosa de lima-limón.'
    ]
  },
  {
    "id": '12',
    "name": 'Negroni',
    "description": 'El clásico italiano fuerte. Gin, Campari y Vermut.',
    "image": 'https://images.unsplash.com/photo-1541546339599-ecdbfcf77378?auto=format&fit=crop&q=80&w=800',
    "rating": 4.9,
    "abv": '24%',
    "difficulty": 'Medio',
    "likes": '9k',
    "comments": 400,
    "category": 'Fuertes',
    "ingredients": [
      { "item": 'Ginebra (Gin)', "amount": '30ml' },
      { "item": 'Campari', "amount": '30ml' },
      { "item": 'Vermut Rojo', "amount": '30ml' }
    ],
    "instructions": [
      'Mezclar las tres partes iguales en un vaso corto con hielo.',
      'Decorar con piel de naranja.'
    ]
  },
  {
    "id": '13',
    "name": 'Destornillador',
    "description": 'Vodka y naranja. Simple, directo y efectivo.',
    "image": 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800',
    "rating": 4.0,
    "abv": '12%',
    "difficulty": 'Fácil',
    "likes": '1.5k',
    "comments": 30,
    "category": 'Clásicos',
    "ingredients": [
      { "item": 'Vodka', "amount": '50ml' },
      { "item": 'Jugo de Naranja', "amount": 'Completar' },
      { "item": 'Hielo', "amount": 'Cubos' }
    ],
    "instructions": [
      'Vaso alto con hielo.',
      'Vodka primero, naranja después.',
      'Remover suavemente.'
    ]
  }
]

def subir_datos():
    collection_ref = db.collection('bebidas')
    print("⏳ Iniciando carga de los 10 tragos argentinos...")

    for trago in initial_cocktails:
        doc_ref = collection_ref.document(trago['id'])
        doc_ref.set(trago)
        print(f"✅ Subido: {trago['name']}")

    print("🎉 ¡Carga completa! Ya tenés la barra lista.")

if __name__ == "__main__":
    subir_datos()