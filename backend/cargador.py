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

def cargar_preguntas_profundas():
    lista_profundas = [
        "¿Cuál es esa inseguridad tuya que creés que la gente nota, pero en realidad nadie ve?",
        "¿Qué es lo que más te gusta de tu personalidad?",
        "¿Cuál fue el error del que más aprendiste en tu vida?",
        "Si pudieras cambiar una sola cosa de tu pasado, ¿cuál sería?",
        "¿Cuándo fue la última vez que lloraste y por qué?",
        "¿Qué es lo que te mantiene despierto a la noche cuando no podés dormir?",
        "¿Te considerás una persona feliz hoy en día?",
        "¿Qué es lo que más valorás en una amistad?",
        "¿Cuál es la mentira más grande que dijiste para no lastimar a alguien?",
        "¿Creés en las segundas oportunidades? ¿Por qué?",
        "¿A qué persona de tu pasado extrañás, aunque se hayan alejado?",
        "¿Qué es imperdonable para vos en una relación?",
        "¿Hay alguien a quien le debas un 'perdón' y nunca se lo dijiste?",
        "¿Creés que el destino existe o nosotros lo creamos?",
        "¿Qué harías si supieras que no vas a fracasar?",
        "¿Preferís una vida corta e intensa o una larga y tranquila?",
        "¿Qué consejo le darías a tu 'yo' de hace 5 años?",
        "¿Qué es el éxito para vos?",
        "¿Cuál es tu mayor miedo irracional?",
        "¿Qué canción te hace acordar a un momento específico de tu vida?"
    ]
    
    print(f"Cargando {len(lista_profundas)} preguntas PROFUNDAS...")
    
    # OJO: Cambié la colección a 'categorias_preguntas'
    db.collection('categorias_preguntas').document('profundas').set({
        "titulo": "Profundas 🌌",
        "descripcion": "Para conocerse de verdad. Cero careta.",
        "es_premium": False, # Estas suelen ser buen gancho gratis
        "color": "azul_noche", # Un dato extra para el frontend
        "preguntas": lista_profundas
    }, merge=True)

def cargar_juego_votacion():
    lista_probable = [
        "¿Quién es más probable que termine vomitando esta noche?",
        "¿Quién es más probable que pierda el celular o la billetera?",
        "¿Quién es más probable que vuelva con su ex tóxico?",
        "¿Quién es más probable que termine preso por error?",
        "¿Quién es más probable que caiga en una estafa piramidal?",
        "¿Quién es más probable que se haga millonario?",
        "¿Quién es más probable que muera primero en un apocalipsis zombie?",
        "¿Quién es más probable que le escriba a su ex en pedo?",
        "¿Quién es más probable que se case por interés?",
        "¿Quién es más probable que termine viviendo solo con 10 gatos?",
        "¿Quién es más probable que se una a una secta?",
        "¿Quién es más probable que haga una bomba de humo (irse sin saludar)?",
        "¿Quién es más probable que llore esta noche?",
        "¿Quién es más probable que se enamore en la primera cita?",
        "¿Quién es más probable que choque el auto estacionando?",
        "¿Quién es más probable que gane un Reality Show?",
        "¿Quién es más probable que se olvide el nombre de la persona con la que duerme?",
        "¿Quién es más probable que se tropiece caminando en plano?",
        "¿Quién es más probable que renuncie a su trabajo mañana?",
        "¿Quién es más probable que tenga hijos primero?"
    ]
    
    print(f"Cargando {len(lista_probable)} preguntas en JUEGO VOTACIÓN...")
    
    # 🎯 ACÁ ESTÁ EL CAMBIO DE RUTA
    # Colección: configuracion_juegos
    # Documento: votacion
    db.collection('configuracion_juegos').document('votacion').set({
        "titulo": "Quién es más probable... 👉",
        "descripcion": "A la cuenta de 3, señalen al culpable.",
        "reglas": "Se lee la tarjeta, cuenta regresiva y todos señalan a uno.",
        "es_premium": False,
        "color": "verde_toxico",
        "preguntas": lista_probable
    }, merge=True)

def cargar_yo_nunca_gratis():
    # --- MAZO 1: GRATIS (Mix: Joda, Vergüenza y "Ganchos Picantes") ---
    lista_gratis = [
        # Ganchos Picantes (Para que quieran más) 🎣
        "Yo nunca besé a alguien en la primera cita.",
        "Yo nunca tuve un sueño 'raro' con un profesor/a.",
        "Yo nunca me bañé acompañado/a.",
        "Yo nunca mandé una foto en ropa interior (aunque sea 'soft').",
        "Yo nunca chapé con alguien de este grupo.",
        
        # Vergüenza y Vida Cotidiana 🙈
        "Yo nunca me hice un perfil falso para stalkear.",
        "Yo nunca usé el shampoo como jabón porque se había terminado.",
        "Yo nunca fingí estar hablando por teléfono para evitar a alguien.",
        "Yo nunca salí de un grupo de WhatsApp indignado/a.",
        "Yo nunca mentí diciendo que me sentía mal para no salir.",
        "Yo nunca me caí en la calle adelante de todos.",
        "Yo nunca revisé el celular de mi pareja (aunque sea la hora).",
        "Yo nunca dije 'qué rico' y escupí la comida cuando no me veían.",
        "Yo nunca me olvidé de ponerle desodorante y salí igual.",
        "Yo nunca usé la misma ropa interior del revés.",
        "Yo nunca me dormí en el cine.",
        "Yo nunca le di like a una foto de hace 3 años sin querer.",
        "Yo nunca me copié en un examen de la facultad/colegio.",
        "Yo nunca devolví una prenda de ropa usada con la etiqueta puesta.",
        
        # Joda y Alcohol 🍻
        "Yo nunca vomité en la casa de un amigo.",
        "Yo nunca me subí a una mesa o parlante en un boliche.",
        "Yo nunca perdí el celular en una noche de joda.",
        "Yo nunca le escribí a mi ex borracho/a pidiéndole perdón.",
        "Yo nunca me desperté con un moretón y no sé cómo me lo hice.",
        "Yo nunca robé un vaso o cenicero de un bar.",
        "Yo nunca me fui sin pagar (el famoso 'pagadios')."
    ]
    
    print(f"Cargando {len(lista_gratis)} frases YO NUNCA (Gratis + Ganchos)...")
    
    db.collection('mazos').document('yo_nunca_gratis').set({
        "titulo": "Yo Nunca: Previa 🍺",
        "descripcion": "Vergüenza, joda y un toque de picante.",
        "es_premium": False,
        "color": "azul_electrico",
        "frases": lista_gratis
    }, merge=True)

def cargar_yo_nunca_premium():
    # --- MAZO 2: PREMIUM (Hardcore, Sexo y Tabúes) ---
    lista_premium = [
        # Sexo y Lugares Raros 🔥
        "Yo nunca tuve sexo en un auto estacionado.",
        "Yo nunca lo hice en la playa o en el mar.",
        "Yo nunca tuve sexo en el trabajo/facultad.",
        "Yo nunca tuve sexo en la cama de mis padres.",
        "Yo nunca me grabé teniendo sexo.",
        "Yo nunca hice sexting con alguien que no conocía en persona.",
        "Yo nunca fui a un telo con alguien que acababa de conocer.",
        "Yo nunca tuve sexo en un baño público (boliche, bar, avión).",
        
        # Experiencias y Fetiches 😈
        "Yo nunca hice un trío.",
        "Yo nunca usé disfraces en la cama.",
        "Yo nunca me dejé atar o esposar.",
        "Yo nunca fingí un orgasmo para terminar rápido.",
        "Yo nunca tuve sexo anal.",
        "Yo nunca usé juguetes sexuales con otra persona.",
        "Yo nunca tuve un 'amigo con derechos'.",
        "Yo nunca probé comida en el sexo (crema, chocolate, hielo).",
        "Yo nunca tuve sexo con la luz prendida mirándome al espejo.",
        
        # Relaciones Prohibidas 🚫
        "Yo nunca me acosté con la pareja de un amigo/a (Icardiando).",
        "Yo nunca volví con un ex solo por el sexo.",
        "Yo nunca tuve una aventura siendo yo el amante.",
        "Yo nunca tuve sexo con un compañero de trabajo.",
        "Yo nunca tuve sexo con el hermano/a de un amigo/a.",
        "Yo nunca me acosté con alguien 10 años mayor (o menor).",
        "Yo nunca estuve con dos personas diferentes en menos de 24 horas."
    ]
    
    print(f"Cargando {len(lista_premium)} frases YO NUNCA (Premium Recargado)...")
    
    db.collection('mazos').document('yo_nunca_hot').set({
        "titulo": "Yo Nunca: Sin Censura 🔥",
        "descripcion": "Si sos sensible, no entres. Solo +18.",
        "es_premium": True,
        "color": "rojo_sangre",
        "frases": lista_premium
    }, merge=True)

from firebase_admin import firestore # <--- AGREGÁ ESTA IMPORTACIÓN ARRIBA DE TODO SI NO ESTÁ

def agregar_nuevas_yo_nunca():
    # --- SOLO LAS NUEVAS GRATIS ---
    nuevas_gratis = [
        "Yo nunca besé a alguien en la primera cita.",
        "Yo nunca tuve un sueño 'raro' con un profesor/a o jefe/a.",
        "Yo nunca me bañé acompañado/a.",
        "Yo nunca mandé una foto en ropa interior.",
        "Yo nunca chapé con alguien de este grupo.",
        "Yo nunca me imaginé a un amigo/a desnudo/a.",
        "Yo nunca dudé de mi orientación sexual.",
        "Yo nunca borré un chat para que nadie lo lea.",
        "Yo nunca subí una historia a Mejores Amigos solo para que la vea UNA persona.",
        "Yo nunca revisé los 'seguidos' de alguien para ver a quién likeaba.",
        "Yo nunca fingí estar hablando por teléfono para evitar saludar a alguien.",
        "Yo nunca salí de un grupo de WhatsApp indignado/a.",
        "Yo nunca le puse agua al shampoo/detergente para que tire un poco más.",
        "Yo nunca comí directo de la olla para no ensuciar un plato.",
        "Yo nunca usé la misma ropa interior del revés.",
        "Yo nunca devolví una prenda de ropa usada con la etiqueta puesta.",
        "Yo nunca me robé los amenities (shampoo/jabón) de un hotel.",
        "Yo nunca dije 'te hago una transferencia' y no tenía saldo.",
        "Yo nunca me hice el dormido en el bondi para no dar el asiento.",
        "Yo nunca usé el celular en el baño hasta que se me durmieron las piernas.",
        "Yo nunca saludé a alguien pensando que me saludaba a mí y no era.",
        "Yo nunca me caí en la calle adelante de todos.",
        "Yo nunca me olvidé de ponerle desodorante y salí igual.",
        "Yo nunca dije 'qué rico' y escupí la comida cuando no me veían.",
        "Yo nunca me dormí en el cine o en una clase.",
        "Yo nunca mentí en mi CV.",
        "Yo nunca me subí a una mesa o parlante en un boliche.",
        "Yo nunca perdí el celular o la billetera en una noche de joda.",
        "Yo nunca me desperté con un moretón y no sé cómo me lo hice."
    ]

    # --- SOLO LAS NUEVAS PREMIUM ---
    nuevas_premium = [
        "Yo nunca lo hice en la playa, mar o pileta.",
        "Yo nunca tuve sexo en el trabajo/facultad/colegio.",
        "Yo nunca tuve sexo en la cama de mis padres.",
        "Yo nunca tuve sexo en la casa de mis suegros.",
        "Yo nunca tuve sexo al aire libre (bosque, parque, balcón).",
        "Yo nunca lo hice en el piso porque no llegamos a la cama.",
        "Yo nunca hice sexting con alguien que no conocía en persona.",
        "Yo nunca tuve una carpeta oculta con fotos hot en el celular.",
        "Yo nunca miré porno en el trabajo o en una compu ajena.",
        "Yo nunca busqué porno de una categoría muy rara.",
        "Yo nunca usé disfraces o roles en la cama.",
        "Yo nunca me dejé atar o esposar.",
        "Yo nunca fingí un orgasmo para terminar rápido.",
        "Yo nunca tuve sexo anal.",
        "Yo nunca probé comida en el sexo (crema, chocolate, hielo).",
        "Yo nunca tuve sexo con la luz prendida mirándome al espejo.",
        "Yo nunca me toqué pensando en el novio/a de un amigo/a.",
        "Yo nunca tragué.",
        "Yo nunca me acosté con la pareja de un amigo/a (Icardiando).",
        "Yo nunca tuve una aventura siendo yo el amante.",
        "Yo nunca tuve sexo con un compañero de trabajo o jefe.",
        "Yo nunca me acosté con alguien 10 años mayor (o menor).",
        "Yo nunca estuve con dos personas diferentes en menos de 24 horas.",
        "Yo nunca tuve sexo por lástima.",
        "Yo nunca me acosté con alguien solo porque tenía auto o casa sola.",
        "Yo nunca dudé de quién era el padre (o tuve miedo de embarazar a alguien)."
    ]

    print("Agregando preguntas nuevas a la base de datos existente...")

    # 1. Agregamos al mazo GRATIS
    db.collection('mazos').document('yo_nunca_gratis').update({
        'frases': firestore.ArrayUnion(nuevas_gratis)
    })
    
    # 2. Agregamos al mazo PREMIUM
    db.collection('mazos').document('yo_nunca_hot').update({
        'frases': firestore.ArrayUnion(nuevas_premium)
    })

    print("¡Listo! Se agregaron las nuevas sin borrar las viejas. 🚀")

# --- EJECUTAR ---
if __name__ == "__main__":
    # agregar_nuevas_yo_nunca()
    # cargar_animales() 
    # cargar_objetos()
    # cargar_comida()
    # cargar_profesiones()
    
    # Nuevas Premium
    # cargar_picante()
    # cargar_argentina_bizarra()
    # cargar_terror()
    # cargar_preguntas_profundas()
    # cargar_juego_votacion()
    # cargar_yo_nunca_gratis()
    # cargar_yo_nunca_premium()
    
    print("¡Listo! Categorías PREMIUM subidas a Firebase 💸")
