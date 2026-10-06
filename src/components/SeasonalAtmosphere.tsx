import React, { useEffect, useRef } from 'react';
import { Season } from '../types';
import { Umbrella, Snowflake, Flower2, Sun, Wind } from 'lucide-react';

interface SeasonalAtmosphereProps {
  season: Season;
  onSeasonChange?: (season: Season) => void;
  isAutoSeason?: boolean;
  onToggleAutoSeason?: () => void;
  locationName?: string;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotSpeed: number;
  color: string;
  shape: 'leaf' | 'rain' | 'snow' | 'petal' | 'flower' | 'sunbeam';
  opacity: number;
  wobbleSpeed?: number;
  wobbleAmp?: number;
  layer?: number; // 0: background, 1: mid, 2: foreground
}

export const SeasonalAtmosphere: React.FC<SeasonalAtmosphereProps> = ({
  season,
  onSeasonChange,
  isAutoSeason = true,
  onToggleAutoSeason,
  locationName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Particle[] = [];
    const count = season === 'qish' ? 85 : season === 'kuz' ? 60 : season === 'bahor' ? 55 : 40;

    const autumnColors = ['#f59e0b', '#d97706', '#b45309', '#9a3412', '#c2410c', '#ea580c'];
    const springColors = ['#f472b6', '#fb7185', '#fbcfe8', '#fda4af', '#fecdd3'];
    const winterColors = ['#ffffff', '#f0f9ff', '#e0f2fe', '#bae6fd'];
    const summerColors = ['#fef08a', '#facc15', '#fde047', '#fed7aa'];

    for (let i = 0; i < count; i++) {
      let shape: Particle['shape'] = 'leaf';
      let color = autumnColors[Math.floor(Math.random() * autumnColors.length)];
      let speedY = 1.2 + Math.random() * 2;
      let speedX = (Math.random() - 0.5) * 1.5;
      const layer = Math.floor(Math.random() * 3);
      const sizeMultiplier = layer === 0 ? 0.6 : layer === 1 ? 1 : 1.4;

      if (season === 'kuz') {
        // Falling autumn foliage and gentle rain
        shape = Math.random() > 0.35 ? 'leaf' : 'rain';
        if (shape === 'rain') {
          color = 'rgba(125, 211, 252, 0.5)';
          speedY = 7 + Math.random() * 6;
          speedX = -1.2;
        }
      } else if (season === 'qish') {
        // Multi-layered realistic snowfall
        shape = 'snow';
        color = winterColors[Math.floor(Math.random() * winterColors.length)];
        speedY = (0.6 + Math.random() * 1.5) * sizeMultiplier;
        speedX = (Math.random() - 0.5) * 1.2;
      } else if (season === 'bahor') {
        // Spring blossoms and delicate flower petals fluttering in breeze
        shape = Math.random() > 0.35 ? 'petal' : 'flower';
        color = springColors[Math.floor(Math.random() * springColors.length)];
        speedY = 0.8 + Math.random() * 1.6;
        speedX = 1.2 + Math.random() * 2.2; // breezy drift to right
      } else if (season === 'yoz') {
        // Radiant sun particles
        shape = 'sunbeam';
        color = summerColors[Math.floor(Math.random() * summerColors.length)];
        speedY = 0.5 + Math.random() * 1.2;
        speedX = (Math.random() - 0.5) * 1;
      }

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: (shape === 'rain' ? 2 : 7 + Math.random() * 13) * sizeMultiplier,
        speedX,
        speedY,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.04,
        color,
        shape,
        opacity: shape === 'rain' ? 0.35 : 0.6 + Math.random() * 0.35,
        wobbleSpeed: 0.02 + Math.random() * 0.03,
        wobbleAmp: 1.5 + Math.random() * 2.5,
        layer,
      });
    }

    // Draw Autumn Leaf
    const drawLeaf = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;

      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * 0.75, -p.size * 0.5, p.size * 0.75, p.size * 0.5, 0, p.size);
      ctx.bezierCurveTo(-p.size * 0.75, p.size * 0.5, -p.size * 0.75, -p.size * 0.5, 0, -p.size);
      ctx.fill();

      // Leaf stem/vein
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.8);
      ctx.lineTo(0, p.size * 0.85);
      ctx.stroke();

      ctx.restore();
    };

    // Draw Realistic 5-Petal Peach Blossom Flower (Zero hearts!)
    const drawBlossomFlower = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;

      const petalR = p.size * 0.42;
      const petalDist = p.size * 0.35;

      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        const px = Math.cos(angle) * petalDist;
        const py = Math.sin(angle) * petalDist;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle);

        // Delicate oval petal shape
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, petalR, petalR * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Yellow/gold pistil & stamen center
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ea580c';
      for (let s = 0; s < 5; s++) {
        const sAngle = (s * 2 * Math.PI) / 5;
        const sx = Math.cos(sAngle) * (p.size * 0.22);
        const sy = Math.sin(sAngle) * (p.size * 0.22);
        ctx.beginPath();
        ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    // Draw Realistic Fluttering Peach Petal (Zero hearts!)
    const drawPetal = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;

      // Organic asymmetrical blossom petal
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.8);
      ctx.quadraticCurveTo(p.size * 0.5, -p.size * 0.3, p.size * 0.35, p.size * 0.5);
      ctx.quadraticCurveTo(0, p.size * 0.75, -p.size * 0.35, p.size * 0.5);
      ctx.quadraticCurveTo(-p.size * 0.5, -p.size * 0.3, 0, -p.size * 0.8);
      ctx.fill();

      // Delicate natural petal vein
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.2)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.65);
      ctx.lineTo(0, p.size * 0.55);
      ctx.stroke();

      ctx.restore();
    };

    // Draw Realistic Snowfall Snowflake with Depth
    const drawSnow = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;

      if (p.layer === 2 && p.size > 8) {
        // Foreground 6-branched crystalline snowflake
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const a = (i * Math.PI) / 3;
          const r = p.size * 0.45;
          ctx.moveTo(-Math.cos(a) * r, -Math.sin(a) * r);
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.18, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Soft rounded drifting snowflake
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    const drawRain = (p: Particle) => {
      ctx.save();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 3, p.y + 11);
      ctx.stroke();
      ctx.restore();
    };

    const drawSunbeam = (p: Particle) => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity * 0.45;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    let time = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.02;

      // Summer sun glow
      if (season === 'yoz') {
        const sunX = width - 100;
        const sunY = 90;
        const sunGrad = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 400);
        sunGrad.addColorStop(0, 'rgba(253, 224, 71, 0.2)');
        sunGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.07)');
        sunGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = sunGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Spring soft blossom glow
      if (season === 'bahor') {
        const springGrad = ctx.createRadialGradient(width * 0.2, height * 0.3, 30, width * 0.2, height * 0.3, 500);
        springGrad.addColorStop(0, 'rgba(244, 114, 182, 0.1)');
        springGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = springGrad;
        ctx.fillRect(0, 0, width, height);
      }

      particles.forEach((p) => {
        p.y += p.speedY;
        const wobble = Math.sin(time * (p.wobbleSpeed || 1) + p.y * 0.01) * (p.wobbleAmp || 1);
        p.x += p.speedX + wobble;
        p.rotation += p.rotSpeed;

        if (p.shape === 'leaf') drawLeaf(p);
        else if (p.shape === 'petal') drawPetal(p);
        else if (p.shape === 'flower') drawBlossomFlower(p);
        else if (p.shape === 'snow') drawSnow(p);
        else if (p.shape === 'rain') drawRain(p);
        else if (p.shape === 'sunbeam') drawSunbeam(p);

        if (p.y > height + 25) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x < -30) p.x = width + 20;
        if (p.x > width + 30) p.x = -20;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [season]);

  const seasonInfo = {
    kuz: {
      name: 'Kuz (Autumn)',
      icon: Umbrella,
      desc: 'Oltin barglar, shivalama yomg\'ir va sokin kuzgi atmosfera',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/40',
    },
    qish: {
      name: 'Qish (Winter)',
      icon: Snowflake,
      desc: 'Haqiqiy yumshoq qor yog\'ishi, muzlagan daraxtlar va sovuq havo',
      textColor: 'text-sky-300',
      borderColor: 'border-sky-500/40',
    },
    bahor: {
      name: 'Bahor (Spring)',
      icon: Flower2,
      desc: 'Shaftoli gulbarglari shamolda uchishi va uyg\'onish davri',
      textColor: 'text-pink-400',
      borderColor: 'border-pink-500/40',
    },
    yoz: {
      name: 'Yoz (Summer)',
      icon: Sun,
      desc: 'Charaqlagan oftob nurlari va iliq quyosh zarralari',
      textColor: 'text-yellow-400',
      borderColor: 'border-yellow-500/40',
    },
  }[season];

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* Unified Seasonal Horizon Tree */}
      <div className="fixed bottom-0 right-0 pointer-events-none z-0 opacity-20 lg:opacity-30 transition-all duration-1000 ease-in-out">
        <svg
          width="420"
          height="320"
          viewBox="0 0 420 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-50 320 C 100 270, 260 290, 470 320 L 470 350 L -50 350 Z"
            fill={season === 'qish' ? '#334155' : season === 'kuz' ? '#29180c' : season === 'bahor' ? '#142e1b' : '#273412'}
            className="transition-colors duration-1000"
          />
          <path
            d="M 280 300 Q 275 220, 265 170 Q 260 140, 250 110 L 260 110 Q 275 140, 285 200 Q 295 260, 310 300 Z"
            fill="#1e1814"
          />
          {season === 'kuz' && (
            <g className="transition-all duration-1000">
              <circle cx="250" cy="100" r="55" fill="#d97706" fillOpacity="0.75" />
              <circle cx="210" cy="115" r="45" fill="#b45309" fillOpacity="0.8" />
              <circle cx="295" cy="105" r="48" fill="#ea580c" fillOpacity="0.7" />
              <circle cx="255" cy="65" r="40" fill="#f59e0b" fillOpacity="0.75" />
            </g>
          )}
          {season === 'qish' && (
            <g className="transition-all duration-1000">
              <circle cx="250" cy="100" r="50" fill="#475569" fillOpacity="0.5" />
              <circle cx="210" cy="115" r="40" fill="#334155" fillOpacity="0.6" />
              <circle cx="295" cy="105" r="42" fill="#475569" fillOpacity="0.5" />
              <ellipse cx="250" cy="65" rx="42" ry="14" fill="#f8fafc" fillOpacity="0.9" />
              <ellipse cx="210" cy="90" rx="34" ry="12" fill="#e2e8f0" fillOpacity="0.85" />
              <ellipse cx="295" cy="85" rx="36" ry="12" fill="#f8fafc" fillOpacity="0.9" />
            </g>
          )}
          {season === 'bahor' && (
            <g className="transition-all duration-1000">
              <circle cx="250" cy="100" r="56" fill="#f472b6" fillOpacity="0.8" />
              <circle cx="205" cy="115" r="46" fill="#ec4899" fillOpacity="0.75" />
              <circle cx="295" cy="105" r="48" fill="#fbcfe8" fillOpacity="0.85" />
              <circle cx="250" cy="60" r="42" fill="#fda4af" fillOpacity="0.8" />
            </g>
          )}
          {season === 'yoz' && (
            <g className="transition-all duration-1000">
              <circle cx="250" cy="100" r="58" fill="#15803d" fillOpacity="0.8" />
              <circle cx="205" cy="115" r="48" fill="#166534" fillOpacity="0.85" />
              <circle cx="295" cy="105" r="50" fill="#22c55e" fillOpacity="0.75" />
            </g>
          )}
        </svg>
      </div>

      {/* Floating Season Switcher Bar */}
      <div className={`relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-[#141210]/90 backdrop-blur-md border ${seasonInfo.borderColor} shadow-xl transition-all duration-500`}>
        <div className="flex items-center gap-2">
          <seasonInfo.icon className={`w-5 h-5 ${seasonInfo.textColor} animate-pulse`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200 tracking-wide">
                Mavsum: <span className={`${seasonInfo.textColor} font-bold`}>{seasonInfo.name}</span>
              </span>
              {locationName && isAutoSeason && (
                <span className={`text-[10px] ${seasonInfo.textColor} font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10`}>
                  ({locationName} fasli)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">{seasonInfo.desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0b0c10]/80 border border-white/5">
          <button
            onClick={() => onSeasonChange && onSeasonChange('kuz')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              season === 'kuz'
                ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-stone-950 shadow-md shadow-amber-500/20 font-bold scale-[1.02]'
                : 'text-slate-400 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <Umbrella className="w-3.5 h-3.5" />
            <span>Kuz</span>
          </button>

          <button
            onClick={() => onSeasonChange && onSeasonChange('qish')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              season === 'qish'
                ? 'bg-gradient-to-r from-cyan-600 via-sky-500 to-blue-600 text-stone-950 shadow-md shadow-cyan-500/20 font-bold scale-[1.02]'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10'
            }`}
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>Qish</span>
          </button>

          <button
            onClick={() => onSeasonChange && onSeasonChange('bahor')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              season === 'bahor'
                ? 'bg-gradient-to-r from-pink-600 via-rose-500 to-fuchsia-600 text-white shadow-md shadow-pink-500/20 font-bold scale-[1.02]'
                : 'text-slate-400 hover:text-pink-300 hover:bg-pink-500/10'
            }`}
          >
            <Flower2 className="w-3.5 h-3.5" />
            <span>Bahor</span>
          </button>

          <button
            onClick={() => onSeasonChange && onSeasonChange('yoz')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              season === 'yoz'
                ? 'bg-gradient-to-r from-yellow-500 via-amber-500 to-emerald-500 text-stone-950 shadow-md shadow-yellow-500/20 font-bold scale-[1.02]'
                : 'text-slate-400 hover:text-yellow-300 hover:bg-yellow-500/10'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Yoz</span>
          </button>

          {onToggleAutoSeason && (
            <button
              onClick={onToggleAutoSeason}
              title="Tanlangan shahar iqlimi va fasliga avtomatik moslash"
              className={`ml-1 px-2.5 py-1.5 text-[11px] rounded-lg border transition-all ${
                isAutoSeason
                  ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/40 font-bold shadow-sm'
                  : 'text-slate-400 border-white/5 hover:text-slate-200 hover:border-white/10'
              }`}
            >
              {isAutoSeason ? 'Avto: Faol' : 'Avto'}
            </button>
          )}
        </div>
      </div>
    </>
  );
};
