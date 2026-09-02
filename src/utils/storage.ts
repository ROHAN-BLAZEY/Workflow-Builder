import { Task, ColumnConfig, TimetableEntry, LanguageCode, ThemeId, RoutinePreset } from '../types';

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  {
    id: 'need',
    title: 'Need to Do',
    subtitle: 'Must complete • High Impact',
    description: 'Essential core commitments, critical deadlines, and urgent deliverables.',
    badge: 'CRITICAL',
    accentColor: 'rose',
    headerBg: 'bg-white',
    borderClass: 'border-slate-200 hover:border-slate-300',
    lightBg: 'bg-rose-50 border border-rose-100',
    pillBg: 'bg-rose-50 text-rose-600 border border-rose-200 font-bold',
    iconBg: 'bg-rose-500 text-white',
    textColor: 'text-rose-600',
    durationMinutes: 45, // Duration allotment
    dailyBudgetMinutes: 45,
    windowStartTime: '09:00',
    windowEndTime: '12:30',
    defaultTaskMinutes: 25,
  },
  {
    id: 'should',
    title: 'Should Do',
    subtitle: 'Strategic & Important • High Value',
    description: 'Meaningful milestones, system improvements, and secondary priorities.',
    badge: 'IMPORTANT',
    accentColor: 'amber',
    headerBg: 'bg-white',
    borderClass: 'border-slate-200 hover:border-slate-300',
    lightBg: 'bg-amber-50 border border-amber-100',
    pillBg: 'bg-amber-50 text-amber-700 border border-amber-200 font-bold',
    iconBg: 'bg-amber-500 text-white',
    textColor: 'text-amber-600',
    durationMinutes: 30, // Duration allotment
    dailyBudgetMinutes: 30,
    windowStartTime: '13:30',
    windowEndTime: '16:00',
    defaultTaskMinutes: 20,
  },
  {
    id: 'can',
    title: 'Can Do',
    subtitle: 'Nice to have • Growth & Exploration',
    description: 'Optional optimizations, exploratory ideas, and backlog tasks.',
    badge: 'OPTIONAL',
    accentColor: 'emerald',
    headerBg: 'bg-white',
    borderClass: 'border-slate-200 hover:border-slate-300',
    lightBg: 'bg-emerald-50 border border-emerald-100',
    pillBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold',
    iconBg: 'bg-emerald-500 text-white',
    textColor: 'text-emerald-600',
    durationMinutes: 20, // Duration allotment
    dailyBudgetMinutes: 20,
    windowStartTime: '16:00',
    windowEndTime: '17:30',
    defaultTaskMinutes: 15,
  },
];

// Returns empty task list as requested by user
export function generateInitialTasks(): Task[] {
  return [];
}

export const DEFAULT_TIMETABLE_ENTRIES: TimetableEntry[] = [
  {
    id: 'tt-1',
    title: 'Morning Focus: Need to Do Review',
    startTime: '09:00',
    endTime: '10:00',
    category: 'need',
    notes: 'Tackle top critical priority tasks',
  },
  {
    id: 'tt-2',
    title: 'Active Recall & Deep Work Session',
    startTime: '10:15',
    endTime: '11:15',
    category: 'study',
    notes: 'Focused revision and active recall practice',
  },
  {
    id: 'tt-3',
    title: 'Mind Refresh & Walk',
    startTime: '11:15',
    endTime: '11:45',
    category: 'break',
    notes: 'Hydration & short walk',
  },
  {
    id: 'tt-4',
    title: 'Afternoon Sprint: Should Do Tasks',
    startTime: '13:30',
    endTime: '14:30',
    category: 'should',
    notes: 'Strategic projects & milestone practice',
  },
  {
    id: 'tt-5',
    title: 'Growth & Exploration: Can Do Block',
    startTime: '16:00',
    endTime: '16:45',
    category: 'can',
    notes: 'Optional reading & deep dive research',
  },
];

export const STORAGE_KEYS = {
  TASKS: 'non_tasks_data_v3',
  COLUMNS: 'non_columns_data_v3',
  TIMETABLE: 'non_timetable_data_v3',
  LANGUAGE: 'non_language_pref_v1',
  THEME: 'non_theme_pref_v1',
  CUSTOM_PRESETS: 'non_custom_presets_v1',
};

export function loadTasksFromStorage(): Task[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!data) {
      saveTasksToStorage([]);
      return [];
    }
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveTasksToStorage(tasks: Task[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to persist tasks', e);
  }
}

export function loadColumnsFromStorage(): ColumnConfig[] {
  if (typeof window === 'undefined') return DEFAULT_COLUMNS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.COLUMNS);
    if (!data) {
      saveColumnsToStorage(DEFAULT_COLUMNS);
      return DEFAULT_COLUMNS;
    }
    const parsed = JSON.parse(data);
    return parsed.map((col: any) => ({
      ...col,
      durationMinutes: col.durationMinutes || col.dailyBudgetMinutes || 30,
    }));
  } catch {
    return DEFAULT_COLUMNS;
  }
}

export function saveColumnsToStorage(columns: ColumnConfig[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.COLUMNS, JSON.stringify(columns));
  } catch (e) {
    console.error('Failed to persist columns', e);
  }
}

export function loadTimetableFromStorage(): TimetableEntry[] {
  if (typeof window === 'undefined') return DEFAULT_TIMETABLE_ENTRIES;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TIMETABLE);
    if (data === null) {
      saveTimetableToStorage(DEFAULT_TIMETABLE_ENTRIES);
      return DEFAULT_TIMETABLE_ENTRIES;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTimetableToStorage(entries: TimetableEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to persist timetable', e);
  }
}

export function clearTimetableInStorage(): void {
  saveTimetableToStorage([]);
}

export function loadLanguageFromStorage(): LanguageCode {
  if (typeof window === 'undefined') return 'en';
  try {
    const code = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as LanguageCode;
    return code || 'en';
  } catch {
    return 'en';
  }
}

export function saveLanguageToStorage(lang: LanguageCode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  } catch (e) {
    console.error('Failed to persist language', e);
  }
}

export function loadThemeFromStorage(): ThemeId {
  if (typeof window === 'undefined') return 'modern-light';
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME) as ThemeId;
    return theme || 'modern-light';
  } catch {
    return 'modern-light';
  }
}

export function saveThemeToStorage(theme: ThemeId): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (e) {
    console.error('Failed to persist theme', e);
  }
}

export function loadCustomPresetsFromStorage(): RoutinePreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_PRESETS);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveCustomPresetsToStorage(presets: RoutinePreset[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PRESETS, JSON.stringify(presets));
  } catch (e) {
    console.error('Failed to persist custom presets', e);
  }
}
