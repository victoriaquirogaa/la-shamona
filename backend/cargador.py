from database import db

def cargar_animales():
    lista_animales = [
        "perro", "gato", "leon", "elefante", "jirafa", "delfin", "tiburon", 
        "pinguino", "mono", "serpiente", "caballo", "vaca", "mosquito", 
        "dinosaurio", "canguro", "hamster", "loro", "tortuga"
    ]
    
    print(f"Cargando {len(lista_animales)} animales...")
    
    db.collection('categorias_impostor').document('animales').set({
        "titulo": "Reino Animal 🦁",
        "es_premium": False,
        "palabras": lista_animales
    }, merge=True)

def cargar_objetos():
    lista_objetos = [
        "celular", "cama", "inodoro", "cepillo de dientes", "silla", "heladera", 
        "espejo", "llave", "papel higienico", "control remoto", "zapatilla", 
        "cuchara", "reloj", "guitarra", "anteojos", "billetera", "mate"
    ]
    
    print(f"Cargando {len(lista_objetos)} objetos...")
    
    db.collection('categorias_impostor').document('objetos').set({
        "titulo": "Cosas de la Casa 🏠",
        "es_premium": False,
        "palabras": lista_objetos
    }, merge=True)
# ... (Acá arriba estaban cargar_animales y cargar_objetos) ...

def cargar_comida():
    lista_comida = [
        "asado", "pizza", "sushi", "empanadas", "milanesa", "hamburguesa",
        "helado", "chocolate", "pochoclos", "lomito", "choripan", "tacos",
        "ensalada", "fideos", "facturas", "criollitos", "cafe", "mate",
        "fernet", "pastel de papa"
    ]
    
    print(f"Cargando {len(lista_comida)} comidas...")
    
    db.collection('categorias_impostor').document('comida').set({
        "titulo": "Comidas y Bebidas 🍕",
        "es_premium": False, # Gratis para todos
        "palabras": lista_comida
    }, merge=True)

def cargar_profesiones():
    lista_profesiones = [
        "medico", "policia", "bombero", "maestra", "futbolista", 
        "actor", "abogado", "albañil", "payaso", "astronauta", 
        "presidente", "delivery", "programador", "psicologo", 
        "cocinero", "veterinario", "influencer", "dj"
    ]
    
    print(f"Cargando {len(lista_profesiones)} profesiones...")
    
    db.collection('categorias_impostor').document('profesiones').set({
        "titulo": "Profesiones y Oficios 👷",
        "es_premium": False,
        "palabras": lista_profesiones
    }, merge=True)

# ... (Funciones anteriores: animales, objetos, comida, profesiones) ...

def cargar_picante():
    # Palabras subidas de tono, citas y vida adulta
    lista_picante = [
        "sexo", "telo", "ex", "cuernos", "trio", "poliamor", 
        "lenceria", "fetiche", "kamusutra", "amigos con derechos", 
        "mañanero", "cucharita", "striptease", "despedida de soltero",
        "lubricante", "juguetes", "nudes", "sexting", "chapar", 
        "resaca moral", "bulo", "chamuyo", "touch and go"
    ]
    
    print(f"Cargando {len(lista_picante)} palabras PICANTES...")
    
    # ¡ATENCIÓN! Esta va con es_premium=True
    db.collection('categorias_impostor').document('picante').set({
        "titulo": "Picante (+18) 🔥",
        "es_premium": True, 
        "palabras": lista_picante
    }, merge=True)

def cargar_argentina_bizarra():
    # Personajes de culto, marcas legendarias y memes históricos
    lista_bizarra = [
        "zulma lobato", "el bananero", "pity alvarez", "felfort", "marolio", 
        "ugi's", "guaymallen", "cronica tv", "samid vs viale", "el gigolo", 
        "caro pardiaco", "el comandante", "esperando la carroza", 
        "okupas", "tumberos", "policia en accion", "callejeros",
        "el atendedor de boludos", "alto guiso"
    ]
    
    print(f"Cargando {len(lista_bizarra)} de ARGENTINA VIP...")
    
    db.collection('categorias_impostor').document('argentina_vip').set({
        "titulo": "Argentina Bizarra 🇦🇷⭐",
        "es_premium": True,
        "palabras": lista_bizarra
    }, merge=True)

def cargar_terror():
    # Películas de miedo y monstruos clásicos
    lista_terror = [
        "it", "chucky", "freddy krueger", "el exorcista", "annabelle",
        "zombie", "vampiro", "hombre lobo", "la llamada", "el juego del miedo",
        "el resplandor", "jason", "la monja", "ouija", "actividad paranormal",
        "stranger things", "black mirror", "el juego del calamar"
    ]
    
    print(f"Cargando {len(lista_terror)} de TERROR...")
    
    db.collection('categorias_impostor').document('terror').set({
        "titulo": "Terror y Suspenso 👻",
        "es_premium": True,
        "palabras": lista_terror
    }, merge=True)

# --- EJECUTAR ---
if __name__ == "__main__":
    # cargar_animales() 
    # cargar_objetos()
    # cargar_comida()
    # cargar_profesiones()
    
    # Nuevas Premium
    cargar_picante()
    cargar_argentina_bizarra()
    cargar_terror()
    
    print("¡Listo! Categorías PREMIUM subidas a Firebase 💸")