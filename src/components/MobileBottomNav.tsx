import React from 'react';
import { LayoutGrid, Calendar as CalendarIcon, Clock, Plus, BarChart3, Compass } from 'lucide-react';
import { ViewMode, LanguageCode } from '../types';
import { getTranslation } from '../utils/i18n';

interface MobileBottomNavProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenNewTask: () => void;
  onOpenTimeSettings: () => void;
  completedTodayCount: number;
  language?: LanguageCode;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  viewMode,
  setViewMode,
  onOpenNewTask,
  completedTodayCount,
  language = 'en',
}) => {
  return (
    <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg w-full">
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* Now or Never (3 Columns) */}
        <button
          onClick={() => setViewMode('board')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
            viewMode === 'board' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[9px] truncate max-w-[60px]">{getTranslation('boardTab', language)}</span>
        </button>

        {/* Timetable */}
        <button
          onClick={() => setViewMode('timetable')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
            viewMode === 'timetable' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[9px] truncate max-w-[60px]">{getTranslation('timetableTab', language)}</span>
        </button>

        {/* Center Quick Add Task Button */}
        <button
          onClick={onOpenNewTask}
          aria-label="Add Task"
          className="w-10 h-10 -mt-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 border-2 border-white active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Calendar Progress */}
        <button
          onClick={() => setViewMode('calendar')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl relative transition-all ${
            viewMode === 'calendar' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[9px] truncate max-w-[60px]">{getTranslation('calendarTab', language)}</span>
          {completedTodayCount > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          )}
        </button>

        {/* Velocity / Analytics */}
        <button
          onClick={() => setViewMode('analytics')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
            viewMode === 'analytics' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[9px] truncate max-w-[60px]">{getTranslation('velocityTab', language)}</span>
        </button>

        {/* Maps & Commute */}
        <button
          onClick={() => setViewMode('commute')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
            viewMode === 'commute' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[9px] truncate max-w-[60px]">{getTranslation('commuteTab', language)}</span>
        </button>

      </div>
    </nav>
  );
};
