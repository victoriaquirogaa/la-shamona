import random
import string

def generar_codigo_sala():
    # ascii_letters incluye minúsculas (a-z) y mayúsculas (A-Z) + dígitos
    caracteres = string.ascii_letters + string.digits
    
    # Generamos 6 caracteres aleatorios
    codigo = ''.join(random.choices(caracteres, k=6)) 
    
    return codigo