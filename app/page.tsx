"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { type Bar, type BarDB, type Coordenadas, distanciaKm, nivelDeXp, procesarBares } from "@/lib/bares";
import { marcasPorPopularidad } from "@/lib/marcas";
import { compartirTarjeta } from "@/lib/tarjeta";
import Mapa from "./components/Mapa";
import ListaBares, { type Orden } from "./components/ListaBares";
import FichaBar, { type Rey } from "./components/FichaBar";
import FormularioPrecio, { type DatosPrecio } from "./components/FormularioPrecio";
import Perfil, { type FilaRanking } from "./components/Perfil";
import Bienvenida from "./components/Bienvenida";
import GuiaInstalarIOS from "./components/GuiaInstalarIOS";
import Novedades from "./components/Novedades";
import Acceso from "./components/Acceso";
import { NOVEDADES, ULTIMA_NOVEDAD, type Novedad } from "@/lib/novedades";
import { useInstalacion } from "@/lib/instalar";

const CENTRO_INICIAL: Coordenadas = [40.489, -3.667];
const RADIO_MISMO_BAR_KM = 0.05; // a menos de 50 m damos por hecho que estás en ese bar
const RADIO_ACTUALIZAR_KM = 0.15; // para actualizar un bar desde su ficha hay que estar cerca
const URL_APP = "https://birradar.vercel.app/";

const leer = (k: string) => {
  try { return localStorage.getItem(k) ?? sessionStorage.getItem(k); } catch { return null; }
};
// Día de hoy y de ayer en España, formato AAAA-MM-DD (igual que la base de datos)
const diaMadrid = (offsetDias = 0) =>
  new Date(Date.now() + offsetDias * 86_400_000).toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });

const guardar = (k: string, sesion = false) => {
  try { (sesion ? sessionStorage : localStorage).setItem(k, "1"); } catch {}
};
const marcarNovedadesVistas = () => {
  try { localStorage.setItem("novedadVista", String(ULTIMA_NOVEDAD)); } catch {}
};

export default function Home() {
  const [splash, setSplash] = useState<"visible" | "saliendo" | "fuera">("visible");
  const [bienvenida, setBienvenida] = useState(false);
  const [novedades, setNovedades] = useState<Novedad[]>([]);

  const [datos, setDatos] = useState<BarDB[]>([]);
  const [centro, setCentro] = useState<Coordenadas>(CENTRO_INICIAL);
  const [zoom, setZoom] = useState(15);
  const [miUbicacion, setMiUbicacion] = useState<Coordenadas | null>(null);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);

  const [orden, setOrden] = useState<Orden>("cerca");
  const [filtroMarca, setFiltroMarca] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [soloTerraza, setSoloTerraza] = useState(false);
  const [hojaAlta, setHojaAlta] = useState(false);

  const [usuario, setUsuario] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<{ xp: number; nombre: string; avatar: string; racha: number; ultimoDia: string | null } | null>(null);
  const [ranking, setRanking] = useState<FilaRanking[]>([]);
  const [rankingSemanal, setRankingSemanal] = useState<FilaRanking[]>([]);
  const [perfilesReyes, setPerfilesReyes] = useState<Record<string, { nombre: string; avatar_url: string }>>({});
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);
  const [accesoAbierto, setAccesoAbierto] = useState(false);

  const [formulario, setFormulario] = useState<{ bar: Bar | null; ubicacion: Coordenadas } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const temporizadorAviso = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hojaRef = useRef<HTMLDivElement>(null);

  // Instalar como app: Android lanza el aviso del navegador; iPhone enseña dónde tocar
  const instalacion = useInstalacion();
  const [guiaIOS, setGuiaIOS] = useState(false);
  const instalar = instalacion.disponible
    ? () => (instalacion.ios ? setGuiaIOS(true) : instalacion.instalarNativo())
    : null;

  // Aviso discreto a partir de la tercera visita, si aún no la tiene instalada
  const [avisoVisitas, setAvisoVisitas] = useState(false);
  useEffect(() => {
    try {
      const n = Number(localStorage.getItem("visitas") ?? "0") + 1;
      localStorage.setItem("visitas", String(n));
      if (n >= 3 && !localStorage.getItem("avisoInstalarCerrado")) setAvisoVisitas(true);
    } catch {}
  }, []);
  const cerrarAvisoVisitas = () => {
    setAvisoVisitas(false);
    try { localStorage.setItem("avisoInstalarCerrado", "1"); } catch {}
  };

  // Al cambiar entre lista y ficha, volver arriba de la hoja
  useEffect(() => {
    hojaRef.current?.scrollTo({ top: 0 });
  }, [seleccionadoId]);

  const avisar = useCallback((texto: string) => {
    setAviso(texto);
    if (temporizadorAviso.current) clearTimeout(temporizadorAviso.current);
    temporizadorAviso.current = setTimeout(() => setAviso(null), 3200);
  }, []);

  // ---------- Datos ----------
  const cargarBares = useCallback(async () => {
    const { data, error } = await supabase
      .from("bares")
      .select("id, nombre, latitud, longitud, resenas ( id, precio, marca, formato, tapa, user_id, fecha, terraza )");
    if (error) console.error(error);
    else setDatos((data ?? []) as BarDB[]);
  }, []);

  const cargarRanking = useCallback(async () => {
    const [siempre, semana] = await Promise.all([
      supabase.from("perfiles").select("id, nombre, avatar_url, xp").order("xp", { ascending: false }).limit(20),
      supabase.rpc("ranking_semanal"),
    ]);
    if (siempre.data) setRanking(siempre.data as FilaRanking[]);
    if (semana.data) setRankingSemanal(semana.data as FilaRanking[]);
  }, []);

  /** Lee el perfil (lo crea la primera vez). Los puntos los pone la base de datos, nunca la app. */
  const cargarPerfil = useCallback(async (u: User): Promise<{ xp: number; racha: number }> => {
    const meta = u.user_metadata ?? {};
    const columnas = "nombre, avatar_url, xp, racha, ultimo_dia";
    let { data } = await supabase.from("perfiles").select(columnas).eq("id", u.id).maybeSingle();
    if (!data) {
      await supabase.from("perfiles").insert({ id: u.id, nombre: meta.full_name ?? "Cazador novato", avatar_url: meta.avatar_url ?? "" });
      ({ data } = await supabase.from("perfiles").select(columnas).eq("id", u.id).maybeSingle());
    }
    supabase.rpc("es_admin").then(({ data: admin }) => setEsAdmin(admin === true));
    const xp = data?.xp ?? 0;
    setPerfil({
      xp,
      nombre: data?.nombre ?? meta.full_name ?? "Tú",
      avatar: data?.avatar_url || meta.avatar_url || "",
      racha: data?.racha ?? 0,
      ultimoDia: data?.ultimo_dia ?? null,
    });
    return { xp, racha: data?.racha ?? 0 };
  }, []);

  const ubicar = useCallback(
    () =>
      new Promise<Coordenadas | null>((resolver) => {
        if (!("geolocation" in navigator)) return resolver(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const c: Coordenadas = [pos.coords.latitude, pos.coords.longitude];
            setMiUbicacion(c);
            resolver(c);
          },
          () => resolver(null),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        );
      }),
    []
  );

  useEffect(() => {
    // Splash corto, y solo una vez por visita
    const yaVisto = leer("splashVisto");
    const t1 = setTimeout(() => setSplash("saliendo"), yaVisto ? 0 : 1100);
    const t2 = setTimeout(() => {
      setSplash("fuera");
      guardar("splashVisto", true);
      if (!leer("tutorialVisto2")) setBienvenida(true);
      else {
        // Novedades desde la última vez que abrió la app
        // Sin registro aún: ya vio el tutorial nuevo, que cubre las novedades 1 a 3
        const vista = Number(leer("novedadVista") ?? "3") || 0;
        const pendientes = NOVEDADES.filter((n) => n.id > vista);
        if (pendientes.length) setNovedades(pendientes);
      }
    }, yaVisto ? 0 : 1500);

    // Enlace directo a un bar: /?bar=<id> (desde las páginas de cada bar)
    const barEnlace = new URLSearchParams(window.location.search).get("bar");
    if (barEnlace) setSeleccionadoId(barEnlace);

    cargarBares();
    cargarRanking();
    ubicar().then((c) => c && !barEnlace && setCentro(c));

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null);
      if (session?.user) cargarPerfil(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUsuario(session?.user ?? null);
      if (session?.user) cargarPerfil(session.user);
      else setPerfil(null);
    });
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      subscription.unsubscribe();
    };
  }, [cargarBares, cargarRanking, cargarPerfil, ubicar]);

  // ---------- Derivados ----------
  const bares = useMemo(() => procesarBares(datos, miUbicacion), [datos, miUbicacion]);

  // Nombres y fotos de los "reyes" de cada bar
  useEffect(() => {
    const ids = [...new Set(bares.flatMap((b) => (b.rey ? [b.rey.userId] : [])))];
    if (ids.length === 0) return;
    supabase
      .from("perfiles")
      .select("id, nombre, avatar_url")
      .in("id", ids)
      .then(({ data }) => {
        if (data) setPerfilesReyes(Object.fromEntries(data.map((d) => [d.id, { nombre: d.nombre ?? "Alguien", avatar_url: d.avatar_url ?? "" }])));
      });
  }, [bares]);

  // Si se abrió con /?bar=<id>, centrar el mapa en ese bar cuando lleguen los datos
  const centradoEnEnlace = useRef(false);
  useEffect(() => {
    if (centradoEnEnlace.current || !seleccionadoId) return;
    const b = bares.find((x) => x.id === seleccionadoId);
    if (b) {
      centradoEnEnlace.current = true;
      setCentro([b.latitud, b.longitud]);
    }
  }, [bares, seleccionadoId]);

  const marcasOrdenadas = useMemo(() => {
    const ref = miUbicacion ?? CENTRO_INICIAL;
    return marcasPorPopularidad(
      datos.flatMap((b) =>
        (b.resenas ?? []).map((r) => ({ marca: r.marca, cerca: distanciaKm(ref, [b.latitud, b.longitud]) < 3 }))
      )
    );
  }, [datos, miUbicacion]);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const ref = miUbicacion ?? centro;
    const lejania = (b: Bar) => b.distanciaKm ?? distanciaKm(ref, [b.latitud, b.longitud]);
    return bares
      .filter((b) => !filtroMarca || b.precios.some((p) => p.marca === filtroMarca))
      .filter((b) => !texto || b.nombre.toLowerCase().includes(texto))
      .filter((b) => orden !== "tapa" || b.tapa !== "No")
      .filter((b) => !soloTerraza || b.terraza === true)
      .sort((a, b) =>
        orden === "barato" ? a.precioDesde - b.precioDesde || lejania(a) - lejania(b) : lejania(a) - lejania(b)
      );
  }, [bares, busqueda, filtroMarca, orden, soloTerraza, miUbicacion, centro]);

  const seleccionado = bares.find((b) => b.id === seleccionadoId) ?? null;
  const puedeActualizar =
    !!seleccionado && !!miUbicacion && distanciaKm(miUbicacion, [seleccionado.latitud, seleccionado.longitud]) <= RADIO_ACTUALIZAR_KM;
  const reySeleccionado: Rey | null =
    seleccionado?.rey && perfilesReyes[seleccionado.rey.userId]
      ? {
          nombre: perfilesReyes[seleccionado.rey.userId].nombre,
          avatar: perfilesReyes[seleccionado.rey.userId].avatar_url,
          aportaciones: seleccionado.rey.aportaciones,
          soyYo: seleccionado.rey.userId === usuario?.id,
        }
      : null;
  const rachaViva = !!perfil?.ultimoDia && (perfil.ultimoDia === diaMadrid() || perfil.ultimoDia === diaMadrid(-1));
  const descubiertos = usuario ? datos.filter((b) => b.resenas?.some((r) => r.user_id === usuario.id)).length : 0;

  // ---------- Acciones ----------
  // Abre la ventana de acceso: Google o correo y contraseña con código de verificación
  const entrar = () => setAccesoAbierto(true);

  const elegirBar = (bar: Bar) => {
    setSeleccionadoId(bar.id);
    setCentro([bar.latitud, bar.longitud]);
    setHojaAlta(false);
  };

  const centrarEnMi = async () => {
    const c = await ubicar();
    if (c) {
      setCentro(c);
      setZoom((z) => Math.max(z, 15));
    } else avisar("No podemos ver tu ubicación. Activa el permiso de ubicación del navegador.");
  };

  const anadirPrecio = async () => {
    if (!usuario) return entrar();
    const pos = await ubicar();
    if (!pos) return avisar("Activa la ubicación para añadir un precio: así sabemos en qué bar estás.");
    const masCercano = [...bares].sort(
      (a, b) => distanciaKm(pos, [a.latitud, a.longitud]) - distanciaKm(pos, [b.latitud, b.longitud])
    )[0];
    const enEseBar = masCercano && distanciaKm(pos, [masCercano.latitud, masCercano.longitud]) <= RADIO_MISMO_BAR_KM;
    setFormulario({ bar: enEseBar ? masCercano : null, ubicacion: pos });
  };

  const actualizarSeleccionado = () => {
    if (!usuario) return entrar();
    if (seleccionado && miUbicacion) setFormulario({ bar: seleccionado, ubicacion: miUbicacion });
  };

  const enviar = async (d: DatosPrecio) => {
    if (!usuario || !formulario) return;
    setEnviando(true);
    try {
      const xpAntes = perfil?.xp ?? 0;
      let idBar = formulario.bar?.id;
      if (!idBar) {
        const { data, error } = await supabase
          .from("bares")
          .insert({ nombre: d.nombre, latitud: formulario.ubicacion[0], longitud: formulario.ubicacion[1] })
          .select("id")
          .single();
        if (error) throw error;
        idBar = data.id as string;
      }
      const { error } = await supabase.from("resenas").insert({
        id_bar: idBar,
        formato: d.formato,
        precio: d.precio,
        marca: d.marca,
        tapa: d.tapa,
        terraza: d.terraza,
        servicio: "Rápido",
        user_id: usuario.id,
      });
      if (error) throw error;

      const { xp, racha } = await cargarPerfil(usuario);
      const ganado = xp - xpAntes;
      const conRacha = racha > 1 && perfil?.ultimoDia !== diaMadrid() ? ` Racha de ${racha} días 🔥` : "";
      if (nivelDeXp(xp) > nivelDeXp(xpAntes)) avisar(`¡Subes a nivel ${nivelDeXp(xp)}! Precio guardado, +${ganado} XP.${conRacha}`);
      else if (ganado > 0) avisar(`Precio guardado. +${ganado} XP.${conRacha}`);
      else avisar("Precio guardado. Los puntos de este bar ya los ganaste hoy.");

      setFormulario(null);
      await cargarBares();
      cargarRanking();
      setSeleccionadoId(idBar);
    } catch (e) {
      console.error(e);
      avisar("No se pudo guardar el precio. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const compartirBar = async () => {
    if (!seleccionado) return;
    try {
      const r = await compartirTarjeta(seleccionado);
      if (r === "descargada") avisar("Tarjeta descargada. Súbela a tus historias o mándala por WhatsApp.");
    } catch {
      // el usuario canceló el menú de compartir
    }
  };

  const compartirApp = async () => {
    const datosCompartir = { title: "Birradar", text: "Mira cuánto cuesta la caña en los bares de tu zona y compite conmigo en el ranking.", url: URL_APP };
    try {
      if (navigator.share) await navigator.share(datosCompartir);
      else window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${datosCompartir.text} ${URL_APP}`)}`, "_blank");
    } catch {}
  };

  // ---------- Pantalla ----------
  return (
    <main className="relative mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-zinc-barra sm:border-x sm:border-tinta/10">
      {splash !== "fuera" && (
        <div className={`absolute inset-0 z-[100] grid place-items-center bg-granate transition-opacity duration-400 ${splash === "saliendo" ? "opacity-0" : "opacity-100"}`}>
          <div className="flex flex-col items-center">
            <span className="grid h-36 w-36 place-items-center rounded-full bg-white shadow-2xl">
              <Image src="/logoprincipio.png" alt="" width={112} height={112} priority className="object-contain" />
            </span>
            <p className="mt-5 text-5xl font-extrabold tracking-[-0.05em] text-white">Birradar</p>
          </div>
        </div>
      )}

      {/* Mapa */}
      <section className="relative shrink-0 transition-[height] duration-300 ease-out" style={{ height: hojaAlta ? "24dvh" : "58dvh" }} aria-label="Mapa de bares">
        <Mapa
          centro={centro}
          zoom={zoom}
          bares={visibles}
          miUbicacion={miUbicacion}
          seleccionadoId={seleccionadoId}
          onMover={(c, z) => {
            setCentro(c);
            setZoom(z);
          }}
          onElegirBar={elegirBar}
          onTocarMapa={() => setSeleccionadoId(null)}
        />

        <header className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <span className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 shadow-md">
            <Image src="/logobirradar.png" alt="" width={30} height={30} className="rounded-full" />
            <span className="text-xl font-extrabold tracking-[-0.04em] text-granate">Birradar</span>
          </span>
          {usuario ? (
            <button
              onClick={() => setPerfilAbierto(true)}
              className="pointer-events-auto relative rounded-full bg-white p-1 shadow-md"
              aria-label="Abrir mi perfil"
            >
              {perfil?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={perfil.avatar} alt="" referrerPolicy="no-referrer" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-full bg-ambar font-extrabold">{(perfil?.nombre ?? "T").slice(0, 1)}</span>
              )}
              <span className="absolute -bottom-1 -right-1 grid h-6 min-w-6 place-items-center rounded-full bg-granate px-1 text-[11px] font-extrabold text-white ring-2 ring-white">
                {nivelDeXp(perfil?.xp ?? 0)}
              </span>
            </button>
          ) : (
            <button onClick={entrar} className="pointer-events-auto rounded-full bg-white px-4 py-2.5 text-sm font-bold shadow-md">
              Entrar
            </button>
          )}
        </header>

        <button
          onClick={centrarEnMi}
          aria-label="Centrar el mapa en mi ubicación"
          className="absolute bottom-10 right-4 grid h-12 w-12 place-items-center rounded-full bg-white shadow-md active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>
      </section>

      {/* Hoja inferior con la lista o la ficha del bar */}
      <section className="relative z-10 -mt-6 flex min-h-0 flex-1 flex-col rounded-t-[28px] bg-white shadow-[0_-10px_30px_-12px_rgba(27,26,24,0.35)]">
        <button
          onClick={() => setHojaAlta((a) => !a)}
          aria-label={hojaAlta ? "Ver más mapa" : "Ver más lista"}
          className="mx-auto flex h-7 w-24 shrink-0 items-center justify-center"
        >
          <span className="h-1.5 w-12 rounded-full bg-tinta/15" />
        </button>
        <div ref={hojaRef} className="min-h-0 flex-1 overflow-y-auto pb-28">
          {seleccionado ? (
            <FichaBar
              bar={seleccionado}
              origen={miUbicacion}
              rey={reySeleccionado}
              onCompartir={compartirBar}
              puedeActualizar={puedeActualizar || !usuario}
              onActualizar={actualizarSeleccionado}
              onCerrar={() => setSeleccionadoId(null)}
              usuario={usuario}
              onEntrar={entrar}
              avisar={avisar}
            />
          ) : (
            <ListaBares
              bares={visibles}
              orden={orden}
              onOrden={setOrden}
              soloTerraza={soloTerraza}
              onSoloTerraza={() => setSoloTerraza((x) => !x)}
              marcasTop={marcasOrdenadas.slice(0, 6)}
              filtroMarca={filtroMarca}
              onFiltroMarca={setFiltroMarca}
              busqueda={busqueda}
              onBusqueda={setBusqueda}
              onElegirBar={elegirBar}
              hayUbicacion={!!miUbicacion}
              onAnadir={anadirPrecio}
            />
          )}
        </div>
      </section>

      {!seleccionado && (
        <button
          onClick={anadirPrecio}
          className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full bg-granate py-2 pl-2 pr-6 text-[17px] font-bold text-white shadow-[0_10px_24px_-8px_rgba(139,0,0,0.7)] active:scale-95"
        >
          <span className="posavasos h-10 w-10 text-xl">
            <span className="relative z-10 -mt-0.5">+</span>
          </span>
          Añadir precio
        </button>
      )}

      {aviso && (
        <div role="status" className="entra absolute left-1/2 top-[max(5rem,calc(env(safe-area-inset-top)+4rem))] z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-tinta px-4 py-3 text-center text-[15px] font-semibold text-white shadow-xl">
          {aviso}
        </div>
      )}

      {avisoVisitas && instalar && !bienvenida && novedades.length === 0 && splash === "fuera" && !formulario && (
        <div className="entra absolute inset-x-4 top-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] z-[55] flex items-center gap-3 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-tinta/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icono-192.png" alt="" className="h-11 w-11 rounded-xl" />
          <p className="min-w-0 flex-1 text-[14px] font-semibold leading-snug">Ten Birradar en tu pantalla de inicio, como una app.</p>
          <button
            onClick={() => {
              instalar();
              cerrarAvisoVisitas();
            }}
            className="shrink-0 rounded-full bg-granate px-4 py-2 text-sm font-bold text-white"
          >
            {instalacion.ios ? "Cómo" : "Instalar"}
          </button>
          <button onClick={cerrarAvisoVisitas} aria-label="Cerrar aviso" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-tinta/50">
            ✕
          </button>
        </div>
      )}

      {accesoAbierto && !usuario && (
        <Acceso
          onCerrar={() => setAccesoAbierto(false)}
          onEntrado={(texto) => {
            setAccesoAbierto(false);
            avisar(texto);
          }}
        />
      )}

      {guiaIOS && <GuiaInstalarIOS arriba={instalacion.compartirArriba} onCerrar={() => setGuiaIOS(false)} />}

      {formulario && (
        <FormularioPrecio
          key={formulario.bar?.id ?? "nuevo"}
          bar={formulario.bar}
          marcasOrdenadas={marcasOrdenadas}
          enviando={enviando}
          onEnviar={enviar}
          onEsOtroBar={() => setFormulario({ bar: null, ubicacion: formulario.ubicacion })}
          onCerrar={() => setFormulario(null)}
        />
      )}

      {perfilAbierto && usuario && perfil && (
        <Perfil
          nombre={perfil.nombre}
          avatar={perfil.avatar}
          xp={perfil.xp}
          racha={perfil.racha}
          rachaViva={rachaViva}
          descubiertos={descubiertos}
          ranking={ranking}
          rankingSemanal={rankingSemanal}
          miId={usuario.id}
          onCompartir={compartirApp}
          onInstalar={instalar}
          esAdmin={esAdmin}
          onSalir={async () => {
            await supabase.auth.signOut();
            setPerfilAbierto(false);
          }}
          onCerrar={() => setPerfilAbierto(false)}
        />
      )}

      {novedades.length > 0 && !bienvenida && (
        <Novedades
          novedades={novedades}
          onCerrar={() => {
            marcarNovedadesVistas();
            setNovedades([]);
          }}
        />
      )}

      {bienvenida && (
        <Bienvenida
          instalacion={instalacion}
          onGuiaIOS={() => setGuiaIOS(true)}
          onTerminar={() => {
            guardar("tutorialVisto2");
            marcarNovedadesVistas();
            setBienvenida(false);
          }}
        />
      )}
    </main>
  );
}
