import { Season } from '../types';

export interface SeasonTheme {
  season: Season;
  name: string;
  seasonTitleUz: string;
  // Text colors
  textColor: string;          // e.g. 'text-amber-400'
  textHighlight: string;      // e.g. 'text-amber-300'
  textLight: string;          // e.g. 'text-amber-200'
  textMuted: string;          // e.g. 'text-amber-400/80'
  // Border colors
  borderColor: string;        // e.g. 'border-amber-500/30'
  borderHover: string;        // e.g. 'hover:border-amber-400/60'
  borderStrong: string;       // e.g. 'border-amber-500/50'
  borderSubtle: string;       // e.g. 'border-amber-500/20'
  // Background & badges
  badgeBg: string;            // e.g. 'bg-amber-500/10'
  cardBg: string;             // card surface background tint
  interactiveBg: string;      // e.g. 'bg-amber-500/15 hover:bg-amber-500/25'
  interactiveActive: string;  // e.g. 'bg-amber-500/25 text-amber-200 border-amber-500/60'
  // Button styles
  buttonPrimary: string;      // Full class for main action button
  buttonSecondary: string;    // Full class for secondary/filter buttons
  buttonPreset: string;       // Full class for quick pills
  buttonGradient: string;     // gradient background only
  buttonText: string;         // text color on button
  // Gradient accents
  brandGradient: string;      // Logo/icon background
  accentGradient: string;     // Text or decorative gradient
  selectionClass: string;     // Selection styling
  // Shadows & Glow
  glowShadow: string;         // e.g. 'shadow-amber-500/20'
  // Hex codes for canvas/charts
  primaryHex: string;
  secondaryHex: string;
  chartColors: {
    tempMax: string;
    tempMin: string;
    tempMean: string;
    precipitation: string;
    accent: string;
  };
}

export function getSeasonTheme(season: Season): SeasonTheme {
  switch (season) {
    case 'qish':
      return {
        season: 'qish',
        name: 'Kumush Qish',
        seasonTitleUz: 'Qish mavsumi',
        textColor: 'text-cyan-400',
        textHighlight: 'text-cyan-300',
        textLight: 'text-sky-200',
        textMuted: 'text-cyan-400/80',
        borderColor: 'border-cyan-500/30',
        borderHover: 'hover:border-cyan-400/60',
        borderStrong: 'border-cyan-500/50',
        borderSubtle: 'border-cyan-500/20',
        badgeBg: 'bg-cyan-500/10',
        cardBg: 'from-[#0b141d]/95 via-[#081018]/95 to-[#060b12]/95',
        interactiveBg: 'bg-cyan-500/15 hover:bg-cyan-500/25',
        interactiveActive: 'bg-cyan-500/25 text-cyan-200 border-cyan-500/60 shadow-lg shadow-cyan-500/10',
        buttonPrimary: 'bg-gradient-to-r from-cyan-600 via-sky-500 to-blue-600 text-stone-950 font-bold shadow-lg shadow-cyan-950/50 hover:from-cyan-500 hover:to-sky-400 active:scale-[0.98] transition-all',
        buttonSecondary: 'bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-200 border border-cyan-500/30 active:scale-[0.98] transition-all',
        buttonPreset: 'bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/40 hover:border-cyan-400 transition-all',
        buttonGradient: 'bg-gradient-to-r from-cyan-600 via-sky-500 to-blue-500 hover:from-cyan-500 hover:to-sky-400',
        buttonText: 'text-stone-950',
        brandGradient: 'from-cyan-600 via-sky-500 to-blue-400 shadow-cyan-500/30',
        accentGradient: 'from-cyan-400 via-sky-300 to-blue-400',
        selectionClass: 'selection:bg-cyan-500/30 selection:text-cyan-100',
        glowShadow: 'shadow-cyan-500/25',
        primaryHex: '#06b6d4',
        secondaryHex: '#38bdf8',
        chartColors: {
          tempMax: '#38bdf8',
          tempMin: '#818cf8',
          tempMean: '#06b6d4',
          precipitation: '#67e8f9',
          accent: '#0284c7',
        },
      };

    case 'bahor':
      return {
        season: 'bahor',
        name: 'Gullagan Bahor',
        seasonTitleUz: 'Bahor mavsumi',
        textColor: 'text-pink-400',
        textHighlight: 'text-pink-300',
        textLight: 'text-rose-200',
        textMuted: 'text-pink-400/80',
        borderColor: 'border-pink-500/30',
        borderHover: 'hover:border-pink-400/60',
        borderStrong: 'border-pink-500/50',
        borderSubtle: 'border-pink-500/20',
        badgeBg: 'bg-pink-500/10',
        cardBg: 'from-[#190c15]/95 via-[#130910]/95 to-[#0b080f]/95',
        interactiveBg: 'bg-pink-500/15 hover:bg-pink-500/25',
        interactiveActive: 'bg-pink-500/25 text-pink-200 border-pink-500/60 shadow-lg shadow-pink-500/10',
        buttonPrimary: 'bg-gradient-to-r from-pink-600 via-rose-500 to-fuchsia-600 text-white font-bold shadow-lg shadow-pink-950/50 hover:from-pink-500 hover:to-rose-400 active:scale-[0.98] transition-all',
        buttonSecondary: 'bg-pink-950/60 hover:bg-pink-900/60 text-pink-200 border border-pink-500/30 active:scale-[0.98] transition-all',
        buttonPreset: 'bg-pink-950/50 hover:bg-pink-900/60 text-pink-300 border border-pink-700/40 hover:border-pink-400 transition-all',
        buttonGradient: 'bg-gradient-to-r from-pink-600 via-rose-500 to-fuchsia-500 hover:from-pink-500 hover:to-rose-400',
        buttonText: 'text-white',
        brandGradient: 'from-pink-600 via-rose-500 to-fuchsia-400 shadow-pink-500/30',
        accentGradient: 'from-pink-400 via-rose-300 to-fuchsia-300',
        selectionClass: 'selection:bg-pink-500/30 selection:text-pink-100',
        glowShadow: 'shadow-pink-500/25',
        primaryHex: '#ec4899',
        secondaryHex: '#f43f5e',
        chartColors: {
          tempMax: '#f43f5e',
          tempMin: '#ec4899',
          tempMean: '#f472b6',
          precipitation: '#fb7185',
          accent: '#db2777',
        },
      };

    case 'yoz':
      return {
        season: 'yoz',
        name: 'Oftobli Yoz',
        seasonTitleUz: 'Yoz mavsumi',
        textColor: 'text-yellow-400',
        textHighlight: 'text-yellow-300',
        textLight: 'text-amber-200',
        textMuted: 'text-yellow-400/80',
        borderColor: 'border-yellow-500/30',
        borderHover: 'hover:border-yellow-400/60',
        borderStrong: 'border-yellow-500/50',
        borderSubtle: 'border-yellow-500/20',
        badgeBg: 'bg-yellow-500/10',
        cardBg: 'from-[#17150c]/95 via-[#121008]/95 to-[#0c0c08]/95',
        interactiveBg: 'bg-yellow-500/15 hover:bg-yellow-500/25',
        interactiveActive: 'bg-yellow-500/25 text-yellow-200 border-yellow-500/60 shadow-lg shadow-yellow-500/10',
        buttonPrimary: 'bg-gradient-to-r from-yellow-500 via-amber-500 to-emerald-500 text-stone-950 font-bold shadow-lg shadow-yellow-950/50 hover:from-yellow-400 hover:to-amber-400 active:scale-[0.98] transition-all',
        buttonSecondary: 'bg-yellow-950/60 hover:bg-yellow-900/60 text-yellow-200 border border-yellow-500/30 active:scale-[0.98] transition-all',
        buttonPreset: 'bg-yellow-950/50 hover:bg-yellow-900/60 text-yellow-300 border border-yellow-700/40 hover:border-yellow-400 transition-all',
        buttonGradient: 'bg-gradient-to-r from-yellow-500 via-amber-500 to-emerald-500 hover:from-yellow-400 hover:to-amber-400',
        buttonText: 'text-stone-950',
        brandGradient: 'from-yellow-500 via-amber-500 to-lime-400 shadow-yellow-500/30',
        accentGradient: 'from-yellow-300 via-amber-300 to-emerald-300',
        selectionClass: 'selection:bg-yellow-500/30 selection:text-yellow-100',
        glowShadow: 'shadow-yellow-500/25',
        primaryHex: '#eab308',
        secondaryHex: '#10b981',
        chartColors: {
          tempMax: '#f59e0b',
          tempMin: '#eab308',
          tempMean: '#84cc16',
          precipitation: '#10b981',
          accent: '#ca8a04',
        },
      };

    case 'kuz':
    default:
      return {
        season: 'kuz',
        name: 'Oltin Kuz',
        seasonTitleUz: 'Kuz mavsumi',
        textColor: 'text-amber-400',
        textHighlight: 'text-amber-300',
        textLight: 'text-amber-200',
        textMuted: 'text-amber-400/80',
        borderColor: 'border-amber-500/30',
        borderHover: 'hover:border-amber-400/60',
        borderStrong: 'border-amber-500/50',
        borderSubtle: 'border-amber-500/20',
        badgeBg: 'bg-amber-500/10',
        cardBg: 'from-[#16120d]/95 via-[#110e0a]/95 to-[#0b0c10]/95',
        interactiveBg: 'bg-amber-500/15 hover:bg-amber-500/25',
        interactiveActive: 'bg-amber-500/25 text-amber-200 border-amber-500/60 shadow-lg shadow-amber-500/10',
        buttonPrimary: 'bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-stone-950 font-bold shadow-lg shadow-amber-950/50 hover:from-amber-500 hover:to-orange-400 active:scale-[0.98] transition-all',
        buttonSecondary: 'bg-amber-950/60 hover:bg-amber-900/60 text-amber-200 border border-amber-500/30 active:scale-[0.98] transition-all',
        buttonPreset: 'bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-700/40 hover:border-amber-400 transition-all',
        buttonGradient: 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400',
        buttonText: 'text-stone-950',
        brandGradient: 'from-amber-600 via-amber-500 to-yellow-400 shadow-amber-500/30',
        accentGradient: 'from-amber-400 via-yellow-300 to-orange-400',
        selectionClass: 'selection:bg-amber-500/30 selection:text-amber-100',
        glowShadow: 'shadow-amber-500/25',
        primaryHex: '#f59e0b',
        secondaryHex: '#ea580c',
        chartColors: {
          tempMax: '#ea580c',
          tempMin: '#d97706',
          tempMean: '#f59e0b',
          precipitation: '#38bdf8',
          accent: '#b45309',
        },
      };
  }
}
