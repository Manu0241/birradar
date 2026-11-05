"use client";
import { useCallback, useEffect, useState } from "react";

type AvisoInstalacion = Event & { prompt: () => Promise<void>; userChoice?: Promise<{ outcome: string }> };

export type Instalacion = {
  instalada: boolean; // ya se abre como app desde la pantalla de inicio
  ios: boolean; // iPhone/iPad: solo se puede añadir a mano desde Compartir
  compartirArriba: boolean; // dónde está el botón Compartir (iPad y Chrome en iOS: arriba; Safari en iPhone: abajo)
  nativo: boolean; // el navegador permite lanzar su propio aviso de instalación (Android/Chrome)
  disponible: boolean; // hay alguna forma de instalarla desde aquí
  instalarNativo: () => void;
};

/** Detecta si Birradar se puede instalar en este móvil y cómo. */
export function useInstalacion(): Instalacion {
  const [aviso, setAviso] = useState<AvisoInstalacion | null>(null);
  const [entorno, setEntorno] = useState({ instalada: false, ios: false, compartirArriba: false });

  useEffect(() => {
    const ua = navigator.userAgent;
    const ipad = /iPad/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const ios = /iPhone|iPod/.test(ua) || ipad;
    const instalada =
      window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setEntorno({ instalada, ios, compartirArriba: ipad || /CriOS|FxiOS|EdgiOS/.test(ua) });

    const guardar = (e: Event) => {
      e.preventDefault();
      setAviso(e as AvisoInstalacion);
    };
    const instalado = () => {
      setAviso(null);
      setEntorno((x) => ({ ...x, instalada: true }));
    };
    window.addEventListener("beforeinstallprompt", guardar);
    window.addEventListener("appinstalled", instalado);
    return () => {
      window.removeEventListener("beforeinstallprompt", guardar);
      window.removeEventListener("appinstalled", instalado);
    };
  }, []);

  const instalarNativo = useCallback(() => {
    if (!aviso) return;
    aviso.prompt().catch(() => {});
    setAviso(null); // el navegador solo deja usar el aviso una vez
  }, [aviso]);

  return {
    ...entorno,
    nativo: !!aviso,
    disponible: !entorno.instalada && (!!aviso || entorno.ios),
    instalarNativo,
  };
}
