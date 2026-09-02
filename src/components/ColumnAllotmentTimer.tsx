import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  X, 
  Plus, 
  Clock, 
  Award,
  Layers,
  ChevronRight
} from 'lucide-react';
import { ColumnId, ColumnConfig, Task, ColumnAllotmentTimerState } from '../types';
import { formatTimeMinutes } from '../utils/dateUtils';
import { soundManager } from '../utils/audio';

interface ColumnAllotmentTimerProps {
  timerState: ColumnAllotmentTimerState;
  columns: ColumnConfig[];
  tasks: Task[];
  soundEnabled: boolean;
  onUpdateTimerState: (state: ColumnAllotmentTimerState) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onClose: () => void;
}

export const ColumnAllotmentTimer: React.FC<ColumnAllotmentTimerProps> = ({
  timerState,
  columns,
  tasks,
  soundEnabled,
  onUpdateTimerState,
  onToggleTaskComplete,
  onClose,
}) => {
  const currentColumn = columns.find((c) => c.id === timerState.currentColumnId) || columns[0];
  const nextColumnId: ColumnId | null =
    timerState.currentColumnId === 'need'
      ? 'should'
      : timerState.currentColumnId === 'should'
      ? 'can'
      : null;

  const nextColumn = nextColumnId ? columns.find((c) => c.id === nextColumnId) : null;

  // Active tasks in the current column
  const columnTasks = tasks.filter((t) => t.columnId === timerState.currentColumnId);
  const remainingTasks = columnTasks.filter((t) => !t.completed);
  const completedTasks = columnTasks.filter((t) => t.completed);

  // Timer Tick Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerState.isActive && !timerState.isPaused && timerState.remainingSeconds > 0) {
      interval = setInterval(() => {
        onUpdateTimerState({
          ...timerState,
          remainingSeconds: timerState.remainingSeconds - 1,
        });
      }, 1000);
    } else if (timerState.isActive && !timerState.isPaused && timerState.remainingSeconds === 0) {
      // Time is up for this column! Play chime
      if (soundEnabled) soundManager.playComplete();
      
      // Auto transition to next column if available
      if (nextColumnId && nextColumn) {
        const nextDurationMins = nextColumn.durationMinutes || nextColumn.dailyBudgetMinutes || 30;
        onUpdateTimerState({
          isActive: true,
          isPaused: false,
          currentColumnId: nextColumnId,
          allottedDurationMinutes: nextDurationMins,
          remainingSeconds: nextDurationMins * 60,
          columnSequence: [...timerState.columnSequence, nextColumnId],
        });
      } else {
        // Complete the sequence
        onUpdateTimerState({
          ...timerState,
          isPaused: true,
        });
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState, nextColumnId, nextColumn, soundEnabled, onUpdateTimerState]);

  const handleTogglePause = () => {
    if (soundEnabled) soundManager.playPop();
    onUpdateTimerState({
      ...timerState,
      isPaused: !timerState.isPaused,
    });
  };

  const handleAddMinutes = (mins: number) => {
    if (soundEnabled) soundManager.playPop();
    onUpdateTimerState({
      ...timerState,
      remainingSeconds: timerState.remainingSeconds + mins * 60,
    });
  };

  const handleFinishColumnAndAdvance = () => {
    if (soundEnabled) soundManager.playComplete();

    if (nextColumnId && nextColumn) {
      const nextDurationMins = nextColumn.durationMinutes || nextColumn.dailyBudgetMinutes || 30;
      onUpdateTimerState({
        isActive: true,
        isPaused: false,
        currentColumnId: nextColumnId,
        allottedDurationMinutes: nextDurationMins,
        remainingSeconds: nextDurationMins * 60,
        columnSequence: [...timerState.columnSequence, nextColumnId],
      });
    } else {
      // Done with all 3 columns!
      onClose();
    }
  };

  const handleSwitchColumnDirectly = (colId: ColumnId) => {
    if (soundEnabled) soundManager.playPop();
    const col = columns.find((c) => c.id === colId) || columns[0];
    const duration = col.durationMinutes || col.dailyBudgetMinutes || 30;
    onUpdateTimerState({
      isActive: true,
      isPaused: false,
      currentColumnId: colId,
      allottedDurationMinutes: duration,
      remainingSeconds: duration * 60,
      columnSequence: [...timerState.columnSequence, colId],
    });
  };

  // Format MM:SS
  const mins = Math.floor(timerState.remainingSeconds / 60);
  const secs = timerState.remainingSeconds % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const totalSeconds = timerState.allottedDurationMinutes * 60;
  const progressPercent = totalSeconds > 0 ? Math.round(((totalSeconds - timerState.remainingSeconds) / totalSeconds) * 100) : 0;

  const accentColor =
    timerState.currentColumnId === 'need'
      ? { text: 'text-rose-600', bg: 'bg-rose-500', light: 'bg-rose-50 border-rose-200' }
      : timerState.currentColumnId === 'should'
      ? { text: 'text-amber-600', bg: 'bg-amber-500', light: 'bg-amber-50 border-amber-200' }
      : { text: 'text-emerald-600', bg: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200' };

  return (
    <div className="bg-slate-900/95 text-white rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-800 space-y-5 animate-in fade-in slide-in-from-top-2">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${accentColor.bg} text-white flex items-center justify-center font-extrabold text-sm shadow-md`}>
            {timerState.currentColumnId === 'need' ? '1' : timerState.currentColumnId === 'should' ? '2' : '3'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Allotment Focus Timer
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-800 text-slate-300 border border-slate-700">
                Column Duration: {timerState.allottedDurationMinutes}m
              </span>
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{currentColumn.title}</span>
              <span className="text-xs text-slate-400 font-normal">({remainingTasks.length} remaining tasks)</span>
            </h3>
          </div>
        </div>

        {/* Column Sequence Stepper Indicator */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
          {(['need', 'should', 'can'] as const).map((colId, index) => {
            const isCurrent = timerState.currentColumnId === colId;
            const isCompleted = timerState.columnSequence.includes(colId) && !isCurrent;
            const label = colId === 'need' ? 'Need' : colId === 'should' ? 'Should' : 'Can';

            return (
              <React.Fragment key={colId}>
                <button
                  onClick={() => handleSwitchColumnDirectly(colId)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    isCurrent
                      ? `${accentColor.bg} text-white shadow-xs`
                      : isCompleted
                      ? 'bg-slate-700 text-emerald-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : null}
                  <span>{label}</span>
                </button>
                {index < 2 && <ChevronRight className="w-3 h-3 text-slate-600" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Dismiss Timer Panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Countdown Timer & Live Action Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Countdown Display & Core Controls (5 cols) */}
        <div className="md:col-span-5 bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 text-center space-y-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Time Remaining in {currentColumn.title}
            </span>
            <div className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight text-white my-2">
              {timeFormatted}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full ${accentColor.bg} transition-all duration-300`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Quick Timer Controls */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={handleTogglePause}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                timerState.isPaused
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
              }`}
            >
              {timerState.isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
              <span>{timerState.isPaused ? 'Resume Timer' : 'Pause'}</span>
            </button>

            <button
              onClick={() => handleAddMinutes(5)}
              className="px-3 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-mono text-xs font-bold transition-colors"
            >
              +5m
            </button>

            <button
              onClick={() => handleAddMinutes(10)}
              className="px-3 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-mono text-xs font-bold transition-colors"
            >
              +10m
            </button>
          </div>

          {/* Advance Column Action */}
          <button
            onClick={handleFinishColumnAndAdvance}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <span>Finish {currentColumn.title}</span>
            {nextColumn ? (
              <>
                <ArrowRight className="w-4 h-4" />
                <span>Allot {nextColumn.durationMinutes}m for {nextColumn.title}</span>
              </>
            ) : (
              <span>& Complete Sequence</span>
            )}
          </button>
        </div>

        {/* Column Tasks to Check Off (7 cols) */}
        <div className="md:col-span-7 bg-slate-800/30 border border-slate-700/60 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Current Tasks in {currentColumn.title} ({remainingTasks.length} active)</span>
            </h4>
            <span className="text-[11px] text-emerald-400 font-mono font-bold">
              {completedTasks.length} Done
            </span>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {columnTasks.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No tasks added to this column yet. You can add one below or focus without a task list!
              </div>
            ) : (
              columnTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onToggleTaskComplete(task.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    task.completed
                      ? 'bg-slate-800/40 border-slate-800 opacity-60'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center border shrink-0 ${
                        task.completed
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                          : 'border-slate-500'
                      }`}
                    >
                      {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-xs font-medium truncate ${task.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                      {task.title}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">
                    {task.estimatedMinutes}m
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
