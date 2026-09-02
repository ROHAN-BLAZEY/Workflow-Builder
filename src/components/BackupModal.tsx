import React, { useState, useRef } from 'react';
import { Download, Upload, Shield, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Task, ColumnConfig, TimetableEntry, RoutinePreset } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { soundManager } from '../utils/audio';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  columns: ColumnConfig[];
  timetableEntries: TimetableEntry[];
  customPresets: RoutinePreset[];
  onRestoreData: (data: {
    tasks?: Task[];
    columns?: ColumnConfig[];
    timetableEntries?: TimetableEntry[];
    customPresets?: RoutinePreset[];
  }) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  tasks,
  columns,
  timetableEntries,
  customPresets,
  onRestoreData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    triggerHaptic(40);
    soundManager.playPop();
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      appName: 'Now or Never',
      tasks,
      columns,
      timetableEntries,
      customPresets,
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `now_or_never_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setSuccessMsg('Backup exported successfully! Transfer this JSON file to your other device.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json || (!json.tasks && !json.timetableEntries)) {
          throw new Error('Invalid backup file format.');
        }

        onRestoreData({
          tasks: json.tasks,
          columns: json.columns,
          timetableEntries: json.timetableEntries || json.timetable,
          customPresets: json.customPresets,
        });

        triggerHaptic([50, 50, 100]);
        soundManager.playComplete();
        setSuccessMsg('Data restored successfully from backup!');
        setErrorMsg(null);
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 2000);
      } catch (err: any) {
        triggerHaptic(80);
        setErrorMsg(err.message || 'Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-5 relative">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Offline Backup & Sync</h3>
              <p className="text-xs text-slate-500">Transfer tasks & routines between phone & laptop</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          {/* Export button */}
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 transition-all group active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Export JSON Backup</p>
                <p className="text-xs text-indigo-700/80">Save all tasks, timetables & routines</p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">.json</span>
          </button>

          {/* Import button */}
          <button
            onClick={() => {
              triggerHaptic(30);
              fileInputRef.current?.click();
            }}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 transition-all group active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Import Backup File</p>
                <p className="text-xs text-slate-500">Restore data from another device</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-600">Upload</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            100% private. Stored locally on your device with zero cloud server tracking required.
          </p>
        </div>

      </div>
    </div>
  );
};
