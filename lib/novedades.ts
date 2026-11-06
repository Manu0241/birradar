// Novedades que se anuncian al abrir la app.
// Para anunciar algo nuevo: añade una entrada al FINAL con el siguiente id.
// Cada persona ve solo las que tengan un id mayor que la última que vio.
export type Novedad = { id: number; fecha: string; icono: string; titulo: string; texto: string };

export const NOVEDADES: Novedad[] = [
  { id: 1, fecha: "2026-11-05", icono: "🍺", titulo: "Birradar estrena diseño", texto: "Cada bar es un posavasos con su precio. Toca uno para ver su pizarra de precios y si ponen tapa." },
  { id: 2, fecha: "2026-11-05", icono: "🏆", titulo: "Ranking semanal y rachas", texto: "El ranking se reinicia cada lunes. Y si aportas varios días seguidos, ganas XP extra." },
  { id: 3, fecha: "2026-11-05", icono: "👑", titulo: "El rey del bar", texto: "Quien más precios pone en un bar se lleva la corona en su ficha. ¿Se la quitas?" },
  { id: 4, fecha: "2026-11-05", icono: "🌞", titulo: "Terrazas", texto: "Al añadir un precio puedes decir si tiene terraza. Y en la lista, filtra solo los bares con terraza." },
  { id: 5, fecha: "2026-11-05", icono: "🍾", titulo: "Botellín, Victoria y 1906", texto: "Nuevo tamaño botellín y dos marcas más para elegir al poner un precio." },
  { id: 6, fecha: "2026-11-05", icono: "📲", titulo: "Tenla en tu pantalla de inicio", texto: "Desde tu perfil puedes añadir Birradar como una app más, sin descargar nada." },
  { id: 7, fecha: "2026-11-06", icono: "✉️", titulo: "Entra con tu correo", texto: "Ya no hace falta Google: crea tu cuenta con correo y contraseña y verifícala con un código." },
];

export const ULTIMA_NOVEDAD = NOVEDADES.reduce((m, n) => Math.max(m, n.id), 0);
