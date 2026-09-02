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
          {/* Cloud Sync section */}
          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200">
             <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-sky-900">Cloud Sync Code</p>
                  <p className="text-[10px] text-sky-700">Enter a code to sync across devices (e.g. 123456)</p>
                </div>
             </div>
             <div className="flex gap-2">
                <input 
                  type="text" 
                  id="sync-code-input"
                  placeholder="Enter Sync Code..."
                  className="flex-1 bg-white border border-sky-200 rounded-xl px-3 py-2 text-sm text-sky-900 font-bold uppercase placeholder:text-sky-300 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-sky-500"
                  defaultValue={typeof window !== 'undefined' ? localStorage.getItem('non_sync_code_v1') || '' : ''}
                />
                <button 
                  onClick={async () => {
                     const input = document.getElementById('sync-code-input') as HTMLInputElement;
                     const code = input.value.trim().toUpperCase();
                     if (!code) {
                        localStorage.removeItem('non_sync_code_v1');
                        setSuccessMsg('Sync disabled.');
                        return;
                     }
                     localStorage.setItem('non_sync_code_v1', code);
                     setSuccessMsg('Sync code saved! Pulling data...');
                     
                     // Import pullFromCloud dynamically to avoid circular dep if needed, but we can just use fetch
                     try {
                        const res = await fetch(`/api/sync/pull?code=${encodeURIComponent(code)}`);
                        const json = await res.json();
                        if (json.success && json.data) {
                           onRestoreData({
                              tasks: json.data.tasks,
                              columns: json.data.columns,
                              timetableEntries: json.data.timetable
                           });
                           setSuccessMsg('Cloud data synced successfully!');
                        } else {
                           // If no data, we push our current data
                           fetch('/api/sync/push', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                 syncCode: code,
                                 data: { tasks, columns, timetable: timetableEntries }
                              })
                           });
                           setSuccessMsg('Created new sync profile!');
                        }
                     } catch(e) {
                        setErrorMsg('Cloud sync failed.');
                     }
                  }}
                  className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors"
                >
                  Sync
                </button>
             </div>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center"><span className="bg-white px-2 text-[10px] text-slate-400 font-bold uppercase">Or use local file</span></div>
          </div>

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
            Files are 100% private. Cloud Sync requires Vercel KV enabled.
          </p>
        </div>

      </div>
    </div>
  );
};
