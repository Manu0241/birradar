"use client";
import { useState } from "react";
import { XP_POR_NIVEL, nivelDeXp, tituloNivel } from "@/lib/bares";

export type FilaRanking = { id: string; nombre: string; avatar_url: string; xp: number };

type Props = {
  nombre: string;
  avatar: string;
  xp: number;
  racha: number;
  rachaViva: boolean; // aportó hoy o ayer, la racha sigue
  descubiertos: number;
  ranking: FilaRanking[];
  rankingSemanal: FilaRanking[];
  miId: string;
  onCompartir: () => void;
  onInstalar: (() => void) | null; // null = ya instalada o no se puede desde este navegador
  esAdmin: boolean;
  onSalir: () => void;
  onCerrar: () => void;
};

function Avatar({ src, tam, nombre }: { src: string; tam: number; nombre: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={tam} height={tam} referrerPolicy="no-referrer" className="rounded-full object-cover" style={{ width: tam, height: tam }} />
  ) : (
    <span className="grid place-items-center rounded-full bg-ambar font-extrabold" style={{ width: tam, height: tam, fontSize: tam * 0.42 }}>
      {nombre.slice(0, 1).toUpperCase()}
    </span>
  );
}

export default function Perfil(p: Props) {
  const [vista, setVista] = useState<"yo" | "ranking">("yo");
  const [periodo, setPeriodo] = useState<"semana" | "siempre">("semana");
  const lista = periodo === "semana" ? p.rankingSemanal : p.ranking;
  const diasHastaLunes = ((8 - new Date().getDay()) % 7) || 7;
  const nivel = nivelDeXp(p.xp);
  const enNivel = p.xp % XP_POR_NIVEL;
  const faltan = XP_POR_NIVEL - enNivel;
  // Anillo de progreso alrededor del avatar
  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-tinta/40 backdrop-blur-[2px]" onClick={p.onCerrar}>
      <div onClick={(e) => e.stopPropagation()} className="entra mx-auto max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[32px] bg-zinc-barra px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
        <div className="flex items-center justify-between">
          <div className="flex rounded-full bg-white p-1 ring-1 ring-tinta/10" role="tablist">
            {(["yo", "ranking"] as const).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={vista === v}
                onClick={() => setVista(v)}
                className={`rounded-full px-4 py-2 text-sm font-bold ${vista === v ? "bg-tinta text-white" : "text-tinta/60"}`}
              >
                {v === "yo" ? "Mi perfil" : "Ranking"}
              </button>
            ))}
          </div>
          <button onClick={p.onCerrar} aria-label="Cerrar" className="grid h-10 w-10 place-items-center rounded-full bg-white text-lg font-bold">
            ✕
          </button>
        </div>

        {vista === "yo" ? (
          <div className="mt-6 text-center">
            <div className="relative mx-auto h-[128px] w-[128px]">
              <svg viewBox="0 0 128 128" className="absolute inset-0 -rotate-90" aria-hidden>
                <circle cx="64" cy="64" r={R} fill="none" stroke="rgba(27,26,24,.1)" strokeWidth="8" />
                <circle
                  cx="64"
                  cy="64"
                  r={R}
                  fill="none"
                  stroke="var(--color-ambar)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - enNivel / XP_POR_NIVEL)}
                  className="transition-[stroke-dashoffset] duration-700"
                />
              </svg>
              <div className="absolute inset-[16px] overflow-hidden rounded-full">
                <Avatar src={p.avatar} tam={96} nombre={p.nombre} />
              </div>
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-granate px-3 py-1 text-sm font-extrabold text-white ring-4 ring-zinc-barra">
                Nivel {nivel}
              </span>
            </div>
            <h2 className="mt-5 text-[26px] font-extrabold tracking-[-0.03em]">{p.nombre}</h2>
            <p className="text-[15px] font-semibold text-tinta/55">{tituloNivel(nivel)}</p>
            <p className="mt-2 text-sm text-tinta/60">
              Te faltan <b className="text-tinta">{faltan} XP</b> para el nivel {nivel + 1}
            </p>

            <div className={`mt-5 flex items-center gap-3 rounded-3xl p-4 text-left ${p.rachaViva && p.racha > 0 ? "bg-tinta text-white" : "bg-white ring-1 ring-tinta/10"}`}>
              <span className="text-4xl leading-none" aria-hidden>{p.rachaViva && p.racha > 0 ? "🔥" : "🕯️"}</span>
              <div>
                <p className="text-[19px] font-extrabold leading-tight">
                  {p.rachaViva && p.racha > 0 ? `Racha de ${p.racha} ${p.racha === 1 ? "día" : "días"}` : "Sin racha ahora mismo"}
                </p>
                <p className={`text-[13px] ${p.rachaViva && p.racha > 0 ? "text-white/70" : "text-tinta/60"}`}>
                  Aporta un precio cada día: +1 XP extra por día seguido, hasta +5.
                </p>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-3xl bg-white p-4 ring-1 ring-tinta/10">
                <p className="text-[34px] font-extrabold leading-none tabular-nums">{p.descubiertos}</p>
                <p className="mt-1 text-sm font-semibold text-tinta/55">bares reseñados</p>
              </div>
              <div className="rounded-3xl bg-white p-4 ring-1 ring-tinta/10">
                <p className="text-[34px] font-extrabold leading-none tabular-nums text-granate">{p.xp}</p>
                <p className="mt-1 text-sm font-semibold text-tinta/55">puntos XP</p>
              </div>
            </div>

            <button onClick={p.onCompartir} className="mt-5 w-full rounded-2xl bg-tinta py-4 text-[16px] font-bold text-white">
              Invitar a un amigo
            </button>
            {p.onInstalar && (
              <button onClick={p.onInstalar} className="mt-2 w-full rounded-2xl bg-white py-4 text-[16px] font-bold ring-1 ring-tinta/10">
                Añadir a la pantalla de inicio
              </button>
            )}
            {p.esAdmin && (
              <a href="/admin" className="mt-2 block w-full rounded-2xl bg-ambar py-4 text-center text-[16px] font-bold text-tinta">
                Panel de administración
              </a>
            )}
            <button onClick={p.onSalir} className="mt-2 w-full py-2 text-sm font-semibold text-tinta/50">
              Cerrar sesión
            </button>
          </div>
        ) : (
          <div className="mt-5">
            <div className="grid grid-cols-2 gap-2">
              {(["semana", "siempre"] as const).map((x) => (
                <button
                  key={x}
                  onClick={() => setPeriodo(x)}
                  aria-pressed={periodo === x}
                  className={`rounded-2xl py-2.5 text-sm font-bold ${periodo === x ? "bg-granate text-white" : "bg-white text-tinta/70 ring-1 ring-tinta/10"}`}
                >
                  {x === "semana" ? "Esta semana" : "De siempre"}
                </button>
              ))}
            </div>
            {periodo === "semana" && (
              <p className="mt-2 text-center text-[13px] text-tinta/55">
                Se reinicia el lunes ({diasHastaLunes === 1 ? "mañana" : `en ${diasHastaLunes} días`}). Cualquiera puede ganar.
              </p>
            )}
            {lista.length === 0 && (
              <p className="mt-6 rounded-3xl bg-white p-6 text-center text-[15px] font-semibold ring-1 ring-tinta/10">
                Nadie ha sumado puntos esta semana. Añade un precio y empiezas primero.
              </p>
            )}
          <ol className="mt-3 space-y-2">
            {lista.map((u, i) => {
              const yo = u.id === p.miId;
              return (
                <li key={u.id} className={`flex items-center gap-3 rounded-2xl p-3 ${yo ? "bg-ambar" : "bg-white ring-1 ring-tinta/10"}`}>
                  <span className="w-7 text-center text-lg font-extrabold tabular-nums">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span>
                  <Avatar src={u.avatar_url} tam={40} nombre={u.nombre ?? "?"} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold">{yo ? "Tú" : u.nombre}</span>
                    <span className="block text-[12px] font-semibold text-tinta/55">
                      Nivel {nivelDeXp(u.xp)}, {tituloNivel(nivelDeXp(u.xp)).toLowerCase()}
                    </span>
                  </span>
                  <span className="text-[15px] font-extrabold tabular-nums">{u.xp} XP</span>
                </li>
              );
            })}
          </ol>
          </div>
        )}
      </div>
    </div>
  );
}
