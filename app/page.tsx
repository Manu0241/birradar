"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase"; 
import { Map, Marker, Overlay } from "pigeon-maps"; 
import Image from "next/image"; 

export default function Home() {
  const [splashActivo, setSplashActivo] = useState(true);
  const [splashVisible, setSplashVisible] = useState(true);

  const [estaMontado, setEstaMontado] = useState(false);
  const [abrirResena, setAbrirResena] = useState(false);
  const [cargando, setCargando] = useState(false);
  
  const [usuario, setUsuario] = useState<any>(null);
  const [perfil, setPerfil] = useState<{ xp: number; nivel: number } | null>(null);
  
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const [vistaPerfil, setVistaPerfil] = useState<'yo' | 'ranking'>('yo');
  const [rankingUsuarios, setRankingUsuarios] = useState<any[]>([]);

  const [baresDescubiertos, setBaresDescubiertos] = useState(0);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const [coordenadas, setCoordenadas] = useState<[number, number]>([40.505, -3.665]);
  const [barSeleccionado, setBarSeleccionado] = useState<any | null>(null);
  
  const [filtroMarca, setFiltroMarca] = useState("");
  const [filtroTapa, setFiltroTapa] = useState("");
  const [filtroPrecioMax, setFiltroPrecioMax] = useState(6.00);

  const [nombreBar, setNombreBar] = useState("");
  const [precio, setPrecio] = useState(2.50);
  const [marca, setMarca] = useState("");
  const [formato, setFormato] = useState("");
  const [tapa, setTapa] = useState("");
  const [zoom, setZoom] = useState(15);
  
  const [ranking, setRanking] = useState<any[]>([]); 
  const [modoAuditoria, setModoAuditoria] = useState<any | null>(null);

  // --- NUEVO: Estados para el Tutorial ---
  const [mostrarTutorial, setMostrarTutorial] = useState(false);
  const [pasoTutorial, setPasoTutorial] = useState(0);

  const marcasCerveza = [
    "🔴 Mahou", "⭐️ E. Galicia", "🦅 Águila", "🟢 Cruzcampo", 
    "🦁 San Miguel", "☀️ Sol", "🦌 Jäger/Radler", "⛵️ Alhambra", 
    "🌍 Heineken", "🏁 Amstel", "🐐 Artesanal/Otra"
  ];

  // --- NUEVO: Pasos del tutorial ---
  const pasosTutorial = [
    { titulo: "¡Bienvenido a Birradar!", desc: "Tu radar definitivo de tapas y cervezas. ¿Listo para mapear el barrio?", icono: "🗺️" },
    { titulo: "Explora y Ubica", desc: "Muévete por el mapa libremente y usa el botón 📍 para encontrar los locales más cercanos a ti.", icono: "📍" },
    { titulo: "Sube de Nivel", desc: "Añade nuevos bares 🍺 para ganar +10 XP. Si el bar ya existe, audita sus precios para ganar +5 XP.", icono: "🏆" },
    { titulo: "Regla de Consenso", desc: "Los precios solo cambian si 3 usuarios distintos confirman la modificación. ¡Comunidad real!", icono: "⚖️" },
    { titulo: "¡Compite!", desc: "Escala en el Ranking Global y comparte la app con tus amigos para ver quién es el Maestro Cervecero.", icono: "📲" }
  ];

  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashVisible(false), 4500);
    const removeTimer = setTimeout(() => {
      setSplashActivo(false);
      // Tras el splash, comprobamos si debe ver el tutorial
      const visto = localStorage.getItem("tutorialVisto");
      if (!visto) setMostrarTutorial(true);
    }, 5000);
    return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
  }, []);

  const finalizarTutorial = () => {
    localStorage.setItem("tutorialVisto", "true");
    setMostrarTutorial(false);
  };

  const compartirApp = async () => {
    const shareData = {
      title: 'Birradar',
      text: '¡Mira este radar de bares y cervezas! Únete y compite conmigo en el ranking.',
      url: 'https://birradar.vercel.app/' // Cambia esto por tu dominio final
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`, '_blank');
    } catch (err) { console.error(err); }
  };

  const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
  };

  const cargarRanking = async () => {
    try {
      const { data, error } = await supabase
        .from('bares')
        .select(`id, nombre, latitud, longitud, resenas ( id, precio, marca, formato, tapa, user_id )`); 
      if (error) throw error;
      if (data) {
        const baresFormateados = data.map((bar: any) => {
          const resenasValidas = bar.resenas || [];
          const cartaBar: Record<string, any> = {};
          resenasValidas.forEach((r: any) => { cartaBar[r.formato] = r; });
          const formatosDisponibles = Object.values(cartaBar);
          const precioBase = formatosDisponibles.length > 0 ? Math.min(...formatosDisponibles.map((f: any) => f.precio)) : 0;
          const marcaBase = formatosDisponibles.length > 0 ? formatosDisponibles[0].marca : 'Desconocida';
          const mejorTapa = formatosDisponibles.some((f: any) => f.tapa === 'Contundente') ? 'Contundente' : 
                            formatosDisponibles.some((f: any) => f.tapa === 'Simple') ? 'Simple' : 'No';
          return { ...bar, formatos: formatosDisponibles, precio_calculado: precioBase, marca_calculada: marcaBase, tapa_calculada: mejorTapa, numResenas: resenasValidas.length };
        });
        setRanking(baresFormateados.filter(b => b.formatos.length > 0));
      }
    } catch (error) { console.error(error); }
  };

  const cargarPerfilUsuario = async (userId: string, userMeta: any) => {
    try {
      let { data, error } = await supabase.from('perfiles').select('xp, nivel').eq('id', userId).single();
      if (error && error.code === 'PGRST116') {
        const nuevoPerfil = { id: userId, nombre: userMeta?.full_name || 'Cazador Novato', avatar_url: userMeta?.avatar_url || '', xp: 0, nivel: 1 };
        const { data: insertado } = await supabase.from('perfiles').insert([nuevoPerfil]).select().single();
        data = insertado;
      }
      if (data) setPerfil({ xp: data.xp, nivel: data.nivel });
      const { data: misResenas } = await supabase.from('resenas').select('id_bar').eq('user_id', userId);
      if (misResenas) setBaresDescubiertos(new Set(misResenas.map(r => r.id_bar)).size);
    } catch (err) { console.error(err); }
  };

  const cargarRankingGlobal = async () => {
    try {
      const { data } = await supabase.from('perfiles').select('id, nombre, avatar_url, xp, nivel').order('xp', { ascending: false }).limit(10);
      if (data) setRankingUsuarios(data);
    } catch (err) { console.error(err); }
  };

useEffect(() => {
    setEstaMontado(true);
    cargarRanking(); 
    cargarRankingGlobal();

    // --- NUEVO: Buscar ubicación automáticamente al abrir la app ---
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (posicion) => { 
          setCoordenadas([posicion.coords.latitude, posicion.coords.longitude]); 
        },
        (error) => {
          console.log("El usuario no dio permisos de ubicación en el arranque.");
        }
      );
    }
    // ---------------------------------------------------------------

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user || null);
      if (session?.user) cargarPerfilUsuario(session.user.id, session.user.user_metadata);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user || null);
      if (session?.user) cargarPerfilUsuario(session.user.id, session.user.user_metadata);
      else { setPerfil(null); setBaresDescubiertos(0); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const iniciarSesionConGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) alert("Error al conectar con Google");
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    setMenuPerfilAbierto(false); 
  };

  const obtenerTituloGamificacion = (nivel: number) => {
    if (nivel >= 10) return "Maestro Cervecero 👑";
    if (nivel >= 5) return "Cazador de Tapas 🏹";
    if (nivel >= 2) return "Explorador 🧭";
    return "Principiante 🎒";
  };

  const rankingProcesado = ranking
    .map((bar) => {
      const dist = calcularDistancia(coordenadas[0], coordenadas[1], bar.latitud, bar.longitud);
      return { ...bar, distanciaKm: dist };
    })
    .filter((bar) => {
      const cumpleMarca = filtroMarca === "" || bar.marca_calculada === filtroMarca;
      const cumpleTapa = filtroTapa === "" || bar.tapa_calculada === filtroTapa;
      const cumplePrecio = bar.precio_calculado <= filtroPrecioMax;
      const cumpleBusqueda = busqueda === "" || bar.nombre.toLowerCase().includes(busqueda.toLowerCase());
      return cumpleMarca && cumpleTapa && cumplePrecio && cumpleBusqueda;
    })
    .sort((a, b) => a.distanciaKm - b.distanciaKm);

  const obtenerUbicacion = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (posicion) => { setCoordenadas([posicion.coords.latitude, posicion.coords.longitude]); setBarSeleccionado(null); },
        (error) => alert("No pudimos ubicarte.")
      );
    }
  };

  const irAlBar = (bar: any) => {
    if (bar?.latitud && bar?.longitud) {
      setCoordenadas([bar.latitud, bar.longitud]);
      setBarSeleccionado(bar); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const abrirEnMapasExternos = (latitud: number, longitud: number) => {
    if (!latitud || !longitud) return;
    window.open(`http://maps.google.com/maps?daddr=${latitud},${longitud}`, "_blank");
  };

  const iniciarCreacionResena = () => {
    if (!usuario) { iniciarSesionConGoogle(); return; }
    const barCercano = rankingProcesado.find(b => b.distanciaKm < 0.03);
    if (barCercano) {
      setModoAuditoria(barCercano);
      setNombreBar(barCercano.nombre);
      setMarca(barCercano.marca_calculada);
      setFormato("Caña"); setPrecio(barCercano.precio_calculado); setTapa(barCercano.tapa_calculada);
    } else {
      setModoAuditoria(null);
      setNombreBar(""); setMarca(""); setFormato(""); setTapa(""); setPrecio(2.50);
    }
    setAbrirResena(true);
  };

  const enviarDatos = async () => {
    if (!usuario) return alert("Debes iniciar sesión primero");
    setCargando(true);
    try {
      let barId = null;
      let esAuditoria = !!modoAuditoria;
      if (esAuditoria) barId = modoAuditoria.id;
      else {
        const { data: barGuardado, error: errorBar } = await supabase.from('bares').insert([{ nombre: nombreBar, latitud: coordenadas[0], longitud: coordenadas[1] }]).select().single();
        if (errorBar) throw errorBar;
        barId = barGuardado.id;
      }
      const { error: errorResena } = await supabase.from('resenas').insert([{ id_bar: barId, formato, precio, marca, tapa, servicio: 'Rápido', user_id: usuario.id }]);
      if (errorResena) throw errorResena;
      const xpGanada = esAuditoria ? 5 : 10;
      let nuevoXp = (perfil?.xp || 0) + xpGanada; 
      let nuevoNivel = perfil?.nivel || 1;
      let subidaDeNivel = false;
      if (nuevoXp >= nuevoNivel * 30) { nuevoNivel += 1; subidaDeNivel = true; }
      await supabase.from('perfiles').update({ xp: nuevoXp, nivel: nuevoNivel }).eq('id', usuario.id);
      setPerfil({ xp: nuevoXp, nivel: nuevoNivel });
      if (!esAuditoria) setBaresDescubiertos(prev => prev + 1); 
      if (subidaDeNivel) alert(`🎉 ¡NIVEL ${nuevoNivel}! 🍻`);
      else alert(`¡+${xpGanada} XP! 🐾`);
      setAbrirResena(false);
      cargarRanking(); cargarRankingGlobal();
    } catch (error) { console.error(error); } finally { setCargando(false); }
  };

  const xpParaSiguienteNivel = perfil ? perfil.nivel * 30 : 30;
  const xpActualNivel = perfil ? perfil.xp % xpParaSiguienteNivel : 0;
  const porcentajeProgreso = perfil ? (xpActualNivel / xpParaSiguienteNivel) * 100 : 0;

  return (
    <main className="h-screen w-full max-w-md mx-auto bg-[#F9FAFB] flex flex-col relative overflow-hidden font-sans shadow-2xl sm:border-x sm:border-gray-200">
      
      {/* --- ZONA 0: SPLASH SCREEN --- */}
      {splashActivo && (
        <div className={`absolute inset-0 bg-[#8B0000] z-[100] flex flex-col items-center justify-center transition-opacity duration-500 ${splashVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="animate-pulse flex flex-col items-center">
            <div className="bg-white p-5 rounded-full shadow-2xl mb-6">
              <Image src="/logoprincipio.png" alt="Logo" width={150} height={150} className="object-contain" priority />
            </div>
            <h1 className="font-black text-5xl tracking-tighter text-white italic">Birradar</h1>
          </div>
        </div>
      )}

      {/* --- NUEVA ZONA: TUTORIAL (ONBOARDING) --- */}
      {mostrarTutorial && (
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md z-[90] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full rounded-[2.5rem] p-8 text-center shadow-2xl relative animate-in zoom-in-95 duration-300">
            <div className="text-6xl mb-6 animate-bounce">{pasosTutorial[pasoTutorial].icono}</div>
            <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">{pasosTutorial[pasoTutorial].titulo}</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">{pasosTutorial[pasoTutorial].desc}</p>
            
            <div className="flex justify-between items-center gap-4">
              {pasoTutorial > 0 ? (
                <button onClick={() => setPasoTutorial(prev => prev - 1)} className="text-gray-400 font-bold text-xs uppercase tracking-widest px-4 py-2">Atrás</button>
              ) : <div className="w-12"></div>}
              
              <div className="flex gap-1.5">
                {pasosTutorial.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${pasoTutorial === i ? 'w-6 bg-[#8B0000]' : 'w-1.5 bg-gray-200'}`}></div>
                ))}
              </div>

              {pasoTutorial < pasosTutorial.length - 1 ? (
                <button onClick={() => setPasoTutorial(prev => prev + 1)} className="bg-gray-900 text-white font-black px-6 py-2.5 rounded-full text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform">Siguiente</button>
              ) : (
                <button onClick={finalizarTutorial} className="bg-[#8B0000] text-white font-black px-6 py-2.5 rounded-full text-xs uppercase tracking-widest shadow-lg shadow-red-900/20 active:scale-95 transition-transform">¡Vamos!</button>
              )}
            </div>
            <button onClick={finalizarTutorial} className="absolute top-6 right-6 text-gray-300 text-xs font-bold hover:text-gray-500">Saltar</button>
          </div>
        </div>
      )}

      {/* --- MAPA --- */}
      <div className="h-[45%] bg-[#e5e5e5] relative w-full z-0">
        {estaMontado && (
          <Map 
            center={coordenadas} 
            zoom={zoom} 
            onBoundsChanged={({ center, zoom }) => { 
              setCoordenadas(center); 
              setZoom(zoom); 
            }} 
            onClick={({ latLng }) => { 
              setCoordenadas(latLng); 
              setBarSeleccionado(null); 
            }}
          >
            <Marker width={45} anchor={coordenadas} color="#3B82F6" />
            {rankingProcesado.map((bar) => (
              <Marker key={bar.id} width={barSeleccionado?.id === bar.id ? 55 : 38} anchor={[bar.latitud, bar.longitud]} color={barSeleccionado?.id === bar.id ? "#D4AF37" : "#8B0000"} onClick={() => setBarSeleccionado(bar)} />
            ))}
            {barSeleccionado && (
              <Overlay anchor={[barSeleccionado.latitud, barSeleccionado.longitud]} offset={[0, -50]}>
                <div className="bg-white p-3 rounded-2xl shadow-xl border border-gray-100 w-[210px] text-gray-900 text-sm relative">
                  <button onClick={(e) => { e.stopPropagation(); setBarSeleccionado(null); }} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center rounded-full bg-gray-50 font-bold text-xs z-10">✕</button>
                  <h4 className="font-bold text-gray-800 capitalize text-base border-b border-gray-100 pb-2 pr-6 truncate">{barSeleccionado.nombre}</h4>
                  <div className="mt-2 text-xs text-gray-600">
                    <p className="flex items-center gap-1 mb-2">🍺 <span className="font-medium truncate">{barSeleccionado.marca_calculada}</span></p>
                    <div className="bg-amber-50/50 p-2 rounded-xl border border-amber-100/50 space-y-1.5">
                      {barSeleccionado.formatos.map((f: any, i: number) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="font-bold text-gray-700 text-[11px]">{f.formato} {f.tapa === 'Contundente' ? '🍲' : f.tapa === 'Simple' ? '🫒' : ''}</span>
                          <span className="font-black text-[#8B0000] text-xs">{f.precio.toFixed(2)}€</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); abrirEnMapasExternos(barSeleccionado.latitud, barSeleccionado.longitud); }} className="w-full mt-3 bg-blue-50 text-blue-600 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1">🚗 Cómo llegar</button>
                </div>
              </Overlay>
            )}
          </Map>
        )}
        <div className="absolute top-5 left-4 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white/50 z-10 flex items-center gap-2 pointer-events-none">
          <Image src="/logobirradar.png" alt="Logo" width={24} height={24} className="object-contain" />
          <h1 className="font-black text-lg tracking-tight text-[#8B0000] italic">Birradar</h1>
        </div>
<div className="absolute top-5 right-4 z-10 flex flex-col gap-2 items-end">
          {usuario ? (
            <button onClick={(e) => { e.stopPropagation(); setVistaPerfil('yo'); setMenuPerfilAbierto(true); }} className="bg-white/90 backdrop-blur-md p-1 rounded-full shadow-sm border border-white/50 cursor-pointer relative hover:scale-105 transition-transform">
              <img src={usuario.user_metadata.avatar_url} className="w-10 h-10 rounded-full" />
              <span className="absolute -bottom-1 -right-1 bg-[#8B0000] text-white font-black text-[9px] rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">{perfil?.nivel || 1}</span>
            </button>
          ) : <button onClick={iniciarSesionConGoogle} className="bg-white/90 px-4 py-2 rounded-full shadow-sm border border-white/50 font-bold text-xs">👤 Entrar</button>}
          
          <button onClick={obtenerUbicacion} className="bg-white/90 backdrop-blur-md w-12 h-12 flex items-center justify-center rounded-full shadow-sm border border-white/50 text-lg text-blue-600 active:scale-95 transition-all">📍</button>

          {/* --- BOTONES DE ZOOM (AHORA SÍ, BIEN COLOCADOS) --- */}
          <div className="flex flex-col bg-white/90 backdrop-blur-md rounded-[1rem] shadow-sm border border-white/50 overflow-hidden mt-1">
            <button 
              onClick={() => setZoom(Math.min(zoom + 1, 18))} 
              className="w-12 h-11 flex items-center justify-center text-2xl font-light text-gray-700 hover:bg-gray-100 border-b border-gray-200 active:bg-gray-200 transition-colors"
            >
              +
            </button>
            <button 
              onClick={() => setZoom(Math.max(zoom - 1, 5))} 
              className="w-12 h-11 flex items-center justify-center text-3xl font-light text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              -
            </button>
          </div>
        </div>
      </div>

      {/* --- LISTA DE BARES --- */}
      <div className="h-[55%] bg-[#F9FAFB] relative z-20 -mt-6 rounded-t-3xl shadow-[0_-8px_20px_-5px_rgba(0,0,0,0.1)] p-5 overflow-y-auto pb-24">
        <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mb-4"></div>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none">🔍</span>
            <input type="text" placeholder="Buscar un bar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full bg-white border border-gray-100 rounded-full py-2.5 pl-9 pr-4 text-xs font-medium outline-none focus:ring-2 focus:ring-[#8B0000] shadow-sm transition-all" />
          </div>
          <button onClick={() => setMostrarFiltros(!mostrarFiltros)} className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1 transition-colors border ${mostrarFiltros ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border-gray-100'}`}>⚙️ Filtros</button>
        </div>

        {mostrarFiltros && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-5 grid grid-cols-3 gap-3 text-[11px] animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="font-bold text-[9px] text-gray-500 uppercase mb-1 block">Marca</label>
              <select value={filtroMarca} onChange={(e) => setFiltroMarca(e.target.value)} className="w-full bg-gray-50 rounded-lg p-2 font-medium outline-none border-none ring-1 ring-gray-100">
                <option value="">Todas</option>
                {marcasCerveza.map(m => <option key={m} value={m}>{m.replace(/[^a-zA-Z. /ñáó]/g, "")}</option>)}
              </select>
            </div>
            <div>
              <label className="font-bold text-[9px] text-gray-500 uppercase mb-1 block">Tapa</label>
              <select value={filtroTapa} onChange={(e) => setFiltroTapa(e.target.value)} className="w-full bg-gray-50 rounded-lg p-2 font-medium outline-none border-none ring-1 ring-gray-100">
                <option value="">Todas</option>
                <option value="No">No</option><option value="Simple">Simple</option><option value="Contundente">Top</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-[9px] text-gray-500 uppercase mb-1 block">Máx: {filtroPrecioMax.toFixed(2)}€</label>
              <input type="range" min="1.00" max="6.00" step="0.20" value={filtroPrecioMax} onChange={(e) => setFiltroPrecioMax(parseFloat(e.target.value))} className="w-full accent-[#8B0000] mt-2" />
            </div>
          </div>
        )}

        <div className="space-y-3">
          {rankingProcesado.map((bar, index) => (
            <button key={bar.id} onClick={() => irAlBar(bar)} className={`w-full bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between transition-all text-left ${barSeleccionado?.id === bar.id ? 'ring-2 ring-[#D4AF37] bg-amber-50/50' : 'border border-gray-100'}`}>
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-lg flex-shrink-0 border border-gray-100 relative">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "📍"}
                  <span className="absolute -bottom-1 -right-2 bg-gray-800 text-white text-[8px] font-black px-1.5 rounded-full">{bar.numResenas}</span>
                </div>
                <div className="truncate pr-2">
                  <h3 className="font-bold text-gray-900 capitalize truncate text-base">{bar.nombre}</h3>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    <span className="truncate">{bar.marca_calculada.split(" ")[0]} {bar.formatos.map((f: any) => f.formato).join(", ")}</span>
                    <span className="text-blue-600 font-bold ml-1.5">{bar.distanciaKm < 1 ? `${Math.round(bar.distanciaKm * 1000)}m` : `${bar.distanciaKm.toFixed(1)}km`}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="font-black text-[#8B0000] text-lg"><span className="text-[9px] text-gray-400 uppercase mr-0.5">Desde</span>{bar.precio_calculado.toFixed(2)}€</span>
                {bar.tapa_calculada === 'Contundente' && <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full mt-1">Tapa Top</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* --- BOTÓN FLOTANTE --- */}
      <button onClick={iniciarCreacionResena} className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white font-black py-3.5 px-8 rounded-full shadow-xl shadow-red-900/20 text-base z-30 transition-transform active:scale-95 ${usuario ? 'bg-[#8B0000]' : 'bg-gray-800'}`}>
        {usuario ? "🍺 Añadir Bar" : "🔒 Entra para Reseñar"}
      </button>

      {/* --- MENÚ PERFIL & RANKING --- */}
      {menuPerfilAbierto && usuario && (
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex flex-col justify-end sm:justify-center items-center sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl text-center animate-in slide-in-from-bottom-8">
            <button onClick={() => setMenuPerfilAbierto(false)} className="absolute top-5 right-5 bg-gray-100 text-gray-500 rounded-full w-8 h-8 font-bold flex items-center justify-center">✕</button>
            <div className="flex bg-gray-100 p-1 rounded-2xl mb-6 mt-4">
              <button onClick={() => setVistaPerfil('yo')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${vistaPerfil === 'yo' ? 'bg-white shadow-sm text-[#8B0000]' : 'text-gray-500'}`}>Mi Perfil</button>
              <button onClick={() => setVistaPerfil('ranking')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${vistaPerfil === 'ranking' ? 'bg-white shadow-sm text-[#8B0000]' : 'text-gray-500'}`}>🏆 Top 10</button>
            </div>

            {vistaPerfil === 'yo' ? (
              <div className="animate-in fade-in duration-300">
                <div className="relative inline-block mb-4">
                  <img src={usuario.user_metadata.avatar_url} className="w-24 h-24 mx-auto rounded-full border-4 border-white shadow-lg" />
                  <span className="absolute bottom-0 right-0 bg-[#D4AF37] text-white font-black text-sm rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-sm">{perfil?.nivel || 1}</span>
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{usuario.user_metadata.full_name}</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{obtenerTituloGamificacion(perfil?.nivel || 1)}</p>

                <div className="mt-6 bg-amber-50 p-5 rounded-2xl border border-amber-100/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-amber-900 text-[10px] uppercase">Progreso Nivel {perfil?.nivel || 1}</span>
                    <span className="text-[10px] text-amber-700 font-bold">{xpActualNivel} / {xpParaSiguienteNivel} XP</span>
                  </div>
                  <div className="w-full bg-amber-200/50 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#D4AF37] h-full transition-all duration-700" style={{ width: `${porcentajeProgreso}%` }}></div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="text-2xl block mb-1">🍺</span>
                    <p className="font-black text-gray-900 text-xl">{baresDescubiertos}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Descubiertos</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="text-2xl block mb-1">🏆</span>
                    <p className="font-black text-[#D4AF37] text-xl">{perfil?.xp || 0}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Puntos XP</p>
                  </div>
                </div>

                {/* --- BOTONES DE ACCIÓN (Compartir & Salir) --- */}
                <div className="mt-6 space-y-3">
                  <button onClick={compartirApp} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2 text-sm active:scale-[0.98] transition-all">
                    <span>📲</span> Compartir Birradar
                  </button>
                  <button onClick={cerrarSesion} className="w-full text-red-500 font-bold py-2 text-xs hover:text-red-600">Cerrar sesión</button>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-4 max-h-[400px] overflow-y-auto space-y-3 text-left pr-2">
                {rankingUsuarios.map((u, i) => (
                  <div key={u.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <div className={`font-black w-6 text-center text-lg ${i === 0 ? 'text-[#D4AF37]' : i === 1 ? 'text-gray-400' : 'text-amber-700'}`}>{i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}</div>
                    <div className="relative"><img src={u.avatar_url} className="w-10 h-10 rounded-full" /><span className="absolute -bottom-1 -right-1 bg-gray-800 text-white font-black text-[8px] rounded-full w-4 h-4 flex items-center justify-center">{u.nivel}</span></div>
                    <div className="flex-1 truncate"><h4 className="font-black text-gray-900 text-sm truncate">{u.nombre}</h4><p className="text-[8px] text-gray-400 font-bold uppercase">{obtenerTituloGamificacion(u.nivel)}</p></div>
                    <div className="font-black text-[#8B0000] text-sm bg-red-50 px-2 py-1 rounded-lg border border-red-100">{u.xp} XP</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- FORMULARIO DE RESEÑA --- */}
      {abrirResena && (
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex flex-col justify-end animate-in fade-in">
          <div className="bg-white rounded-t-[2.5rem] p-6 h-[90%] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center mb-6">
              <div><h2 className="text-2xl font-black text-gray-900 tracking-tight">{modoAuditoria ? 'Auditoría' : 'Nuevo Bar'}</h2>{modoAuditoria && <p className="text-[10px] font-black text-amber-600 uppercase mt-1">Gana +5 XP auditando</p>}</div>
              <button onClick={() => setAbrirResena(false)} className="bg-gray-100 text-gray-500 rounded-full w-8 h-8 font-bold">✕</button>
            </div>
            <div className="space-y-6">
              <div><label className="font-bold text-gray-400 uppercase text-[10px] mb-1.5 block">Nombre del Local</label><input type="text" placeholder="Ej: Bar Fide..." value={nombreBar} onChange={(e) => setNombreBar(e.target.value)} disabled={!!modoAuditoria} className={`w-full border-none ring-1 rounded-xl p-3.5 font-bold outline-none ${modoAuditoria ? 'bg-amber-50 ring-amber-200 text-amber-900' : 'bg-gray-50 ring-gray-200 focus:ring-2 focus:ring-[#8B0000]'}`} /></div>
              <div><label className="font-bold text-gray-400 uppercase text-[10px] mb-2 block">Cerveza</label><div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-1 bg-gray-50 rounded-xl border border-gray-100 shadow-inner">
                {marcasCerveza.map((m) => (
                  <button key={m} onClick={() => setMarca(m)} className={`py-2.5 px-3 border rounded-xl text-left text-xs font-bold transition-all truncate flex items-center justify-between ${marca === m ? 'bg-[#8B0000] text-white border-[#8B0000] shadow-md' : 'text-gray-700 bg-white border-gray-200'}`}><span>{m}</span>{marca === m && <span>✓</span>}</button>
                ))}
              </div></div>
              <div><label className="font-bold text-gray-400 uppercase text-[10px] mb-1.5 block">Tamaño</label><div className="grid grid-cols-3 gap-2">{['Caña', 'Doble', 'Tercio'].map((f) => (<button key={f} onClick={() => setFormato(f)} className={`py-3 border rounded-xl font-bold text-xs ${formato === f ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 bg-white border-gray-200'}`}>{f}</button>))}</div></div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><label className="font-bold text-gray-400 uppercase text-[10px] flex justify-between items-center mb-3">Precio <span className="text-[#8B0000] text-lg font-black">{precio.toFixed(2)}€</span></label><input type="range" min="1.00" max="6.00" step="0.10" value={precio} onChange={(e) => setPrecio(parseFloat(e.target.value))} className="w-full accent-[#8B0000] py-2"/></div>
              <div><label className="font-bold text-gray-400 uppercase text-[10px] mb-1.5 block">¿Tapa?</label><div className="grid grid-cols-3 gap-2">
                {['No', 'Simple', 'Contundente'].map(t => (<button key={t} onClick={() => setTapa(t)} className={`py-4 border rounded-xl text-2xl flex flex-col items-center gap-1 transition-all ${tapa === t ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-200' : 'bg-white border-gray-200'}`}><span>{t==='No'?'❌':t==='Simple'?'🫒':'🍲'}</span><span className="text-[8px] font-bold text-gray-400 uppercase">{t}</span></button>))}
              </div></div>
              <button onClick={enviarDatos} className="w-full bg-gradient-to-r from-[#8B0000] to-[#6b0000] text-white font-black py-4 rounded-2xl shadow-lg disabled:opacity-50 text-base" disabled={!nombreBar || !marca || !formato || !tapa || cargando}>{cargando ? 'Enviando...' : (modoAuditoria ? '✅ Añadir a la Carta' : '🚀 Subir Nuevo Bar')}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}