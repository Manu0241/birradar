"use client";
import type { Bar } from "@/lib/bares";
import { euros, haceCuanto, textoDistancia } from "@/lib/bares";
import { infoMarca, type Marca } from "@/lib/marcas";

export type Orden = "cerca" | "barato" | "tapa";

type Props = {
  bares: Bar[];
  orden: Orden;
  onOrden: (o: Orden) => void;
  marcasTop: Marca[];
  filtroMarca: string | null;
  onFiltroMarca: (m: string | null) => void;
  busqueda: string;
  onBusqueda: (t: string) => void;
  onElegirBar: (bar: Bar) => void;
  hayUbicacion: boolean;
  onAnadir: () => void;
};

const ORDENES: { id: Orden; texto: string }[] = [
  { id: "cerca", texto: "Cerca" },
  { id: "barato", texto: "Más baratas" },
  { id: "tapa", texto: "Con tapa" },
];

export const iconoTapa = (t: string) => (t === "Contundente" ? "🍲" : t === "Simple" ? "🫒" : "");

export default function ListaBares(p: Props) {
  const titulo =
    p.orden === "barato" ? "Las cañas más baratas" : p.orden === "tapa" ? "Donde te ponen tapa" : p.hayUbicacion ? "Cañas cerca de ti" : "Cañas en la zona";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 px-5">
        <h2 className="text-[26px] font-extrabold leading-tight tracking-[-0.03em]">{titulo}</h2>
        <span className="shrink-0 text-sm font-semibold text-tinta/50">{p.bares.length} bares</span>
      </div>

      <div className="mt-3 px-5">
        <label className="relative block">
          <span className="sr-only">Buscar un bar</span>
          <input
            type="search"
            placeholder="Buscar un bar por nombre"
            value={p.busqueda}
            onChange={(e) => p.onBusqueda(e.target.value)}
            className="w-full rounded-2xl border-0 bg-zinc-barra px-4 py-3 text-[15px] font-medium outline-none placeholder:text-tinta/40 focus:ring-2 focus:ring-ambar"
          />
        </label>
      </div>

      {/* Orden */}
      <div className="mt-3 flex gap-2 px-5" role="tablist" aria-label="Ordenar bares">
        {ORDENES.map((o) => (
          <button
            key={o.id}
            role="tab"
            aria-selected={p.orden === o.id}
            onClick={() => p.onOrden(o.id)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              p.orden === o.id ? "bg-tinta text-white" : "bg-white text-tinta/70 ring-1 ring-tinta/10"
            }`}
          >
            {o.texto}
          </button>
        ))}
      </div>

      {/* Marcas populares como filtro rápido */}
      <div className="sin-scrollbar mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
        {p.marcasTop.map((m) => {
          const activa = p.filtroMarca === m.id;
          return (
            <button
              key={m.id}
              onClick={() => p.onFiltroMarca(activa ? null : m.id)}
              aria-pressed={activa}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                activa ? "bg-granate text-white" : "bg-white text-tinta/80 ring-1 ring-tinta/10"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full ring-2 ring-white/70" style={{ background: m.color }} />
              {m.nombre}
            </button>
          );
        })}
      </div>

      <ul className="mt-3 divide-y divide-tinta/[0.06] px-3">
        {p.bares.map((bar) => {
          const marca = infoMarca(bar.marca);
          return (
            <li key={bar.id}>
              <button onClick={() => p.onElegirBar(bar)} className="flex w-full items-center gap-4 rounded-2xl px-2 py-3 text-left active:bg-zinc-barra">
                <span className="posavasos h-14 w-14 shrink-0 text-[15px]" data-chollo={bar.chollo}>
                  <span className="relative z-10">{euros(bar.precioDesde)}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[17px] font-bold capitalize tracking-[-0.01em]">{bar.nombre}</span>
                    {bar.chollo && <span className="shrink-0 rounded-md bg-granate px-1.5 py-0.5 text-[11px] font-bold text-white">Chollo</span>}
                    {bar.precioViejo && <span className="shrink-0 rounded-md bg-ambar px-1.5 py-0.5 text-[11px] font-bold">XP doble</span>}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-tinta/60">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: marca.color }} />
                    <span className="truncate">
                      {marca.nombre}
                      {iconoTapa(bar.tapa) && <span className="ml-1.5">{iconoTapa(bar.tapa)} tapa</span>}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[15px] font-bold text-blue-700">{textoDistancia(bar.distanciaKm)}</span>
                  <span className="block text-[12px] text-tinta/45">{haceCuanto(bar.ultimaFecha)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <a href="/canas-baratas" className="mx-5 mt-4 block rounded-2xl bg-zinc-barra px-4 py-3 text-center text-sm font-bold text-tinta/70">
        Ver el ranking de cañas más baratas
      </a>

      {p.bares.length === 0 && (
        <div className="mx-5 mt-4 rounded-3xl bg-zinc-barra p-6 text-center">
          <p className="text-lg font-bold">No hay bares con estos filtros</p>
          <p className="mt-1 text-sm text-tinta/60">¿Conoces uno por aquí? Añade su precio y serás el primero.</p>
          <button onClick={p.onAnadir} className="mt-4 rounded-full bg-granate px-5 py-2.5 text-sm font-bold text-white">
            Añadir precio
          </button>
        </div>
      )}
    </div>
  );
}
