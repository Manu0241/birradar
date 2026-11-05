// Diseño de las imágenes que salen al compartir un enlace (WhatsApp, Instagram, X...)
export const TAM_SOCIAL = { width: 1200, height: 630 };

/** Bricolage Grotesque en negrita desde Google Fonts (si falla, se usa la letra por defecto). */
export async function fuentesSocial() {
  try {
    // Sin user-agent de navegador, Google devuelve TTF, que es lo que admite ImageResponse
    const css = await fetch("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@800").then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    if (!url) return [];
    const data = await fetch(url).then((r) => r.arrayBuffer());
    return [{ name: "Bricolage", data, weight: 800 as const, style: "normal" as const }];
  } catch {
    return [];
  }
}

export function ImagenSocial({ precio, titulo, subtitulo }: { precio: string; titulo: string; subtitulo: string }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#8B0000", padding: 70, alignItems: "center", position: "relative", fontFamily: "Bricolage" }}>
      <div style={{ position: "absolute", right: -120, top: -160, width: 520, height: 520, borderRadius: 9999, background: "rgba(0,0,0,0.18)", display: "flex" }} />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, color: "white", paddingRight: 40 }}>
        <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>Birradar</div>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, marginTop: 40, letterSpacing: -2 }}>{titulo}</div>
        <div style={{ fontSize: 34, marginTop: 24, color: "rgba(255,255,255,0.75)" }}>{subtitulo}</div>
      </div>
      <div
        style={{
          width: 400,
          height: 400,
          borderRadius: 9999,
          background: "#F4A81D",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 18px 0 rgba(0,0,0,0.28)",
        }}
      >
        <div
          style={{
            width: 352,
            height: 352,
            borderRadius: 9999,
            border: "6px dashed rgba(27,26,24,0.35)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#1B1A18",
          }}
        >
          <div style={{ fontSize: precio.length > 4 ? 120 : 150, fontWeight: 800, letterSpacing: -6, display: "flex" }}>{precio}</div>
          <div style={{ fontSize: 36, fontWeight: 700, display: "flex" }}>{precio === "?" ? "la caña" : "€ la más barata"}</div>
        </div>
      </div>
    </div>
  );
}
