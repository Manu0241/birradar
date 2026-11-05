import { ImageResponse } from "next/og";
import { ImagenSocial, TAM_SOCIAL } from "@/lib/imagenSocial";

export const alt = "Birradar: lo que cuesta la caña en los bares de tu zona";
export const size = TAM_SOCIAL;
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <ImagenSocial precio="?" titulo="¿Cuánto cuesta la caña aquí?" subtitulo="Precios de cañas y tapas, bar a bar, puestos por la gente." />,
    size
  );
}
