import type { Bar } from "./bares";
import { euros } from "./bares";
import { urlBar } from "./datos";

const GRANATE = "#8B0000";
const AMBAR = "#F4A81D";
const TINTA = "#1B1A18";
const URL_APP = "birradar.vercel.app";

/** Corta un texto en líneas que quepan en `ancho` (máx. `maxLineas`). */
function lineas(ctx: CanvasRenderingContext2D, texto: string, ancho: number, maxLineas: number) {
  const palabras = texto.split(/\s+/);
  const res: string[] = [];
  let actual = "";
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (ctx.measureText(prueba).width > ancho && actual) {
      res.push(actual);
      actual = p;
    } else actual = prueba;
  }
  if (actual) res.push(actual);
  if (res.length > maxLineas) {
    res.length = maxLineas;
    res[maxLineas - 1] = res[maxLineas - 1].replace(/\s*\S*$/, "…");
  }
  return res;
}

/** Imagen 1080x1350 (formato vertical de Instagram/WhatsApp) con el precio en un posavasos gigante. */
export async function crearTarjeta(bar: Bar): Promise<Blob | null> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const fuente = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
  try {
    await document.fonts.ready;
  } catch {}

  // Fondo granate con una veta más oscura
  ctx.fillStyle = GRANATE;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.arc(W * 0.9, H * 0.08, 420, 0, Math.PI * 2);
  ctx.fill();

  // Cabecera
  ctx.fillStyle = "#fff";
  ctx.font = `800 64px ${fuente}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Birradar", 90, 150);
  ctx.font = `600 36px ${fuente}`;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("Lo que cuesta la caña, bar a bar", 90, 205);

  // Posavasos
  const cx = W / 2;
  const cy = 610;
  const r = 300;
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.arc(cx, cy + 18, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = AMBAR;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.setLineDash([22, 16]);
  ctx.lineWidth = 7;
  ctx.strokeStyle = "rgba(27,26,24,0.35)";
  ctx.beginPath();
  ctx.arc(cx, cy, r - 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const principal = bar.precios.find((p) => p.precio === bar.precioDesde) ?? bar.precios[0];
  ctx.fillStyle = TINTA;
  ctx.textAlign = "center";
  ctx.font = `800 190px ${fuente}`;
  ctx.fillText(euros(bar.precioDesde), cx, cy + 40);
  ctx.font = `700 54px ${fuente}`;
  ctx.fillText(`€ la ${principal?.formato.toLowerCase() ?? "caña"}`, cx, cy + 120);

  // Nombre del bar
  ctx.fillStyle = "#fff";
  ctx.font = `800 92px ${fuente}`;
  const nombre = bar.nombre.charAt(0).toUpperCase() + bar.nombre.slice(1);
  const ls = lineas(ctx, nombre, W - 180, 2);
  ls.forEach((l, i) => ctx.fillText(l, cx, 1060 + i * 100));

  if (bar.tapa !== "No") {
    ctx.font = `600 42px ${fuente}`;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText(bar.tapa === "Contundente" ? "Y con tapa de verdad" : "Y con tapa", cx, 1060 + ls.length * 100 + 10);
  }

  // Pie
  ctx.fillStyle = AMBAR;
  ctx.font = `700 40px ${fuente}`;
  ctx.fillText(URL_APP, cx, H - 70);

  return new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
}

/** Comparte la tarjeta (o la descarga si el navegador no deja compartir imágenes). */
export async function compartirTarjeta(bar: Bar) {
  const blob = await crearTarjeta(bar);
  const texto = `${bar.nombre}: ${euros(bar.precioDesde)} € la caña. Míralo en Birradar`;
  const url = urlBar(bar);
  if (blob) {
    const archivo = new File([blob], `birradar-${bar.nombre.toLowerCase().replace(/\W+/g, "-")}.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [archivo] })) {
      await navigator.share({ files: [archivo], text: `${texto} ${url}` });
      return "compartida";
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = archivo.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    return "descargada";
  }
  if (navigator.share) await navigator.share({ title: "Birradar", text: texto, url });
  else window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${texto} ${url}`)}`, "_blank");
  return "compartida";
}
