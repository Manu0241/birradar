"use client";
import { Map, Overlay } from "pigeon-maps";
import type { Bar, Coordenadas } from "@/lib/bares";
import { euros } from "@/lib/bares";

// Mapa de Mapbox con tu token (si no hay token, mapa normal de OpenStreetMap)
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const proveedor = (x: number, y: number, z: number, dpr?: number) =>
  TOKEN
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/${z}/${x}/${y}${dpr && dpr >= 2 ? "@2x" : ""}?access_token=${TOKEN}`
    : `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

type Props = {
  centro: Coordenadas;
  zoom: number;
  bares: Bar[];
  miUbicacion: Coordenadas | null;
  seleccionadoId: string | null;
  onMover: (centro: Coordenadas, zoom: number) => void;
  onElegirBar: (bar: Bar) => void;
  onTocarMapa: () => void;
};

export default function Mapa({ centro, zoom, bares, miUbicacion, seleccionadoId, onMover, onElegirBar, onTocarMapa }: Props) {
  const compacto = zoom < 14;

  return (
    <Map
      provider={proveedor}
      dprs={[1, 2]}
      center={centro}
      zoom={zoom}
      minZoom={5}
      maxZoom={19}
      onBoundsChanged={({ center, zoom }) => onMover(center, zoom)}
      onClick={onTocarMapa}
      attribution={
        <span className="text-[10px]">
          {TOKEN && (
            <>
              © <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noreferrer">Mapbox</a>{" "}
            </>
          )}
          © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>
        </span>
      }
      attributionPrefix={false}
    >
      {bares.map((bar) => {
        const activo = bar.id === seleccionadoId;
        const tam = activo ? 58 : compacto ? 18 : 46;
        return (
          <Overlay key={bar.id} anchor={[bar.latitud, bar.longitud]} offset={[tam / 2, tam / 2]}>
            <button
              type="button"
              onClick={() => onElegirBar(bar)}
              aria-label={`${bar.nombre}, desde ${euros(bar.precioDesde)} euros`}
              className="posavasos transition-all duration-200"
              data-activo={activo}
              data-chollo={bar.chollo}
              style={{ width: tam, height: tam, fontSize: activo ? 15 : 13, zIndex: activo ? 10 : 1 }}
            >
              {!compacto || activo ? <span className="relative z-10">{euros(bar.precioDesde)}</span> : null}
            </button>
          </Overlay>
        );
      })}

      {miUbicacion && (
        <Overlay anchor={miUbicacion} offset={[9, 9]}>
          <span className="punto-yo relative block h-[18px] w-[18px] rounded-full" aria-label="Tu ubicación">
            <span className="absolute inset-0 rounded-full border-[3px] border-white bg-blue-600 shadow-md" />
          </span>
        </Overlay>
      )}
    </Map>
  );
}
