import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { distanciaKm, euros, haceCuanto, textoDistancia } from "@/lib/bares";
import { infoMarca } from "@/lib/marcas";
import { nombreBonito, obtenerBarPorSlug, slugBar, urlBar } from "@/lib/datos";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

const textoTapa = (t: string) => (t === "Contundente" ? "con tapa de verdad" : t === "Simple" ? "con algo de picar" : "sin tapa");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await obtenerBarPorSlug(slug);
  if (!r?.bar) return { title: "Bar no encontrado · Birradar" };
  const b = r.bar;
  const nombre = nombreBonito(b.nombre);
  const titulo = `Precio de la caña en ${nombre}: desde ${euros(b.precioDesde)} € · Birradar`;
  const descripcion = `${b.precios.map((p) => `${p.formato} a ${euros(p.precio)} €`).join(", ")}, ${textoTapa(b.tapa)}. Precios actualizados por la gente que va al bar.`;
  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: urlBar(b) },
    openGraph: { title: `${nombre}: caña desde ${euros(b.precioDesde)} €`, description: descripcion, url: urlBar(b), type: "website" },
  };
}

export default async function PaginaBar({ params }: Props) {
  const { slug } = await params;
  const r = await obtenerBarPorSlug(slug);
  if (!r?.bar) notFound();
  const { bar, todos } = r;
  const nombre = nombreBonito(bar.nombre);
  const cercanos = todos
    .filter((b) => b.id !== bar.id)
    .map((b) => ({ ...b, km: distanciaKm([bar.latitud, bar.longitud], [b.latitud, b.longitud]) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 5);

  const precios = bar.precios.map((p) => p.precio);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    name: nombre,
    url: urlBar(bar),
    geo: { "@type": "GeoCoordinates", latitude: bar.latitud, longitude: bar.longitud },
    priceRange: `${euros(Math.min(...precios))} € - ${euros(Math.max(...precios))} €`,
    servesCuisine: "Tapas",
  };

  return (
    <main className="mx-auto min-h-[100dvh] max-w-2xl bg-white px-5 pb-16 pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="flex items-center justify-between">
        <Link href="/" className="text-2xl font-extrabold tracking-[-0.04em] text-granate">
          Birradar
        </Link>
        <Link href="/canas-baratas" className="text-sm font-semibold text-tinta/60 underline underline-offset-2">
          Cañas más baratas
        </Link>
      </nav>

      <h1 className="mt-8 text-[40px] font-extrabold leading-[1.05] tracking-[-0.04em]">Precio de la caña en {nombre}</h1>
      <p className="mt-3 text-[17px] text-tinta/65">
        Desde <b className="text-tinta">{euros(bar.precioDesde)} €</b>, {textoTapa(bar.tapa)}
        {bar.terraza === true ? " y con terraza" : ""}. Último precio aportado {haceCuanto(bar.ultimaFecha)}.
      </p>

      <section aria-label="Carta de precios" className="mt-6 rounded-3xl bg-tinta p-5 text-white">
        {bar.precios.map((p) => {
          const m = infoMarca(p.marca);
          return (
            <div key={p.formato} className="flex items-center justify-between gap-3 border-b border-white/10 py-3 last:border-0">
              <div>
                <h2 className="text-xl font-bold">{p.formato}</h2>
                <p className="flex items-center gap-1.5 text-sm text-white/60">
                  <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
                  {m.nombre}, {textoTapa(p.tapa)}
                </p>
              </div>
              <p className="text-[34px] font-extrabold tabular-nums tracking-[-0.04em] text-ambar">{euros(p.precio)} €</p>
            </div>
          );
        })}
      </section>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Link href={`/?bar=${bar.id}`} className="rounded-2xl bg-granate py-4 text-center text-[16px] font-bold text-white">
          Ver en el mapa y actualizar precio
        </Link>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${bar.latitud},${bar.longitud}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl bg-zinc-barra py-4 text-center text-[16px] font-bold"
        >
          Cómo llegar
        </a>
      </div>

      <p className="mt-6 text-[15px] leading-relaxed text-tinta/65">
        Estos precios los ponen las personas que van a {nombre} con Birradar. Mostramos el precio que más se repite en las últimas
        aportaciones de cada tamaño, así que si ha cambiado, entra y actualízalo.
      </p>

      {cercanos.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold tracking-[-0.03em]">Otros bares cerca de {nombre}</h2>
          <ul className="mt-3 divide-y divide-tinta/10">
            {cercanos.map((b) => (
              <li key={b.id}>
                <Link href={`/bar/${slugBar(b)}`} className="flex items-center justify-between gap-3 py-3">
                  <span className="text-[17px] font-bold">{nombreBonito(b.nombre)}</span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[17px] font-extrabold tabular-nums text-granate">{euros(b.precioDesde)} €</span>
                    <span className="block text-[13px] text-tinta/50">a {textoDistancia(b.km)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
