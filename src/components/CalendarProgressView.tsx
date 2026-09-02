import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Award, 
  Download
} from 'lucide-react';
import { Task, ColumnConfig, ColumnId, LanguageCode } from '../types';
import { 
  generateMonthCalendarGrid, 
  formatFriendlyDate, 
  formatTimeMinutes, 
  formatDateToYYYYMMDD, 
  calculateCompletionStreak
} from '../utils/dateUtils';
import { getTranslation } from '../utils/i18n';

interface CalendarProgressViewProps {
  tasks: Task[];
  columns: ColumnConfig[];
  onToggleComplete: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  language?: LanguageCode;
}

export const CalendarProgressView: React.FC<CalendarProgressViewProps> = ({
  tasks,
  columns,
  onToggleComplete,
  onEditTask,
  language = 'en',
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string>(formatDateToYYYYMMDD(new Date()));
  const [selectedColumnFilter, setSelectedColumnFilter] = useState<ColumnId | 'all'>('all');

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, monthIndex - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, monthIndex + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDayStr(formatDateToYYYYMMDD(today));
  };

  // Filter tasks if specific column selected
  const filteredTasks = selectedColumnFilter === 'all'
    ? tasks
    : tasks.filter((t) => t.columnId === selectedColumnFilter);

  const calendarGrid = generateMonthCalendarGrid(year, monthIndex, filteredTasks);

  // Month formatted title
  const monthTitle = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Calculate global streak metrics
  const streakInfo = calculateCompletionStreak(tasks);

  // Completed tasks across entire system
  const completedTasks = tasks.filter((t) => t.completed);
  const totalMinutesWorkedOnCompleted = completedTasks.reduce(
    (sum, t) => sum + (t.actualMinutes || t.estimatedMinutes || 0),
    0
  );

  // Selected Day data
  const selectedDayInfo = calendarGrid.find((d) => d.dateStr === selectedDayStr) || {
    date: new Date(selectedDayStr),
    dateStr: selectedDayStr,
    dayNumber: parseInt(selectedDayStr.split('-')[2], 10),
    isCurrentMonth: true,
    isToday: selectedDayStr === formatDateToYYYYMMDD(new Date()),
    tasksCompleted: tasks.filter((t) => t.completed && t.completedAt?.startsWith(selectedDayStr)),
    needCount: tasks.filter((t) => t.completed && t.completedAt?.startsWith(selectedDayStr) && t.columnId === 'need').length,
    shouldCount: tasks.filter((t) => t.completed && t.completedAt?.startsWith(selectedDayStr) && t.columnId === 'should').length,
    canCount: tasks.filter((t) => t.completed && t.completedAt?.startsWith(selectedDayStr) && t.columnId === 'can').length,
    totalActualMinutes: tasks.filter((t) => t.completed && t.completedAt?.startsWith(selectedDayStr)).reduce((s, t) => s + (t.actualMinutes || 0), 0),
    totalEstimatedMinutes: tasks.filter((t) => t.completed && t.completedAt?.startsWith(selectedDayStr)).reduce((s, t) => s + (t.estimatedMinutes || 0), 0),
    hasActivity: tasks.some((t) => t.completed && t.completedAt?.startsWith(selectedDayStr)),
  };

  const selectedDayTasks = selectedDayInfo.tasksCompleted || [];

  // Export progress summary as text
  const handleExportSummary = () => {
    let report = `NOW OR NEVER — WORKS PROGRESS REPORT\nGenerated: ${new Date().toLocaleString()}\n`;
    report += `Total Completed: ${completedTasks.length}\n`;
    report += `Total Focus Time: ${formatTimeMinutes(totalMinutesWorkedOnCompleted)}\n`;
    report += `Streak: ${streakInfo.currentStreak} days\n\n`;
    report += `==============================================\n`;
    
    completedTasks.forEach((t, i) => {
      const colName = t.columnId === 'need' ? 'Need to Do' : t.columnId === 'should' ? 'Should Do' : 'Can Do';
      const compDate = t.completedAt ? new Date(t.completedAt).toLocaleString() : 'N/A';
      report += `${i + 1}. [${colName}] ${t.title}\n`;
      report += `   Completed: ${compDate} | Time: ${formatTimeMinutes(t.actualMinutes || t.estimatedMinutes)}\n\n`;
    });

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Progress_Report_${formatDateToYYYYMMDD(new Date())}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 w-full max-w-full overflow-x-hidden">
      
      {/* Top Banner & Streak Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Total Completed */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 flex items-center gap-3 shadow-xs min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate block">{getTranslation('completedTasks', language)}</span>
            <p className="text-lg sm:text-2xl font-bold text-slate-900 font-mono">{completedTasks.length}</p>
          </div>
        </div>

        {/* Total Time Spent */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 flex items-center gap-3 shadow-xs min-w-0">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate block">{getTranslation('totalFocus', language)}</span>
            <p className="text-lg sm:text-2xl font-bold text-slate-900 font-mono truncate">
              {formatTimeMinutes(totalMinutesWorkedOnCompleted)}
            </p>
          </div>
        </div>

        {/* Streak */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 flex items-center gap-3 shadow-xs min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate block">{getTranslation('streakDays', language)}</span>
            <p className="text-lg sm:text-2xl font-bold text-slate-900 font-mono flex items-baseline gap-1">
              <span>{streakInfo.currentStreak}</span>
              <span className="text-xs text-amber-600 font-normal">days</span>
            </p>
          </div>
        </div>

        {/* Productive Days */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 flex items-center gap-3 shadow-xs min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate block">{getTranslation('activeDays', language)}</span>
            <p className="text-lg sm:text-2xl font-bold text-slate-900 font-mono">
              {streakInfo.totalDaysWithCompletedTasks} <span className="text-xs text-slate-500 font-normal">days</span>
            </p>
          </div>
        </div>

      </div>

      {/* Main Calendar Section & Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left: Monthly Calendar Grid (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-4 w-full overflow-hidden">
          
          {/* Calendar Header Controls */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5 sm:gap-2">
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                <span>{monthTitle}</span>
              </h2>

              <button
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              >
                {getTranslation('today', language)}
              </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Filter by column */}
              <div className="flex items-center bg-slate-50 p-0.5 sm:p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setSelectedColumnFilter('all')}
                  className={`px-2 py-1 rounded-lg font-medium transition-all text-[11px] sm:text-xs ${
                    selectedColumnFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {getTranslation('all', language)}
                </button>
                <button
                  onClick={() => setSelectedColumnFilter('need')}
                  className={`px-2 py-1 rounded-lg font-medium transition-all text-[11px] sm:text-xs flex items-center gap-1 ${
                    selectedColumnFilter === 'need'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-rose-600'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Need
                </button>
                <button
                  onClick={() => setSelectedColumnFilter('should')}
                  className={`px-2 py-1 rounded-lg font-medium transition-all text-[11px] sm:text-xs flex items-center gap-1 ${
                    selectedColumnFilter === 'should'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-amber-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Should
                </button>
                <button
                  onClick={() => setSelectedColumnFilter('can')}
                  className={`px-2 py-1 rounded-lg font-medium transition-all text-[11px] sm:text-xs flex items-center gap-1 ${
                    selectedColumnFilter === 'can'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-emerald-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Can
                </button>
              </div>

              {/* Month navigation buttons */}
              <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={handlePrevMonth}
                  aria-label="Previous Month"
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  aria-label="Next Month"
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500 py-1.5 border-b border-slate-200">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarGrid.map((day) => {
              const isSelected = day.dateStr === selectedDayStr;
              const hasNeed = day.needCount > 0;
              const hasShould = day.shouldCount > 0;
              const hasCan = day.canCount > 0;

              return (
                <button
                  key={day.dateStr}
                  onClick={() => setSelectedDayStr(day.dateStr)}
                  className={`min-h-[64px] sm:min-h-[80px] p-1 sm:p-2 rounded-xl border flex flex-col justify-between text-left transition-all relative ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/40 shadow-xs'
                      : day.hasActivity
                      ? 'border-slate-300 bg-white hover:border-indigo-300 hover:bg-slate-50'
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
                  } ${!day.isCurrentMonth ? 'opacity-40' : ''}`}
                >
                  
                  {/* Day Number + Today Badge */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-[11px] sm:text-xs font-mono font-bold ${
                        day.isToday
                          ? 'w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs'
                          : day.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {day.tasksCompleted.length > 0 && (
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold px-1 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ✓{day.tasksCompleted.length}
                      </span>
                    )}
                  </div>

                  {/* Activity preview dots & time spent */}
                  <div className="space-y-0.5 sm:space-y-1 w-full mt-1">
                    {/* Time spent pill */}
                    {day.totalActualMinutes > 0 ? (
                      <div className="text-[9px] sm:text-[10px] font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded border border-slate-200 truncate font-semibold">
                        {formatTimeMinutes(day.totalActualMinutes)}
                      </div>
                    ) : day.totalEstimatedMinutes > 0 ? (
                      <div className="text-[9px] sm:text-[10px] font-mono text-slate-400 bg-slate-50 px-1 py-0.5 rounded truncate">
                        {formatTimeMinutes(day.totalEstimatedMinutes)}
                      </div>
                    ) : null}

                    {/* Color Dots for 3 Columns */}
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      {hasNeed && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                      {hasShould && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                      {hasCan && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    </div>
                  </div>

                </button>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
            <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs">
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>{getTranslation('needToDo', language)}</span>
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>{getTranslation('shouldDo', language)}</span>
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{getTranslation('canDo', language)}</span>
              </span>
            </div>

            <button
              onClick={handleExportSummary}
              className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-indigo-600 font-semibold underline underline-offset-4"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{getTranslation('exportLog', language)}</span>
            </button>
          </div>

        </div>

        {/* Right: Selected Date Completed Works Detail (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-4 w-full">
          
          {/* Header */}
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                {getTranslation('timelineProgress', language)}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {formatFriendlyDate(selectedDayStr)}
              </h3>
            </div>

            <div className="text-right">
              <span className="text-[10px] sm:text-[11px] text-slate-500 block">{getTranslation('totalFocus', language)}</span>
              <p className="text-sm sm:text-base font-mono font-bold text-emerald-600">
                {formatTimeMinutes(selectedDayInfo.totalActualMinutes || selectedDayInfo.totalEstimatedMinutes)}
              </p>
            </div>
          </div>

          {/* Breakdown summary cards for this day */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-rose-700 font-bold block text-[10px] sm:text-[11px]">Need</span>
              <span className="text-sm font-mono font-extrabold text-slate-900">
                {selectedDayInfo.needCount}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-amber-800 font-bold block text-[10px] sm:text-[11px]">Should</span>
              <span className="text-sm font-mono font-extrabold text-slate-900">
                {selectedDayInfo.shouldCount}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-emerald-800 font-bold block text-[10px] sm:text-[11px]">Can</span>
              <span className="text-sm font-mono font-extrabold text-slate-900">
                {selectedDayInfo.canCount}
              </span>
            </div>
          </div>

          {/* List of completed works for this day */}
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {selectedDayTasks.length === 0 ? (
              <div className="py-8 text-center rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-700">{getTranslation('noCompletedWork', language)}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Complete tasks in the 3 columns to build your daily timeline.
                </p>
              </div>
            ) : (
              selectedDayTasks.map((task) => {
                const colBorder =
                  task.columnId === 'need'
                    ? 'border-l-rose-500'
                    : task.columnId === 'should'
                    ? 'border-l-amber-500'
                    : 'border-l-emerald-500';

                const badgePill =
                  task.columnId === 'need'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : task.columnId === 'should'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200';

                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl border border-slate-200 bg-white ${colBorder} border-l-4 space-y-2 shadow-xs`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`px-1.5 py-0.2 text-[9px] uppercase font-bold rounded ${badgePill} shrink-0`}>
                          {task.columnId === 'need' ? 'Need' : task.columnId === 'should' ? 'Should' : 'Can'}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate">{task.title}</h4>
                      </div>

                      <button
                        onClick={() => onToggleComplete(task.id)}
                        className="text-[10px] text-slate-400 hover:text-indigo-600 underline shrink-0 font-medium"
                        title="Reopen task"
                      >
                        {getTranslation('reopen', language)}
                      </button>
                    </div>

                    {task.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Completion Time & Reflection Notes */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="font-semibold text-slate-700">{formatTimeMinutes(task.actualMinutes || task.estimatedMinutes)}</span>
                      </span>

                      {task.completedAt && (
                        <span>
                          {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {task.completionNotes && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 italic">
                        "{task.completionNotes}"
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
