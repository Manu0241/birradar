"use client";
import { useEffect, useState } from "react";

const PASOS = [
  { icono: "🍺", titulo: "¿Cuánto cuesta la caña aquí?", texto: "Birradar te enseña el precio de la caña en los bares de tu zona antes de sentarte." },
  { icono: "📍", titulo: "Cada posavasos es un bar", texto: "El número es lo que cuesta la cerveza más barata. Los amarillos más claros son chollos." },
  { icono: "✍️", titulo: "Tú pones los precios", texto: "Cuando estés en un bar, pulsa «Añadir precio». Ganas 10 XP por bar nuevo y 5 por actualizar uno." },
  { icono: "🤝", titulo: "Precios de la gente", texto: "Mostramos el precio que más se repite en las últimas reseñas, así un error no estropea nada." },
  { icono: "🏆", titulo: "Gana la semana", texto: "El ranking semanal se reinicia cada lunes. Aporta días seguidos para sumar racha y corónate rey de tu bar." },
];

type Props = {
  onTerminar: () => void;
  onInstalar: (() => void) | null; // Android/Chrome: abre el diálogo de instalación
};

export default function Bienvenida({ onTerminar, onInstalar }: Props) {
  const [paso, setPaso] = useState(0);
  const [entorno, setEntorno] = useState<{ ios: boolean; instalada: boolean }>({ ios: false, instalada: false });

  useEffect(() => {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const instalada =
      window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setEntorno({ ios, instalada });
  }, []);

  // Último paso: tenerla en la pantalla de inicio (no se muestra si ya está instalada)
  const pasos = entorno.instalada
    ? PASOS
    : [
        ...PASOS,
        {
          icono: "📲",
          titulo: "Tenla en tu pantalla de inicio",
          texto: entorno.ios
            ? "En Safari, pulsa el botón Compartir (el cuadrado con la flecha hacia arriba) y luego «Añadir a pantalla de inicio»."
            : onInstalar
              ? "Pulsa «Instalar» y tendrás Birradar como una app más, sin descargar nada de la tienda."
              : "En el menú del navegador (⋮), pulsa «Instalar aplicación» o «Añadir a pantalla de inicio».",
        },
      ];
  const p = pasos[Math.min(paso, pasos.length - 1)];
  const ultimo = paso >= pasos.length - 1;
  const puedeInstalar = ultimo && !entorno.instalada && !entorno.ios && !!onInstalar;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-tinta/60 p-4 backdrop-blur-sm sm:items-center">
      <div key={paso} className="entra w-full max-w-sm rounded-[32px] bg-white p-7">
        <span className="posavasos h-20 w-20 text-4xl">
          <span className="relative z-10">{p.icono}</span>
        </span>
        <h2 className="mt-5 text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em]">{p.titulo}</h2>
        <p className="mt-3 text-[16px] leading-relaxed text-tinta/65">{p.texto}</p>

        <div className="mt-7 flex items-center justify-between">
          <div className="flex gap-1.5" aria-label={`Paso ${paso + 1} de ${pasos.length}`}>
            {pasos.map((_, i) => (
              <span key={i} className={`h-2 rounded-full transition-all ${i === paso ? "w-6 bg-granate" : "w-2 bg-tinta/15"}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {!ultimo && (
              <button onClick={onTerminar} className="px-3 py-2 text-sm font-semibold text-tinta/50">
                Saltar
              </button>
            )}
            {puedeInstalar && (
              <button onClick={onTerminar} className="px-3 py-2 text-sm font-semibold text-tinta/50">
                Ahora no
              </button>
            )}
            <button
              onClick={() => {
                if (!ultimo) return setPaso(paso + 1);
                if (puedeInstalar) onInstalar?.();
                onTerminar();
              }}
              className="rounded-full bg-granate px-6 py-3 text-[15px] font-bold text-white"
            >
              {!ultimo ? "Siguiente" : puedeInstalar ? "Instalar" : "Empezar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
