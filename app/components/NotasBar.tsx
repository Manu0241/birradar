"use client";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { haceCuanto } from "@/lib/bares";

const MAX = 140;
const VISIBLES = 5;

type Nota = {
  id: string;
  texto: string;
  creado: string;
  user_id: string;
  perfiles: { nombre: string | null; avatar_url: string | null } | null;
};

function mensajeError(msg: string) {
  if (msg.startsWith("Pon ") || msg.startsWith("Has llegado")) return msg; // mensajes de la base de datos, ya en castellano
  if (msg.includes("check constraint")) return `La nota tiene que tener entre 2 y ${MAX} caracteres.`;
  return "No se ha podido guardar la nota. Inténtalo de nuevo.";
}

type Props = { barId: string; usuario: User | null; onEntrar: () => void; avisar: (texto: string) => void };

export default function NotasBar({ barId, usuario, onEntrar, avisar }: Props) {
  const [notas, setNotas] = useState<Nota[] | null>(null);
  const [texto, setTexto] = useState("");
  const [todas, setTodas] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);
  const [borrando, setBorrando] = useState<string | null>(null); // nota pendiente de confirmar

  const cargar = useCallback(async () => {
    const { data } = await supabase
      .from("notas")
      .select("id, texto, creado, user_id, perfiles ( nombre, avatar_url )")
      .eq("id_bar", barId)
      .order("creado", { ascending: false })
      .limit(50);
    setNotas((data ?? []) as unknown as Nota[]);
  }, [barId]);

  useEffect(() => {
    setNotas(null);
    setTodas(false);
    setTexto("");
    setBorrando(null);
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!usuario) return setEsAdmin(false);
    supabase.rpc("es_admin").then(({ data }) => setEsAdmin(data === true));
  }, [usuario]);

  const publicar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return onEntrar();
    const limpio = texto.trim();
    if (limpio.length < 2) return;
    setOcupado(true);
    const { error } = await supabase.from("notas").insert({ id_bar: barId, user_id: usuario.id, texto: limpio });
    setOcupado(false);
    if (error) return avisar(mensajeError(error.message));
    setTexto("");
    avisar("Nota publicada 📝");
    cargar();
  };

  const borrar = async (id: string) => {
    setOcupado(true);
    const { error } = await supabase.from("notas").delete().eq("id", id);
    setOcupado(false);
    setBorrando(null);
    if (error) return avisar("No se ha podido borrar la nota.");
    setNotas((n) => n?.filter((x) => x.id !== id) ?? null);
  };

  const lista = notas ? (todas ? notas : notas.slice(0, VISIBLES)) : [];

  return (
    <section className="mt-5" aria-labelledby="titulo-notas">
      <h3 id="titulo-notas" className="text-[18px] font-extrabold tracking-[-0.02em]">
        Notas de la gente{notas && notas.length > 0 && <span className="text-tinta/45"> · {notas.length}</span>}
      </h3>

      <form onSubmit={publicar} className="mt-2">
        {usuario ? (
          <>
            <label className="block">
              <span className="sr-only">Escribe una nota sobre este bar</span>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value.slice(0, MAX))}
                rows={2}
                maxLength={MAX}
                placeholder="Ej.: la tapa de los martes es enorme, pide la de croquetas"
                className="w-full resize-none rounded-2xl border-0 bg-zinc-barra px-4 py-3 text-[16px] outline-none placeholder:text-tinta/40 focus:ring-2 focus:ring-ambar"
              />
            </label>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <span className={`text-[12px] tabular-nums ${texto.length >= MAX ? "font-bold text-granate" : "text-tinta/45"}`}>
                {texto.length}/{MAX}
              </span>
              <button
                disabled={ocupado || texto.trim().length < 2}
                className="rounded-full bg-tinta px-5 py-2 text-sm font-bold text-white disabled:bg-tinta/15 disabled:text-tinta/45"
              >
                Publicar
              </button>
            </div>
          </>
        ) : (
          <button type="button" onClick={onEntrar} className="w-full rounded-2xl bg-zinc-barra py-3 text-[15px] font-bold">
            Entra para dejar una nota
          </button>
        )}
      </form>

      {notas === null ? (
        <p className="mt-3 text-sm text-tinta/45">Cargando notas…</p>
      ) : notas.length === 0 ? (
        <p className="mt-3 text-sm text-tinta/55">Aún no hay notas. Cuenta algo útil: la tapa, el ambiente, cuándo hay sitio…</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {lista.map((n) => {
            const nombre = n.perfiles?.nombre || "Cazador";
            const mia = n.user_id === usuario?.id;
            return (
              <li key={n.id} className="rounded-2xl bg-white p-3 ring-1 ring-tinta/10">
                <div className="flex items-center gap-2">
                  {n.perfiles?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={n.perfiles.avatar_url} alt="" referrerPolicy="no-referrer" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-ambar text-[12px] font-extrabold">{nombre.slice(0, 1)}</span>
                  )}
                  <p className="min-w-0 flex-1 truncate text-[13px] text-tinta/60">
                    <span className="font-bold text-tinta">{mia ? "Tú" : nombre}</span>, {haceCuanto(n.creado)}
                  </p>
                  {(mia || esAdmin) &&
                    (borrando === n.id ? (
                      <span className="flex shrink-0 gap-2 text-[13px] font-bold">
                        <button disabled={ocupado} onClick={() => borrar(n.id)} className="text-granate">
                          Borrar
                        </button>
                        <button onClick={() => setBorrando(null)} className="text-tinta/55">
                          No
                        </button>
                      </span>
                    ) : (
                      <button onClick={() => setBorrando(n.id)} aria-label="Borrar nota" className="shrink-0 text-[13px] font-semibold text-tinta/45 underline underline-offset-2">
                        Borrar
                      </button>
                    ))}
                </div>
                <p className="mt-1.5 whitespace-pre-line break-words text-[15px] leading-snug">{n.texto}</p>
              </li>
            );
          })}
        </ul>
      )}

      {notas && notas.length > VISIBLES && (
        <button onClick={() => setTodas((t) => !t)} className="mt-2 w-full py-2 text-sm font-bold text-granate">
          {todas ? "Ver menos" : `Ver las ${notas.length} notas`}
        </button>
      )}
    </section>
  );
}
