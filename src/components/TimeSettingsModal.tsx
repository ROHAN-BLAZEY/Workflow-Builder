import React, { useState } from 'react';
import { X, Clock, Sliders, Check, RotateCcw, Minus, Plus } from 'lucide-react';
import { ColumnConfig, ColumnId, LanguageCode } from '../types';
import { DEFAULT_COLUMNS } from '../utils/storage';
import { getTranslation } from '../utils/i18n';

interface TimeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnConfig[];
  activeColumnId?: ColumnId;
  onSaveColumns: (updatedColumns: ColumnConfig[]) => void;
  language?: LanguageCode;
}

export const TimeSettingsModal: React.FC<TimeSettingsModalProps> = ({
  isOpen,
  onClose,
  columns,
  activeColumnId = 'need',
  onSaveColumns,
  language = 'en',
}) => {
  const [selectedCol, setSelectedCol] = useState<ColumnId>(activeColumnId);
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>(columns);

  if (!isOpen) return null;

  const currentConfig = columnConfigs.find((c) => c.id === selectedCol) || columnConfigs[0];
  const currentDuration = currentConfig.durationMinutes || currentConfig.dailyBudgetMinutes || 30;

  const handleUpdateCurrent = (updates: Partial<ColumnConfig>) => {
    setColumnConfigs((prev) =>
      prev.map((c) => (c.id === selectedCol ? { ...c, ...updates } : c))
    );
  };

  const handleSave = () => {
    onSaveColumns(columnConfigs);
    onClose();
  };

  const handleResetDefaults = () => {
    setColumnConfigs(DEFAULT_COLUMNS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Custom Column Timer Settings</h3>
              <p className="text-xs text-slate-500">Set your exact custom focus minutes and scheduled work window</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Column Switcher Tabs */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex gap-2">
          {columnConfigs.map((col) => {
            const isSelected = col.id === selectedCol;
            const dur = col.durationMinutes || col.dailyBudgetMinutes || 30;
            const accent =
              col.id === 'need'
                ? 'border-rose-500 text-rose-700 bg-rose-50 ring-2 ring-rose-500/20'
                : col.id === 'should'
                ? 'border-amber-500 text-amber-800 bg-amber-50 ring-2 ring-amber-500/20'
                : 'border-emerald-500 text-emerald-800 bg-emerald-50 ring-2 ring-emerald-500/20';

            return (
              <button
                key={col.id}
                onClick={() => setSelectedCol(col.id)}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                  isSelected
                    ? accent
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{col.title}</span>
                <span className="text-[10px] font-mono opacity-80">
                  ({dur}m)
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Form */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-700 text-sm">
          
          {/* Column Highlight Banner */}
          <div className={`p-3.5 rounded-xl border ${currentConfig.borderClass} ${currentConfig.lightBg} flex items-center justify-between`}>
            <div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${currentConfig.pillBg}`}>
                {currentConfig.badge}
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-1">{currentConfig.title}</h4>
              <p className="text-xs text-slate-600">{currentConfig.subtitle}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Allotted Focus Timer</span>
              <p className="text-lg font-bold font-mono text-slate-900">
                {currentDuration} mins
              </p>
            </div>
          </div>

          {/* Fully Custom Duration Input & Steppers */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs sm:text-sm">
                <Clock className="w-4 h-4 text-indigo-600" />
                Custom Duration (Minutes)
              </label>
              <span className="text-xs text-slate-500 font-medium">Type any exact duration</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const nextVal = Math.max(1, currentDuration - 5);
                  handleUpdateCurrent({ durationMinutes: nextVal, dailyBudgetMinutes: nextVal });
                }}
                className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 shadow-xs active:scale-95"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex-1 relative">
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={currentDuration}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                    handleUpdateCurrent({ durationMinutes: val, dailyBudgetMinutes: val });
                  }}
                  className="w-full text-center text-xl font-bold font-mono py-2 px-4 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  mins
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextVal = currentDuration + 5;
                  handleUpdateCurrent({ durationMinutes: nextVal, dailyBudgetMinutes: nextVal });
                }}
                className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 shadow-xs active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              When starting the timer for {currentConfig.title}, it will count down from your custom duration.
            </p>
          </div>

          {/* Scheduled Work Window */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <label className="font-semibold text-slate-700">
              Scheduled Work Window
            </label>
            <p className="text-xs text-slate-500">
              Target time slot during your day for tasks in this column
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-xs text-slate-500 font-medium">Window Start Time</span>
                <input
                  type="time"
                  value={currentConfig.windowStartTime}
                  onChange={(e) => handleUpdateCurrent({ windowStartTime: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-sm focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Window End Time</span>
                <input
                  type="time"
                  value={currentConfig.windowEndTime}
                  onChange={(e) => handleUpdateCurrent({ windowEndTime: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-sm focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Default Task Duration Custom Input */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">
                Default Duration per New Task
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={currentConfig.defaultTaskMinutes}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value, 10) || 15);
                    handleUpdateCurrent({ defaultTaskMinutes: val });
                  }}
                  className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold text-indigo-600 text-sm focus:outline-none focus:border-indigo-600"
                />
                <span className="text-xs text-slate-500">mins</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Apply Custom Duration</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
