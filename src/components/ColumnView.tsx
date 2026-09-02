import React, { useState } from 'react';
import { 
  Sliders, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Filter, 
  ArrowUpDown,
  Search,
  Sparkles,
  Play,
  Minus,
  Plus as PlusIcon,
  Layers
} from 'lucide-react';
import { ColumnConfig, ColumnId, Task, ActiveTimerState, LanguageCode } from '../types';
import { TaskCard } from './TaskCard';
import { formatTimeMinutes } from '../utils/dateUtils';
import { getTranslation } from '../utils/i18n';

interface ColumnViewProps {
  columns: ColumnConfig[];
  tasks: Task[];
  activeTimer: ActiveTimerState;
  onToggleComplete: (taskId: string) => void;
  onStartTimer: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveColumn: (taskId: string, newColumnId: ColumnId) => void;
  onOpenNewTask: (columnId: ColumnId) => void;
  onOpenTimeSettings: (columnId: ColumnId) => void;
  onStartColumnAllotment?: (columnId: ColumnId) => void;
  onUpdateColumnDuration?: (columnId: ColumnId, durationMinutes: number) => void;
  language?: LanguageCode;
}

export const ColumnView: React.FC<ColumnViewProps> = ({
  columns,
  tasks,
  activeTimer,
  onToggleComplete,
  onStartTimer,
  onEditTask,
  onDeleteTask,
  onMoveColumn,
  onOpenNewTask,
  onOpenTimeSettings,
  onStartColumnAllotment,
  onUpdateColumnDuration,
  language = 'en',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'time' | 'priority' | 'default'>('default');
  const [mobileActiveColumn, setMobileActiveColumn] = useState<ColumnId | 'all'>('all');

  const handleAdjustDuration = (columnId: ColumnId, currentDur: number, delta: number) => {
    if (!onUpdateColumnDuration) return;
    const newDur = Math.max(5, Math.min(240, currentDur + delta));
    onUpdateColumnDuration(columnId, newDur);
  };

  const getColumnLocalizedTitle = (colId: ColumnId) => {
    if (colId === 'need') return getTranslation('needToDo', language);
    if (colId === 'should') return getTranslation('shouldDo', language);
    return getTranslation('canDo', language);
  };

  const getColumnLocalizedSubtitle = (colId: ColumnId) => {
    if (colId === 'need') return getTranslation('needSubtitle', language);
    if (colId === 'should') return getTranslation('shouldSubtitle', language);
    return getTranslation('canSubtitle', language);
  };

  // Filter columns if mobile single-column view selected
  const displayedColumns = mobileActiveColumn === 'all'
    ? columns
    : columns.filter(c => c.id === mobileActiveColumn);

  return (
    <div className="space-y-4 sm:space-y-5 w-full max-w-full overflow-x-hidden">
      
      {/* Mobile Column Quick Filter Pills (Especially for Samsung SM-A135F & Mobile screens) */}
      <div className="lg:hidden flex items-center justify-between gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 text-xs overflow-x-auto no-scrollbar">
        <button
          onClick={() => setMobileActiveColumn('all')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-bold text-center transition-all whitespace-nowrap text-[11px] sm:text-xs ${
            mobileActiveColumn === 'all'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {getTranslation('all', language)} ({tasks.length})
        </button>

        {columns.map((col) => {
          const colCount = tasks.filter(t => t.columnId === col.id).length;
          const isSel = mobileActiveColumn === col.id;
          const pillDot = col.id === 'need' ? 'bg-rose-500' : col.id === 'should' ? 'bg-amber-500' : 'bg-emerald-500';

          return (
            <button
              key={col.id}
              onClick={() => setMobileActiveColumn(col.id)}
              className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center justify-center gap-1 text-[11px] sm:text-xs ${
                isSel
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${pillDot}`} />
              <span className="truncate">{getColumnLocalizedTitle(col.id).split(' ')[0]}</span>
              <span className="text-[10px] text-slate-400 font-mono">({colCount})</span>
            </button>
          );
        })}
      </div>

      {/* Global Filter / Search Bar */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 bg-white p-2.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex-wrap w-full">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[160px] sm:min-w-[220px] max-w-full">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getTranslation('searchPlaceholder', language)}
            className="w-full pl-8 sm:pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
            >
              ×
            </button>
          )}
        </div>

        {/* Status Filters & Sort */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <div className="flex bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200 text-xs">
            {(['all', 'active', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-2 sm:px-3 py-1 rounded-lg font-medium transition-all text-[11px] sm:text-xs ${
                  filterStatus === status
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {getTranslation(status, language)}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center bg-slate-50 px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 text-[11px] sm:text-xs text-slate-700 gap-1">
            <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'time' | 'priority' | 'default')}
              aria-label="Sort tasks by"
              className="bg-transparent text-[11px] sm:text-xs text-slate-700 focus:outline-none cursor-pointer font-medium"
            >
              <option value="default">{getTranslation('sortDefault', language)}</option>
              <option value="time">{getTranslation('sortTime', language)}</option>
              <option value="priority">{getTranslation('sortPriority', language)}</option>
            </select>
          </div>
        </div>

      </div>

      {/* The Columns Grid (Responsive 1 Column on Mobile, 3 Columns on LG screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start w-full">
        {displayedColumns.map((column) => {
          // Filter tasks for this column
          let colTasks = tasks.filter((t) => t.columnId === column.id);

          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            colTasks = colTasks.filter(
              (t) =>
                t.title.toLowerCase().includes(query) ||
                (t.description && t.description.toLowerCase().includes(query)) ||
                (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(query)))
            );
          }

          if (filterStatus === 'active') {
            colTasks = colTasks.filter((t) => !t.completed);
          } else if (filterStatus === 'completed') {
            colTasks = colTasks.filter((t) => t.completed);
          }

          // Sort
          if (sortBy === 'time') {
            colTasks.sort((a, b) => (b.estimatedMinutes || 0) - (a.estimatedMinutes || 0));
          } else if (sortBy === 'priority') {
            const priorityWeight = { urgent: 4, high: 3, normal: 2, low: 1 };
            colTasks.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
          }

          const allColTasks = tasks.filter((t) => t.columnId === column.id);
          const activeTasks = allColTasks.filter((t) => !t.completed);
          const completedTasks = allColTasks.filter((t) => t.completed);

          const durationMins = column.durationMinutes || column.dailyBudgetMinutes || 30;
          const localizedTitle = getColumnLocalizedTitle(column.id);
          const localizedSubtitle = getColumnLocalizedSubtitle(column.id);

          // Color constants for column accents
          const pillColor = column.id === 'need' 
            ? 'bg-rose-500' 
            : column.id === 'should' 
            ? 'bg-amber-500' 
            : 'bg-emerald-500';

          const badgeBg = column.id === 'need'
            ? 'bg-rose-50 border-rose-100 text-rose-600'
            : column.id === 'should'
            ? 'bg-amber-50 border-amber-100 text-amber-600'
            : 'bg-emerald-50 border-emerald-100 text-emerald-600';

          return (
            <section
              key={column.id}
              className="bg-slate-50/80 rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs flex flex-col transition-all w-full overflow-hidden"
            >
              
              {/* Column Header */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-5 sm:h-6 ${pillColor} rounded-full shrink-0`}></span>
                  <h2 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight flex items-center gap-1.5 truncate">
                    <span className="truncate">{localizedTitle}</span>
                    <span className="text-xs font-mono font-medium text-slate-400 shrink-0">
                      ({colTasks.length})
                    </span>
                  </h2>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Scheduled window pill */}
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] sm:text-[11px] font-bold ${badgeBg}`}>
                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span>{column.windowStartTime} — {column.windowEndTime}</span>
                  </div>

                  {/* Settings modal trigger */}
                  <button
                    id={`col-settings-btn-${column.id}`}
                    onClick={() => onOpenTimeSettings(column.id)}
                    title={getTranslation('columnSettings', language)}
                    className="p-1 rounded-lg hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Custom Duration Allotment (Allows setting custom timer duration without preset lock) */}
              <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 mb-3 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">{getTranslation('duration', language)}:</span>
                  
                  {/* Custom duration stepper & input */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAdjustDuration(column.id, durationMins, -5)}
                      title="Decrease by 5 mins"
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min={5}
                      max={240}
                      value={durationMins}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && onUpdateColumnDuration) {
                          onUpdateColumnDuration(column.id, Math.max(1, Math.min(360, val)));
                        }
                      }}
                      className="w-12 sm:w-14 text-center font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg py-0.5 text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-slate-500 font-mono text-[10px] font-bold">m</span>
                    <button
                      onClick={() => handleAdjustDuration(column.id, durationMins, 5)}
                      title="Increase by 5 mins"
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs"
                    >
                      <PlusIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Direct Column Timer Start Button */}
                {onStartColumnAllotment && (
                  <button
                    onClick={() => onStartColumnAllotment(column.id)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-indigo-400" />
                    <span>{getTranslation('startSession', language)} ({durationMins}m)</span>
                  </button>
                )}
              </div>

              {/* Add Task Button at top of column */}
              <button
                id={`add-task-col-btn-${column.id}`}
                onClick={() => onOpenNewTask(column.id)}
                className="w-full mb-3 py-2 px-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs group active:scale-[0.99]"
              >
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform text-slate-500" />
                <span>+ {getTranslation('addTask', language)}</span>
              </button>

              {/* Column Task List */}
              <div className="space-y-2.5 sm:space-y-3 flex-1 min-h-[180px] sm:min-h-[220px] overflow-y-auto max-h-[60vh] pr-0.5">
                
                {/* Empty State */}
                {colTasks.length === 0 && (
                  <div className="py-8 px-4 text-center rounded-xl bg-white/70 border border-slate-200 flex flex-col items-center justify-center">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center mb-2">
                      <Sparkles className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-700">
                      {filterStatus === 'all'
                        ? getTranslation('noTasksYet', language)
                        : `${getTranslation(filterStatus, language)} 0`}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                      {localizedSubtitle}
                    </p>
                    <button
                      onClick={() => onOpenNewTask(column.id)}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200"
                    >
                      {getTranslation('createTask', language)}
                    </button>
                  </div>
                )}

                {/* Render Task Cards */}
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isTimerActive={activeTimer.taskId === task.id}
                    onToggleComplete={onToggleComplete}
                    onStartTimer={onStartTimer}
                    onEditTask={onEditTask}
                    onDeleteTask={onDeleteTask}
                    onMoveColumn={onMoveColumn}
                    language={language}
                  />
                ))}

              </div>

              {/* Velocity / Stability Indicator at bottom of Column */}
              <div className="mt-3.5 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {column.id === 'need' 
                      ? getTranslation('completionVelocity', language) 
                      : column.id === 'should' 
                      ? getTranslation('taskStability', language) 
                      : getTranslation('optionalCompletion', language)}
                  </p>
                  <span className="text-[10px] font-mono text-slate-500 font-semibold">
                    {completedTasks.length} {getTranslation('completed', language)}
                  </span>
                </div>

                {/* 7-day velocity heat blocks */}
                <div className="grid grid-cols-7 gap-1">
                  {column.id === 'need' && (
                    <>
                      <div className="h-3 sm:h-4 rounded-xs bg-rose-500"></div>
                      <div className="h-3 sm:h-4 rounded-xs bg-rose-400 opacity-80"></div>
                      <div className="h-3 sm:h-4 rounded-xs bg-rose-600"></div>
                      <div className="h-3 sm:h-4 rounded-xs bg-rose-200"></div>
                      <div className="h-3 sm:h-4 rounded-xs bg-rose-500"></div>
                      <div className="h-3 sm:h-4 rounded-xs bg-slate-200"></div>
                      <div className="h-3 sm:h-4 rounded-xs bg-slate-200"></div>
                    </>
                  )}
                  {column.id === 'should' && (
                    <>
                      <div className="h-3 sm:h-4 rounded-xs bg-amber-400"></div>
                      <div className="h-3 sm:h-4 rounded-xs bg-slate-200"></div>
                      <div className="h-3 sm:h-4 rounded-xs bg-amber-500"></div>
                      <div className="h-3 sm:h-4 rounded-xs bg-amber-600"></div>
                      <div className="h-3 sm:h-4 rounded-xs bg-slate-200"></div>
                      <div className="h-3 sm:h-4 rounded-xs bg-amber-400 opacity-60"></div>
                      <div className="h-3 sm:h-4 rounded-xs bg-amber-500"></div>
                    </>
                  )}
                  {column.id === 'can' && (
                    <>
                      <div className="h-3 sm:h-4 rounded-xs bg-slate-200"></div>
                      <div className="h-3 sm:h-4 rounded-xs bg-slate-200"></div>
                      <div className="h-3 sm:h-4 rounded-xs bg-slate-200"></div>
                      <div className="h-3 sm:h-4 rounded-xs bg-emerald-400"></div>
                      <div className="h-3 sm:h-4 rounded-xs bg-emerald-300"></div>
                      <div className="h-3 sm:h-4 rounded-xs bg-emerald-500"></div>
                      <div className="h-3 sm:h-4 rounded-xs bg-emerald-200"></div>
                    </>
                  )}
                </div>
              </div>

            </section>
          );
        })}
      </div>

    </div>
  );
};
