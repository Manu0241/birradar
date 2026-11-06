"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Modo = "inicio" | "registro" | "codigo" | "recuperar" | "nuevaClave";

// Traduce los errores de Supabase a mensajes que se entienden
function mensajeError(msg: string) {
  if (msg.startsWith("Pon ")) return msg; // mensajes propios, ya en castellano
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Aún no has verificado tu correo. Te hemos enviado un código nuevo.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Ya hay una cuenta con este correo. Entra o recupera tu contraseña.";
  if (m.includes("expired") || (m.includes("invalid") && m.includes("token"))) return "El código no es correcto o ha caducado. Pide uno nuevo.";
  if (m.includes("not authorized")) return "Ahora mismo no podemos enviar correos a esta dirección. Entra con Google o inténtalo más tarde.";
  if (m.includes("rate limit") || m.includes("security purposes")) return "Hemos enviado demasiados correos seguidos. Espera un minuto y vuelve a intentarlo.";
  if (m.includes("password") && m.includes("characters")) return "La contraseña tiene que tener al menos 8 caracteres.";
  if (m.includes("valid email") || m.includes("invalid email")) return "Ese correo no parece válido.";
  return "No se ha podido completar. Revisa los datos e inténtalo de nuevo.";
}

function IconoGoogle() {
  return (
    <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

const campo =
  "w-full rounded-2xl border-0 bg-white px-4 py-3.5 text-[16px] font-medium outline-none ring-1 ring-tinta/10 placeholder:text-tinta/40 focus:ring-2 focus:ring-ambar";

export default function Acceso({ onCerrar, onEntrado }: { onCerrar: () => void; onEntrado: (texto: string) => void }) {
  const [modo, setModo] = useState<Modo>("inicio");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [codigo, setCodigo] = useState("");
  const [paraRecuperar, setParaRecuperar] = useState(false); // el código es para cambiar la contraseña
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [espera, setEspera] = useState(0); // segundos hasta poder reenviar el código
  const temporizador = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (temporizador.current) clearInterval(temporizador.current);
  }, []);

  const empezarEspera = () => {
    setEspera(60);
    if (temporizador.current) clearInterval(temporizador.current);
    temporizador.current = setInterval(() => setEspera((s) => (s <= 1 ? (clearInterval(temporizador.current!), 0) : s - 1)), 1000);
  };

  const ir = (m: Modo) => {
    setError(null);
    setModo(m);
  };

  const conGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) setError(mensajeError(error.message));
  };

  const ejecutar = async (accion: () => Promise<void>) => {
    setError(null);
    setOcupado(true);
    try {
      await accion();
    } catch (e) {
      setError(mensajeError(e instanceof Error ? e.message : String(e)));
    } finally {
      setOcupado(false);
    }
  };

  const entrar = () =>
    ejecutar(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: clave });
      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          await supabase.auth.resend({ type: "signup", email: email.trim() });
          setParaRecuperar(false);
          empezarEspera();
          setModo("codigo");
        }
        throw error;
      }
      onEntrado("¡Hola de nuevo!");
    });

  const registrar = () =>
    ejecutar(async () => {
      if (nombre.trim().length < 2) throw new Error("Pon un nombre de usuario de al menos 2 letras.");
      if (clave.length < 8) throw new Error("password should be at least 8 characters");
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: clave,
        options: { data: { full_name: nombre.trim() } },
      });
      if (error) throw error;
      // Supabase no avisa si el correo ya existía: en ese caso no devuelve identidades
      if (data.user && data.user.identities && data.user.identities.length === 0) throw new Error("already registered");
      setParaRecuperar(false);
      empezarEspera();
      setModo("codigo");
    });

  const verificar = () =>
    ejecutar(async () => {
      const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: codigo.trim(), type: paraRecuperar ? "recovery" : "signup" });
      if (error) throw error;
      if (paraRecuperar) {
        setClave("");
        setModo("nuevaClave");
      } else onEntrado("Cuenta verificada. ¡Bienvenido a Birradar!");
    });

  const reenviar = () =>
    ejecutar(async () => {
      const { error } = paraRecuperar
        ? await supabase.auth.resetPasswordForEmail(email.trim())
        : await supabase.auth.resend({ type: "signup", email: email.trim() });
      if (error) throw error;
      empezarEspera();
    });

  const pedirRecuperacion = () =>
    ejecutar(async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      setParaRecuperar(true);
      setCodigo("");
      empezarEspera();
      setModo("codigo");
    });

  const guardarNuevaClave = () =>
    ejecutar(async () => {
      if (clave.length < 8) throw new Error("password should be at least 8 characters");
      const { error } = await supabase.auth.updateUser({ password: clave });
      if (error) throw error;
      onEntrado("Contraseña cambiada. Ya has entrado.");
    });

  const titulos: Record<Modo, [string, string]> = {
    inicio: ["Entra en Birradar", "Para añadir precios y sumar puntos."],
    registro: ["Crea tu cuenta", "Te enviaremos un código para verificar tu correo."],
    codigo: ["Revisa tu correo", `Hemos enviado un código de 6 dígitos a ${email.trim()}.`],
    recuperar: ["¿Olvidaste tu contraseña?", "Te enviamos un código para crear una nueva."],
    nuevaClave: ["Nueva contraseña", "Elige una contraseña de al menos 8 caracteres."],
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end bg-tinta/40 backdrop-blur-[2px]" onClick={onCerrar}>
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={titulos[modo][0]}
        className="entra mx-auto max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-[32px] bg-zinc-barra px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[26px] font-extrabold leading-tight tracking-[-0.03em]">{titulos[modo][0]}</h2>
            <p className="mt-1 text-sm text-tinta/60">{titulos[modo][1]}</p>
          </div>
          <button onClick={onCerrar} aria-label="Cerrar" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-lg font-bold">
            ✕
          </button>
        </div>

        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (ocupado) return;
            ({ inicio: entrar, registro: registrar, codigo: verificar, recuperar: pedirRecuperacion, nuevaClave: guardarNuevaClave })[modo]();
          }}
        >
          {modo === "inicio" && (
            <>
              <button type="button" onClick={conGoogle} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-3.5 text-[16px] font-bold ring-1 ring-tinta/10">
                <IconoGoogle /> Continuar con Google
              </button>
              <div className="flex items-center gap-3 py-1 text-[13px] font-semibold text-tinta/45">
                <span className="h-px flex-1 bg-tinta/10" /> o con tu correo <span className="h-px flex-1 bg-tinta/10" />
              </div>
            </>
          )}

          {modo === "registro" && (
            <label className="block">
              <span className="mb-1 block text-[14px] font-bold">Nombre de usuario</span>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={30} autoComplete="nickname" placeholder="Así te verán en el ranking" className={campo} />
            </label>
          )}

          {(modo === "inicio" || modo === "registro" || modo === "recuperar") && (
            <label className="block">
              <span className="mb-1 block text-[14px] font-bold">Correo</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="tu@correo.com" className={campo} />
            </label>
          )}

          {(modo === "inicio" || modo === "registro" || modo === "nuevaClave") && (
            <label className="block">
              <span className="mb-1 block text-[14px] font-bold">{modo === "nuevaClave" ? "Nueva contraseña" : "Contraseña"}</span>
              <input
                type="password"
                required
                minLength={modo === "inicio" ? 1 : 8}
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                autoComplete={modo === "inicio" ? "current-password" : "new-password"}
                placeholder={modo === "inicio" ? "" : "Mínimo 8 caracteres"}
                className={campo}
              />
            </label>
          )}

          {modo === "codigo" && (
            <label className="block">
              <span className="sr-only">Código de 6 dígitos</span>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full rounded-2xl border-0 bg-white py-4 text-center text-[40px] font-extrabold tracking-[0.35em] tabular-nums outline-none ring-1 ring-tinta/10 placeholder:text-tinta/15 focus:ring-2 focus:ring-ambar"
              />
            </label>
          )}

          {error && (
            <p role="alert" className="rounded-2xl bg-granate/10 px-4 py-3 text-[14px] font-semibold text-granate">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={ocupado || (modo === "codigo" && codigo.length !== 6)}
            className="w-full rounded-2xl bg-granate py-4 text-[17px] font-bold text-white disabled:bg-tinta/15 disabled:text-tinta/45"
          >
            {ocupado
              ? "Un momento…"
              : { inicio: "Entrar", registro: "Crear cuenta", codigo: "Verificar código", recuperar: "Enviarme el código", nuevaClave: "Guardar contraseña" }[modo]}
          </button>
        </form>

        <div className="mt-4 space-y-2 text-center text-[14px]">
          {modo === "inicio" && (
            <>
              <p>
                ¿No tienes cuenta?{" "}
                <button onClick={() => ir("registro")} className="font-bold text-granate underline underline-offset-2">
                  Crea una
                </button>
              </p>
              <button onClick={() => ir("recuperar")} className="font-semibold text-tinta/55 underline underline-offset-2">
                ¿Olvidaste tu contraseña?
              </button>
            </>
          )}
          {modo === "registro" && (
            <p>
              ¿Ya tienes cuenta?{" "}
              <button onClick={() => ir("inicio")} className="font-bold text-granate underline underline-offset-2">
                Entra
              </button>
            </p>
          )}
          {modo === "codigo" && (
            <>
              <button onClick={reenviar} disabled={espera > 0 || ocupado} className="font-bold text-granate underline underline-offset-2 disabled:text-tinta/40 disabled:no-underline">
                {espera > 0 ? `Reenviar código en ${espera} s` : "Reenviar código"}
              </button>
              <p className="text-[13px] text-tinta/50">Mira también en la carpeta de spam.</p>
            </>
          )}
          {(modo === "recuperar" || modo === "codigo") && (
            <button onClick={() => ir("inicio")} className="block w-full font-semibold text-tinta/55 underline underline-offset-2">
              Volver
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
