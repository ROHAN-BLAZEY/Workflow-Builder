import React, { useState } from 'react';
import { 
  Check, 
  Clock, 
  Play, 
  Pause, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  CheckCircle2
} from 'lucide-react';
import { Task, ColumnId, PriorityLevel, LanguageCode } from '../types';
import { formatTimeMinutes } from '../utils/dateUtils';
import { getTranslation } from '../utils/i18n';

interface TaskCardProps {
  task: Task;
  isTimerActive: boolean;
  onToggleComplete: (taskId: string) => void;
  onStartTimer: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveColumn: (taskId: string, newColumnId: ColumnId) => void;
  language?: LanguageCode;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isTimerActive,
  onToggleComplete,
  onStartTimer,
  onEditTask,
  onDeleteTask,
  onMoveColumn,
  language = 'en',
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const getPriorityBadge = (p: PriorityLevel) => {
    switch (p) {
      case 'urgent':
        return (
          <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
            {getTranslation('priorityUrgent', language)}
          </span>
        );
      case 'high':
        return (
          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
            {getTranslation('priorityHigh', language)}
          </span>
        );
      case 'normal':
        return (
          <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-medium uppercase tracking-wide">
            {getTranslation('priorityNormal', language)}
          </span>
        );
      case 'low':
        return (
          <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded font-medium uppercase tracking-wide">
            {getTranslation('priorityLow', language)}
          </span>
        );
    }
  };

  const getColumnAccent = (colId: ColumnId) => {
    switch (colId) {
      case 'need':
        return 'border-l-rose-500';
      case 'should':
        return 'border-l-amber-500';
      case 'can':
        return 'border-l-emerald-500';
    }
  };

  return (
    <div
      className={`group relative rounded-xl border border-slate-200 p-3 sm:p-4 transition-all duration-200 bg-white shadow-xs ${getColumnAccent(
        task.columnId
      )} border-l-4 ${
        task.completed
          ? 'opacity-60 bg-slate-50 border-slate-200'
          : 'hover:shadow-md hover:border-slate-300'
      } ${isTimerActive ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''}`}
    >
      <div className="flex items-start gap-2.5 sm:gap-3">
        
        {/* Checkbox */}
        <button
          id={`task-complete-btn-${task.id}`}
          onClick={() => onToggleComplete(task.id)}
          aria-label={task.completed ? 'Mark as incomplete' : 'Mark as completed'}
          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
            task.completed
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
              : 'border-slate-300 hover:border-indigo-500 bg-white hover:bg-slate-50'
          }`}
        >
          {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Task Core Content */}
        <div className="flex-1 min-w-0">
          
          <div className="flex items-start justify-between gap-1.5">
            <h4
              className={`text-xs sm:text-sm font-semibold mb-0.5 text-slate-900 leading-snug tracking-tight break-words ${
                task.completed ? 'line-through text-slate-400' : ''
              }`}
            >
              {task.title}
            </h4>

            {/* Quick Actions Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Task Options"
              >
                <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-6 z-30 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-xs text-slate-700 divide-y divide-slate-100">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onEditTask(task);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 font-medium"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{getTranslation('editTask', language)}</span>
                      </button>
                    </div>

                    <div className="py-1 px-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {getTranslation('moveColumn', language)}
                      </span>
                      <div className="mt-1 flex flex-col gap-1">
                        {task.columnId !== 'need' && (
                          <button
                            onClick={() => {
                              onMoveColumn(task.id, 'need');
                              setShowMenu(false);
                            }}
                            className="text-left py-1 px-2 rounded hover:bg-rose-50 text-rose-600 font-medium"
                          >
                            → {getTranslation('needToDo', language)}
                          </button>
                        )}
                        {task.columnId !== 'should' && (
                          <button
                            onClick={() => {
                              onMoveColumn(task.id, 'should');
                              setShowMenu(false);
                            }}
                            className="text-left py-1 px-2 rounded hover:bg-amber-50 text-amber-700 font-medium"
                          >
                            → {getTranslation('shouldDo', language)}
                          </button>
                        )}
                        {task.columnId !== 'can' && (
                          <button
                            onClick={() => {
                              onMoveColumn(task.id, 'can');
                              setShowMenu(false);
                            }}
                            className="text-left py-1 px-2 rounded hover:bg-emerald-50 text-emerald-700 font-medium"
                          >
                            → {getTranslation('canDo', language)}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDeleteTask(task.id);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{getTranslation('deleteTask', language)}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-slate-500 mt-0.5 mb-1.5 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Time & Scheduling Badges */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            
            {/* Priority Badge */}
            {getPriorityBadge(task.priority)}

            {/* Tags */}
            {task.tags && task.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-medium uppercase"
              >
                {tag}
              </span>
            ))}

            {/* Scheduled Window */}
            {task.scheduledStartTime && (
              <div 
                title="Scheduled Time Slot"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-mono"
              >
                <span>{task.scheduledStartTime}</span>
                {task.scheduledEndTime && <span>- {task.scheduledEndTime}</span>}
              </div>
            )}
          </div>

          {/* Completion summary notes if completed */}
          {task.completed && task.completedAt && (
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-emerald-600 font-medium flex items-center justify-between gap-2">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                {getTranslation('completed', language)} {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {task.completionNotes && (
                <span className="italic truncate text-slate-400 max-w-[140px]" title={task.completionNotes}>
                  "{task.completionNotes}"
                </span>
              )}
            </div>
          )}

          {/* Active Timer Trigger & Duration Footer */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
            {/* Duration */}
            <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="font-semibold text-slate-600">{formatTimeMinutes(task.estimatedMinutes)}</span>
              {task.actualMinutes > 0 && (
                <span className="text-emerald-600 font-bold">({formatTimeMinutes(task.actualMinutes)})</span>
              )}
            </div>

            {!task.completed && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onStartTimer(task)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isTimerActive
                      ? 'bg-indigo-600 text-white animate-pulse shadow-xs'
                      : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200'
                  }`}
                >
                  {isTimerActive ? (
                    <>
                      <Pause className="w-3 h-3 fill-current" />
                      <span>{getTranslation('focusSession', language)}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current text-indigo-600" />
                      <span>{getTranslation('timer', language)}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onEditTask(task)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 underline underline-offset-2"
                >
                  {getTranslation('edit', language)}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
