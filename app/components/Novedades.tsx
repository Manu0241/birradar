"use client";
import { useState } from "react";
import type { Novedad } from "@/lib/novedades";

/** Ventana de novedades: mismo estilo que el tutorial, una novedad por paso. */
export default function Novedades({ novedades, onCerrar }: { novedades: Novedad[]; onCerrar: () => void }) {
  const [paso, setPaso] = useState(0);
  const n = novedades[paso];
  const ultimo = paso === novedades.length - 1;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-tinta/60 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-label="Novedades de Birradar">
      <div key={n.id} className="entra w-full max-w-sm rounded-[32px] bg-white p-7">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-granate px-3 py-1 text-[13px] font-bold text-white">Novedades</span>
          {novedades.length > 1 && (
            <span className="text-[13px] font-semibold text-tinta/50">
              {paso + 1} de {novedades.length}
            </span>
          )}
        </div>
        <span className="posavasos mt-5 h-20 w-20 text-4xl">
          <span className="relative z-10">{n.icono}</span>
        </span>
        <h2 className="mt-5 text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em]">{n.titulo}</h2>
        <p className="mt-3 text-[16px] leading-relaxed text-tinta/65">{n.texto}</p>

        <div className="mt-7 flex items-center justify-between">
          <div className="flex gap-1.5" aria-hidden>
            {novedades.length > 1 &&
              novedades.map((_, i) => <span key={i} className={`h-2 rounded-full transition-all ${i === paso ? "w-6 bg-granate" : "w-2 bg-tinta/15"}`} />)}
          </div>
          <div className="flex items-center gap-2">
            {!ultimo && (
              <button onClick={onCerrar} className="px-3 py-2 text-sm font-semibold text-tinta/50">
                Cerrar
              </button>
            )}
            <button onClick={() => (ultimo ? onCerrar() : setPaso(paso + 1))} className="rounded-full bg-granate px-6 py-3 text-[15px] font-bold text-white">
              {ultimo ? "¡Entendido!" : "Siguiente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
