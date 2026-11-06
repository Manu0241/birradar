"use client";
import type { Bar, Coordenadas } from "@/lib/bares";
import { euros, haceCuanto, textoDistancia, urlComoLlegar } from "@/lib/bares";
import { infoMarca } from "@/lib/marcas";
import type { User } from "@supabase/supabase-js";
import { iconoTapa } from "./ListaBares";
import NotasBar from "./NotasBar";

export type Rey = { nombre: string; avatar: string; aportaciones: number; soyYo: boolean };

type Props = {
  bar: Bar;
  origen: Coordenadas | null; // dónde está la persona, para la ruta de «Cómo llegar»
  rey: Rey | null;
  puedeActualizar: boolean;
  onActualizar: () => void;
  onCompartir: () => void;
  onCerrar: () => void;
  usuario: User | null;
  onEntrar: () => void;
  avisar: (texto: string) => void;
};

export default function FichaBar({ bar, origen, rey, puedeActualizar, onActualizar, onCompartir, onCerrar, usuario, onEntrar, avisar }: Props) {

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
          {bar.terraza !== null && (
            <p className={`mt-2 inline-block rounded-full px-3 py-1 text-[13px] font-bold ${bar.terraza ? "bg-ambar text-tinta" : "bg-zinc-barra text-tinta/60"}`}>
              {bar.terraza ? "🌞 Tiene terraza" : "Sin terraza"}
            </p>
          )}
        </div>
        <button onClick={onCerrar} aria-label="Volver a la lista" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-barra text-lg font-bold">
          ✕
        </button>
      </div>

      {bar.precioViejo && (
        <p className="mt-3 rounded-2xl bg-ambar px-4 py-2.5 text-sm font-semibold">
          Este precio lleva más de 3 meses sin revisar. Si lo actualizas ganas 10 XP en vez de 5.
        </p>
      )}

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
                  <span>
                    {marca.nombre}
                    {p.confirmaciones >= 2 && <span className="text-ambar">, confirmado por {p.confirmaciones}</span>}
                  </span>
                </p>
              </div>
              <p className="text-[30px] font-extrabold tabular-nums tracking-[-0.04em] text-ambar">{euros(p.precio)} €</p>
            </div>
          );
        })}
      </div>

      {rey && (
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-zinc-barra p-3">
          {rey.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={rey.avatar} alt="" referrerPolicy="no-referrer" className="h-11 w-11 rounded-full object-cover ring-2 ring-ambar" />
          ) : (
            <span className="grid h-11 w-11 place-items-center rounded-full bg-ambar text-lg font-extrabold">{rey.nombre.slice(0, 1)}</span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold">
              <span aria-hidden>👑 </span>
              {rey.soyYo ? "Eres el rey de este bar" : `${rey.nombre}, rey del bar`}
            </p>
            <p className="text-[13px] text-tinta/60">
              {rey.aportaciones} precios aportados aquí{!rey.soyYo && ". Aporta más y quítale la corona."}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <a
          href={urlComoLlegar(bar.latitud, bar.longitud, origen)}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl bg-white py-3.5 text-center text-[15px] font-bold ring-1 ring-tinta/10"
        >
          Cómo llegar
        </a>
        <button onClick={onCompartir} className="rounded-2xl bg-white py-3.5 text-[15px] font-bold ring-1 ring-tinta/10">
          Compartir tarjeta
        </button>
      </div>

      <button
        onClick={onActualizar}
        disabled={!puedeActualizar}
        className="mt-2 w-full rounded-2xl bg-granate py-4 text-[16px] font-bold text-white disabled:bg-tinta/15 disabled:text-tinta/50"
      >
        {puedeActualizar ? "Actualizar precio" : "Acércate al bar para actualizar el precio"}
      </button>

      <NotasBar barId={bar.id} usuario={usuario} onEntrar={onEntrar} avisar={avisar} />
    </div>
  );
}
