// Lectura de datos en el servidor (para las páginas que indexa Google)
import { supabase } from "./supabase";
import { type Bar, type BarDB, procesarBares } from "./bares";

export const URL_BASE = "https://birradar.vercel.app";

export async function obtenerBares(): Promise<Bar[]> {
  const { data, error } = await supabase
    .from("bares")
    .select("id, nombre, latitud, longitud, resenas ( id, precio, marca, formato, tapa, user_id, fecha )");
  if (error) {
    console.error(error);
    return [];
  }
  return procesarBares((data ?? []) as BarDB[], null);
}

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function slugBar(bar: { id: string; nombre: string }) {
  const nombre = bar.nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${nombre || "bar"}-${bar.id}`;
}

export const urlBar = (bar: { id: string; nombre: string }) => `${URL_BASE}/bar/${slugBar(bar)}`;

export async function obtenerBarPorSlug(slug: string) {
  const id = slug.match(UUID)?.[0];
  if (!id) return null;
  const bares = await obtenerBares();
  return { bar: bares.find((b) => b.id === id) ?? null, todos: bares };
}

export const nombreBonito = (n: string) => n.charAt(0).toUpperCase() + n.slice(1);
