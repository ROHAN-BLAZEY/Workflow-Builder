import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Clock, 
  Check, 
  Zap, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  BookmarkCheck,
  Layers,
  HelpCircle,
  Tag
} from 'lucide-react';
import { RoutinePreset, RoutinePresetCategory, TimetableEntry, ColumnId } from '../types';

interface PresetEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset: RoutinePreset | null;
  onSavePreset: (preset: RoutinePreset, action: 'save' | 'saveAndApply') => void;
}

interface EditableEntry {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  category: TimetableEntry['category'];
  notes?: string;
}

interface EditableTask {
  id: string;
  title: string;
  columnId: ColumnId;
  estimatedMinutes: number;
  description: string;
}

export const PresetEditorModal: React.FC<PresetEditorModalProps> = ({
  isOpen,
  onClose,
  preset,
  onSavePreset,
}) => {
  const [name, setName] = useState('');
  const [badge, setBadge] = useState('Custom Routine');
  const [category, setCategory] = useState<RoutinePresetCategory>('custom');
  const [description, setDescription] = useState('');
  const [entries, setEntries] = useState<EditableEntry[]>([]);
  const [suggestedTasks, setSuggestedTasks] = useState<EditableTask[]>([]);
  const [activeTab, setActiveTab] = useState<'schedule' | 'tasks'>('schedule');

  useEffect(() => {
    if (preset) {
      setName(preset.name);
      setBadge(preset.badge || 'Custom');
      setCategory(preset.category || 'custom');
      setDescription(preset.description || '');
      setEntries(
        preset.entries.map((e, idx) => ({
          id: `entry-${idx}-${Date.now()}`,
          title: e.title,
          startTime: e.startTime,
          endTime: e.endTime,
          category: e.category,
          notes: e.notes || '',
        }))
      );
      setSuggestedTasks(
        (preset.suggestedTasks || []).map((t, idx) => ({
          id: `task-${idx}-${Date.now()}`,
          title: t.title,
          columnId: t.columnId,
          estimatedMinutes: t.estimatedMinutes || 45,
          description: t.description || '',
        }))
      );
    } else {
      setName('My Daily Power Routine');
      setBadge('Personal');
      setCategory('custom');
      setDescription('My customized time blocks and focus routines');
      setEntries([
        { id: '1', title: 'Deep Work & Core Deliverables', startTime: '09:00', endTime: '11:00', category: 'need', notes: 'Top priority objectives' },
        { id: '2', title: 'Secondary Focus & Collaborative Tasks', startTime: '11:30', endTime: '13:00', category: 'should', notes: 'Should accomplish before afternoon' },
        { id: '3', title: 'Quick Wins & Administrative', startTime: '14:30', endTime: '15:30', category: 'can', notes: 'Can do tasks if time permits' },
      ]);
      setSuggestedTasks([
        { id: 't1', title: 'Complete Core Deliverables', columnId: 'need', estimatedMinutes: 60, description: 'Finish highest impact tasks' },
        { id: 't2', title: 'Review and Follow-up', columnId: 'should', estimatedMinutes: 45, description: 'Should review progress' },
      ]);
    }
  }, [preset, isOpen]);

  if (!isOpen) return null;

  const handleAddEntry = () => {
    const lastEntry = entries[entries.length - 1];
    let nextStart = '14:00';
    let nextEnd = '15:00';

    if (lastEntry) {
      const [eh, em] = lastEntry.endTime.split(':').map(Number);
      const startH = (eh + Math.floor((em + 15) / 60)) % 24;
      const startM = (em + 15) % 60;
      const endH = (startH + 1) % 24;
      nextStart = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
      nextEnd = `${String(endH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
    }

    setEntries([
      ...entries,
      {
        id: `entry-${Date.now()}`,
        title: 'New Time Block',
        startTime: nextStart,
        endTime: nextEnd,
        category: 'need',
        notes: '',
      },
    ]);
  };

  const handleUpdateEntry = (id: string, updates: Partial<EditableEntry>) => {
    setEntries(entries.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const handleMoveEntry = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= entries.length) return;
    const copy = [...entries];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setEntries(copy);
  };

  const handleAddTask = () => {
    setSuggestedTasks([
      ...suggestedTasks,
      {
        id: `task-${Date.now()}`,
        title: 'New Action Item',
        columnId: 'need',
        estimatedMinutes: 45,
        description: '',
      },
    ]);
  };

  const handleUpdateTask = (id: string, updates: Partial<EditableTask>) => {
    setSuggestedTasks(suggestedTasks.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const handleDeleteTask = (id: string) => {
    setSuggestedTasks(suggestedTasks.filter((t) => t.id !== id));
  };

  const calculateTotalHours = () => {
    const totalMinutes = entries.reduce((acc, curr) => {
      const [sh, sm] = curr.startTime.split(':').map(Number);
      const [eh, em] = curr.endTime.split(':').map(Number);
      let mins不易 = eh * 60 + em - (sh * 60 + sm);
      if (mins不易 < 0) mins不易 += 24 * 60;
      return acc + (mins不易 > 0 ? mins不易 : 60);
    }, 0);
    return (totalMinutes / 60).toFixed(1);
  };

  const handleSave = (action: 'save' | 'saveAndApply') => {
    if (!name.trim()) return;
    if (entries.length === 0) return;

    const totalHours = calculateTotalHours();
    const targetCat: 'academic' | 'work' | 'timing' | 'productivity' | 'custom' =
      category === 'all' ? 'custom' : category;

    const formattedPreset: RoutinePreset = {
      id: preset?.id || `custom-${Date.now()}`,
      name: name.trim(),
      category: targetCat,
      badge: badge.trim() || 'Custom',
      durationLabel: `${totalHours} Hours • ${entries.length} Blocks`,
      description: description.trim() || `Custom schedule routine with ${entries.length} blocks`,
      isCustom: true,
      entries: entries.map((e) => ({
        title: e.title.trim() || 'Focus Session',
        startTime: e.startTime,
        endTime: e.endTime,
        category: e.category,
        notes: e.notes?.trim() || undefined,
        completed: false,
      })),
      suggestedTasks: suggestedTasks.map((t) => ({
        title: t.title.trim() || 'Focus Task',
        columnId: t.columnId,
        estimatedMinutes: Number(t.estimatedMinutes) || 30,
        description: t.description?.trim() || 'Task from custom routine',
      })),
    };

    onSavePreset(formattedPreset, action);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                {preset ? 'Edit Routine Preset' : 'Create Custom Routine'}
              </h3>
              <p className="text-xs text-slate-500">
                Customize time blocks, sequence, tags, and matching task board deliverables.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          
          {/* Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Routine Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. JEE 10-Hour Sprint, Weekend Deep Work"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-900 font-semibold text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tag / Badge</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Exam, Deep Work, Morning"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-900 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Description / Strategy</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. High intensity morning study blocks with structured active recall breaks"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-900 text-xs"
            />
          </div>

          {/* Tab Switcher: Schedule Blocks vs Matching Tasks */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                activeTab === 'schedule'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Schedule Blocks ({entries.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                activeTab === 'tasks'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Matching 3-Column Tasks ({suggestedTasks.length})</span>
            </button>

            <span className="ml-auto text-[11px] font-mono text-slate-500 font-bold hidden sm:inline">
              Total Duration: {calculateTotalHours()}h
            </span>
          </div>

          {/* Tab 1: Schedule Blocks */}
          {activeTab === 'schedule' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Define start and end times, priority categories, and notes for each session block:
                </p>
                <button
                  type="button"
                  onClick={handleAddEntry}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 border border-indigo-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Block</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {entries.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveEntry(idx, 'up')}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === entries.length - 1}
                            onClick={() => handleMoveEntry(idx, 'down')}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Category Selection */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {(['need', 'should', 'can', 'study', 'break', 'custom'] as const).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleUpdateEntry(entry.id, { category: cat })}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                              entry.category === cat
                                ? cat === 'need'
                                  ? 'bg-rose-500 text-white'
                                  : cat === 'should'
                                  ? 'bg-amber-500 text-white'
                                  : cat === 'can'
                                  ? 'bg-emerald-500 text-white'
                                  : cat === 'study'
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-700 text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded ml-1 transition-colors"
                          title="Delete Block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={entry.title}
                          onChange={(e) => handleUpdateEntry(entry.id, { title: e.target.value })}
                          placeholder="Block Title (e.g. Organic Chemistry / Problem Set 1)"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="time"
                          value={entry.startTime}
                          onChange={(e) => handleUpdateEntry(entry.id, { startTime: e.target.value })}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="time"
                          value={entry.endTime}
                          onChange={(e) => handleUpdateEntry(entry.id, { endTime: e.target.value })}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={entry.notes || ''}
                        onChange={(e) => handleUpdateEntry(entry.id, { notes: e.target.value })}
                        placeholder="Key focus notes, chapters, formulas, or deliverable targets..."
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Matching 3-Column Tasks */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  These tasks will be added to your <strong>Need to Do</strong>, <strong>Should Do</strong>, and <strong>Can Do</strong> columns when applying the routine:
                </p>
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1 border border-amber-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Action Item</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {suggestedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {(['need', 'should', 'can'] as const).map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => handleUpdateTask(task.id, { columnId: col })}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                              task.columnId === col
                                ? col === 'need'
                                  ? 'bg-rose-500 text-white'
                                  : col === 'should'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-emerald-500 text-white'
                                : 'bg-white border border-slate-200 text-slate-600'
                            }`}
                          >
                            {col} to do
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-semibold text-slate-500">Est:</span>
                          <input
                            type="number"
                            min="5"
                            max="300"
                            step="5"
                            value={task.estimatedMinutes}
                            onChange={(e) => handleUpdateTask(task.id, { estimatedMinutes: Number(e.target.value) })}
                            className="w-14 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-mono text-center font-bold text-slate-800"
                          />
                          <span className="text-[10px] text-slate-500 font-mono">min</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => handleUpdateTask(task.id, { title: e.target.value })}
                        placeholder="Task title"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        value={task.description}
                        onChange={(e) => handleUpdateTask(task.id, { description: e.target.value })}
                        placeholder="Description / acceptance criteria"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ))}

                {suggestedTasks.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No matching task items configured yet. Click "+ Add Action Item" above.
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave('save')}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 shadow-2xs transition-all active:scale-95 flex items-center gap-1.5"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Save Preset</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave('saveAndApply')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Save & Apply Now</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
