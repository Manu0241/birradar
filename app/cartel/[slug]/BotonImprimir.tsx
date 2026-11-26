"use client";

export default function BotonImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{ border: 0, borderRadius: 999, background: "#F4C542", color: "#1B1A18", fontWeight: 700, fontSize: 15, padding: "10px 18px", cursor: "pointer" }}
    >
      Imprimir o guardar PDF
    </button>
  );
}
