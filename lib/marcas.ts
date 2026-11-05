// Marcas de cerveza. El `id` es el texto que se guarda en la base de datos
// (no cambiarlo para las marcas que ya existen o se perderían las reseñas antiguas).
export type Marca = { id: string; nombre: string; color: string };

export const MARCAS: Marca[] = [
  { id: "🔴 Mahou", nombre: "Mahou", color: "#D52B1E" },
  { id: "⭐️ E. Galicia", nombre: "Estrella Galicia", color: "#B5121B" },
  { id: "⚫ 1906", nombre: "1906", color: "#7A1E1E" },
  { id: "🟢 Cruzcampo", nombre: "Cruzcampo", color: "#E3A21A" },
  { id: "⭐ E. Damm", nombre: "Estrella Damm", color: "#0B3D91" },
  { id: "🦁 San Miguel", nombre: "San Miguel", color: "#8C6A2F" },
  { id: "🌍 Heineken", nombre: "Heineken", color: "#00843D" },
  { id: "🏁 Amstel", nombre: "Amstel", color: "#A6192E" },
  { id: "⛵️ Alhambra", nombre: "Alhambra", color: "#1E6B52" },
  { id: "🔵 Victoria", nombre: "Victoria", color: "#1F4E9C" },
  { id: "🟡 Ámbar", nombre: "Ámbar", color: "#D98E04" },
  { id: "🦅 Águila", nombre: "Águila", color: "#7A5C2E" },
  { id: "☀️ Sol", nombre: "Sol", color: "#E8B923" },
  { id: "🦌 Jäger/Radler", nombre: "Radler", color: "#5A9E3D" },
  { id: "🍀 Guinness", nombre: "Guinness", color: "#1B1A18" },
  { id: "🐐 Artesanal/Otra", nombre: "Artesanal u otra", color: "#6D4C8E" },
];

export function infoMarca(id: string): Marca {
  return (
    MARCAS.find((m) => m.id === id) ?? {
      id,
      nombre: id.replace(/^[^\p{L}]+/u, "").trim() || "Sin marca",
      color: "#9AA0A6",
    }
  );
}

/**
 * Marcas ordenadas por popularidad: cuántas reseñas tiene cada una
 * (las reseñas cercanas cuentan el doble). Si hay empate o pocos datos,
 * manda el orden por defecto, que ya va de más a menos popular en España.
 */
export function marcasPorPopularidad(
  conteo: { marca: string; cerca: boolean }[]
): Marca[] {
  const puntos: Record<string, number> = {};
  for (const r of conteo) puntos[r.marca] = (puntos[r.marca] ?? 0) + (r.cerca ? 2 : 1);
  return [...MARCAS].sort((a, b) => {
    const diff = (puntos[b.id] ?? 0) - (puntos[a.id] ?? 0);
    return diff !== 0 ? diff : MARCAS.indexOf(a) - MARCAS.indexOf(b);
  });
}
