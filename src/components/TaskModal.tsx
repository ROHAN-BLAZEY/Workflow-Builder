import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar as CalendarIcon, Tag, Flame, Plus, Check } from 'lucide-react';
import { Task, ColumnId, PriorityLevel, ColumnConfig, LanguageCode } from '../types';
import { formatDateToYYYYMMDD, formatTimeMinutes } from '../utils/dateUtils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (taskData: Partial<Task>) => void;
  editingTask: Task | null;
  defaultColumnId?: ColumnId;
  columns: ColumnConfig[];
  language?: LanguageCode;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSaveTask,
  editingTask,
  defaultColumnId = 'need',
  columns,
}) => {
  const [columnId, setColumnId] = useState<ColumnId>(defaultColumnId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(45);
  const [actualMinutes, setActualMinutes] = useState<number>(0);
  const [scheduledStartTime, setScheduledStartTime] = useState<string>('09:00');
  const [scheduledEndTime, setScheduledEndTime] = useState<string>('10:00');
  const [dueDate, setDueDate] = useState<string>(formatDateToYYYYMMDD(new Date()));
  const [priority, setPriority] = useState<PriorityLevel>('normal');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [completionNotes, setCompletionNotes] = useState('');

  useEffect(() => {
    if (editingTask) {
      setColumnId(editingTask.columnId);
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setEstimatedMinutes(editingTask.estimatedMinutes || 30);
      setActualMinutes(editingTask.actualMinutes || 0);
      setScheduledStartTime(editingTask.scheduledStartTime || '09:00');
      setScheduledEndTime(editingTask.scheduledEndTime || '10:00');
      setDueDate(editingTask.dueDate || formatDateToYYYYMMDD(new Date()));
      setPriority(editingTask.priority || 'normal');
      setTags(editingTask.tags || []);
      setCompletionNotes(editingTask.completionNotes || '');
    } else {
      const colConfig = columns.find((c) => c.id === defaultColumnId);
      setColumnId(defaultColumnId);
      setTitle('');
      setDescription('');
      setEstimatedMinutes(colConfig?.defaultTaskMinutes || 45);
      setActualMinutes(0);
      setScheduledStartTime(colConfig?.windowStartTime || '09:00');
      setScheduledEndTime(colConfig?.windowEndTime || '10:00');
      setDueDate(formatDateToYYYYMMDD(new Date()));
      setPriority(defaultColumnId === 'need' ? 'urgent' : defaultColumnId === 'should' ? 'high' : 'normal');
      setTags([]);
      setCompletionNotes('');
    }
  }, [editingTask, defaultColumnId, columns, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSaveTask({
      id: editingTask ? editingTask.id : undefined,
      columnId,
      title: title.trim(),
      description: description.trim(),
      estimatedMinutes: Number(estimatedMinutes) || 30,
      actualMinutes: Number(actualMinutes) || 0,
      scheduledStartTime: scheduledStartTime || undefined,
      scheduledEndTime: scheduledEndTime || undefined,
      dueDate,
      priority,
      tags,
      completionNotes: completionNotes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {editingTask ? 'Edit Task & Time Settings' : 'Create New Task'}
            </h3>
            <p className="text-xs text-slate-500">
              Assign to a priority column and define its dedicated time schedule
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-slate-700 text-sm">
          
          {/* Priority Column Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Column / Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {columns.map((col) => {
                const isSelected = col.id === columnId;
                const activeStyle =
                  col.id === 'need'
                    ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20'
                    : col.id === 'should'
                    ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20'
                    : 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20';

                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setColumnId(col.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-0.5 ${
                      isSelected
                        ? activeStyle
                        : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span>{col.title}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-100 font-medium text-slate-500">
                      {col.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finish quarterly finance report review"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description / Action Steps (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key deliverables, links, or notes..."
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
            />
          </div>

          {/* Time Settings & Duration */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Time Setting / Estimated Duration
              </label>
              <span className="font-mono font-bold text-indigo-600 text-sm">
                {formatTimeMinutes(estimatedMinutes)}
              </span>
            </div>

            {/* Duration Presets */}
            <div className="grid grid-cols-7 gap-1.5">
              {[15, 25, 30, 45, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setEstimatedMinutes(mins)}
                  className={`py-1 rounded-lg text-xs font-mono border transition-all ${
                    estimatedMinutes === mins
                      ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>

            {/* Scheduled Window */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <span className="text-[11px] font-medium text-slate-500">Scheduled Start</span>
                <input
                  type="time"
                  value={scheduledStartTime}
                  onChange={(e) => setScheduledStartTime(e.target.value)}
                  className="mt-1 w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500">Scheduled End</span>
                <input
                  type="time"
                  value={scheduledEndTime}
                  onChange={(e) => setScheduledEndTime(e.target.value)}
                  className="mt-1 w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Due Date & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
              >
                <option value="urgent">Critical (Top Priority)</option>
                <option value="high">Urgent</option>
                <option value="normal">Team Standard</option>
                <option value="low">Growth / Flexible</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tags / Categories
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type tag and press Add..."
                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
              >
                Add Tag
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs border border-slate-200 font-medium"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-600 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* If Editing a Completed Task: Completion Notes */}
          {editingTask?.completed && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Progress / Completion Notes
              </label>
              <textarea
                rows={2}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="What was accomplished? Any key outcomes?"
                className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-slate-900 text-xs focus:outline-none"
              />
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{editingTask ? 'Save Changes' : 'Create Task'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
