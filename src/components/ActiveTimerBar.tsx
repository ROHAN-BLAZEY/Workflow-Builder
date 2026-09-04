import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Check, Clock, Plus, Bell } from 'lucide-react';
import { ActiveTimerState, Task } from '../types';
import { formatSecondsToDigital } from '../utils/dateUtils';
import { soundManager } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface ActiveTimerBarProps {
  timer: ActiveTimerState;
  task: Task | undefined;
  onTogglePlay: () => void;
  onStop: () => void;
  onAddFiveMinutes: () => void;
  onCompleteTask: (taskId: string) => void;
  onTick?: (newSeconds: number) => void;
  onTimerExpired: (taskId: string, initialSeconds: number) => void;
}

export const ActiveTimerBar: React.FC<ActiveTimerBarProps> = ({
  timer,
  task,
  onTogglePlay,
  onStop,
  onAddFiveMinutes,
  onCompleteTask,
  onTick,
  onTimerExpired
}) => {
  const [localSeconds, setLocalSeconds] = useState(timer.secondsRemaining);

  // Sync local seconds when timer prop changes significantly (like +5 mins)
  useEffect(() => {
    setLocalSeconds(timer.secondsRemaining);
  }, [timer.secondsRemaining, timer.taskId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.isRunning && timer.taskId) {
      interval = setInterval(() => {
        setLocalSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onTimerExpired(timer.taskId!, timer.initialSeconds);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.taskId, timer.initialSeconds, onTimerExpired]);

  if (!timer.taskId || !task) return null;

  const totalSecs = timer.initialSeconds || (task.estimatedMinutes * 60);
  const progressPct = totalSecs > 0 ? Math.max(0, Math.min(100, ((totalSecs - localSeconds) / totalSecs) * 100)) : 0;

  const getBadgeColor = () => {
    if (task.columnId === 'need') return 'bg-rose-500 text-white';
    if (task.columnId === 'should') return 'bg-amber-500 text-slate-900';
    return 'bg-emerald-500 text-slate-900';
  };

  return (
    <div 
      className="fixed left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-300"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4.5rem)' }}
    >
      <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-800 shadow-2xl bg-slate-900/95 backdrop-blur-md text-white flex flex-col gap-2.5">
        
        {/* Progress line */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-1000 linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          
          {/* Task info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-indigo-400 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded ${getBadgeColor()}`}>
                  {task.columnId === 'need' ? 'Need' : task.columnId === 'should' ? 'Should' : 'Can'}
                </span>
                <span className="text-xs text-slate-400 truncate hidden sm:inline">Active Focus Timer</span>
              </div>
              <p className="text-sm font-semibold text-white truncate">{task.title}</p>
            </div>
          </div>

          {/* Time digits */}
          <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-white shrink-0 px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800">
            {formatSecondsToDigital(localSeconds)}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onTogglePlay}
              title={timer.isRunning ? 'Pause' : 'Resume'}
              className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-xs"
            >
              {timer.isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => {
                setLocalSeconds(s => s + 300);
                onAddFiveMinutes();
              }}
              title="+5 minutes"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95 transition-all text-xs font-mono font-bold border border-slate-700"
            >
              +5m
            </button>

            <button
              onClick={() => onCompleteTask(task.id)}
              title="Complete Task"
              className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 transition-all shadow-xs"
            >
              <Check className="w-4 h-4 stroke-[3]" />
            </button>

            <button
              onClick={onStop}
              title="Stop timer"
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 active:scale-95 transition-all border border-slate-700"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
