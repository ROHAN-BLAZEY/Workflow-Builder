import { Task, ColumnId } from '../types';

export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseYYYYMMDD(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseYYYYMMDD(dateStr);
  const today = new Date();
  const todayStr = formatDateToYYYYMMDD(today);

  if (dateStr === todayStr) {
    return 'Today';
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === formatDateToYYYYMMDD(yesterday)) {
    return 'Yesterday';
  }

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateStr === formatDateToYYYYMMDD(tomorrow)) {
    return 'Tomorrow';
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTimeMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export function formatSecondsToDigital(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export interface CalendarDayInfo {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasksCompleted: Task[];
  needCount: number;
  shouldCount: number;
  canCount: number;
  totalActualMinutes: number;
  totalEstimatedMinutes: number;
  hasActivity: boolean;
}

export function generateMonthCalendarGrid(
  year: number,
  monthIndex: number, // 0 - 11
  tasks: Task[]
): CalendarDayInfo[] {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
  const totalDays = lastDayOfMonth.getDate();

  const days: CalendarDayInfo[] = [];
  const todayStr = formatDateToYYYYMMDD(new Date());

  // Completed tasks mapped by date (YYYY-MM-DD)
  const tasksByDate: { [key: string]: Task[] } = {};
  tasks.forEach((t) => {
    if (t.completed && t.completedAt) {
      const taskDate = t.completedAt.split('T')[0];
      if (!tasksByDate[taskDate]) tasksByDate[taskDate] = [];
      tasksByDate[taskDate].push(t);
    }
  });

  // Previous month padding days
  const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const prevDate = new Date(year, monthIndex - 1, prevMonthLastDay - i);
    const dateStr = formatDateToYYYYMMDD(prevDate);
    const completedTasks = tasksByDate[dateStr] || [];
    days.push({
      date: prevDate,
      dateStr,
      dayNumber: prevDate.getDate(),
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      tasksCompleted: completedTasks,
      needCount: completedTasks.filter((t) => t.columnId === 'need').length,
      shouldCount: completedTasks.filter((t) => t.columnId === 'should').length,
      canCount: completedTasks.filter((t) => t.columnId === 'can').length,
      totalActualMinutes: completedTasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0),
      totalEstimatedMinutes: completedTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0),
      hasActivity: completedTasks.length > 0,
    });
  }

  // Current month days
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, monthIndex, day);
    const dateStr = formatDateToYYYYMMDD(date);
    const completedTasks = tasksByDate[dateStr] || [];
    days.push({
      date,
      dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      tasksCompleted: completedTasks,
      needCount: completedTasks.filter((t) => t.columnId === 'need').length,
      shouldCount: completedTasks.filter((t) => t.columnId === 'should').length,
      canCount: completedTasks.filter((t) => t.columnId === 'can').length,
      totalActualMinutes: completedTasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0),
      totalEstimatedMinutes: completedTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0),
      hasActivity: completedTasks.length > 0,
    });
  }

  // Next month padding days to fill 35 or 42 grid cells (5 or 6 rows)
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, monthIndex + 1, i);
    const dateStr = formatDateToYYYYMMDD(nextDate);
    const completedTasks = tasksByDate[dateStr] || [];
    days.push({
      date: nextDate,
      dateStr,
      dayNumber: i,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      tasksCompleted: completedTasks,
      needCount: completedTasks.filter((t) => t.columnId === 'need').length,
      shouldCount: completedTasks.filter((t) => t.columnId === 'should').length,
      canCount: completedTasks.filter((t) => t.columnId === 'can').length,
      totalActualMinutes: completedTasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0),
      totalEstimatedMinutes: completedTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0),
      hasActivity: completedTasks.length > 0,
    });
  }

  return days;
}

export function calculateCompletionStreak(tasks: Task[]): {
  currentStreak: number;
  longestStreak: number;
  totalDaysWithCompletedTasks: number;
} {
  const datesSet = new Set<string>();
  tasks.forEach((t) => {
    if (t.completed && t.completedAt) {
      datesSet.add(t.completedAt.split('T')[0]);
    }
  });

  if (datesSet.size === 0) {
    return { currentStreak: 0, longestStreak: 0, totalDaysWithCompletedTasks: 0 };
  }

  const today = new Date();
  let currentStreak = 0;
  let checkDate = new Date(today);
  const todayStr = formatDateToYYYYMMDD(checkDate);

  // If today has tasks, start from today, else if yesterday has tasks, start from yesterday
  if (datesSet.has(todayStr)) {
    while (datesSet.has(formatDateToYYYYMMDD(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
    while (datesSet.has(formatDateToYYYYMMDD(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // Calculate longest streak
  const sortedDates = Array.from(datesSet).sort();
  let longestStreak = 0;
  let runningStreak = 0;
  let prevDate: Date | null = null;

  sortedDates.forEach((dStr) => {
    const curDate = parseYYYYMMDD(dStr);
    if (!prevDate) {
      runningStreak = 1;
    } else {
      const diffTime = curDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      if (diffDays === 1) {
        runningStreak++;
      } else if (diffDays > 1) {
        runningStreak = 1;
      }
    }
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
    prevDate = curDate;
  });

  return {
    currentStreak,
    longestStreak,
    totalDaysWithCompletedTasks: datesSet.size,
  };
}

export function getColumnStats(tasks: Task[], columnId: ColumnId) {
  const colTasks = tasks.filter((t) => t.columnId === columnId);
  const activeTasks = colTasks.filter((t) => !t.completed);
  const completedTasks = colTasks.filter((t) => t.completed);

  const totalEstimated = activeTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const completedEstimated = completedTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const actualTimeSpent = colTasks.reduce((acc, t) => acc + (t.actualMinutes || 0), 0);

  return {
    total: colTasks.length,
    activeCount: activeTasks.length,
    completedCount: completedTasks.length,
    totalEstimated,
    completedEstimated,
    actualTimeSpent,
    progressPercentage: colTasks.length > 0 ? Math.round((completedTasks.length / colTasks.length) * 100) : 0,
  };
}
