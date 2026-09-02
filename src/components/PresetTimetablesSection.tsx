import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Clock, 
  Layers, 
  Check, 
  Plus, 
  Trash2, 
  Eye, 
  Search, 
  BookmarkPlus, 
  Zap, 
  BookOpen, 
  Laptop, 
  Sun, 
  Sliders, 
  ChevronRight,
  Flame,
  CheckCircle2,
  Calendar,
  Edit3,
  Copy,
  Info,
  HardDrive,
  Database,
  AlertCircle,
  X
} from 'lucide-react';
import { RoutinePreset, RoutinePresetCategory, ColumnId, TimetableEntry, Task } from '../types';
import { DEFAULT_TIMETABLE_PRESETS } from '../data/timetablePresets';
import { loadCustomPresetsFromStorage, saveCustomPresetsToStorage, STORAGE_KEYS } from '../utils/storage';
import { PresetEditorModal } from './PresetEditorModal';

interface PresetTimetablesSectionProps {
  currentEntries: TimetableEntry[];
  onApplyTimetable: (entries: Array<Omit<TimetableEntry, 'id'>>, presetName: string) => void;
  onAddTasks?: (tasks: Array<{ title: string; columnId: ColumnId; estimatedMinutes: number; description: string }>, presetName: string) => void;
  onNotification?: (message: string) => void;
}

const CATEGORY_TABS: Array<{ id: RoutinePresetCategory; label: string; icon: React.ReactNode }> = [
  { id: 'all', label: 'All Presets', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'academic', label: 'Exams & Study', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: 'work', label: 'Tech & Deep Work', icon: <Laptop className="w-3.5 h-3.5" /> },
  { id: 'timing', label: 'Time Rhythms', icon: <Sun className="w-3.5 h-3.5" /> },
  { id: 'productivity', label: 'Protocols', icon: <Zap className="w-3.5 h-3.5" /> },
  { id: 'custom', label: 'My Saved', icon: <BookmarkPlus className="w-3.5 h-3.5" /> },
];

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  need: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  should: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  can: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  study: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-600' },
  break: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
  custom: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-600' },
};

export const PresetTimetablesSection: React.FC<PresetTimetablesSectionProps> = ({
  currentEntries,
  onApplyTimetable,
  onAddTasks,
  onNotification,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<RoutinePresetCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customPresets, setCustomPresets] = useState<RoutinePreset[]>(() => loadCustomPresetsFromStorage());
  const [previewPreset, setPreviewPreset] = useState<RoutinePreset | null>(null);
  
  // Full Preset Editor Modal state
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<RoutinePreset | null>(null);

  // Quick Save Modal State (from current active timetable)
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetBadge, setNewPresetBadge] = useState('Custom Routine');
  const [newPresetDesc, setNewPresetDesc] = useState('');

  // In-app Delete Confirmation (no browser window.confirm!)
  const [presetToDelete, setPresetToDelete] = useState<{ id: string; name: string } | null>(null);

  // Storage info modal
  const [isStorageInfoOpen, setIsStorageInfoOpen] = useState(false);

  // Applied feedback animation states
  const [appliedPresetId, setAppliedPresetId] = useState<string | null>(null);

  // Combine default and custom presets
  const allPresets = useMemo(() => {
    return [...customPresets, ...DEFAULT_TIMETABLE_PRESETS];
  }, [customPresets]);

  // Filter presets based on category and search query
  const filteredPresets = useMemo(() => {
    return allPresets.filter((preset) => {
      const matchesCategory =
        selectedCategory === 'all'
          ? true
          : selectedCategory === 'custom'
          ? preset.isCustom
          : preset.category === selectedCategory;

      const matchesSearch =
        !searchQuery.trim() ||
        preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.entries.some((e) => e.title.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [allPresets, selectedCategory, searchQuery]);

  const handleApplyPreset = (preset: RoutinePreset, mode: 'timetable' | 'tasks' | 'both') => {
    if (mode === 'timetable' || mode === 'both') {
      onApplyTimetable(preset.entries, preset.name);
    }
    if ((mode === 'tasks' || mode === 'both') && preset.suggestedTasks && onAddTasks) {
      onAddTasks(preset.suggestedTasks, preset.name);
    }

    setAppliedPresetId(preset.id);
    setTimeout(() => setAppliedPresetId(null), 3000);

    if (mode === 'both') {
      onNotification?.(`Applied "${preset.name}" (${preset.entries.length} slots & ${preset.suggestedTasks?.length || 0} tasks) — saved to local storage`);
    } else if (mode === 'timetable') {
      onNotification?.(`Loaded ${preset.entries.length} time blocks from "${preset.name}" into timetable`);
    } else {
      onNotification?.(`Added ${preset.suggestedTasks?.length || 0} tasks to your 3-column board`);
    }

    if (previewPreset?.id === preset.id) {
      setPreviewPreset(null);
    }
  };

  // Open editor for creating brand new routine
  const handleOpenCreateNew = () => {
    setEditingPreset(null);
    setIsEditorModalOpen(true);
  };

  // Open editor for modifying existing preset
  const handleOpenEditPreset = (preset: RoutinePreset) => {
    // If it's a default preset, we give it a copy name so user customizes it cleanly
    if (!preset.isCustom) {
      const customizedCopy: RoutinePreset = {
        ...preset,
        id: `custom-${Date.now()}`,
        name: `${preset.name} (My Routine)`,
        badge: 'Customized',
        isCustom: true,
      };
      setEditingPreset(customizedCopy);
    } else {
      setEditingPreset(preset);
    }
    setIsEditorModalOpen(true);
  };

  // Duplicate routine for quick tweaking
  const handleDuplicatePreset = (preset: RoutinePreset) => {
    const duplicated: RoutinePreset = {
      ...preset,
      id: `custom-${Date.now()}`,
      name: `${preset.name} (Copy)`,
      badge: 'Custom',
      isCustom: true,
    };
    setEditingPreset(duplicated);
    setIsEditorModalOpen(true);
  };

  // Handle Save from PresetEditorModal
  const handleSaveEditedPreset = (preset: RoutinePreset, action: 'save' | 'saveAndApply') => {
    const exists = customPresets.some((p) => p.id === preset.id);
    let updated: RoutinePreset[];

    if (exists) {
      updated = customPresets.map((p) => (p.id === preset.id ? preset : p));
    } else {
      updated = [preset, ...customPresets];
    }

    setCustomPresets(updated);
    saveCustomPresetsToStorage(updated);
    setSelectedCategory('custom');
    onNotification?.(`Routine "${preset.name}" saved to your presets!`);

    if (action === 'saveAndApply') {
      handleApplyPreset(preset, 'both');
    }
  };

  // Quick save current active timetable as a custom preset
  const handleSaveCurrentAsCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim() || currentEntries.length === 0) {
      onNotification?.('Please ensure your timetable has at least 1 schedule block');
      return;
    }

    const calculatedHours = (
      currentEntries.reduce((acc, curr) => {
        const [sh, sm] = curr.startTime.split(':').map(Number);
        const [eh, em] = curr.endTime.split(':').map(Number);
        const mins = eh * 60 + em - (sh * 60 + sm);
        return acc + (mins > 0 ? mins : 60);
      }, 0) / 60
    ).toFixed(1);

    const newPreset: RoutinePreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      category: 'custom',
      badge: newPresetBadge.trim() || 'Custom',
      durationLabel: `${calculatedHours} Hours • ${currentEntries.length} Blocks`,
      description: newPresetDesc.trim() || `Saved on ${new Date().toLocaleDateString()}`,
      isCustom: true,
      entries: currentEntries.map((e) => ({
        title: e.title,
        startTime: e.startTime,
        endTime: e.endTime,
        category: e.category,
        notes: e.notes,
        completed: false,
      })),
      suggestedTasks: currentEntries
        .filter((e) => e.category === 'need' || e.category === 'should' || e.category === 'can')
        .map((e) => ({
          title: e.title,
          columnId: (e.category === 'need' || e.category === 'should' || e.category === 'can' ? e.category : 'need') as ColumnId,
          estimatedMinutes: 45,
          description: e.notes || 'From custom saved preset',
        })),
    };

    const updated = [newPreset, ...customPresets];
    setCustomPresets(updated);
    saveCustomPresetsToStorage(updated);
    setIsSaveModalOpen(false);
    setNewPresetName('');
    setNewPresetDesc('');
    setSelectedCategory('custom');
    onNotification?.(`Saved "${newPreset.name}" to your preset library (in local storage)!`);
  };

  // Safe delete handler without browser confirm()
  const handleConfirmDeletePreset = () => {
    if (!presetToDelete) return;
    const updated = customPresets.filter((p) => p.id !== presetToDelete.id);
    setCustomPresets(updated);
    saveCustomPresetsToStorage(updated);
    if (previewPreset?.id === presetToDelete.id) setPreviewPreset(null);
    onNotification?.(`Removed preset "${presetToDelete.name}"`);
    setPresetToDelete(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Preset Timetable Library</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {allPresets.length} Routines
                </span>
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                <span>Ready-to-use study, work & daily rhythms. Editable to your preference.</span>
                <button
                  type="button"
                  onClick={() => setIsStorageInfoOpen(true)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold underline flex items-center gap-0.5 text-[11px]"
                >
                  <HardDrive className="w-3 h-3" />
                  <span>Where is data saved?</span>
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Create Custom Routine Button */}
          <button
            onClick={handleOpenCreateNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 shadow-2xs transition-all active:scale-95"
            title="Create a personalized routine from scratch"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Custom Routine</span>
          </button>

          {/* Save Current Active Timetable as Preset */}
          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 shadow-2xs transition-all active:scale-95"
            title="Save current active timetable into your preset library"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-indigo-600" />
            <span>Save Current as Preset</span>
          </button>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.id;
            const count =
              tab.id === 'all'
                ? allPresets.length
                : tab.id === 'custom'
                ? customPresets.length
                : allPresets.filter((p) => p.category === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search routines (e.g. JEE, Deep Work, 5:30 AM)..."
            className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Preset Cards Grid */}
      {filteredPresets.length === 0 ? (
        <div className="py-12 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 p-6 flex flex-col items-center">
          <Sparkles className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-sm font-bold text-slate-700">No preset timetables found</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {selectedCategory === 'custom'
              ? 'You have not saved any custom presets yet. Build a timetable and click "Save Current as Preset" or "+ New Custom Routine" above!'
              : 'Try changing your search query or switching to "All Presets".'}
          </p>
          <div className="flex items-center gap-2 mt-3">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs"
              >
                Clear Search
              </button>
            )}
            <button
              onClick={handleOpenCreateNew}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Create Custom Routine</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPresets.map((preset) => {
            const isApplied = appliedPresetId === preset.id;

            return (
              <div
                key={preset.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                
                {/* Card Top / Header */}
                <div className="p-4.5 space-y-3">
                  
                  {/* Badge, Tag & Duration */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {preset.badge}
                      </span>
                      {preset.isCustom && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Custom
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {preset.durationLabel}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {preset.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>

                  {/* Schedule Timeline Preview Chips (First 3 blocks) */}
                  <div className="space-y-1.5 pt-1">
                    {preset.entries.slice(0, 3).map((entry, idx) => {
                      const style = CATEGORY_STYLES[entry.category] || CATEGORY_STYLES.need;
                      return (
                        <div
                          key={idx}
                          className={`px-2.5 py-1.5 rounded-lg ${style.bg} border ${style.border} flex items-center justify-between text-[11px]`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0`} />
                            <span className={`font-semibold ${style.text} truncate`}>{entry.title}</span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-500 font-bold shrink-0 ml-2">
                            {entry.startTime}
                          </span>
                        </div>
                      );
                    })}
                    {preset.entries.length > 3 && (
                      <p className="text-[10px] text-slate-400 font-medium text-right pr-1">
                        + {preset.entries.length - 3} more schedule blocks
                      </p>
                    )}
                  </div>

                </div>

                {/* Card Footer / Action Buttons */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                  
                  {/* Left Controls: Preview & Edit */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewPreset(preset)}
                      className="px-2 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold text-xs flex items-center gap-1 transition-colors"
                      title="View full schedule and matching tasks"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    {/* Edit Preset Button */}
                    <button
                      onClick={() => handleOpenEditPreset(preset)}
                      className="px-2 py-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-semibold text-xs flex items-center gap-1 transition-colors"
                      title="Edit time blocks, titles, and matching tasks"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Duplicate Preset Button */}
                    <button
                      onClick={() => handleDuplicatePreset(preset)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                      title="Duplicate & tweak as new custom routine"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Right Controls: Delete (if custom) & Apply */}
                  <div className="flex items-center gap-1.5">
                    {preset.isCustom && (
                      <button
                        onClick={() => setPresetToDelete({ id: preset.id, name: preset.name })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete custom preset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleApplyPreset(preset, 'both')}
                      disabled={isApplied}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 ${
                        isApplied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {isApplied ? <Check className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                      <span>{isApplied ? 'Applied!' : 'Apply Routine'}</span>
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Preset Full Detail Preview Modal */}
      {previewPreset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-indigo-100 text-indigo-700">
                    {previewPreset.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-500 font-semibold">
                    {previewPreset.durationLabel}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {previewPreset.name}
                </h3>
                <p className="text-xs text-slate-600">{previewPreset.description}</p>
              </div>

              <button
                onClick={() => setPreviewPreset(null)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Schedule Blocks + Actionable Tasks */}
            <div className="p-5 overflow-y-auto space-y-5 text-slate-800">
              
              {/* Scheduled Blocks Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Scheduled Time Blocks ({previewPreset.entries.length})</span>
                  </h4>
                  <button
                    onClick={() => {
                      const p = previewPreset;
                      setPreviewPreset(null);
                      handleOpenEditPreset(p);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit this Routine</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {previewPreset.entries.map((entry, idx) => {
                    const style = CATEGORY_STYLES[entry.category] || CATEGORY_STYLES.need;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border ${style.border} ${style.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-2`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className={`w-2 h-2 rounded-full ${style.dot} mt-1.5 shrink-0`} />
                          <div>
                            <p className="text-xs font-bold text-slate-900">{entry.title}</p>
                            {entry.notes && (
                              <p className="text-[11px] text-slate-600 mt-0.5">{entry.notes}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono font-bold text-slate-700">
                            {entry.startTime} — {entry.endTime}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actionable 3-Column Tasks Section */}
              {previewPreset.suggestedTasks && previewPreset.suggestedTasks.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    <span>Matching Actionable Tasks ({previewPreset.suggestedTasks.length})</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Applying this routine will auto-populate these tasks into your <strong>Need to Do</strong>, <strong>Should Do</strong>, and <strong>Can Do</strong> columns.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {previewPreset.suggestedTasks.map((task, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-white border border-slate-200 text-slate-700">
                            {task.columnId.toUpperCase()} • {task.estimatedMinutes}m
                          </span>
                          <p className="text-xs font-bold text-slate-900">{task.title}</p>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">{task.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setPreviewPreset(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60"
              >
                Close Preview
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const p = previewPreset;
                    setPreviewPreset(null);
                    handleOpenEditPreset(p);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-indigo-700 font-bold text-xs border border-indigo-200 shadow-2xs flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Customize First</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(previewPreset, 'timetable')}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 shadow-2xs"
                >
                  Timetable Only
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(previewPreset, 'both')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Apply Timetable & Tasks</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Preset Editor Modal */}
      <PresetEditorModal
        isOpen={isEditorModalOpen}
        onClose={() => setIsEditorModalOpen(false)}
        preset={editingPreset}
        onSavePreset={handleSaveEditedPreset}
      />

      {/* In-App Delete Confirmation Modal (Replaces browser confirm) */}
      {presetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Delete Custom Preset?</h4>
                <p className="text-xs text-slate-500">
                  Are you sure you want to remove <strong>"{presetToDelete.name}"</strong> from your saved preset library?
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPresetToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePreset}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
              >
                Delete Preset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Storage Information Modal */}
      {isStorageInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-base">Where Are Presets & Timetables Saved?</h4>
              </div>
              <button
                onClick={() => setIsStorageInfoOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                All presets and timetables are automatically saved to your browser's persistent <strong>Local Storage</strong>:
              </p>
              
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
                  <p className="font-bold text-indigo-900 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Active Timetable: <code className="text-[11px] font-mono text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200">{STORAGE_KEYS.TIMETABLE}</code></span>
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Stores the current active schedule slots you see in your timetable. Loaded and persisted every session.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                  <p className="font-bold text-amber-900 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-amber-600" />
                    <span>Custom & Edited Presets: <code className="text-[11px] font-mono text-amber-800 bg-white px-1.5 py-0.5 rounded border border-amber-200">{STORAGE_KEYS.CUSTOM_PRESETS}</code></span>
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Stores routines you create, edit, or customize. Available under the "My Saved" tab anytime.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <p className="font-bold text-emerald-900 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    <span>3-Column Tasks: <code className="text-[11px] font-mono text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-200">{STORAGE_KEYS.TASKS}</code></span>
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Stores tasks added to your Need, Should, and Can columns.
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                🔒 <strong>100% Private & Offline-Capable:</strong> No login or server sync needed. Your routine data remains safely on your computer across browser restarts.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsStorageInfoOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Save Current Timetable as Custom Preset Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Save as Custom Preset
                </h3>
              </div>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCurrentAsCustom} className="p-5 space-y-4 text-xs sm:text-sm">
              <p className="text-xs text-slate-500">
                This will bundle your current <strong>{currentEntries.length} timetable blocks</strong> into a custom reusable preset template in your browser storage.
              </p>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Preset Name</label>
                <input
                  type="text"
                  required
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="e.g. My Tuesday Math & Coding Routine"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-900 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Category Tag / Badge</label>
                <input
                  type="text"
                  value={newPresetBadge}
                  onChange={(e) => setNewPresetBadge(e.target.value)}
                  placeholder="e.g. Exam Sprint, Personal, Weekend"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-900 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={newPresetDesc}
                  onChange={(e) => setNewPresetDesc(e.target.value)}
                  placeholder="Brief description of the daily focus or target goals..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-900 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>Save to My Presets</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
