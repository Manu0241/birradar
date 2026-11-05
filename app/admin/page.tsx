"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { euros, fechaMs, haceCuanto } from "@/lib/bares";
import { infoMarca } from "@/lib/marcas";

type ResenaPanel = {
  id: string;
  precio: number;
  formato: string;
  marca: string;
  tapa: string;
  terraza: boolean | null;
  fecha: string;
  xp_ganado: number | null;
  user_id: string | null;
  id_bar: string;
};
type BarPanel = { id: string; nombre: string; latitud: number; longitud: number; resenas: { id: string; fecha: string }[] };
type Estado = "cargando" | "sin-sesion" | "sin-permiso" | "listo";

const SIETE_DIAS = 7 * 86_400_000;

export default function Panel() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [usuario, setUsuario] = useState<User | null>(null);
  const [vista, setVista] = useState<"precios" | "bares">("precios");
  const [resenas, setResenas] = useState<ResenaPanel[]>([]);
  const [bares, setBares] = useState<BarPanel[]>([]);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [usuarios, setUsuarios] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [confirmar, setConfirmar] = useState<string | null>(null); // id pendiente de confirmar borrado
  const [editando, setEditando] = useState<{ id: string; nombre: string } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const avisar = (t: string) => {
    setAviso(t);
    setTimeout(() => setAviso(null), 3000);
  };

  const cargar = useCallback(async () => {
    const [r, b, p] = await Promise.all([
      supabase
        .from("resenas")
        .select("id, precio, formato, marca, tapa, terraza, fecha, xp_ganado, user_id, id_bar")
        .order("fecha", { ascending: false })
        .limit(300),
      supabase.from("bares").select("id, nombre, latitud, longitud, resenas ( id, fecha )"),
      supabase.from("perfiles").select("id, nombre"),
    ]);
    if (r.data) setResenas(r.data as ResenaPanel[]);
    if (b.data) setBares(b.data as BarPanel[]);
    if (p.data) {
      setUsuarios(p.data.length);
      setNombres(Object.fromEntries(p.data.map((x) => [x.id, x.nombre ?? "Sin nombre"])));
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUsuario(u);
      if (!u) return setEstado("sin-sesion");
      const { data } = await supabase.rpc("es_admin");
      if (data !== true) return setEstado("sin-permiso");
      await cargar();
      setEstado("listo");
    });
  }, [cargar]);

  const nombreBar = useMemo(() => Object.fromEntries(bares.map((b) => [b.id, b.nombre])), [bares]);

  const stats = useMemo(() => {
    const hace7 = Date.now() - SIETE_DIAS;
    const recientes = resenas.filter((r) => fechaMs(r.fecha) > hace7);
    return {
      bares: bares.length,
      precios: bares.reduce((n, b) => n + b.resenas.length, 0),
      usuarios,
      semana: recientes.length,
      activos: new Set(recientes.map((r) => r.user_id).filter(Boolean)).size,
    };
  }, [bares, resenas, usuarios]);

  const texto = busqueda.trim().toLowerCase();
  const resenasVisibles = resenas.filter(
    (r) => !texto || (nombreBar[r.id_bar] ?? "").toLowerCase().includes(texto) || (nombres[r.user_id ?? ""] ?? "").toLowerCase().includes(texto)
  );
  const baresVisibles = bares
    .filter((b) => !texto || b.nombre.toLowerCase().includes(texto))
    .sort((a, b) => (b.resenas[0]?.fecha ?? "").localeCompare(a.resenas[0]?.fecha ?? ""));

  // Posibles duplicados: bares con el mismo nombre (sin mayúsculas ni espacios)
  const duplicados = useMemo(() => {
    const vistos: Record<string, number> = {};
    for (const b of bares) {
      const k = b.nombre.trim().toLowerCase();
      vistos[k] = (vistos[k] ?? 0) + 1;
    }
    return new Set(Object.keys(vistos).filter((k) => vistos[k] > 1));
  }, [bares]);

  const accion = async (fn: string, args: Record<string, string>, ok: string) => {
    setOcupado(true);
    const { error } = await supabase.rpc(fn, args);
    setOcupado(false);
    setConfirmar(null);
    setEditando(null);
    if (error) return avisar(`No se pudo: ${error.message}`);
    avisar(ok);
    await cargar();
  };

  if (estado !== "listo") {
    const textos: Record<Exclude<Estado, "listo">, string> = {
      cargando: "Cargando el panel…",
      "sin-sesion": "Entra en Birradar con tu cuenta para ver el panel.",
      "sin-permiso": "Esta cuenta no tiene acceso al panel.",
    };
    return (
      <main className="mx-auto grid min-h-[100dvh] max-w-md place-items-center p-6 text-center">
        <div>
          <p className="text-2xl font-extrabold tracking-[-0.03em]">{textos[estado]}</p>
          {estado !== "cargando" && (
            <Link href="/" className="mt-4 inline-block rounded-full bg-granate px-5 py-3 font-bold text-white">
              Volver a Birradar
            </Link>
          )}
          {estado === "sin-permiso" && usuario?.email && <p className="mt-3 text-sm text-tinta/60">Has entrado como {usuario.email}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[100dvh] max-w-2xl px-4 pb-16 pt-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-tinta/55">Birradar</p>
          <h1 className="text-[32px] font-extrabold leading-tight tracking-[-0.04em]">Tu panel</h1>
        </div>
        <Link href="/" className="rounded-full bg-white px-4 py-2 text-sm font-bold ring-1 ring-tinta/10">
          Ir a la app
        </Link>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Resumen">
        {[
          [stats.bares, "bares"],
          [stats.precios, "precios"],
          [stats.usuarios, "usuarios"],
          [stats.semana, `precios en 7 días (${stats.activos} personas)`],
        ].map(([n, t]) => (
          <div key={String(t)} className="rounded-3xl bg-white p-4 ring-1 ring-tinta/10">
            <p className="text-[30px] font-extrabold leading-none tabular-nums">{n}</p>
            <p className="mt-1 text-[13px] font-semibold text-tinta/55">{t}</p>
          </div>
        ))}
      </section>

      <div className="mt-5 flex gap-2">
        {(["precios", "bares"] as const).map((v) => (
          <button
            key={v}
            onClick={() => {
              setVista(v);
              setConfirmar(null);
            }}
            aria-pressed={vista === v}
            className={`rounded-full px-4 py-2 text-sm font-bold ${vista === v ? "bg-tinta text-white" : "bg-white text-tinta/70 ring-1 ring-tinta/10"}`}
          >
            {v === "precios" ? "Últimos precios" : `Bares${duplicados.size ? ` (${duplicados.size} repetidos)` : ""}`}
          </button>
        ))}
      </div>
      <label className="mt-3 block">
        <span className="sr-only">Buscar</span>
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={vista === "precios" ? "Buscar por bar o persona" : "Buscar bar"}
          className="w-full rounded-2xl border-0 bg-white px-4 py-3 text-[15px] outline-none ring-1 ring-tinta/10 focus:ring-2 focus:ring-ambar"
        />
      </label>

      {vista === "precios" ? (
        <ul className="mt-3 space-y-2">
          {resenasVisibles.map((r) => {
            const m = infoMarca(r.marca);
            return (
              <li key={r.id} className="rounded-2xl bg-white p-3 ring-1 ring-tinta/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-bold capitalize">{nombreBar[r.id_bar] ?? "Bar borrado"}</p>
                    <p className="text-[13px] text-tinta/60">
                      {r.formato}, {m.nombre}
                      {r.tapa !== "No" ? `, tapa ${r.tapa.toLowerCase()}` : ""}
                      {r.terraza ? ", terraza" : ""}
                    </p>
                    <p className="text-[12px] text-tinta/50">
                      {r.user_id ? nombres[r.user_id] ?? "Usuario" : "Anónimo"}, {haceCuanto(r.fecha)}
                      {r.xp_ganado ? `, +${r.xp_ganado} XP` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-[22px] font-extrabold tabular-nums text-granate">{euros(r.precio)} €</p>
                </div>
                {confirmar === r.id ? (
                  <div className="mt-2 flex gap-2">
                    <button
                      disabled={ocupado}
                      onClick={() => accion("admin_borrar_resena", { p_id: r.id }, "Precio borrado")}
                      className="flex-1 rounded-xl bg-granate py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                      Sí, borrar este precio
                    </button>
                    <button onClick={() => setConfirmar(null)} className="flex-1 rounded-xl bg-zinc-barra py-2 text-sm font-bold">
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmar(r.id)} className="mt-2 text-sm font-semibold text-granate underline underline-offset-2">
                    Borrar precio
                  </button>
                )}
              </li>
            );
          })}
          {resenasVisibles.length === 0 && <p className="py-8 text-center text-tinta/55">No hay precios que coincidan.</p>}
        </ul>
      ) : (
        <ul className="mt-3 space-y-2">
          {baresVisibles.map((b) => {
            const repetido = duplicados.has(b.nombre.trim().toLowerCase());
            return (
              <li key={b.id} className={`rounded-2xl bg-white p-3 ring-1 ${repetido ? "ring-ambar" : "ring-tinta/10"}`}>
                {editando?.id === b.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      accion("admin_renombrar_bar", { p_id: b.id, p_nombre: editando.nombre }, "Nombre cambiado");
                    }}
                    className="flex gap-2"
                  >
                    <label className="min-w-0 flex-1">
                      <span className="sr-only">Nuevo nombre</span>
                      <input
                        autoFocus
                        value={editando.nombre}
                        onChange={(e) => setEditando({ id: b.id, nombre: e.target.value })}
                        className="w-full rounded-xl bg-zinc-barra px-3 py-2 font-semibold outline-none focus:ring-2 focus:ring-ambar"
                      />
                    </label>
                    <button disabled={ocupado} className="rounded-xl bg-tinta px-4 text-sm font-bold text-white disabled:opacity-50">
                      Guardar
                    </button>
                    <button type="button" onClick={() => setEditando(null)} className="rounded-xl bg-zinc-barra px-3 text-sm font-bold">
                      ✕
                    </button>
                  </form>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[16px] font-bold capitalize">
                        {b.nombre}
                        {repetido && <span className="ml-2 rounded-md bg-ambar px-1.5 py-0.5 text-[11px] font-bold">Repetido</span>}
                      </p>
                      <p className="text-[13px] text-tinta/60">
                        {b.resenas.length} precios
                        {b.resenas.length ? `, último ${haceCuanto([...b.resenas].sort((x, y) => y.fecha.localeCompare(x.fecha))[0].fecha)}` : ""}
                      </p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${b.latitud},${b.longitud}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12px] font-semibold text-blue-700 underline underline-offset-2"
                      >
                        Ver ubicación
                      </a>
                    </div>
                    <button onClick={() => setEditando({ id: b.id, nombre: b.nombre })} className="shrink-0 rounded-xl bg-zinc-barra px-3 py-2 text-sm font-bold">
                      Renombrar
                    </button>
                  </div>
                )}
                {editando?.id !== b.id &&
                  (confirmar === b.id ? (
                    <div className="mt-2">
                      <p className="text-[13px] text-tinta/70">Se borran el bar y sus {b.resenas.length} precios, y se restan los puntos que dieron.</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          disabled={ocupado}
                          onClick={() => accion("admin_borrar_bar", { p_id: b.id }, "Bar borrado")}
                          className="flex-1 rounded-xl bg-granate py-2 text-sm font-bold text-white disabled:opacity-50"
                        >
                          Sí, borrar el bar
                        </button>
                        <button onClick={() => setConfirmar(null)} className="flex-1 rounded-xl bg-zinc-barra py-2 text-sm font-bold">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmar(b.id)} className="mt-2 text-sm font-semibold text-granate underline underline-offset-2">
                      Borrar bar
                    </button>
                  ))}
              </li>
            );
          })}
        </ul>
      )}

      {aviso && (
        <div role="status" className="entra fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-tinta px-4 py-3 text-center font-semibold text-white">
          {aviso}
        </div>
      )}
    </main>
  );
}
