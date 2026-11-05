"use client";
import type { Bar } from "@/lib/bares";
import { euros, haceCuanto, textoDistancia } from "@/lib/bares";
import { infoMarca } from "@/lib/marcas";
import { iconoTapa } from "./ListaBares";

type Props = {
  bar: Bar;
  puedeActualizar: boolean;
  onActualizar: () => void;
  onCerrar: () => void;
};

export default function FichaBar({ bar, puedeActualizar, onActualizar, onCerrar }: Props) {
  const compartir = async () => {
    const texto = `${bar.nombre}: caña desde ${euros(bar.precioDesde)} € en Birradar`;
    const url = "https://birradar.vercel.app/";
    try {
      if (navigator.share) await navigator.share({ title: "Birradar", text: texto, url });
      else window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${texto} ${url}`)}`, "_blank");
    } catch {}
  };

  return (
    <div className="entra px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[28px] font-extrabold capitalize leading-tight tracking-[-0.03em]">{bar.nombre}</h2>
          <p className="mt-1 text-sm text-tinta/60">
            {textoDistancia(bar.distanciaKm) && <span className="font-semibold text-blue-700">A {textoDistancia(bar.distanciaKm)}</span>}
            {textoDistancia(bar.distanciaKm) && " de ti, "}
            actualizado {haceCuanto(bar.ultimaFecha)}
          </p>
        </div>
        <button onClick={onCerrar} aria-label="Volver a la lista" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-barra text-lg font-bold">
          ✕
        </button>
      </div>

      {bar.chollo && (
        <p className="mt-3 rounded-2xl bg-granate px-4 py-2.5 text-sm font-semibold text-white">
          Chollo: de los más baratos de la zona.
        </p>
      )}

      {/* Pizarra de precios */}
      <div className="mt-4 rounded-3xl bg-tinta p-4 text-white">
        {bar.precios.map((p) => {
          const marca = infoMarca(p.marca);
          return (
            <div key={p.formato} className="flex items-center justify-between gap-3 border-b border-white/10 py-3 last:border-0">
              <div className="min-w-0">
                <p className="text-lg font-bold">
                  {p.formato} {iconoTapa(p.tapa)}
                </p>
                <p className="flex items-center gap-1.5 text-[13px] text-white/60">
                  <span className="h-2 w-2 rounded-full" style={{ background: marca.color }} />
                  {marca.nombre}
                  {p.confirmaciones >= 2 && <span className="text-ambar">, confirmado por {p.confirmaciones}</span>}
                </p>
              </div>
              <p className="text-[30px] font-extrabold tabular-nums tracking-[-0.04em] text-ambar">{euros(p.precio)} €</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${bar.latitud},${bar.longitud}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl bg-white py-3.5 text-center text-[15px] font-bold ring-1 ring-tinta/10"
        >
          Cómo llegar
        </a>
        <button onClick={compartir} className="rounded-2xl bg-white py-3.5 text-[15px] font-bold ring-1 ring-tinta/10">
          Compartir
        </button>
      </div>

      <button
        onClick={onActualizar}
        disabled={!puedeActualizar}
        className="mt-2 w-full rounded-2xl bg-granate py-4 text-[16px] font-bold text-white disabled:bg-tinta/15 disabled:text-tinta/50"
      >
        {puedeActualizar ? "Actualizar precio" : "Acércate al bar para actualizar el precio"}
      </button>
    </div>
  );
}
