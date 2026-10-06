import React, { useState, useEffect, useRef } from 'react';
import { CityLocation } from '../types';
import { Layers, ZoomIn, ZoomOut, X, Maximize2, Minimize2, MapPin, ExternalLink } from 'lucide-react';

interface SatelliteTileViewerProps {
  location: CityLocation;
  onClose: () => void;
}

// Convert Lat/Lng to Slippy Map Tile numbers at zoom level Z
function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = 2 ** zoom;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

export const SatelliteTileViewer: React.FC<SatelliteTileViewerProps> = ({ location, onClose }) => {
  const [zoom, setZoom] = useState(14); // City level zoom (12 to 17)
  const [isExpanded, setIsExpanded] = useState(false);
  const [tileOffset, setTileOffset] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Reset offset when location or zoom changes
  useEffect(() => {
    setTileOffset({ x: 0, y: 0 });
  }, [location.id, zoom]);

  const { x: centerTileX, y: centerTileY } = latLngToTile(location.lat, location.lng, zoom);

  // Generate 3x3 grid of surrounding satellite tiles
  const tiles: { key: string; x: number; y: number; offsetX: number; offsetY: number; url: string }[] = [];
  const gridSize = isExpanded ? 5 : 3;
  const halfGrid = Math.floor(gridSize / 2);

  for (let dx = -halfGrid; dx <= halfGrid; dx++) {
    for (let dy = -halfGrid; dy <= halfGrid; dy++) {
      const tileX = centerTileX + dx;
      const tileY = centerTileY + dy;
      // Esri ArcGIS World Imagery Tile Service
      const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${tileY}/${tileX}`;
      tiles.push({
        key: `${zoom}-${tileX}-${tileY}`,
        x: tileX,
        y: tileY,
        offsetX: dx * 256,
        offsetY: dy * 256,
        url,
      });
    }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - tileOffset.x, y: e.clientY - tileOffset.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    setTileOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      className={`absolute z-30 transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl border border-amber-500/50 bg-[#0a0d14]/95 backdrop-blur-xl flex flex-col ${
        isExpanded
          ? 'inset-3 sm:inset-6'
          : 'bottom-4 left-4 right-4 sm:right-auto sm:w-[380px] h-[320px]'
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0e1320] border-b border-white/10 z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{location.nameUz || location.name}</span>
              <span className="text-[10px] text-amber-300 font-mono font-normal">
                (Sun'iy yo'ldosh xaritasi)
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Masshtab: {zoom}x · Esri World Imagery
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Kichraytirish' : 'Kattalashtirish'}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            title="Yopish"
            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Tile Canvas Area */}
      <div
        className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing bg-[#02050b]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${tileOffset.x}px, ${tileOffset.y}px)`,
          }}
        >
          {tiles.map((t) => (
            <img
              key={t.key}
              src={t.url}
              alt="Satellite tile"
              className="absolute w-[256px] h-[256px] object-cover pointer-events-none select-none transition-opacity duration-300"
              style={{
                transform: `translate(${t.offsetX}px, ${t.offsetY}px)`,
              }}
              onError={(e) => {
                // Fallback tile styling
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ))}

          {/* Center Target Pin */}
          <div className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="w-6 h-6 rounded-full border-2 border-amber-400 bg-amber-500/30 flex items-center justify-center animate-pulse">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
            <div className="mt-1 px-2 py-0.5 rounded-md bg-[#000000]/80 backdrop-blur-md text-[10px] text-amber-200 border border-amber-500/40 whitespace-nowrap font-semibold">
              {location.nameUz || location.name} markazi
            </div>
          </div>
        </div>

        {/* Zoom Controls Overlay */}
        <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => Math.min(17, z + 1));
            }}
            disabled={zoom >= 17}
            title="Yaqinlashtirish (Ko'chalar va binolar)"
            className="p-2 rounded-xl bg-[#0e1320]/90 hover:bg-white/10 text-white border border-white/10 backdrop-blur-md disabled:opacity-40 transition-colors shadow-lg"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => Math.max(11, z - 1));
            }}
            disabled={zoom <= 11}
            title="Uzoqlashtirish"
            className="p-2 rounded-xl bg-[#0e1320]/90 hover:bg-white/10 text-white border border-white/10 backdrop-blur-md disabled:opacity-40 transition-colors shadow-lg"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Informative footer chip */}
        <div className="absolute bottom-3 left-3 z-20 px-2.5 py-1 rounded-lg bg-[#000000]/80 backdrop-blur-md border border-white/10 text-[10px] text-slate-300 pointer-events-none">
          <span>Surish orqali xaritani yurgizing</span>
        </div>
      </div>
    </div>
  );
};
