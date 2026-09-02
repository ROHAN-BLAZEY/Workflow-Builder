import { ThemeId } from '../types';

export interface ThemeColors {
  appBg: string;
  cardBg: string;
  cardBgSubtle: string;
  cardBorder: string;
  cardBorderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentPrimary: string;
  accentText: string;
  headerBg: string;
  inputBg: string;
  inputBorder: string;
  previewBg: string;
  previewCard: string;
  previewAccent: string;
  previewBorder: string;
  metaThemeColor: string;
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  category: 'light' | 'dark' | 'warm';
  categoryLabel: string;
  tagline: string;
  description: string;
  colors: ThemeColors;
  previewClass: string;
}

export const APP_THEMES: ThemeConfig[] = [
  {
    id: 'modern-light',
    name: 'Modern Light',
    category: 'light',
    categoryLabel: 'Light Theme',
    tagline: 'Clean & High Contrast',
    description: 'Crisp indigo & slate aesthetic designed for clarity and daytime focus',
    previewClass: 'bg-white border-indigo-500 text-slate-900',
    colors: {
      appBg: '#f8fafc',
      cardBg: '#ffffff',
      cardBgSubtle: '#f1f5f9',
      cardBorder: '#e2e8f0',
      cardBorderSubtle: '#f1f5f9',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#94a3b8',
      accentPrimary: '#4f46e5',
      accentText: '#ffffff',
      headerBg: 'rgba(255, 255, 255, 0.95)',
      inputBg: '#ffffff',
      inputBorder: '#cbd5e1',
      previewBg: '#f8fafc',
      previewCard: '#ffffff',
      previewAccent: '#4f46e5',
      previewBorder: '#cbd5e1',
      metaThemeColor: '#ffffff',
    },
  },
  {
    id: 'midnight-dark',
    name: 'Midnight Dark',
    category: 'dark',
    categoryLabel: 'Dark Theme',
    tagline: 'Deep Obsidian Charcoal',
    description: 'Deep midnight obsidian tones that minimize eye strain during late night sessions',
    previewClass: 'bg-[#131b2e] border-indigo-400 text-slate-100',
    colors: {
      appBg: '#0b0f19',
      cardBg: '#131b2e',
      cardBgSubtle: '#1a253c',
      cardBorder: '#1e293b',
      cardBorderSubtle: '#182236',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      accentPrimary: '#6366f1',
      accentText: '#ffffff',
      headerBg: 'rgba(19, 27, 46, 0.95)',
      inputBg: '#1a253c',
      inputBorder: '#334155',
      previewBg: '#0b0f19',
      previewCard: '#131b2e',
      previewAccent: '#6366f1',
      previewBorder: '#334155',
      metaThemeColor: '#131b2e',
    },
  },
  {
    id: 'cyberpunk-emerald',
    name: 'Cyber Emerald',
    category: 'dark',
    categoryLabel: 'High Contrast Dark',
    tagline: 'Matrix & Mint Accents',
    description: 'Deep forest dark background with glowing mint & emerald productivity highlights',
    previewClass: 'bg-[#0a2219] border-emerald-500 text-emerald-300',
    colors: {
      appBg: '#05100c',
      cardBg: '#0a2219',
      cardBgSubtle: '#103527',
      cardBorder: '#0d4833',
      cardBorderSubtle: '#093324',
      textPrimary: '#ecfdf5',
      textSecondary: '#6ee7b7',
      textMuted: '#34d399',
      accentPrimary: '#10b981',
      accentText: '#022c22',
      headerBg: 'rgba(10, 34, 25, 0.95)',
      inputBg: '#0d2c20',
      inputBorder: '#105e43',
      previewBg: '#05100c',
      previewCard: '#0a2219',
      previewAccent: '#10b981',
      previewBorder: '#0d4833',
      metaThemeColor: '#0a2219',
    },
  },
  {
    id: 'warm-sepia',
    name: 'Warm Sepia',
    category: 'warm',
    categoryLabel: 'Warm & Natural',
    tagline: 'Parchment Amber Softness',
    description: 'Natural bookish paper parchment with amber accents to avoid blue light fatigue',
    previewClass: 'bg-[#fbf7ee] border-amber-600 text-amber-950',
    colors: {
      appBg: '#f5eedc',
      cardBg: '#fbf7ee',
      cardBgSubtle: '#ede2cc',
      cardBorder: '#ddccb0',
      cardBorderSubtle: '#e8dcc6',
      textPrimary: '#2e2316',
      textSecondary: '#664e31',
      textMuted: '#8c704f',
      accentPrimary: '#b45309',
      accentText: '#ffffff',
      headerBg: 'rgba(251, 247, 238, 0.95)',
      inputBg: '#fffdf9',
      inputBorder: '#d8c4a5',
      previewBg: '#f5eedc',
      previewCard: '#fbf7ee',
      previewAccent: '#b45309',
      previewBorder: '#ddccb0',
      metaThemeColor: '#fbf7ee',
    },
  },
  {
    id: 'ocean-sapphire',
    name: 'Ocean Sapphire',
    category: 'dark',
    categoryLabel: 'Cool Dark Theme',
    tagline: 'Deep Ocean Blue & Cyan',
    description: 'Submerged navy blue canvas with sapphire accents and crisp neon cyan details',
    previewClass: 'bg-[#0c2340] border-cyan-400 text-sky-100',
    colors: {
      appBg: '#061224',
      cardBg: '#0c2340',
      cardBgSubtle: '#12335c',
      cardBorder: '#19467c',
      cardBorderSubtle: '#112e52',
      textPrimary: '#f0f9ff',
      textSecondary: '#7dd3fc',
      textMuted: '#38bdf8',
      accentPrimary: '#0284c7',
      accentText: '#ffffff',
      headerBg: 'rgba(12, 35, 64, 0.95)',
      inputBg: '#0f2b4e',
      inputBorder: '#1d508d',
      previewBg: '#061224',
      previewCard: '#0c2340',
      previewAccent: '#0284c7',
      previewBorder: '#19467c',
      metaThemeColor: '#0c2340',
    },
  },
  {
    id: 'sunset-rose',
    name: 'Sunset Rose',
    category: 'light',
    categoryLabel: 'Pastel Light',
    tagline: 'Twilight Blossom & Rose',
    description: 'Soft twilight pastel with gentle rose gradients and warm violet focus elements',
    previewClass: 'bg-white border-rose-500 text-rose-950',
    colors: {
      appBg: '#fff1f2',
      cardBg: '#ffffff',
      cardBgSubtle: '#ffe4e6',
      cardBorder: '#fecdd3',
      cardBorderSubtle: '#ffe4e6',
      textPrimary: '#4c0519',
      textSecondary: '#9f1239',
      textMuted: '#be123c',
      accentPrimary: '#e11d48',
      accentText: '#ffffff',
      headerBg: 'rgba(255, 255, 255, 0.95)',
      inputBg: '#fff5f6',
      inputBorder: '#fca5a5',
      previewBg: '#fff1f2',
      previewCard: '#ffffff',
      previewAccent: '#e11d48',
      previewBorder: '#fecdd3',
      metaThemeColor: '#ffffff',
    },
  },
  {
    id: 'nordic-slate',
    name: 'Nordic Slate',
    category: 'light',
    categoryLabel: 'Monochrome Light',
    tagline: 'Scandinavian Minimalism',
    description: 'Distraction-free pure zinc monochrome with crisp high-contrast typography',
    previewClass: 'bg-white border-zinc-500 text-zinc-900',
    colors: {
      appBg: '#f4f4f5',
      cardBg: '#ffffff',
      cardBgSubtle: '#e4e4e7',
      cardBorder: '#d4d4d8',
      cardBorderSubtle: '#e4e4e7',
      textPrimary: '#18181b',
      textSecondary: '#52525b',
      textMuted: '#71717a',
      accentPrimary: '#18181b',
      accentText: '#ffffff',
      headerBg: 'rgba(255, 255, 255, 0.95)',
      inputBg: '#ffffff',
      inputBorder: '#a1a1aa',
      previewBg: '#f4f4f5',
      previewCard: '#ffffff',
      previewAccent: '#18181b',
      previewBorder: '#d4d4d8',
      metaThemeColor: '#ffffff',
    },
  },
];

export function getThemeConfig(themeId: ThemeId = 'modern-light'): ThemeConfig {
  return APP_THEMES.find((t) => t.id === themeId) || APP_THEMES[0];
}

export function applyTheme(themeId: ThemeId): void {
  if (typeof document === 'undefined') return;
  const config = getThemeConfig(themeId);
  const root = document.documentElement;

  if (config.category === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Set theme data attribute for CSS targeting
  root.setAttribute('data-theme', themeId);

  // Set CSS Variables dynamically on root
  const { colors } = config;
  root.style.setProperty('--app-bg', colors.appBg);
  root.style.setProperty('--card-bg', colors.cardBg);
  root.style.setProperty('--card-bg-subtle', colors.cardBgSubtle);
  root.style.setProperty('--card-border', colors.cardBorder);
  root.style.setProperty('--card-border-subtle', colors.cardBorderSubtle);
  root.style.setProperty('--text-primary', colors.textPrimary);
  root.style.setProperty('--text-secondary', colors.textSecondary);
  root.style.setProperty('--text-muted', colors.textMuted);
  root.style.setProperty('--accent-primary', colors.accentPrimary);
  root.style.setProperty('--accent-text', colors.accentText);
  root.style.setProperty('--header-bg', colors.headerBg);
  root.style.setProperty('--input-bg', colors.inputBg);
  root.style.setProperty('--input-border', colors.inputBorder);

  // Update theme meta color for mobile browser tab headers
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', colors.metaThemeColor);
  }
}

