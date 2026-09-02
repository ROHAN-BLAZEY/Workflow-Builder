import { Task } from '../types';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  badgeTitle: string;
  badgeEmoji: string;
}

export function calculateStreak(tasks: Task[]): StreakInfo {
  if (!tasks || tasks.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      badgeTitle: 'Getting Started',
      badgeEmoji: '🌱',
    };
  }

  // Get all unique dates (YYYY-MM-DD) where tasks were completed
  const completedDatesSet = new Set<string>();
  tasks.forEach((t) => {
    if (t.completed && t.completedAt) {
      const datePart = t.completedAt.split('T')[0];
      completedDatesSet.add(datePart);
    }
  });

  const sortedDates = Array.from(completedDatesSet).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (sortedDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      badgeTitle: 'Getting Started',
      badgeEmoji: '🌱',
    };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  const lastActive = sortedDates[0];
  let currentStreak = 0;

  // Check if last active was today or yesterday to continue streak
  if (lastActive === todayStr || lastActive === yesterdayStr) {
    let expectedDate = new Date(lastActive);
    for (const dateStr of sortedDates) {
      const currentD = new Date(dateStr);
      const diffTime = Math.abs(expectedDate.getTime() - currentD.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        currentStreak++;
        expectedDate = currentD;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longest = 0;
  let tempStreak = 1;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const d1 = new Date(sortedDates[i]);
    const d2 = new Date(sortedDates[i + 1]);
    const diff = Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
    if (Math.round(diff) === 1) {
      tempStreak++;
    } else {
      longest = Math.max(longest, tempStreak);
      tempStreak = 1;
    }
  }
  longest = Math.max(longest, tempStreak, currentStreak);

  // Badge determination
  let badgeTitle = 'Consistent Builder';
  let badgeEmoji = '🔥';
  if (currentStreak >= 30) {
    badgeTitle = 'Productivity Legend';
    badgeEmoji = '🏆';
  } else if (currentStreak >= 14) {
    badgeTitle = 'Momentum Master';
    badgeEmoji = '⚡';
  } else if (currentStreak >= 7) {
    badgeTitle = 'Week Warrior';
    badgeEmoji = '🚀';
  } else if (currentStreak >= 3) {
    badgeTitle = 'Consistency Star';
    badgeEmoji = '⭐';
  } else if (currentStreak === 0) {
    badgeTitle = 'Ready to Sprint';
    badgeEmoji = '🎯';
  }

  return {
    currentStreak,
    longestStreak: longest,
    lastActiveDate: lastActive,
    badgeTitle,
    badgeEmoji,
  };
}
