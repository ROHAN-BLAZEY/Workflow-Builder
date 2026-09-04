import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  LayoutGrid, 
  BarChart3, 
  Plus, 
  Smartphone, 
  Monitor, 
  Volume2, 
  VolumeX, 
  Clock, 
  Play,
  Languages,
  Check,
  ChevronDown,
  Download,
  Flame,
  Compass
} from 'lucide-react';
import { ViewMode, DeviceViewMode, ColumnConfig, Task, LanguageCode } from '../types';
import { SUPPORTED_LANGUAGES, getTranslation } from '../utils/i18n';
import { calculateStreak } from '../utils/streak';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  deviceMode: DeviceViewMode;
  setDeviceMode: (mode: DeviceViewMode) => void;
  columns: ColumnConfig[];
  tasks: Task[];
  onOpenNewTask: (columnId?: 'need' | 'should' | 'can') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onStartAllotmentTimer: () => void;
  isAllotmentTimerActive?: boolean;
  language: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  onOpenBackupModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  deviceMode,
  setDeviceMode,
  columns,
  tasks,
  onOpenNewTask,
  soundEnabled,
  onToggleSound,
  onStartAllotmentTimer,
  isAllotmentTimerActive,
  language,
  onChangeLanguage,
  onOpenBackupModal,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayCompleted = tasks.filter(t => t.completed && t.completedAt?.startsWith(todayStr));
  const streakInfo = calculateStreak(tasks);

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <header 
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs transition-colors w-full overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
          
          {/* Logo & Brand: Now or Never */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setViewMode('board')}
              className="flex items-center gap-2 text-left group focus:outline-none"
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform text-white font-extrabold text-xs shrink-0">
                NN
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 truncate">
                    {getTranslation('appName', language)}
                  </span>
                  {/* Streak Badge */}
                  <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold" title={`${streakInfo.currentStreak} Day Streak - ${streakInfo.badgeTitle}`}>
                    <span>{streakInfo.badgeEmoji}</span>
                    <span>{streakInfo.currentStreak}d</span>
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Navigation View Modes */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto max-w-full no-scrollbar">
            <button
              id="view-board-btn"
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                viewMode === 'board'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
              <span>{getTranslation('boardTab', language)}</span>
            </button>

            <button
              id="view-timetable-btn"
              onClick={() => setViewMode('timetable')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                viewMode === 'timetable'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>{getTranslation('timetableTab', language)}</span>
            </button>

            <button
              id="view-calendar-btn"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap relative ${
                viewMode === 'calendar'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-rose-500" />
              <span>{getTranslation('calendarTab', language)}</span>
              {todayCompleted.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>

            <button
              id="view-analytics-btn"
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                viewMode === 'analytics'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
              <span>{getTranslation('velocityTab', language)}</span>
            </button>

            <button
              id="view-commute-btn"
              onClick={() => setViewMode('commute')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                viewMode === 'commute'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-indigo-600" />
              <span>{getTranslation('commuteTab', language)}</span>
            </button>
          </div>

          {/* Right Controls: Backup & Sync + 12 Languages + Timer + Add Task */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            
            {/* Offline Backup & Sync Button */}
            <button
              id="backup-sync-btn"
              onClick={onOpenBackupModal}
              title="1-click JSON backup export & sync between phone and laptop"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-200 transition-all active:scale-95 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Backup & Sync</span>
              <span className="sm:hidden">Sync</span>
            </button>

            {/* 12 Regional Language Picker Dropdown */}
            <div className="relative">
              <button
                id="language-picker-btn"
                onClick={() => setShowLangMenu(!showLangMenu)}
                title="Change Platform Language (12 Indian Regional Languages)"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
              >
                <Languages className="w-3.5 h-3.5 text-indigo-600" />
                <span>{currentLangObj.flag}</span>
                <span className="hidden md:inline text-xs">{currentLangObj.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showLangMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLangMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-60 max-h-80 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
                      12 Regional Languages
                    </div>
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          onChangeLanguage(l.code);
                          setShowLangMenu(false);
                        }}
                        className={`w-full p-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors ${
                          language === l.code
                            ? 'bg-indigo-50 text-indigo-700 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{l.flag}</span>
                          <div>
                            <p className="font-semibold text-slate-900">{l.name}</p>
                            <p className="text-[10px] text-slate-500">{l.nativeName}</p>
                          </div>
                        </div>
                        {language === l.code && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Start Sequential Allotment Timer Button */}
            <button
              onClick={onStartAllotmentTimer}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 ${
                isAllotmentTimerActive
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/40 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">
                {isAllotmentTimerActive ? getTranslation('sessionActive', language) : getTranslation('startSession', language)}
              </span>
              <span className="sm:hidden">{getTranslation('timer', language)}</span>
            </button>

            {/* Quick Add Task Button */}
            <button
              id="quick-add-task-btn"
              onClick={() => onOpenNewTask('need')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{getTranslation('addTask', language)}</span>
            </button>

            {/* Device preview toggle (Web vs Mobile Frame) */}
            <div className="hidden xl:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                title="Desktop Web Layout"
                onClick={() => setDeviceMode('responsive')}
                className={`p-1.5 rounded ${deviceMode === 'responsive' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                title="Mobile App Simulator"
                onClick={() => setDeviceMode('mobile-preview')}
                className={`p-1.5 rounded ${deviceMode === 'mobile-preview' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sound toggle */}
            <button
              id="sound-toggle-btn"
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            </button>

          </div>

        </div>

        {/* Column Duration Allotment Bar */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-3 gap-1.5 sm:gap-2 text-xs">
          {columns.map((col) => {
            const colTasks = tasks.filter(t => t.columnId === col.id);
            const activeTasks = colTasks.filter(t => !t.completed);
            const durationMins = col.durationMinutes || col.dailyBudgetMinutes || 30;

            const colTitle = col.id === 'need' 
              ? getTranslation('needToDo', language) 
              : col.id === 'should' 
              ? getTranslation('shouldDo', language) 
              : getTranslation('canDo', language);

            return (
              <div 
                key={col.id} 
                className="flex items-center justify-between px-2 sm:px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 min-w-0"
              >
                <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    col.id === 'need' ? 'bg-rose-500' : col.id === 'should' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <span className="font-semibold text-slate-700 truncate text-[10px] sm:text-xs">
                    {colTitle} ({activeTasks.length})
                  </span>
                </div>
                <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-slate-600 font-mono font-bold shrink-0 ml-1">
                  <span>{durationMins}m</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </header>
  );
};

