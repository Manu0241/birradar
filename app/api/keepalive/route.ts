import { supabase } from '@/lib/supabase'

// Nunca cachear: cada llamada tiene que llegar de verdad a Supabase
export const dynamic = 'force-dynamic'

// Vercel Cron llama a esta ruta una vez al día (ver vercel.json).
// Hace consultas pequeñas a la base de datos para que Supabase
// vea actividad y no pause el proyecto por inactividad.
export async function GET(request: Request) {
  // Si defines CRON_SECRET en Vercel, solo el cron puede llamar a esta ruta
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const tablas = ['bares', 'resenas', 'perfiles'] as const
  const resultados: Record<string, number | string> = {}

  for (const tabla of tablas) {
    const { count, error } = await supabase
      .from(tabla)
      .select('*', { count: 'exact', head: true })
    resultados[tabla] = error ? `error: ${error.message}` : count ?? 0
  }

  const ok = Object.values(resultados).every((v) => typeof v === 'number')
  return Response.json(
    { ok, fecha: new Date().toISOString(), resultados },
    { status: ok ? 200 : 500 }
  )
}
