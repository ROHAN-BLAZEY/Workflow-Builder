import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Task, 
  ColumnConfig, 
  ColumnId, 
  ViewMode, 
  DeviceViewMode, 
  ActiveTimerState,
  TimetableEntry,
  ColumnAllotmentTimerState,
  LanguageCode,
  RoutinePreset
} from './types';
import { 
  loadTasksFromStorage, 
  saveTasksToStorage, 
  loadColumnsFromStorage, 
  saveColumnsToStorage,
  loadTimetableFromStorage,
  saveTimetableToStorage,
  loadLanguageFromStorage,
  saveLanguageToStorage
} from './utils/storage';
import { soundManager } from './utils/audio';
import { triggerHaptic } from './utils/haptics';
import { Header } from './components/Header';
import { ColumnView } from './components/ColumnView';
import { CalendarProgressView } from './components/CalendarProgressView';
import { AnalyticsView } from './components/AnalyticsView';
import { TimetableView } from './components/TimetableView';
import { TravelPlannerView } from './components/TravelPlannerView';
import { ColumnAllotmentTimer } from './components/ColumnAllotmentTimer';
import { ActiveTimerBar } from './components/ActiveTimerBar';
import { TaskModal } from './components/TaskModal';
import { TimeSettingsModal } from './components/TimeSettingsModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileDeviceFrame } from './components/MobileDeviceFrame';
import { BackupModal } from './components/BackupModal';

export default function App() {
  // Main Data States
  const [tasks, setTasks] = useState<Task[]>(() => loadTasksFromStorage());
  const [columns, setColumns] = useState<ColumnConfig[]>(() => loadColumnsFromStorage());
  const [timetable, setTimetable] = useState<TimetableEntry[]>(() => loadTimetableFromStorage());
  
  // Language Personalization
  const [language, setLanguage] = useState<LanguageCode>(() => loadLanguageFromStorage());

  // Navigation & View Modes
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [deviceMode, setDeviceMode] = useState<DeviceViewMode>('responsive');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Persist language
  useEffect(() => {
    saveLanguageToStorage(language);
  }, [language]);

  // Column Sequential Allotment Timer State
  const [allotmentTimer, setAllotmentTimer] = useState<ColumnAllotmentTimerState>({
    isActive: false,
    isPaused: false,
    currentColumnId: 'need',
    allottedDurationMinutes: 45,
    remainingSeconds: 45 * 60,
    columnSequence: ['need'],
  });

  // Task-specific Focus Timer State
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState>({
    taskId: null,
    secondsRemaining: 0,
    initialSeconds: 0,
    isRunning: false,
    isCountUp: false,
  });

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultColumnForNewTask, setDefaultColumnForNewTask] = useState<ColumnId>('need');
  
  const [isTimeSettingsModalOpen, setIsTimeSettingsModalOpen] = useState(false);
  const [timeSettingsColumnId, setTimeSettingsColumnId] = useState<ColumnId>('need');

  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [customPresets, setCustomPresets] = useState<RoutinePreset[]>([]);

  // Task Focus Timer interval effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (activeTimer.isRunning && activeTimer.taskId) {
      interval = setInterval(() => {
        setActiveTimer((prev) => {
          if (prev.secondsRemaining <= 1) {
            // Timer expired!
            soundManager.playTimerAlarm();
            
            // Auto update actualMinutes for this task
            setTasks((curTasks) =>
              curTasks.map((t) =>
                t.id === prev.taskId
                  ? {
                      ...t,
                      actualMinutes: (t.actualMinutes || 0) + Math.round(prev.initialSeconds / 60),
                    }
                  : t
              )
            );

            return {
              ...prev,
              secondsRemaining: 0,
              isRunning: false,
            };
          }
          return {
            ...prev,
            secondsRemaining: prev.secondsRemaining - 1,
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer.isRunning, activeTimer.taskId]);

  // Persist tasks whenever they change
  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  // Persist columns whenever they change
  useEffect(() => {
    saveColumnsToStorage(columns);
  }, [columns]);

  // Persist timetable
  useEffect(() => {
    saveTimetableToStorage(timetable);
  }, [timetable]);

  // Toggle audio effects
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setEnabled(next);
  };

  // Trigger celebration confetti
  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#f43f5e', '#f59e0b', '#10b981', '#6366f1'],
      });
    } catch {
      // Ignore if canvas not ready
    }
  };

  // Start Column Sequential Allotment Timer
  const handleStartAllotmentTimer = (targetColumnId: ColumnId = 'need') => {
    const col = columns.find((c) => c.id === targetColumnId) || columns[0];
    const duration = col.durationMinutes || col.dailyBudgetMinutes || 30;

    setAllotmentTimer({
      isActive: true,
      isPaused: false,
      currentColumnId: targetColumnId,
      allottedDurationMinutes: duration,
      remainingSeconds: duration * 60,
      columnSequence: [targetColumnId],
    });

    soundManager.playTimerStart();
  };

  // Direct column duration update
  const handleUpdateColumnDuration = (columnId: ColumnId, durationMinutes: number) => {
    setColumns((prev) =>
      prev.map((c) =>
        c.id === columnId
          ? { ...c, durationMinutes, dailyBudgetMinutes: durationMinutes }
          : c
      )
    );
    soundManager.playPop();
  };

  // Task Completion Flow
  const handleToggleComplete = (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const willBeCompleted = !targetTask.completed;

    if (willBeCompleted) {
      soundManager.playComplete();
      triggerCelebration();

      // If this task had active timer running, stop and log time
      if (activeTimer.taskId === taskId) {
        const timeElapsedSeconds = activeTimer.initialSeconds - activeTimer.secondsRemaining;
        const timeElapsedMinutes = Math.max(1, Math.round(timeElapsedSeconds / 60));

        setActiveTimer({
          taskId: null,
          secondsRemaining: 0,
          initialSeconds: 0,
          isRunning: false,
          isCountUp: false,
        });

        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  completed: true,
                  completedAt: new Date().toISOString(),
                  actualMinutes: (t.actualMinutes || 0) + timeElapsedMinutes,
                }
              : t
          )
        );
        return;
      }
    } else {
      soundManager.playPop();
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: willBeCompleted,
              completedAt: willBeCompleted ? new Date().toISOString() : undefined,
              actualMinutes: willBeCompleted && !t.actualMinutes ? t.estimatedMinutes : t.actualMinutes,
            }
          : t
      )
    );
  };

  // Timer Handlers
  const handleStartTimer = (task: Task) => {
    if (activeTimer.taskId === task.id && activeTimer.isRunning) {
      // Pause
      setActiveTimer((prev) => ({ ...prev, isRunning: false }));
      soundManager.playPop();
    } else if (activeTimer.taskId === task.id && !activeTimer.isRunning) {
      // Resume
      setActiveTimer((prev) => ({ ...prev, isRunning: true }));
      soundManager.playTimerStart();
    } else {
      // Start new timer for this task
      const durationSeconds = (task.estimatedMinutes || 30) * 60;
      setActiveTimer({
        taskId: task.id,
        taskTitle: task.title,
        columnId: task.columnId,
        secondsRemaining: durationSeconds,
        initialSeconds: durationSeconds,
        isRunning: true,
        isCountUp: false,
      });
      soundManager.playTimerStart();
    }
  };

  const handleToggleTimerPlay = () => {
    setActiveTimer((prev) => {
      const nextRunning = !prev.isRunning;
      if (nextRunning) soundManager.playTimerStart();
      else soundManager.playPop();
      return { ...prev, isRunning: nextRunning };
    });
  };

  const handleStopTimer = () => {
    if (activeTimer.taskId) {
      const timeElapsedSeconds = activeTimer.initialSeconds - activeTimer.secondsRemaining;
      const timeElapsedMinutes = Math.round(timeElapsedSeconds / 60);

      if (timeElapsedMinutes > 0) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === activeTimer.taskId
              ? {
                  ...t,
                  actualMinutes: (t.actualMinutes || 0) + timeElapsedMinutes,
                }
              : t
          )
        );
      }
    }

    setActiveTimer({
      taskId: null,
      secondsRemaining: 0,
      initialSeconds: 0,
      isRunning: false,
      isCountUp: false,
    });
    soundManager.playPop();
  };

  const handleAddFiveMinutes = () => {
    setActiveTimer((prev) => ({
      ...prev,
      secondsRemaining: prev.secondsRemaining + 300,
      initialSeconds: prev.initialSeconds + 300,
    }));
    soundManager.playPop();
  };

  // Move Column Handler
  const handleMoveColumn = (taskId: string, newColumnId: ColumnId) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, columnId: newColumnId } : t))
    );
    soundManager.playPop();
  };

  // Save Task (Create or Update)
  const handleSaveTask = (taskData: Partial<Task>) => {
    if (taskData.id) {
      // Update existing
      setTasks((prev) =>
        prev.map((t) => (t.id === taskData.id ? ({ ...t, ...taskData } as Task) : t))
      );
    } else {
      // Create new
      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        columnId: taskData.columnId || 'need',
        title: taskData.title || 'Untitled Task',
        description: taskData.description || '',
        estimatedMinutes: taskData.estimatedMinutes || 30,
        actualMinutes: taskData.actualMinutes || 0,
        scheduledStartTime: taskData.scheduledStartTime,
        scheduledEndTime: taskData.scheduledEndTime,
        dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
        priority: taskData.priority || 'normal',
        tags: taskData.tags || [],
        completed: false,
        createdAt: new Date().toISOString(),
        order: tasks.length + 1,
      };
      setTasks((prev) => [newTask, ...prev]);
    }
    soundManager.playPop();
  };

  const handleDeleteTask = (taskId: string) => {
    if (activeTimer.taskId === taskId) {
      handleStopTimer();
    }
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    soundManager.playPop();
  };

  // Add tasks from routine preset
  const handleAddTasksFromRoutine = (routineTasks: Array<{ title: string; columnId: ColumnId; estimatedMinutes: number }>) => {
    const created: Task[] = routineTasks.map((item, idx) => ({
      id: `routine-task-${Date.now()}-${idx}`,
      columnId: item.columnId,
      title: item.title,
      description: 'Auto-generated from Routine Preset',
      estimatedMinutes: item.estimatedMinutes || 30,
      actualMinutes: 0,
      priority: item.columnId === 'need' ? 'urgent' : item.columnId === 'should' ? 'high' : 'normal',
      dueDate: new Date().toISOString().split('T')[0],
      tags: ['Routine', item.columnId.toUpperCase()],
      completed: false,
      createdAt: new Date().toISOString(),
      order: tasks.length + idx + 1,
    }));

    setTasks((prev) => [...created, ...prev]);
    triggerCelebration();
    soundManager.playComplete();
  };

  const handleAddTimetableEntries = (newEntries: Array<Omit<TimetableEntry, 'id'>>) => {
    const created: TimetableEntry[] = newEntries.map((e, idx) => ({
      ...e,
      id: `commute-${Date.now()}-${idx}`,
    }));
    setTimetable((prev) => [...prev, ...created]);
    triggerCelebration();
    soundManager.playComplete();
  };

  const handleAddTasksToColumns = (
    newTasks: Array<{ title: string; columnId: ColumnId; estimatedMinutes: number; description?: string }>
  ) => {
    const created: Task[] = newTasks.map((t, idx) => ({
      id: `commute-task-${Date.now()}-${idx}`,
      columnId: t.columnId,
      title: t.title,
      description: t.description || 'Commute workflow task',
      estimatedMinutes: t.estimatedMinutes,
      actualMinutes: 0,
      priority: t.columnId === 'need' ? 'urgent' : t.columnId === 'should' ? 'high' : 'normal',
      dueDate: new Date().toISOString().split('T')[0],
      tags: ['Commute', t.columnId.toUpperCase()],
      completed: false,
      createdAt: new Date().toISOString(),
      order: tasks.length + idx + 1,
    }));
    setTasks((prev) => [...created, ...prev]);
    triggerCelebration();
    soundManager.playComplete();
  };

  const handleOpenNewTask = (columnId?: ColumnId) => {
    setDefaultColumnForNewTask(columnId || 'need');
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenTimeSettings = (columnId?: ColumnId) => {
    setTimeSettingsColumnId(columnId || 'need');
    setIsTimeSettingsModalOpen(true);
  };

  const handleSaveColumns = (updatedColumns: ColumnConfig[]) => {
    setColumns(updatedColumns);
    soundManager.playPop();
  };

  const activeTaskForTimer = tasks.find((t) => t.id === activeTimer.taskId);
  const todayStr = new Date().toISOString().split('T')[0];
  const completedTodayCount = tasks.filter(
    (t) => t.completed && t.completedAt?.startsWith(todayStr)
  ).length;

  // Render Inner Application Content
  const appContent = (
    <div className="min-h-screen flex flex-col pb-24 md:pb-12 bg-[#f8fafc] text-slate-800 w-full overflow-x-hidden">
      
      {/* Top Application Header */}
      <Header
        viewMode={viewMode}
        setViewMode={(m) => {
          triggerHaptic(15);
          setViewMode(m);
        }}
        deviceMode={deviceMode}
        setDeviceMode={setDeviceMode}
        columns={columns}
        tasks={tasks}
        onOpenNewTask={handleOpenNewTask}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onStartAllotmentTimer={() => {
          triggerHaptic(30);
          handleStartAllotmentTimer('need');
        }}
        isAllotmentTimerActive={allotmentTimer.isActive && !allotmentTimer.isPaused}
        language={language}
        onChangeLanguage={(l) => {
          triggerHaptic(20);
          setLanguage(l);
        }}
        onOpenBackupModal={() => {
          triggerHaptic(20);
          setIsBackupModalOpen(true);
        }}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 py-3 sm:py-6 space-y-4 sm:space-y-5 overflow-x-hidden">
        
        {/* Sequential Column Allotment Focus Bar (Top of Board when Active) */}
        {allotmentTimer.isActive && (
          <ColumnAllotmentTimer
            timerState={allotmentTimer}
            columns={columns}
            tasks={tasks}
            soundEnabled={soundEnabled}
            onUpdateTimerState={setAllotmentTimer}
            onToggleTaskComplete={handleToggleComplete}
            onClose={() => setAllotmentTimer((prev) => ({ ...prev, isActive: false }))}
          />
        )}

        {viewMode === 'board' && (
          <ColumnView
            columns={columns}
            tasks={tasks}
            activeTimer={activeTimer}
            onToggleComplete={handleToggleComplete}
            onStartTimer={handleStartTimer}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onMoveColumn={handleMoveColumn}
            onOpenNewTask={handleOpenNewTask}
            onOpenTimeSettings={handleOpenTimeSettings}
            onStartColumnAllotment={handleStartAllotmentTimer}
            onUpdateColumnDuration={handleUpdateColumnDuration}
            language={language}
          />
        )}

        {viewMode === 'timetable' && (
          <TimetableView
            timetable={timetable}
            tasks={tasks}
            onSaveTimetable={setTimetable}
            onAddTasksFromRoutine={handleAddTasksFromRoutine}
            language={language}
          />
        )}

        {viewMode === 'calendar' && (
          <CalendarProgressView
            tasks={tasks}
            columns={columns}
            onToggleComplete={handleToggleComplete}
            onEditTask={handleEditTask}
            language={language}
          />
        )}

        {viewMode === 'analytics' && (
          <AnalyticsView 
            tasks={tasks} 
            columns={columns} 
            language={language}
          />
        )}

        {viewMode === 'commute' && (
          <TravelPlannerView
            tasks={tasks}
            columns={columns}
            onAddTimetableEntries={handleAddTimetableEntries}
            onAddTasksToColumns={handleAddTasksToColumns}
            language={language}
          />
        )}
      </main>

      {/* Active Single Task Focus Timer Bar */}
      <ActiveTimerBar
        timer={activeTimer}
        task={activeTaskForTimer}
        onTogglePlay={handleToggleTimerPlay}
        onStop={handleStopTimer}
        onAddFiveMinutes={handleAddFiveMinutes}
        onCompleteTask={handleToggleComplete}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenNewTask={() => handleOpenNewTask('need')}
        onOpenTimeSettings={() => handleOpenTimeSettings('need')}
        completedTodayCount={completedTodayCount}
        language={language}
      />

      {/* Task Creation & Editing Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSaveTask={handleSaveTask}
        editingTask={editingTask}
        defaultColumnId={defaultColumnForNewTask}
        columns={columns}
        language={language}
      />

      {/* Time Settings Modal per Column */}
      <TimeSettingsModal
        isOpen={isTimeSettingsModalOpen}
        onClose={() => setIsTimeSettingsModalOpen(false)}
        columns={columns}
        activeColumnId={timeSettingsColumnId}
        onSaveColumns={handleSaveColumns}
        language={language}
      />

      {/* Offline Backup & Sync Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        tasks={tasks}
        columns={columns}
        timetableEntries={timetable}
        customPresets={customPresets}
        onRestoreData={(data) => {
          if (data.tasks) setTasks(data.tasks);
          if (data.columns) setColumns(data.columns);
          if (data.timetableEntries) setTimetable(data.timetableEntries);
          if (data.customPresets) setCustomPresets(data.customPresets);
        }}
      />

    </div>
  );

  if (deviceMode === 'mobile-preview') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-1 sm:p-2 overflow-x-hidden">
        <MobileDeviceFrame onClosePreview={() => setDeviceMode('responsive')}>
          {appContent}
        </MobileDeviceFrame>
      </div>
    );
  }

  return appContent;
}
