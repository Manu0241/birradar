import type { MetadataRoute } from "next";
import { URL_BASE, obtenerBares, urlBar } from "@/lib/datos";
import { fechaMs } from "@/lib/bares";

export const revalidate = 3600; // se regenera como mucho una vez por hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const bares = await obtenerBares();
  const ultima = bares.reduce((m, b) => Math.max(m, b.ultimaFecha ? fechaMs(b.ultimaFecha) : 0), 0);
  return [
    { url: URL_BASE, changeFrequency: "daily", priority: 1 },
    { url: `${URL_BASE}/canas-baratas`, lastModified: ultima ? new Date(ultima) : undefined, changeFrequency: "daily", priority: 0.9 },
    ...bares.map((b) => ({
      url: urlBar(b),
      lastModified: b.ultimaFecha ? new Date(fechaMs(b.ultimaFecha)) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
