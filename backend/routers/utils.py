import random
import string

def generar_codigo_sala(largo=6):
    """
    Genera un código aleatorio de letras mayúsculas y números.
    Ejemplo: 'A4X9' o 'BEER'
    """
    # Usamos solo letras mayúsculas y dígitos para que sea fácil de leer
    caracteres = string.ascii_uppercase + string.digits
    
    # Excluimos caracteres confusos (Opcional, pero recomendado)
    # Por ejemplo, la 'I' y el '1', la 'O' y el '0'.
    caracteres = caracteres.replace("O", "").replace("0", "").replace("I", "").replace("1", "")
    
    codigo = ''.join(random.choice(caracteres) for _ in range(largo))
    return codigo