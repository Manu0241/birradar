import type { Metadata } from "next";
import Link from "next/link";
import { euros, haceCuanto } from "@/lib/bares";
import { infoMarca } from "@/lib/marcas";
import { URL_BASE, nombreBonito, obtenerBares, slugBar } from "@/lib/datos";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Cañas baratas en Madrid: ranking de precios por bar · Birradar",
  description:
    "Dónde tomar la caña más barata en Madrid. Precios de caña, doble y tercio en cada bar, con tapa o sin ella, actualizados por la gente.",
  alternates: { canonical: `${URL_BASE}/canas-baratas` },
};

export default async function CanasBaratas() {
  const bares = (await obtenerBares()).sort((a, b) => a.precioDesde - b.precioDesde);
  const canas = bares.flatMap((b) => b.precios.filter((p) => p.formato === "Caña").map((p) => p.precio)).sort((a, b) => a - b);
  const mediana = canas.length ? canas[Math.floor(canas.length / 2)] : null;
  const conTapa = bares.filter((b) => b.tapa !== "No").length;

  const preguntas = [
    mediana !== null && {
      p: "¿Cuánto cuesta una caña en Madrid?",
      r: `En los bares de Birradar la caña cuesta ${euros(mediana)} € de mediana, y la más barata está a ${euros(canas[0])} €. Los precios los actualiza la gente que va a cada bar.`,
    },
    {
      p: "¿En qué bares de Madrid ponen tapa con la caña?",
      r: `De los ${bares.length} bares con precios en Birradar, ${conTapa} ponen tapa con la bebida. En la lista de esta página verás cuáles.`,
    },
    {
      p: "¿Cómo sé si el precio está actualizado?",
      r: "Cada bar muestra cuándo se aportó el último precio. Si ves uno desactualizado, entra en Birradar desde el bar y corrígelo: ganarás puntos para el ranking.",
    },
  ].filter(Boolean) as { p: string; r: string }[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: preguntas.map((q) => ({ "@type": "Question", name: q.p, acceptedAnswer: { "@type": "Answer", text: q.r } })),
  };

  return (
    <main className="mx-auto min-h-[100dvh] max-w-2xl bg-white px-5 pb-16 pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav>
        <Link href="/" className="text-2xl font-extrabold tracking-[-0.04em] text-granate">
          Birradar
        </Link>
      </nav>

      <h1 className="mt-8 text-[40px] font-extrabold leading-[1.05] tracking-[-0.04em]">Las cañas más baratas de Madrid</h1>
      <p className="mt-3 text-[17px] leading-relaxed text-tinta/65">
        Ranking de bares por precio de la cerveza, de más barata a más cara. Lo actualiza la gente que va a cada bar con Birradar.
      </p>

      <ol className="mt-6 divide-y divide-tinta/10">
        {bares.map((b, i) => {
          const m = infoMarca(b.marca);
          return (
            <li key={b.id}>
              <Link href={`/bar/${slugBar(b)}`} className="flex items-center gap-4 py-4">
                <span className="w-7 text-center text-lg font-extrabold tabular-nums text-tinta/40">{i + 1}</span>
                <span className="posavasos h-14 w-14 shrink-0 text-[15px]" data-chollo={b.chollo}>
                  <span className="relative z-10">{euros(b.precioDesde)}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[18px] font-bold">{nombreBonito(b.nombre)}</span>
                  <span className="block text-[14px] text-tinta/55">
                    {m.nombre}
                    {b.tapa !== "No" ? ", con tapa" : ""}, actualizado {haceCuanto(b.ultimaFecha)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <Link href="/" className="mt-6 block rounded-2xl bg-granate py-4 text-center text-[16px] font-bold text-white">
        Abrir el mapa y añadir un bar
      </Link>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em]">Preguntas frecuentes</h2>
        {preguntas.map((q) => (
          <div key={q.p} className="mt-5">
            <h3 className="text-[18px] font-bold">{q.p}</h3>
            <p className="mt-1 text-[16px] leading-relaxed text-tinta/65">{q.r}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
