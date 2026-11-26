import type { Metadata } from "next";
import { Anton, Oswald, Space_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { URL_BASE, nombreBonito, obtenerBarPorSlug } from "@/lib/datos";
import { svgQR } from "@/lib/qr";
import BotonImprimir from "./BotonImprimir";

// Cartel A4 para pegar en el bar: "¿Cuánto cuesta la caña aquí?" con un QR que abre el bar en Birradar.
// Lo abre el administrador desde la ficha del bar y lo imprime o lo guarda como PDF.

const anton = Anton({ subsets: ["latin"], weight: "400", display: "block" });
const oswald = Oswald({ subsets: ["latin"], weight: ["500", "700"], display: "block" });
const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], display: "block" });

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Cartel para el bar · Birradar",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

const VERDE = "#25312B";
const AMARILLO = "#F4C542";
const CREMA = "#EFEBE0";
const TINTA = "#1B1A18";
const PAPEL = "#FFFDF7";

// Bordes de ticket en zigzag (450 px de ancho, dientes de 10 px)
const dientes = (arriba: boolean) =>
  `M0 ${arriba ? 14 : 0} ` +
  Array.from({ length: 45 }, (_, i) => `L ${(i + 1) * 10} ${(i % 2 === 0) === arriba ? 0 : 14}`).join(" ") +
  ` L 450 ${arriba ? 14 : 0} Z`;

export default async function CartelBar({ params }: Props) {
  const { slug } = await params;
  const r = await obtenerBarPorSlug(slug);
  if (!r?.bar) notFound();
  const { bar } = r;
  const nombre = nombreBonito(bar.nombre).toUpperCase();
  const tamNombre = nombre.length > 26 ? 22 : nombre.length > 18 ? 25 : 30;
  const qr = svgQR(`${URL_BASE}/?bar=${bar.id}`, TINTA);

  return (
    <div className="cartel-pagina">
      <style>{`
        @page { size: A4; margin: 0; }
        .cartel-pagina { min-height: 100dvh; background: #3a3a37; padding: 24px 16px 48px; box-sizing: border-box; }
        .cartel-barra { max-width: 794px; margin: 0 auto 20px; display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap; color: #fff; font-family: system-ui, sans-serif; }
        .cartel-hoja { width: 794px; height: 1123px; margin: 0 auto; box-shadow: 0 20px 50px rgba(0,0,0,0.45); overflow: hidden; }
        @media print {
          html, body { background: #fff !important; margin: 0 !important; height: 297mm; overflow: hidden; }
          .cartel-pagina { padding: 0; background: none; min-height: 0; }
          .cartel-barra { display: none; }
          .cartel-hoja { width: 210mm; height: 297mm; box-shadow: none; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="cartel-barra">
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.4 }}>
          Cartel de <b>{nombreBonito(bar.nombre)}</b>. Imprímelo en A4 a color, o guárdalo como PDF.
        </p>
        <BotonImprimir />
      </div>

      <div className={`cartel-hoja ${oswald.className}`} style={{ boxSizing: "border-box", padding: 40, background: VERDE, color: CREMA }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
            border: `6px solid ${AMARILLO}`,
            outline: `2px solid ${AMARILLO}`,
            outlineOffset: -16,
            padding: "36px 44px 30px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <p className={anton.className} style={{ margin: 0, fontSize: 124, lineHeight: 0.95, letterSpacing: 6, color: AMARILLO }}>
              BIRRADAR
            </p>
            <p style={{ margin: "4px 0 10px", fontSize: 22, fontWeight: 700, letterSpacing: 8 }}>★ PRESENTA ★</p>
            <p className={anton.className} style={{ margin: 0, fontSize: 62, lineHeight: 1.02 }}>
              ¿CUÁNTO CUESTA LA <span style={{ color: AMARILLO }}>CAÑA</span> AQUÍ?
            </p>
          </div>

          <div style={{ width: 450, transform: "rotate(-1.5deg)", filter: "drop-shadow(0 14px 18px rgba(0,0,0,0.45))" }}>
            <svg aria-hidden="true" width="450" height="14" viewBox="0 0 450 14" style={{ display: "block" }}>
              <path d={dientes(true)} fill={PAPEL} />
            </svg>
            <div
              className={mono.className}
              style={{ background: PAPEL, padding: "20px 34px 22px", display: "flex", flexDirection: "column", gap: 8, fontSize: 24, lineHeight: 1.3, color: TINTA }}
            >
              <p style={{ margin: 0, fontSize: tamNombre, fontWeight: 700, lineHeight: 1.2 }}>{nombre}</p>
              <p style={{ margin: 0, color: "#6E675E" }}>----------------------</p>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>1 x CAÑA</span>
                <span style={{ fontWeight: 700 }}>¿? €</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, fontWeight: 700 }}>
                <span>TOTAL</span>
                <span style={{ color: "#A3201A" }}>¡SORPRESA!</span>
              </div>
              <p style={{ margin: 0, color: "#6E675E" }}>----------------------</p>
              <svg
                role="img"
                aria-label={`Código QR que abre ${nombreBonito(bar.nombre)} en Birradar`}
                width="196"
                height="196"
                viewBox={`0 0 ${qr.tam} ${qr.tam}`}
                shapeRendering="crispEdges"
                style={{ display: "block", margin: "4px auto 0" }}
              >
                <path d={qr.d} fill={qr.color} />
              </svg>
              <p style={{ margin: 0, fontWeight: 700 }}>ESCANEA · MIRA · APUNTA</p>
            </div>
            <svg aria-hidden="true" width="450" height="14" viewBox="0 0 450 14" style={{ display: "block" }}>
              <path d={dientes(false)} fill={PAPEL} />
            </svg>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 500, color: "#C9C3B4" }}>Con la colaboración de toda la gente del barrio</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 500, letterSpacing: 2, color: "#C9C3B4" }}>BIRRADAR.ES · SOLO PARA MAYORES DE 18</p>
          </div>
        </div>
      </div>
    </div>
  );
}
