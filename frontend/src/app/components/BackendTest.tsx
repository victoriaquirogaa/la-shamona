import { useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

type Status = 'idle' | 'loading' | 'ok' | 'error';

function statusLabel(status: Status): string {
  switch (status) {
    case 'idle':
      return 'Listo';
    case 'loading':
      return 'Probando...';
    case 'ok':
      return 'Conectado';
    case 'error':
      return 'Error';
  }
}

export function BackendTest({ onBack }: { onBack: () => void }) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('Presioná el botón para probar la conexión.');

  const badgeVariant = useMemo(() => {
    if (status === 'ok') return 'default';
    if (status === 'error') return 'destructive';
    return 'secondary';
  }, [status]);

  const test = async () => {
    try {
      setStatus('loading');
      setMessage('Conectando con el backend...');

      const res = await fetch('http://127.0.0.1:8000/', {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as { mensaje?: string };

      setStatus('ok');
      setMessage(data?.mensaje ? `✅ ${data.mensaje}` : '✅ Respuesta OK del backend.');
    } catch (err) {
      setStatus('error');
      setMessage('❌ No se pudo conectar con el backend. Verificá que esté corriendo en http://127.0.0.1:8000/.');
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl text-white">Prueba de Backend</h1>
          <Button variant="secondary" className="rounded-2xl" onClick={onBack}>
            Volver al menú
          </Button>
        </div>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Estado
              <Badge variant={badgeVariant as any}>{statusLabel(status)}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Este test consulta el endpoint raíz del backend. Si tu backend corre en otro host/puerto, ajustá la URL en el componente.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={test}
                disabled={status === 'loading'}
                className="rounded-2xl"
              >
                Probar conexión
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStatus('idle');
                  setMessage('Presioná el botón para probar la conexión.');
                }}
                className="rounded-2xl"
              >
                Reset
              </Button>
            </div>

            <div className="mt-6">
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-sm whitespace-pre-wrap">{message}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-white/70 text-xs mt-4">
          Nota: si el navegador bloquea la solicitud por CORS, habilitá CORS en el backend para el origen del frontend (por ejemplo, http://localhost:5173).
        </p>
      </div>
    </div>
  );
}
