export type ColumnId = 'need' | 'should' | 'can';

export type PriorityLevel = 'urgent' | 'high' | 'normal' | 'low';

export type LanguageCode =
  | 'en' // English
  | 'hi' // हिन्दी (Hindi)
  | 'bn' // বাংলা (Bengali)
  | 'te' // తెలుగు (Telugu)
  | 'mr' // मराठी (Marathi)
  | 'ta' // தமிழ் (Tamil)
  | 'gu' // ગુજરાતી (Gujarati)
  | 'kn' // ಕನ್ನಡ (Kannada)
  | 'ml' // മലയാളം (Malayalam)
  | 'pa' // ਪੰਜਾਬੀ (Punjabi)
  | 'or' // ଓଡ଼ିଆ (Odia)
  | 'ur'; // اردو (Urdu)

export type ThemeId =
  | 'modern-light'
  | 'midnight-dark'
  | 'cyberpunk-emerald'
  | 'warm-sepia'
  | 'ocean-sapphire'
  | 'sunset-rose'
  | 'nordic-slate';

export interface SubStep {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  columnId: ColumnId;
  title: string;
  description?: string;
  estimatedMinutes: number;
  actualMinutes: number;
  scheduledStartTime?: string; // "HH:mm" e.g. "09:00"
  scheduledEndTime?: string;   // "HH:mm" e.g. "10:30"
  dueDate: string;             // YYYY-MM-DD
  priority: PriorityLevel;
  tags: string[];
  completed: boolean;
  completedAt?: string;        // ISO timestamp
  completionNotes?: string;
  subSteps?: SubStep[];        // Mini-checklists micro-progress
  createdAt: string;
  order: number;
}

export interface ColumnConfig {
  id: ColumnId;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  accentColor: string;       // Primary accent name
  headerBg: string;
  borderClass: string;
  lightBg: string;
  pillBg: string;
  iconBg: string;
  textColor: string;
  durationMinutes: number;   // Column Focus Duration allotment
  dailyBudgetMinutes?: number; // Backwards-compatible alias
  windowStartTime: string;    // Active work window start "HH:mm"
  windowEndTime: string;      // Active work window end "HH:mm"
  defaultTaskMinutes: number;
}

export interface TimetableEntry {
  id: string;
  title: string;
  startTime: string; // "09:00"
  endTime: string;   // "10:30"
  date?: string;     // YYYY-MM-DD
  dayOfWeek?: number; // 0=Sun, 1=Mon, ..., 6=Sat
  category: 'need' | 'should' | 'can' | 'study' | 'break' | 'custom';
  color?: string;
  notes?: string;
  taskId?: string;   // Linked task if any
  completed?: boolean;
}

export interface TimeSpentRecord {
  taskId: string;
  columnId: ColumnId;
  taskTitle: string;
  date: string; // YYYY-MM-DD
  minutes: number;
  timestamp: string;
}

export interface DayProgress {
  date: string; // YYYY-MM-DD
  completedTasks: Task[];
  totalCompleted: number;
  needCompleted: number;
  shouldCompleted: number;
  canCompleted: number;
  totalEstimatedMinutes: number;
  totalActualMinutes: number;
  completionRate: number; // 0 - 100
}

export interface ActiveTimerState {
  taskId: string | null;
  taskTitle?: string;
  columnId?: ColumnId;
  secondsRemaining: number;
  initialSeconds: number;
  isRunning: boolean;
  isCountUp: boolean;
}

export interface ColumnAllotmentTimerState {
  isActive: boolean;
  isPaused: boolean;
  currentColumnId: ColumnId;
  allottedDurationMinutes: number;
  remainingSeconds: number;
  columnSequence: ColumnId[];
}

export type RoutinePresetCategory = 'all' | 'academic' | 'work' | 'timing' | 'productivity' | 'custom';

export interface RoutinePreset {
  id: string;
  name: string;
  category: 'academic' | 'work' | 'timing' | 'productivity' | 'custom';
  badge: string;
  durationLabel: string;
  description: string;
  iconName?: string;
  isCustom?: boolean;
  entries: Array<Omit<TimetableEntry, 'id'>>;
  suggestedTasks?: Array<{
    title: string;
    columnId: ColumnId;
    estimatedMinutes: number;
    description: string;
  }>;
}

export type ViewMode = 'board' | 'timetable' | 'calendar' | 'analytics' | 'commute';
export type DeviceViewMode = 'responsive' | 'mobile-preview' | 'tablet-preview';

export interface TravelStop {
  id: string;
  location: string;
  durationMinutes: number;
  purpose?: string;
}

export interface TravelPlanPayload {
  origin: string;
  stops: TravelStop[];
  destination: string;
  travelMode: 'driving' | 'transit' | 'walking' | 'bicycling';
  workStyle: 'handsfree' | 'mobile_transit' | 'stationary_stops' | 'resilient';
  departureTime?: string;
  trafficTolerance: 'tight' | 'moderate' | 'defensive';
  tasks: Array<{ id: string; title: string; columnId: ColumnId; estimatedMinutes: number }>;
  userLocation?: { latitude: number; longitude: number };
}

export interface GroundingChunkItem {
  maps?: {
    uri?: string;
    title?: string;
    placeAnswerSources?: {
      reviewSnippets?: Array<{
        reviewText?: string;
        authorAttribution?: { displayName?: string };
      }>;
    };
  };
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface TravelPlanResponse {
  success: boolean;
  model: string;
  text: string;
  groundingChunks?: GroundingChunkItem[];
  webSearchQueries?: string[];
  error?: string;
  message?: string;
}

