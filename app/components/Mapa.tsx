"use client";
import { Map, Overlay } from "pigeon-maps";
import type { Bar, Coordenadas } from "@/lib/bares";
import { euros } from "@/lib/bares";

// Mapa claro de CARTO (gratis con atribución), más limpio que el de OSM por defecto
const cartoVoyager = (x: number, y: number, z: number, dpr?: number) =>
  `https://${"abcd"[(x + y) % 4]}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}${dpr && dpr >= 2 ? "@2x" : ""}.png`;

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
      provider={cartoVoyager}
      dprs={[1, 2]}
      center={centro}
      zoom={zoom}
      minZoom={5}
      maxZoom={19}
      onBoundsChanged={({ center, zoom }) => onMover(center, zoom)}
      onClick={onTocarMapa}
      attribution={
        <span className="text-[10px]">
          © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> ©{" "}
          <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>
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
