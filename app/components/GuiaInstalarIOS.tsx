"use client";

/** Icono de Compartir de iOS (cuadrado con flecha hacia arriba). */
function IconoCompartir({ tam = 28 }: { tam?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={tam} height={tam} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v12" />
      <path d="M7.5 7.5 12 3l4.5 4.5" />
      <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}

function IconoAnadir() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#1b1a18" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

/**
 * En iPhone/iPad ninguna web puede añadirse sola a la pantalla de inicio (Apple no lo permite),
 * así que señalamos con una flecha el botón Compartir y enseñamos la opción exacta que hay que tocar.
 */
export default function GuiaInstalarIOS({ arriba, onCerrar }: { arriba: boolean; onCerrar: () => void }) {
  return (
    <div className="fixed inset-0 z-[95] bg-tinta/75 backdrop-blur-[2px]" onClick={onCerrar} role="dialog" aria-label="Cómo añadir Birradar a la pantalla de inicio">
      {/* Flecha que apunta al botón Compartir del navegador */}
      <div className={`absolute flex flex-col items-center ${arriba ? "right-5 top-3" : "bottom-3 left-1/2 -translate-x-1/2"}`}>
        {arriba && <Flecha arriba />}
        <span className="mt-1 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-tinta shadow-lg">
          <span className="inline-flex items-center gap-1.5">
            Pulsa <IconoCompartir tam={20} />
          </span>
        </span>
        {!arriba && <Flecha />}
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className={`entra absolute left-1/2 w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 rounded-[28px] bg-white p-6 ${arriba ? "top-28" : "top-[18%]"}`}
      >
        <h2 className="text-[24px] font-extrabold leading-tight tracking-[-0.03em]">Añade Birradar a tu pantalla de inicio</h2>
        <ol className="mt-4 space-y-3 text-[15px]">
          <li className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-barra">
              <IconoCompartir />
            </span>
            <span>
              Pulsa <b>Compartir</b> {arriba ? "arriba a la derecha" : "abajo, en la barra de Safari"}.
            </span>
          </li>
          <li className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-barra">
              <IconoAnadir />
            </span>
            <span>
              Baja y toca <b>«Añadir a pantalla de inicio»</b>.
            </span>
          </li>
          <li className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-barra text-[15px] font-extrabold text-blue-700">OK</span>
            <span>
              Pulsa <b>Añadir</b>. Te saldrá el icono como una app más.
            </span>
          </li>
        </ol>
        <button onClick={onCerrar} className="mt-5 w-full rounded-2xl bg-granate py-3.5 text-[16px] font-bold text-white">
          Entendido
        </button>
      </div>
    </div>
  );
}

function Flecha({ arriba = false }: { arriba?: boolean }) {
  return (
    <svg viewBox="0 0 40 70" width="40" height="70" className={`animate-bounce ${arriba ? "rotate-180" : ""}`} aria-hidden>
      <path d="M20 4v54" stroke="#f4a81d" strokeWidth="6" strokeLinecap="round" />
      <path d="M6 44l14 16 14-16" fill="none" stroke="#f4a81d" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
