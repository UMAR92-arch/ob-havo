import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import * as THREE from 'three';
import { CityLocation, Season } from '../types';
import { WORLD_CITIES } from '../data/worldCities';
import { reverseGeocode } from '../services/weatherApi';
import { getSeasonTheme } from '../utils/seasonTheme';
import { SatelliteTileViewer } from './SatelliteTileViewer';
import {
  MapPin,
  Loader2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Compass,
  Layers,
  Sun,
  Sparkles,
  Timer,
  Globe2,
} from 'lucide-react';

interface Globe3DProps {
  selectedLocation: CityLocation | null;
  onSelectLocation: (location: CityLocation) => void;
  activeSeason?: string;
  simulatedSeason?: string;
  simulatedTempOffset?: number;
}

interface CityMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  country: string;
  isCapital: boolean;
  isSelected: boolean;
  population?: string;
  tier?: number;
  cityObj: CityLocation;
}

interface CountryFeature {
  type: string;
  properties: {
    ADMIN?: string;
    NAME?: string;
    NAME_LONG?: string;
    ISO_A2?: string;
    ISO_A3?: string;
    CONTINENT?: string;
    POP_EST?: number;
    [key: string]: any;
  };
  geometry: any;
}

// Calculate Sun position in 3D coordinates based on current UTC time
function getSunCartesianCoords(radius: number = 400): THREE.Vector3 {
  const now = new Date();
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  // Subsolar longitude (0° lon is at noon 12:00 UTC)
  const sunLng = (12 - utcHours) * 15;
  // Approximate solar declination for current day of year
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(Date.UTC(now.getUTCFullYear(), 0, 0)).getTime()) / 86400000
  );
  const sunLat = -23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10));

  const phi = (90 - sunLat) * (Math.PI / 180);
  const theta = (sunLng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

export const Globe3D: React.FC<Globe3DProps> = React.memo(({
  selectedLocation,
  onSelectLocation,
  activeSeason = 'kuz',
}) => {
  const theme = getSeasonTheme((activeSeason as Season) || 'kuz');
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);

  const [dimensions, setDimensions] = useState({ width: 700, height: 500 });
  const [isAutoRotateAllowed, setIsAutoRotateAllowed] = useState(true);
  const [isCurrentlyRotating, setIsCurrentlyRotating] = useState(true);
  const [inactivityCountdown, setInactivityCountdown] = useState<number | null>(null);

  const [currentAltitude, setCurrentAltitude] = useState<number>(1.8);
  const [countriesData, setCountriesData] = useState<CountryFeature[]>([]);
  const [hoveredCountry, setHoveredCountry] = useState<CountryFeature | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<CityMarker | null>(null);

  const [isResolvingPoint, setIsResolvingPoint] = useState(false);
  const [showSatelliteViewer, setShowSatelliteViewer] = useState(false);

  // References for inactivity timer logic
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoRotateAllowedRef = useRef(true);
  isAutoRotateAllowedRef.current = isAutoRotateAllowed;

  // 1. Fetch Country Boundaries GeoJSON (ne_110m_admin_0_countries)
  useEffect(() => {
    let isMounted = true;
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then((res) => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then((data) => {
        if (isMounted && data?.features) {
          setCountriesData(data.features);
        }
      })
      .catch((err) => {
        console.warn('Failed to load primary country boundaries GeoJSON, using fallback:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Resize listener
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 700,
          height: containerRef.current.clientHeight || 500,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 3. User interaction handler with STRICT 6-second inactivity pause
  const handleUserInteraction = useCallback(() => {
    if (!isAutoRotateAllowedRef.current) return;

    // Immediately stop rotation
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      if (controls) controls.autoRotate = false;
    }
    setIsCurrentlyRotating(false);
    setInactivityCountdown(6);

    // Clear any previous timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // Countdown second by second
    let remaining = 6;
    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setInactivityCountdown(remaining);
      } else {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setInactivityCountdown(null);
      }
    }, 1000);

    // Exactly after 6 seconds of NO movement, resume auto-rotation
    inactivityTimerRef.current = setTimeout(() => {
      if (isAutoRotateAllowedRef.current && globeRef.current) {
        const controls = globeRef.current.controls();
        if (controls) controls.autoRotate = true;
        setIsCurrentlyRotating(true);
      }
      setInactivityCountdown(null);
    }, 6000);
  }, []);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // 4. Continuous Camera Zoom Level Watcher (Kamera zoom darajasini uzluksiz kuzatuvchi funksiya)
  useEffect(() => {
    let animId: number;
    let lastAltitude = -1;

    // Kamera zoom darajasini (altitude) doimiy kuzatib boradi
    const trackCameraZoom = () => {
      if (globeRef.current) {
        try {
          const pov = globeRef.current.pointOfView();
          if (pov && typeof pov.altitude === 'number') {
            if (Math.abs(pov.altitude - lastAltitude) >= 0.02) {
              lastAltitude = pov.altitude;
              setCurrentAltitude(pov.altitude);
            }
          }
        } catch {
          // Initsializatsiya davrida xatoliklarni e'tiborsiz qoldirish
        }
      }
      animId = requestAnimationFrame(trackCameraZoom);
    };

    animId = requestAnimationFrame(trackCameraZoom);
    return () => cancelAnimationFrame(animId);
  }, []);

  // 5. Configure OrbitControls & Day/Night Lighting
  useEffect(() => {
    if (!globeRef.current) return;

    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = isAutoRotateAllowed;
      controls.autoRotateSpeed = 0.5;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.rotateSpeed = 0.85;
      controls.zoomSpeed = 1.15;

      controls.addEventListener('start', handleUserInteraction);
      return () => {
        controls.removeEventListener('start', handleUserInteraction);
      };
    }

    const scene = globeRef.current.scene();
    if (scene && !sunLightRef.current) {
      const sunCoords = getSunCartesianCoords(500);
      const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.3);
      sunLight.position.copy(sunCoords);
      scene.add(sunLight);
      sunLightRef.current = sunLight;

      const ambientNightLight = new THREE.AmbientLight(0x1e293b, 0.45);
      scene.add(ambientNightLight);

      const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.35);
      rimLight.position.set(-sunCoords.x, -sunCoords.y, -sunCoords.z);
      scene.add(rimLight);
    }
  }, [isAutoRotateAllowed, handleUserInteraction]);

  // Periodic sun position updates
  useEffect(() => {
    const sunInterval = setInterval(() => {
      if (sunLightRef.current) {
        const coords = getSunCartesianCoords(500);
        sunLightRef.current.position.copy(coords);
      }
    }, 30000);
    return () => clearInterval(sunInterval);
  }, []);

  // Smooth camera glide on location change without resetting controls
  useEffect(() => {
    if (!selectedLocation || !globeRef.current) return;
    const currentPov = globeRef.current.pointOfView();
    globeRef.current.pointOfView(
      {
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        altitude: Math.min(Math.max(currentPov.altitude, 1.2), 1.9),
      },
      1100
    );
  }, [selectedLocation?.lat, selectedLocation?.lng]);

  // Hisoblangan kamera zoom ko'rsatkichi (1.0x dan 6.5x gacha)
  const zoomMultiplier = Math.min(6.5, Math.max(1.0, Number((2.5 / Math.max(0.38, currentAltitude)).toFixed(1))));

  // 6. Dynamic Level of Detail (LOD) for Cities based on zoom altitude
  // Foydalanuvchi yaqinlashganda shaharlar nomlari va belgilari (markers) ko'rinadi:
  // - Uzoqda (altitude > 2.2): Faqat tanlangan shahar va yirik dunyo poytaxtlari (Tier 1)
  // - O'rtacha yaqinlashganda (1.45 - 2.2): Barcha davlat poytaxtlari va yirik shaharlar (Tier 1 + 2)
  // - Yaqinlashganda (altitude <= 1.45): Barcha regional markazlar, O'zbekiston viloyatlari va tarixiy shaharlari (Tier 1 + 2 + 3)
  const markerData: CityMarker[] = useMemo(() => {
    const maxTierToShow = currentAltitude > 2.2 ? 1 : currentAltitude > 1.45 ? 2 : 3;

    const filtered = WORLD_CITIES.filter((c) => {
      // Tanlangan shahar doimo ko'rsatiladi
      if (selectedLocation && c.id === selectedLocation.id) return true;
      const tier = c.tier || 1;
      return tier <= maxTierToShow;
    }).map((c) => ({
      id: c.id,
      lat: c.lat,
      lng: c.lng,
      name: c.nameUz || c.name,
      country: c.country,
      isCapital: Boolean(c.isCapital),
      isSelected: selectedLocation?.id === c.id,
      population: c.population,
      tier: c.tier || 1,
      cityObj: c,
    }));

    // Tanlangan shahar filtrdan tushib qolmasligi uchun
    if (selectedLocation && !filtered.some((c) => c.id === selectedLocation.id)) {
      filtered.push({
        id: selectedLocation.id,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        name: selectedLocation.nameUz || selectedLocation.name,
        country: selectedLocation.country,
        isCapital: false,
        isSelected: true,
        population: selectedLocation.population,
        tier: selectedLocation.tier || 1,
        cityObj: selectedLocation,
      });
    }

    return filtered;
  }, [currentAltitude, selectedLocation]);

  // Selected Location Pulsing Beacon Ring
  const ringsData = useMemo(() => {
    if (!selectedLocation) return [];
    return [
      {
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        maxR: 3.8,
        propagationSpeed: 2.2,
        repeatPeriod: 1100,
      },
    ];
  }, [selectedLocation?.lat, selectedLocation?.lng]);

  // Reverse geocode on globe click
  const handleGlobeClick = useCallback(async ({ lat, lng }: { lat: number; lng: number }) => {
    handleUserInteraction();

    let closest = WORLD_CITIES[0];
    let minD = 999999;
    WORLD_CITIES.forEach((c) => {
      const d = Math.hypot(c.lat - lat, c.lng - lng);
      if (d < minD) {
        minD = d;
        closest = c;
      }
    });

    if (minD < 4.0) {
      onSelectLocation(closest);
      return;
    }

    setIsResolvingPoint(true);
    try {
      const realLoc = await reverseGeocode(lat, lng);
      onSelectLocation(realLoc);
    } finally {
      setIsResolvingPoint(false);
    }
  }, [handleUserInteraction, onSelectLocation]);

  // Country polygon click handler
  const handlePolygonClick = useCallback((feature: any) => {
    handleUserInteraction();
    const props = feature.properties || {};
    const countryName = props.ADMIN || props.NAME || props.NAME_LONG;
    const iso = props.ISO_A2 || props.ISO_A3;

    // Find city in this country
    const cityInCountry = WORLD_CITIES.find(
      (c) =>
        (iso && (c.countryCode === iso || c.countryCode.toLowerCase() === iso.toLowerCase())) ||
        (countryName && c.country.toLowerCase().includes(countryName.toLowerCase()))
    );

    if (cityInCountry) {
      onSelectLocation(cityInCountry);
    } else {
      // Find approximate centroid from coordinates
      let lat = 0;
      let lng = 0;
      try {
        const coords = feature.geometry?.coordinates;
        if (coords) {
          const flat = JSON.stringify(coords);
          const pairs = flat.match(/\[-?\d+\.?\d*,-?\d+\.?\d*\]/g);
          if (pairs && pairs.length > 0) {
            const sample = JSON.parse(pairs[Math.floor(pairs.length / 2)]);
            lng = sample[0];
            lat = sample[1];
          }
        }
      } catch (e) {
        console.warn(e);
      }

      if (lat !== 0 || lng !== 0) {
        handleGlobeClick({ lat, lng });
      }
    }
  }, [handleUserInteraction, onSelectLocation, handleGlobeClick]);

  // Zoom buttons
  const handleZoom = (direction: 'in' | 'out') => {
    handleUserInteraction();
    if (!globeRef.current) return;
    const pov = globeRef.current.pointOfView();
    const newAltitude = direction === 'in' ? Math.max(0.4, pov.altitude - 0.45) : Math.min(3.8, pov.altitude + 0.45);
    globeRef.current.pointOfView({ ...pov, altitude: newAltitude }, 400);
    setCurrentAltitude(newAltitude);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handleUserInteraction}
      onWheel={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      className={`relative w-full h-[430px] sm:h-[500px] lg:h-[550px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#050810] via-[#03050a] to-[#010205] border ${theme.borderColor} shadow-2xl select-none transition-colors duration-500`}
    >
      {/* 3D React Globe with Polygons (Borders), Points (Cities), and Atmospheric Shaders */}
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0, 0, 0, 0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        showAtmosphere={true}
        atmosphereColor="#38bdf8"
        atmosphereAltitude={0.24}
        // 1. Country Borders Layer (Polygons)
        polygonsData={countriesData}
        polygonCapColor={(feat: any) => {
          const isHovered = hoveredCountry === feat;
          const isSelectedCountry =
            selectedLocation &&
            (feat.properties.ISO_A2 === selectedLocation.countryCode ||
              feat.properties.ADMIN?.toLowerCase() === selectedLocation.country.toLowerCase());

          if (isSelectedCountry) return `${theme.primaryHex}33`;
          if (isHovered) return 'rgba(56, 189, 248, 0.22)';
          return 'rgba(255, 255, 255, 0.015)';
        }}
        polygonSideColor={() => 'rgba(0, 0, 0, 0.05)'}
        polygonStrokeColor={(feat: any) => {
          const isHovered = hoveredCountry === feat;
          const isSelectedCountry =
            selectedLocation &&
            (feat.properties.ISO_A2 === selectedLocation.countryCode ||
              feat.properties.ADMIN?.toLowerCase() === selectedLocation.country.toLowerCase());

          if (isSelectedCountry) return theme.primaryHex;
          if (isHovered) return '#38bdf8';
          return 'rgba(255, 255, 255, 0.38)'; // Crisp, clearly visible country border
        }}
        polygonAltitude={(feat: any) => (hoveredCountry === feat ? 0.012 : 0.005)}
        onPolygonHover={(feat: any) => setHoveredCountry(feat || null)}
        onPolygonClick={handlePolygonClick}
        // 2. City Markers Layer (Points) - Yaqinlashganda markerlar kattalashadi va yangi shaharlar ochiladi
        pointsData={markerData}
        pointLat="lat"
        pointLng="lng"
        pointColor={(obj: object) => {
          const d = obj as CityMarker;
          return d.isSelected ? theme.primaryHex : d.isCapital ? '#38bdf8' : '#a1a1aa';
        }}
        pointAltitude={(obj: object) => ((obj as CityMarker).isSelected ? 0.055 : 0.018)}
        pointRadius={(obj: object) => {
          const d = obj as CityMarker;
          // Yaqinlashganda marker hajmi moslashadi
          const scale = currentAltitude < 1.0 ? 1.35 : currentAltitude < 1.6 ? 1.1 : 0.85;
          return (d.isSelected ? 0.7 : d.isCapital ? 0.42 : 0.26) * scale;
        }}
        onPointClick={(obj: object) => {
          handleUserInteraction();
          onSelectLocation((obj as CityMarker).cityObj);
        }}
        onPointHover={(obj: object | null) => setHoveredMarker(obj ? (obj as CityMarker) : null)}
        // 3. City Labels Layer - Yaqinlashganda shaharlar nomlari aniq va yorqin ko'rinadi
        labelsData={markerData}
        labelLat="lat"
        labelLng="lng"
        labelText="name"
        labelSize={(obj: object) => {
          const d = obj as CityMarker;
          const scale = currentAltitude < 1.0 ? 1.45 : currentAltitude < 1.6 ? 1.18 : 0.9;
          return (d.isSelected ? 1.4 : d.isCapital ? 1.05 : 0.82) * scale;
        }}
        labelDotRadius={(obj: object) => ((obj as CityMarker).isSelected ? 0.45 : 0.22)}
        labelColor={(obj: object) => ((obj as CityMarker).isSelected ? '#fef08a' : '#e2e8f0')}
        labelResolution={2}
        labelAltitude={(obj: object) => ((obj as CityMarker).isSelected ? 0.03 : 0.015)}
        onLabelClick={(obj: object) => {
          handleUserInteraction();
          onSelectLocation((obj as CityMarker).cityObj);
        }}
        // 4. Rings Layer (Target Pulse)
        ringsData={ringsData}
        ringColor={() => theme.primaryHex}
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        onGlobeClick={handleGlobeClick}
      />

      {/* TOP HUD: SELECTED CITY & COUNTRY WITH REAL-TIME SOLAR LIGHTING BADGE */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 max-w-[85%] sm:max-w-md pointer-events-auto">
        <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#0b0e17]/95 backdrop-blur-md border ${theme.borderColor} shadow-2xl`}>
          <div className={`p-1.5 rounded-lg ${theme.badgeBg} ${theme.textHighlight}`}>
            <MapPin className={`w-4 h-4 ${theme.textColor}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono ${theme.textColor} font-bold uppercase tracking-wider`}>
                Tanlangan Davlat & Hudud:
              </span>
              {selectedLocation?.countryCode && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${theme.badgeBg} ${theme.textHighlight} border ${theme.borderColor}`}>
                  {selectedLocation.countryCode}
                </span>
              )}
            </div>

            <div className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <span>{selectedLocation ? selectedLocation.nameUz || selectedLocation.name : 'Toshkent'}</span>
              <span className="text-slate-400 font-normal text-xs">
                ({selectedLocation?.country || "O'zbekiston"})
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Solar Terminator badge & Live Camera Zoom Indicator */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0e1424]/90 backdrop-blur-md border border-sky-500/30 text-[11px] text-sky-200">
            <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '30s' }} />
            <span>Jonli Quyosh & Kun/Tun</span>
          </div>

          {/* Kamera Zoom Darajasi Kuzatuvchisi (Live Zoom Level Watcher) */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0e1424]/90 backdrop-blur-md border ${theme.borderColor} text-[11px] ${theme.textHighlight}`}>
            <ZoomIn className={`w-3.5 h-3.5 ${theme.textColor}`} />
            <span>
              Kamera Zoom: <b className={`font-mono ${theme.textHighlight}`}>{zoomMultiplier}x</b> ({markerData.length} ta shahar)
            </span>
          </div>

          {/* Inactivity Pause Indicator (Shows 6s countdown when user interacts) */}
          {inactivityCountdown !== null && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/90 backdrop-blur-md border border-amber-500/40 text-[11px] font-mono text-amber-300 animate-pulse">
              <Timer className="w-3.5 h-3.5 text-amber-400" />
              <span>Globus pauzada: {inactivityCountdown}s</span>
            </div>
          )}

          {/* Satellite Map Button */}
          {selectedLocation && (
            <button
              onClick={() => setShowSatelliteViewer(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${theme.interactiveBg} border ${theme.borderColor} text-[11px] font-semibold ${theme.textHighlight} transition-all shadow-md`}
            >
              <Layers className={`w-3.5 h-3.5 ${theme.textColor}`} />
              <span>Sun'iy Yo'ldosh Xaritasi</span>
            </button>
          )}
        </div>

        {/* Reverse geocoding loading badge */}
        {isResolvingPoint && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-950/90 backdrop-blur-md border border-sky-500/40 text-xs text-sky-200 shadow-lg">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
            <span>Bosilgan nuqtaning davlati va shahri aniqlanmoqda...</span>
          </div>
        )}
      </div>

      {/* Hovered Country Banner / Tooltip */}
      {hoveredCountry && !hoveredMarker && (
        <div className="pointer-events-none absolute top-4 right-4 z-20 px-3.5 py-2 rounded-xl bg-[#090d16]/95 backdrop-blur-md border border-sky-500/40 text-xs text-white shadow-2xl flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-sky-400" />
          <div>
            <span className="font-bold text-sky-300">
              {hoveredCountry.properties.ADMIN || hoveredCountry.properties.NAME}
            </span>
            {hoveredCountry.properties.ISO_A2 && (
              <span className="ml-1.5 text-[10px] text-slate-400 font-mono">
                ({hoveredCountry.properties.ISO_A2})
              </span>
            )}
            <div className="text-[10px] text-slate-400">Chegara belgilandi · Tanlash uchun bosing</div>
          </div>
        </div>
      )}

      {/* Interactive Satellite Tile Inspector Overlay */}
      {showSatelliteViewer && selectedLocation && (
        <SatelliteTileViewer
          location={selectedLocation}
          onClose={() => setShowSatelliteViewer(false)}
        />
      )}

      {/* Hover tooltip for cities */}
      {hoveredMarker && !showSatelliteViewer && (
        <div className="pointer-events-none absolute bottom-14 left-4 z-30 px-3 py-2 rounded-xl bg-[#090d16]/95 backdrop-blur-md border border-amber-500/50 text-xs text-white shadow-2xl">
          <div className="font-semibold text-amber-300 flex items-center gap-1.5">
            <span>{hoveredMarker.name}</span>
            {hoveredMarker.isCapital && <span className="text-[10px] text-sky-300 font-normal">★ Poytaxt</span>}
          </div>
          <div className="text-[11px] text-slate-300">{hoveredMarker.country}</div>
          <div className="text-[10px] text-amber-200/70 mt-0.5">Ob-havo va vaqtini ko'rish uchun bosing</div>
        </div>
      )}

      {/* Control Dock */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Auto rotate toggle */}
        <button
          onClick={() => {
            const nextVal = !isAutoRotateAllowed;
            setIsAutoRotateAllowed(nextVal);
            if (globeRef.current) {
              const controls = globeRef.current.controls();
              if (controls) controls.autoRotate = nextVal;
            }
            setIsCurrentlyRotating(nextVal);
          }}
          title={isAutoRotateAllowed ? "Aylanishni o'chirish" : "Avtomatik aylanishni yoqish"}
          className={`p-2.5 rounded-xl backdrop-blur-md transition-all border ${
            isCurrentlyRotating
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
              : 'bg-[#181d28]/80 text-slate-300 border-white/10 hover:bg-white/10'
          }`}
        >
          <RotateCw
            className={`w-4 h-4 ${isCurrentlyRotating ? 'animate-spin' : ''}`}
            style={{ animationDuration: '8s' }}
          />
        </button>

        {/* Zoom In */}
        <button
          onClick={() => handleZoom('in')}
          title="Yaqinlashtirish (Ko'proq shaharlar ochiladi)"
          className="p-2.5 rounded-xl bg-[#181d28]/85 hover:bg-white/10 text-slate-200 border border-white/10 backdrop-blur-md transition-all"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => handleZoom('out')}
          title="Uzoqlashtirish"
          className="p-2.5 rounded-xl bg-[#181d28]/85 hover:bg-white/10 text-slate-200 border border-white/10 backdrop-blur-md transition-all"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom hint pill */}
      <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#090d16]/80 backdrop-blur-md border border-white/10 text-[11px] text-slate-300 pointer-events-none">
        <Compass className="w-3.5 h-3.5 text-amber-400" />
        <span>
          Yaqinlashtirsangiz ko'proq shaharlar ko'rinadi · Tegilganda 6 sekund to'xtab turadi · Davlat chegaralari ko'rinadi
        </span>
      </div>
    </div>
  );
});
