"use client";
import { useState } from "react";
import { Map, Overlay } from "pigeon-maps";
import type { Bar, Coordenadas, Tapa } from "@/lib/bares";
import { FORMATOS, euros } from "@/lib/bares";
import type { Marca } from "@/lib/marcas";
import { proveedor } from "./Mapa";

export type DatosPrecio = { nombre: string; marca: string; formato: string; precio: number; tapa: Tapa; terraza: boolean | null };

type Props = {
  bar: Bar | null; // null = bar nuevo
  ubicacion: Coordenadas; // donde está la persona (y donde se coloca un bar nuevo)
  precision: number | null; // margen del GPS en metros
  marcasOrdenadas: Marca[]; // de más a menos popular por la zona
  enviando: boolean;
  onEnviar: (d: DatosPrecio) => void;
  onEsOtroBar: () => void;
  onCerrar: () => void;
};

const TAPAS: { id: Tapa; icono: string; texto: string }[] = [
  { id: "No", icono: "—", texto: "Sin tapa" },
  { id: "Simple", icono: "🫒", texto: "Algo pequeño" },
  { id: "Contundente", icono: "🍲", texto: "Tapa de verdad" },
];

const RAPIDOS = [1.5, 2, 2.5, 3];
const PRECISION_MAXIMA = 200; // con más margen que esto no dejamos crear un bar (p. ej. desde el ordenador de casa)

const textoMargen = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1).replace(".", ",")} km`);

export default function FormularioPrecio({ bar, ubicacion, precision, marcasOrdenadas, enviando, onEnviar, onEsOtroBar, onCerrar }: Props) {
  const inicial = bar?.precios.find((p) => p.formato === "Caña") ?? bar?.precios[0];
  const [nombre, setNombre] = useState(bar?.nombre ?? "");
  const [formato, setFormato] = useState<string>(inicial?.formato ?? "Caña");
  const [marca, setMarca] = useState(bar?.marca ?? "");
  const [precio, setPrecio] = useState(inicial?.precio ?? 2);
  const [tapa, setTapa] = useState<Tapa | "">(inicial?.tapa ?? "");
  const [verTodas, setVerTodas] = useState(false);
  const [terraza, setTerraza] = useState<boolean | null>(bar?.terraza ?? null);
  const [estoyDentro, setEstoyDentro] = useState(false);
  const imprecisa = !bar && precision !== null && precision > PRECISION_MAXIMA;
  const ubicacionOk = !!bar || (estoyDentro && !imprecisa);

  const precioActual = bar?.precios.find((p) => p.formato === formato);
  const elegirFormato = (f: string) => {
    setFormato(f);
    const p = bar?.precios.find((x) => x.formato === f);
    if (p) setPrecio(p.precio);
  };
  const ajustar = (d: number) => setPrecio((p) => Math.min(15, Math.max(0.5, Math.round((p + d) * 100) / 100)));

  const populares = marcasOrdenadas.slice(0, 6);
  const resto = marcasOrdenadas.slice(6);
  const marcaEnResto = resto.some((m) => m.id === marca);
  const listo = nombre.trim().length > 1 && marca && formato && tapa && ubicacionOk && !enviando;

  const BotonMarca = ({ m }: { m: Marca }) => (
    <button
      type="button"
      onClick={() => setMarca(m.id)}
      aria-pressed={marca === m.id}
      className={`flex items-center gap-2.5 rounded-2xl px-3 py-3 text-left text-[15px] font-bold transition-colors ${
        marca === m.id ? "bg-tinta text-white" : "bg-white ring-1 ring-tinta/10"
      }`}
    >
      <span className="h-4 w-4 shrink-0 rounded-full ring-2 ring-white" style={{ background: m.color }} />
      <span className="truncate">{m.nombre}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-tinta/40 backdrop-blur-[2px]" onClick={onCerrar}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (listo) onEnviar({ nombre: nombre.trim(), marca, formato, precio, tapa: tapa as Tapa, terraza });
        }}
        className="entra mx-auto flex max-h-[94dvh] w-full max-w-md flex-col rounded-t-[32px] bg-zinc-barra"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            <h2 className="text-[26px] font-extrabold leading-tight tracking-[-0.03em]">
              {bar ? `Precio en ${bar.nombre}` : "Bar nuevo"}
            </h2>
            <p className="text-sm text-tinta/60">
              {bar ? `Confirma o corrige lo que cuesta hoy. +${bar.precioViejo ? 10 : 5} XP` : "Lo colocamos donde estás ahora. +10 XP"}
            </p>
            {bar && (
              <button type="button" onClick={onEsOtroBar} className="mt-1 text-sm font-semibold text-granate underline underline-offset-2">
                No estoy en este bar
              </button>
            )}
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-lg font-bold">
            ✕
          </button>
        </div>

        <div className="mt-4 flex-1 space-y-6 overflow-y-auto px-5 pb-4">
          {!bar && (
            <section className="rounded-3xl bg-granate p-4 text-white" aria-labelledby="aviso-sitio">
              <p id="aviso-sitio" className="text-[19px] font-extrabold leading-tight tracking-[-0.02em]">
                📍 Tienes que estar dentro del bar
              </p>
              <p className="mt-1.5 text-[14px] leading-snug text-white/85">
                El bar se coloca en el mapa <b className="text-white">justo donde estás ahora</b>. Si lo añades desde casa, aparecerá en tu casa y
                nadie podrá encontrarlo.
              </p>
              <div className="mt-3 overflow-hidden rounded-2xl bg-white/10">
                <Map provider={proveedor} dprs={[1, 2]} center={ubicacion} zoom={17} height={130} mouseEvents={false} touchEvents={false} attribution={false}>
                  <Overlay anchor={ubicacion} offset={[14, 34]}>
                    <span className="block text-[30px] leading-none drop-shadow" aria-hidden>
                      📍
                    </span>
                  </Overlay>
                </Map>
              </div>
              <p className="mt-1.5 text-[12px] text-white/75">
                Aquí quedará el bar{precision !== null ? ` (margen de ${textoMargen(precision)})` : ""}.
              </p>
              {imprecisa ? (
                <p role="alert" className="mt-3 rounded-2xl bg-white px-3 py-2.5 text-[14px] font-semibold leading-snug text-granate">
                  Tu ubicación no es precisa (margen de {textoMargen(precision!)}). Para añadir un bar nuevo abre Birradar en el móvil, dentro del bar y
                  con el GPS activado.
                </p>
              ) : (
                <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-2xl bg-white px-3 py-3 text-[15px] font-bold text-tinta">
                  <input
                    type="checkbox"
                    checked={estoyDentro}
                    onChange={(e) => setEstoyDentro(e.target.checked)}
                    className="h-6 w-6 shrink-0 accent-[#8B0000]"
                  />
                  Estoy dentro del bar ahora mismo
                </label>
              )}
            </section>
          )}

          {!bar && (
            <label className="block">
              <span className="mb-2 block text-[15px] font-bold">Nombre del bar</span>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Bar Casa Pepe"
                maxLength={60}
                className="w-full rounded-2xl border-0 bg-white px-4 py-3.5 text-[17px] font-semibold outline-none ring-1 ring-tinta/10 focus:ring-2 focus:ring-ambar"
              />
            </label>
          )}

          <fieldset>
            <legend className="mb-2 text-[15px] font-bold">Tamaño</legend>
            <div className="grid grid-cols-4 gap-2">
              {FORMATOS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => elegirFormato(f)}
                  aria-pressed={formato === f}
                  className={`rounded-2xl px-1 py-3 text-[14px] font-bold ${formato === f ? "bg-tinta text-white" : "bg-white ring-1 ring-tinta/10"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Precio: lo más importante, el más grande */}
          <fieldset className="rounded-3xl bg-white p-4 ring-1 ring-tinta/10">
            <legend className="sr-only">Precio</legend>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => ajustar(-0.1)} aria-label="Bajar 10 céntimos" className="grid h-14 w-14 place-items-center rounded-full bg-zinc-barra text-3xl font-bold active:scale-95">
                −
              </button>
              <div className="text-center">
                <p className="text-[52px] font-extrabold leading-none tabular-nums tracking-[-0.05em]">{euros(precio)}</p>
                <p className="mt-1 text-sm font-semibold text-tinta/50">
                  {precioActual ? `Ahora pone ${euros(precioActual.precio)} €` : "euros"}
                </p>
              </div>
              <button type="button" onClick={() => ajustar(0.1)} aria-label="Subir 10 céntimos" className="grid h-14 w-14 place-items-center rounded-full bg-zinc-barra text-3xl font-bold active:scale-95">
                +
              </button>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {RAPIDOS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setPrecio(r)}
                  className={`rounded-xl py-2 text-sm font-bold tabular-nums ${precio === r ? "bg-ambar" : "bg-zinc-barra"}`}
                >
                  {euros(r)}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[15px] font-bold">Cerveza</legend>
            <p className="-mt-1 mb-2 text-[13px] text-tinta/55">Las que más se piden por aquí</p>
            <div className="grid grid-cols-2 gap-2">
              {populares.map((m) => (
                <BotonMarca key={m.id} m={m} />
              ))}
              {(verTodas || marcaEnResto) && resto.map((m) => <BotonMarca key={m.id} m={m} />)}
            </div>
            {!verTodas && !marcaEnResto && (
              <button type="button" onClick={() => setVerTodas(true)} className="mt-2 w-full rounded-2xl py-2.5 text-sm font-bold text-granate">
                Ver todas las marcas ({resto.length} más)
              </button>
            )}
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[15px] font-bold">¿Te ponen tapa?</legend>
            <div className="grid grid-cols-3 gap-2">
              {TAPAS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTapa(t.id)}
                  aria-pressed={tapa === t.id}
                  className={`flex flex-col items-center gap-1 rounded-2xl py-3 ${tapa === t.id ? "bg-ambar" : "bg-white ring-1 ring-tinta/10"}`}
                >
                  <span className="text-2xl leading-none">{t.icono}</span>
                  <span className="text-[13px] font-bold">{t.texto}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[15px] font-bold">¿Tiene terraza?</legend>
            <div className="grid grid-cols-2 gap-2">
              {([true, false] as const).map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setTerraza(terraza === v ? null : v)}
                  aria-pressed={terraza === v}
                  className={`rounded-2xl py-3 text-[15px] font-bold ${terraza === v ? "bg-ambar" : "bg-white ring-1 ring-tinta/10"}`}
                >
                  {v ? "🌞 Sí" : "No"}
                </button>
              ))}
            </div>
          </fieldset>
        </div>


        <div className="border-t border-tinta/10 bg-zinc-barra px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <button type="submit" disabled={!listo} className="w-full rounded-2xl bg-granate py-4 text-[17px] font-bold text-white disabled:bg-tinta/15 disabled:text-tinta/45">
            {enviando ? "Guardando…" : !ubicacionOk ? (imprecisa ? "Ubicación poco precisa" : "Confirma que estás en el bar") : "Guardar precio"}
          </button>
        </div>
      </form>
    </div>
  );
}
