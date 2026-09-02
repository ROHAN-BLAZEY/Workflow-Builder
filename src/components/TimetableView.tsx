import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Plus, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Play, 
  Check, 
  ChevronRight, 
  Layers,
  Calendar,
  Zap,
  BookmarkPlus,
  HardDrive,
  Database,
  RotateCcw,
  AlertCircle,
  Copy,
  Info,
  X
} from 'lucide-react';
import { TimetableEntry, ColumnId, Task, LanguageCode } from '../types';
import { getTranslation } from '../utils/i18n';
import { PresetTimetablesSection } from './PresetTimetablesSection';
import { saveTimetableToStorage, DEFAULT_TIMETABLE_ENTRIES, STORAGE_KEYS } from '../utils/storage';

interface TimetableViewProps {
  timetable: TimetableEntry[];
  tasks: Task[];
  onSaveTimetable: (updated: TimetableEntry[]) => void;
  onAddTasksFromRoutine?: (newTasks: Array<Omit<Task, 'id' | 'createdAt' | 'order'>>) => void;
  onStartFocusFromTimetable?: (entry: TimetableEntry) => void;
  language?: LanguageCode;
}

export const TimetableView: React.FC<TimetableViewProps> = ({
  timetable,
  tasks,
  onSaveTimetable,
  onAddTasksFromRoutine,
  onStartFocusFromTimetable,
  language = 'en',
}) => {
  const [entries, setEntries] = useState<TimetableEntry[]>(timetable);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);

  // Clear Confirmation & Undo State
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [lastClearedSlots, setLastClearedSlots] = useState<TimetableEntry[] | null>(null);

  // Storage Information Modal
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Modal Form State
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [category, setCategory] = useState<TimetableEntry['category']>('need');
  const [notes, setNotes] = useState('');

  // Toast / notification state
  const [notification, setNotification] = useState<string | null>(null);

  // Track current time
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setEntries(timetable);
  }, [timetable]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentMinutesFromMidnight = currentHours * 60 + currentMinutes;

  // Find currently active slot
  const currentSlot = entries.find((e) => {
    const [startH, startM] = e.startTime.split(':').map(Number);
    const [endH, endM] = e.endTime.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    return currentMinutesFromMidnight >= startMins && currentMinutesFromMidnight < endMins;
  });

  const handleOpenAdd = () => {
    setEditingEntry(null);
    setTitle('');
    setStartTime('09:00');
    setEndTime('10:00');
    setCategory('need');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setStartTime(entry.startTime);
    setEndTime(entry.endTime);
    setCategory(entry.category);
    setNotes(entry.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let updated: TimetableEntry[];
    if (editingEntry) {
      updated = entries.map((entry) =>
        entry.id === editingEntry.id
          ? { ...entry, title, startTime, endTime, category, notes }
          : entry
      );
    } else {
      const newEntry: TimetableEntry = {
        id: `tt-${Date.now()}`,
        title,
        startTime,
        endTime,
        category,
        notes: notes || undefined,
        completed: false,
      };
      updated = [...entries, newEntry];
    }

    updated.sort((a, b) => a.startTime.localeCompare(b.startTime));
    setEntries(updated);
    onSaveTimetable(updated);
    saveTimetableToStorage(updated);
    setIsModalOpen(false);
    triggerNotification('Timetable slot saved and persisted to local storage!');
  };

  const handleDeleteEntry = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    onSaveTimetable(updated);
    saveTimetableToStorage(updated);
    triggerNotification('Slot removed from timetable');
  };

  const handleToggleComplete = (id: string) => {
    const updated = entries.map((e) =>
      e.id === id ? { ...e, completed: !e.completed } : e
    );
    setEntries(updated);
    onSaveTimetable(updated);
    saveTimetableToStorage(updated);
  };

  // Apply slots from preset
  const handleApplyPresetSlots = (slots: Array<Omit<TimetableEntry, 'id'>>, presetName: string) => {
    const newEntries: TimetableEntry[] = slots.map((s, idx) => ({
      id: `tt-preset-${Date.now()}-${idx}`,
      title: s.title || 'Focus Session',
      startTime: s.startTime || '09:00',
      endTime: s.endTime || '10:00',
      category: s.category || 'need',
      notes: s.notes,
      completed: false,
    }));

    newEntries.sort((a, b) => a.startTime.localeCompare(b.startTime));
    setEntries(newEntries);
    onSaveTimetable(newEntries);
    saveTimetableToStorage(newEntries);
  };

  // Add tasks from preset to Now or Never columns
  const handleAddPresetTasks = (suggestedTasks: Array<{ title: string; columnId: ColumnId; estimatedMinutes: number; description?: string }>, presetName: string) => {
    if (!onAddTasksFromRoutine) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const tasksToCreate = suggestedTasks.map((t) => ({
      title: t.title,
      columnId: (t.columnId || 'need') as ColumnId,
      estimatedMinutes: t.estimatedMinutes || 45,
      actualMinutes: 0,
      priority: (t.columnId === 'need' ? 'urgent' : t.columnId === 'should' ? 'high' : 'normal') as any,
      tags: [presetName.split(' ')[0] || 'Preset'],
      completed: false,
      dueDate: todayStr,
      description: t.description || `Generated from ${presetName}`,
    }));
    onAddTasksFromRoutine(tasksToCreate);
  };

  // Open Clear Confirmation Modal (Replaces browser confirm)
  const handleOpenClearModal = () => {
    if (entries.length === 0) return;
    setIsClearConfirmOpen(true);
  };

  // Confirm Clear All Slots
  const handleConfirmClear = () => {
    const previous = [...entries];
    setLastClearedSlots(previous);
    setEntries([]);
    onSaveTimetable([]);
    saveTimetableToStorage([]);
    setIsClearConfirmOpen(false);
    triggerNotification(`Cleared all ${previous.length} timetable schedule blocks`);
  };

  // Undo Clear action
  const handleUndoClear = () => {
    if (lastClearedSlots && lastClearedSlots.length > 0) {
      setEntries(lastClearedSlots);
      onSaveTimetable(lastClearedSlots);
      saveTimetableToStorage(lastClearedSlots);
      setLastClearedSlots(null);
      triggerNotification('Restored previously cleared schedule blocks!');
    }
  };

  // Restore Default 4-Slot Schedule
  const handleRestoreDefaultSchedule = () => {
    setEntries(DEFAULT_TIMETABLE_ENTRIES);
    onSaveTimetable(DEFAULT_TIMETABLE_ENTRIES);
    saveTimetableToStorage(DEFAULT_TIMETABLE_ENTRIES);
    setLastClearedSlots(null);
    triggerNotification('Restored default 4-block timetable schedule');
  };

  // Copy timetable JSON backup to clipboard
  const handleCopyJsonBackup = () => {
    try {
      const dataStr = JSON.stringify(entries, null, 2);
      navigator.clipboard.writeText(dataStr);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 3000);
      triggerNotification('Copied timetable JSON to clipboard!');
    } catch {
      triggerNotification('Could not copy JSON');
    }
  };

  const getCategoryStyles = (cat: TimetableEntry['category']) => {
    switch (cat) {
      case 'need':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-900',
          badge: 'bg-rose-500 text-white',
          pill: 'bg-rose-100 text-rose-700',
          borderLeft: 'border-l-rose-500',
        };
      case 'should':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-950',
          badge: 'bg-amber-500 text-white',
          pill: 'bg-amber-100 text-amber-800',
          borderLeft: 'border-l-amber-500',
        };
      case 'can':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-950',
          badge: 'bg-emerald-500 text-white',
          pill: 'bg-emerald-100 text-emerald-800',
          borderLeft: 'border-l-emerald-500',
        };
      case 'study':
        return {
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-950',
          badge: 'bg-indigo-600 text-white',
          pill: 'bg-indigo-100 text-indigo-800',
          borderLeft: 'border-l-indigo-600',
        };
      case 'break':
        return {
          bg: 'bg-slate-100 border-slate-200 text-slate-800',
          badge: 'bg-slate-500 text-white',
          pill: 'bg-slate-200 text-slate-700',
          borderLeft: 'border-l-slate-400',
        };
      default:
        return {
          bg: 'bg-purple-50 border-purple-200 text-purple-950',
          badge: 'bg-purple-600 text-white',
          pill: 'bg-purple-100 text-purple-800',
          borderLeft: 'border-l-purple-500',
        };
    }
  };

  // Calculate schedule stats
  const completedCount = entries.filter((e) => e.completed).length;
  const totalHoursScheduled = (
    entries.reduce((acc, curr) => {
      const [sh, sm] = curr.startTime.split(':').map(Number);
      const [eh, em] = curr.endTime.split(':').map(Number);
      let mins = eh * 60 + em - (sh * 60 + sm);
      if (mins < 0) mins += 24 * 60;
      return acc + (mins > 0 ? mins : 60);
    }, 0) / 60
  ).toFixed(1);

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{notification}</span>
          {lastClearedSlots && (
            <button
              onClick={handleUndoClear}
              className="ml-2 px-2 py-0.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-[11px] font-bold"
            >
              Undo
            </button>
          )}
        </div>
      )}

      {/* Top Banner & Live Indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left 2 Cols: Timetable Header & Live Indicator */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                {getTranslation('appTagline', language)}
              </span>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span>{getTranslation('todaysTimetable', language)}</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{getTranslation('addScheduleSlot', language)}</span>
              </button>
            </div>
          </div>

          {/* Current Active Block Card */}
          {currentSlot ? (
            <div className={`p-4 rounded-xl border ${getCategoryStyles(currentSlot.category).bg} flex items-center justify-between gap-4`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                    {getTranslation('activeTimeBlock', language)}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900">{currentSlot.title}</h4>
                <p className="text-xs text-slate-600 font-mono">
                  {currentSlot.startTime} — {currentSlot.endTime} {currentSlot.notes ? `• ${currentSlot.notes}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleComplete(currentSlot.id)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{currentSlot.completed ? getTranslation('completed', language) : getTranslation('markDone', language)}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>{getTranslation('noActiveBlock', language)}</span>
              <span className="font-mono text-slate-700 font-bold">
                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Timetable Stats */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Schedule Overview</span>
            </h3>
            <button
              onClick={() => setIsStorageModalOpen(true)}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              title="View storage details"
            >
              <HardDrive className="w-3 h-3" />
              <span>Storage Info</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
              <p className="text-[10px] font-bold text-indigo-700 uppercase">Total Scheduled</p>
              <p className="text-lg font-extrabold text-indigo-950 font-mono mt-0.5">{totalHoursScheduled}h</p>
              <p className="text-[10px] text-indigo-600/80">{entries.length} time blocks</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-700 uppercase">Blocks Done</p>
              <p className="text-lg font-extrabold text-emerald-950 font-mono mt-0.5">
                {completedCount}/{entries.length}
              </p>
              <p className="text-[10px] text-emerald-600/80">
                {entries.length > 0 ? `${Math.round((completedCount / entries.length) * 100)}% completed` : '0%'}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Browse and customize preset routines below or click any preset to populate your schedule instantly.
          </p>
        </div>

      </div>

      {/* Preset Timetables Hub */}
      <PresetTimetablesSection
        currentEntries={entries}
        onApplyTimetable={handleApplyPresetSlots}
        onAddTasks={handleAddPresetTasks}
        onNotification={triggerNotification}
      />

      {/* Timetable Schedule Blocks Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        
        {/* Header with Title, Persistence note, Storage Info, and Clear All */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wider">
                Active Timetable Schedule ({entries.length})
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Auto-saved
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>Persisted across sessions in browser Local Storage</span>
              <span className="text-slate-300">•</span>
              <code className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                {STORAGE_KEYS.TIMETABLE}
              </code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Storage Info Details Button */}
            <button
              onClick={() => setIsStorageModalOpen(true)}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-indigo-300 bg-white flex items-center gap-1 transition-colors"
              title="Where are presets & timetables saved?"
            >
              <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
              <span>Storage Details</span>
            </button>

            {/* Undo button if recently cleared */}
            {lastClearedSlots && lastClearedSlots.length > 0 && (
              <button
                onClick={handleUndoClear}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo Clear ({lastClearedSlots.length})</span>
              </button>
            )}

            {/* Clear All Slots Button (Safe In-App Modal) */}
            {entries.length > 0 && (
              <button
                onClick={handleOpenClearModal}
                className="text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors border border-transparent hover:border-rose-200 flex items-center gap-1"
                title="Remove all slots from active timetable"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Slots</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {entries.length === 0 ? (
          <div className="py-12 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 p-6 flex flex-col items-center">
            <Clock className="w-10 h-10 text-slate-400 mb-2" />
            <p className="text-sm font-bold text-slate-800">Your timetable schedule is currently empty</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              All schedule slots have been cleared. You can create a custom time block, restore the default 4-slot routine, or apply any preset from above.
            </p>
            <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Schedule Block</span>
              </button>

              <button
                onClick={handleRestoreDefaultSchedule}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 shadow-2xs flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                <span>Restore Default 4-Slot Schedule</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const styles = getCategoryStyles(entry.category);
              const isCurrent = currentSlot?.id === entry.id;

              return (
                <div
                  key={entry.id}
                  className={`p-4 rounded-xl border border-slate-200 bg-white ${styles.borderLeft} border-l-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:shadow-sm transition-all ${
                    entry.completed ? 'opacity-60 bg-slate-50/70' : ''
                  }`}
                >
                  
                  {/* Left: Time & Title */}
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleComplete(entry.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors mt-0.5 ${
                        entry.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-slate-400 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {entry.startTime} — {entry.endTime}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${styles.pill}`}>
                          {entry.category}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200 animate-pulse">
                            ACTIVE NOW
                          </span>
                        )}
                      </div>

                      <h4 className={`text-sm font-bold ${entry.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                        {entry.title}
                      </h4>

                      {entry.notes && (
                        <p className="text-xs text-slate-500">{entry.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleOpenEdit(entry)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Edit Slot"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clear All Slots Confirmation Modal (Replaces browser confirm) */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-base">Clear Timetable Schedule?</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  This will remove all <strong>{entries.length} scheduled time blocks</strong> from your active timetable and update your browser local storage.
                </p>
                <p className="text-[11px] text-slate-400">
                  Note: Presets saved in the Preset Library will NOT be deleted. You can restore the default schedule or undo this action anytime.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
              >
                Yes, Clear All Slots
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Storage Information & Backup Modal */}
      {isStorageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-base">Where Is Your Timetable Data Saved?</h4>
              </div>
              <button
                onClick={() => setIsStorageModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                All your timetable data is persisted in your browser's persistent <strong>Local Storage</strong> on this device:
              </p>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Active Timetable</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-white text-indigo-700 rounded-md border border-indigo-200">
                      {entries.length} slots active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Key: <code className="font-mono text-indigo-700 font-bold bg-white px-1.5 py-0.5 rounded border border-indigo-200">{STORAGE_KEYS.TIMETABLE}</code>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Updated automatically whenever you add, edit, complete, apply a preset, or clear slots.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-amber-600" />
                      <span>Custom & Edited Presets</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Key: <code className="font-mono text-amber-800 font-bold bg-white px-1.5 py-0.5 rounded border border-amber-200">{STORAGE_KEYS.CUSTOM_PRESETS}</code>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Preserves routines you create, customize, or save from the Preset Timetables section.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Task Board Columns</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-white text-emerald-700 rounded-md border border-emerald-200">
                      {tasks.length} tasks
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Key: <code className="font-mono text-emerald-800 font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200">{STORAGE_KEYS.TASKS}</code>
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="font-bold text-slate-800 text-[11px]">Timetable Backup & Recovery</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleCopyJsonBackup}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedJson ? 'Copied to Clipboard!' : 'Copy Timetable JSON'}</span>
                  </button>

                  <button
                    onClick={handleRestoreDefaultSchedule}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Default 4 Slots</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsStorageModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingEntry ? 'Edit Timetable Slot' : 'Add New Timetable Slot'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="p-5 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Block Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Physics Formula Practice, Need to Do Deliverables"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Category Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['need', 'should', 'can', 'study', 'break', 'custom'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border capitalize transition-all ${
                        category === cat
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notes / Objectives</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key focus areas, chapter pages, or deliverables..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-900 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                >
                  {editingEntry ? 'Save Changes' : 'Add to Timetable'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
