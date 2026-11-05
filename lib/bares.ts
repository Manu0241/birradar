export type Coordenadas = [number, number];

export type Resena = {
  id: string;
  precio: number;
  marca: string;
  formato: string;
  tapa: string;
  user_id: string | null;
  fecha: string;
};

export type BarDB = {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
  resenas: Resena[] | null;
};

export type Tapa = "No" | "Simple" | "Contundente";

export type PrecioFormato = {
  formato: string;
  precio: number;
  marca: string;
  tapa: Tapa;
  confirmaciones: number; // cuántas de las últimas reseñas coinciden en este precio
  fecha: string; // última vez que alguien lo reportó
};

export type Bar = {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
  precios: PrecioFormato[];
  precioDesde: number;
  marca: string;
  tapa: Tapa;
  numResenas: number;
  ultimaFecha: string;
  chollo: boolean;
  precioViejo: boolean; // más de 90 días sin actualizar: actualizarlo da el doble de XP
  rey: { userId: string; aportaciones: number } | null; // quien más precios ha aportado aquí
  distanciaKm: number | null;
};

export const DIAS_PRECIO_VIEJO = 90;

export const FORMATOS = ["Caña", "Doble", "Tercio"] as const;
export const XP_POR_NIVEL = 30;

const ordenFormato = (f: string) => {
  const i = (FORMATOS as readonly string[]).indexOf(f);
  return i === -1 ? 99 : i;
};

const comoTapa = (t: string): Tapa =>
  t === "Contundente" || t === "Simple" ? t : "No";

/** El valor que más se repite; si hay empate gana el más reciente (la lista viene de más nuevo a más viejo). */
function moda<T>(valores: T[]): { valor: T; veces: number } {
  const veces = new Map<T, number>();
  for (const v of valores) veces.set(v, (veces.get(v) ?? 0) + 1);
  let mejor = valores[0];
  for (const v of valores) if ((veces.get(v) ?? 0) > (veces.get(mejor) ?? 0)) mejor = v;
  return { valor: mejor, veces: veces.get(mejor) ?? 0 };
}

export function distanciaKm(a: Coordenadas, b: Coordenadas) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/**
 * Convierte los bares de la base de datos en lo que muestra la app.
 * Precio por consenso: de las últimas 5 reseñas de cada tamaño se queda
 * con el precio que más se repite (en empate, el más reciente).
 */
export function procesarBares(datos: BarDB[], desde: Coordenadas | null): Bar[] {
  const bares = datos
    .map((b) => {
      const resenas = [...(b.resenas ?? [])].sort((x, y) => y.fecha.localeCompare(x.fecha));
      const porFormato: Record<string, Resena[]> = {};
      for (const r of resenas) (porFormato[r.formato] ??= []).push(r);

      const precios: PrecioFormato[] = Object.entries(porFormato)
        .map(([formato, lista]) => {
          const ultimas = lista.slice(0, 5);
          const { valor, veces } = moda(ultimas.map((r) => Math.round(r.precio * 100) / 100));
          return {
            formato,
            precio: valor,
            marca: moda(ultimas.map((r) => r.marca)).valor,
            tapa: comoTapa(ultimas[0].tapa),
            confirmaciones: veces,
            fecha: ultimas[0].fecha,
          };
        })
        .sort((a, b) => ordenFormato(a.formato) - ordenFormato(b.formato));

      const tapas = precios.map((p) => p.tapa);
      const porUsuario: Record<string, number> = {};
      for (const r of resenas) if (r.user_id) porUsuario[r.user_id] = (porUsuario[r.user_id] ?? 0) + 1;
      const [reyId, reyCuenta] = Object.entries(porUsuario).sort((a, b) => b[1] - a[1])[0] ?? [];
      const ultimaFecha = resenas[0]?.fecha ?? "";
      return {
        id: b.id,
        nombre: b.nombre.trim(),
        latitud: b.latitud,
        longitud: b.longitud,
        precios,
        precioDesde: precios.length ? Math.min(...precios.map((p) => p.precio)) : 0,
        marca: resenas.length ? moda(resenas.slice(0, 10).map((r) => r.marca)).valor : "",
        tapa: (tapas.includes("Contundente") ? "Contundente" : tapas.includes("Simple") ? "Simple" : "No") as Tapa,
        numResenas: resenas.length,
        ultimaFecha,
        chollo: false,
        precioViejo: !!ultimaFecha && Date.now() - fechaMs(ultimaFecha) > DIAS_PRECIO_VIEJO * 86_400_000,
        rey: reyId && reyCuenta >= 2 ? { userId: reyId, aportaciones: reyCuenta } : null,
        distanciaKm: desde ? distanciaKm(desde, [b.latitud, b.longitud]) : null,
      };
    })
    .filter((b) => b.precios.length > 0);

  // Chollo: al menos un 15 % más barato que la mediana de la zona (si hay datos suficientes)
  if (bares.length >= 4) {
    const ordenados = bares.map((b) => b.precioDesde).sort((a, b) => a - b);
    const mediana = ordenados[Math.floor(ordenados.length / 2)];
    for (const b of bares) b.chollo = b.precioDesde <= mediana * 0.85;
  }
  return bares;
}

export const euros = (n: number) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function textoDistancia(km: number | null) {
  if (km === null) return "";
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace(".", ",")} km`;
}

// Las fechas de Supabase vienen en UTC, a veces sin zona horaria
export const fechaMs = (fecha: string) => Date.parse(/Z$|[+-]\d\d:?\d\d$/.test(fecha) ? fecha : fecha + "Z");

export function haceCuanto(fecha: string) {
  if (!fecha) return "";
  const dias = Math.floor((Date.now() - fechaMs(fecha)) / 86_400_000);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 14) return `hace ${dias} días`;
  if (dias < 60) return `hace ${Math.floor(dias / 7)} semanas`;
  if (dias < 365) return `hace ${Math.floor(dias / 30)} meses`;
  return "hace más de un año";
}

export const nivelDeXp = (xp: number) => Math.floor(Math.max(xp, 0) / XP_POR_NIVEL) + 1;

export function tituloNivel(nivel: number) {
  if (nivel >= 10) return "Maestro cervecero";
  if (nivel >= 5) return "Cazador de tapas";
  if (nivel >= 2) return "Explorador";
  return "Principiante";
}
