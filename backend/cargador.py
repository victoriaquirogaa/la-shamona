import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from google.cloud.firestore import ArrayUnion

# 1. Tu conexión (usá tu archivo json real)
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred) # Descomentá si hace falta inicializar
db = firestore.client()

# Estas son para calentar motores sin ser +18 explícito.
frases_gratis = [
    "Yo nunca besé a dos personas en la misma noche.",
    "Yo nunca le mandé una foto 'subida de tono' a la persona equivocada.",
    "Yo nunca me bañé desnudo/a en una piscina o el mar con amigos.",
    "Yo nunca tuve un sueño húmedo con alguien que conozco.",
    "Yo nunca salí sin ropa interior a la calle.",
    "Yo nunca me besé con un amigo/a 'jugando'.",
    "Yo nunca usé Tinder u otra app solo para subirme el ego.",
    "Yo nunca me desperté en la cama de un desconocido/a después de una fiesta.",
    "Yo nunca le hice un baile sexy a alguien (aunque fuera en joda).",
    "Yo nunca me sentí atraído/a por el padre o madre de un amigo/a.",
    "Yo nunca espié a alguien mientras se cambiaba.",
    "Yo nunca dije el nombre de mi ex por error en un momento inoportuno.",
    "Yo nunca tuve una marca (chupón) en el cuello y mentí sobre cómo me la hice.",
    "Yo nunca me saqué fotos desnudo/a frente al espejo (aunque las borrara después).",
    "Yo nunca dudé de mi orientación sexual.",
    "Yo nunca me besé con alguien del mismo sexo.",
    "Yo nunca estuve en una playa nudista.",
    "Yo nunca me toqué (masturbé) pensando en alguien de este grupo.",
    "Yo nunca le fui infiel a alguien 'con el pensamiento'.",
    "Yo nunca me probé la ropa interior de mi pareja.",
    "Yo nunca busqué porno en el celular de un amigo/a para ver qué miraba.",
    "Yo nunca tuve sexo telefónico (solo audio).",
    "Yo nunca le di un beso negro a la botella (o a alguien).",
    "Yo nunca me dejé lamer alguna parte del cuerpo (cuello, oreja) en público.",
    "Yo nunca dije que era virgen cuando ya no lo era."
]

# --- LISTA 2: YO NUNCA HOT 🔥 (Premium / +18 Fuerte) ---
# Acá vamos directo a los bifes.
frases_hot = [
    "Yo nunca tuve sexo con los padres de alguien cerca (en la otra habitación).",
    "Yo nunca usé comida (crema, chocolate, hielo) durante el sexo.",
    "Yo nunca me grabé teniendo sexo y lo vi después.",
    "Yo nunca fui a un club de striptease o un lugar swinger.",
    "Yo nunca tuve sexo en un auto en movimiento.",
    "Yo nunca hice un '69'.",
    "Yo nunca tuve sexo con alguien cuyo nombre no sabía.",
    "Yo nunca me disfracé de enfermera/o, policía o escolar para tener sexo.",
    "Yo nunca me dejé atar o esposar en la cama.",
    "Yo nunca tuve sexo anal y me gustó.",
    "Yo nunca tuve un orgasmo múltiple.",
    "Yo nunca lo hice en un baño de un avión, tren o colectivo.",
    "Yo nunca tuve sexo con más de una persona el mismo día (separadas).",
    "Yo nunca tuve una relación de 'amigos con derechos' que terminó mal.",
    "Yo nunca me acosté con el/la jefe/a o un superior.",
    "Yo nunca me masturbé en una videollamada.",
    "Yo nunca tuve sexo en el cine.",
    "Yo nunca le pedí a mi pareja que se ponga una máscara o me tape los ojos.",
    "Yo nunca tuve sexo con la regla y manché las sábanas.",
    "Yo nunca me tragué el semen de mi pareja.",
    "Yo nunca dejé que me hicieran sexo oral mientras manejaba.",
    "Yo nunca tuve sexo en la casa de un amigo durante una fiesta.",
    "Yo nunca usé un dildo o vibrador con otra persona.",
    "Yo nunca tuve sexo al aire libre a plena luz del día.",
    "Yo nunca me excité viendo a mi pareja tener sexo con otra persona (voyeur)."
]

# --- CARGA A FIRESTORE ---

# 1. Cargar Gratis
ref_gratis = db.collection("mazos").document("yo_nunca_gratis")
ref_gratis.update({
    "frases": ArrayUnion(frases_gratis)
})
print(f"✅ Se agregaron {len(frases_gratis)} frases al mazo GRATIS.")

# 2. Cargar Hot
ref_hot = db.collection("mazos").document("yo_nunca_hot")
ref_hot.update({
    "frases": ArrayUnion(frases_hot)
})
print(f"🔥 Se agregaron {len(frases_hot)} frases al mazo HOT (Premium).")