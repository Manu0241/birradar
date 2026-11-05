import { ImageResponse } from "next/og";
import { ImagenSocial, TAM_SOCIAL, fuentesSocial } from "@/lib/imagenSocial";
import { nombreBonito, obtenerBarPorSlug } from "@/lib/datos";
import { euros } from "@/lib/bares";

export const alt = "Precio de la caña en este bar, en Birradar";
export const size = TAM_SOCIAL;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await obtenerBarPorSlug(slug);
  const bar = r?.bar;
  return new ImageResponse(
    bar ? (
      <ImagenSocial
        precio={euros(bar.precioDesde)}
        titulo={nombreBonito(bar.nombre)}
        subtitulo={bar.tapa !== "No" ? "Con tapa. Mira todos los precios en Birradar." : "Mira todos los precios en Birradar."}
      />
    ) : (
      <ImagenSocial precio="?" titulo="Bar no encontrado" subtitulo="Busca otros bares en Birradar." />
    ),
    { ...size, fonts: await fuentesSocial() }
  );
}
