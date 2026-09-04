import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Navigation,
  Clock,
  Car,
  Train,
  Footprints,
  Bike,
  Plus,
  Trash2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Check,
  ShieldCheck,
  Compass,
  ArrowRight,
  CalendarPlus,
  ListPlus,
  Copy,
  ChevronDown,
  ChevronUp,
  Zap,
  CheckCircle2,
  Timer,
  BarChart3,
  Layers,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Task, ColumnId, ColumnConfig, TimetableEntry, LanguageCode, TravelStop, GroundingChunkItem } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface TravelPlannerViewProps {
  tasks: Task[];
  columns?: ColumnConfig[];
  onAddTimetableEntries: (entries: Array<Omit<TimetableEntry, 'id'>>) => void;
  onAddTasksToColumns: (newTasks: Array<{ title: string; columnId: ColumnId; estimatedMinutes: number; description?: string }>) => void;
  language?: LanguageCode;
}

// Time calculation utilities
function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  let hours = 8;
  let minutes = 30;
  const clean = timeStr.trim();
  const match = clean.match(/(\d+):(\d+)\s*(am|pm)?/i);
  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const meridiem = match[3]?.toLowerCase();
    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;
  }
  return { hours, minutes };
}

function formatMinutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  const meridiem = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : `${m}`;
  return `${displayH}:${displayM} ${meridiem}`;
}

function getCurrentFormattedTime(): string {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${mStr} ${meridiem}`;
}

export const TravelPlannerView: React.FC<TravelPlannerViewProps> = ({
  tasks,
  columns,
  onAddTimetableEntries,
  onAddTasksToColumns,
}) => {
  // Core Route States (Kept same as requested)
  const [origin, setOrigin] = useState('Home Residence');
  const [destination, setDestination] = useState('Central Office Headquarters');
  const [stops, setStops] = useState<TravelStop[]>([
    { id: 'stop-default', location: 'Espresso Focus Hub', durationMinutes: 25, purpose: 'Triage & Morning Sprint' },
  ]);
  const [travelMode, setTravelMode] = useState<'driving' | 'transit' | 'walking' | 'bicycling'>('driving');
  const [trafficTolerance, setTrafficTolerance] = useState<'tight' | 'moderate' | 'defensive'>('moderate');
  const [departureTime, setDepartureTime] = useState('08:30 AM');
  const [workStyle, setWorkStyle] = useState<'handsfree' | 'mobile_transit' | 'stationary_stops' | 'resilient'>('resilient');

  // Advanced settings toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Selected Tasks from the 3 Columns (Need, Should, Can)
  // By default, select active uncompleted tasks
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(() =>
    tasks.filter((t) => !t.completed).map((t) => t.id)
  );

  // Geolocation & Loading States
  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Result State
  const [planResult, setPlanResult] = useState<{
    text: string;
    model: string;
    groundingChunks: GroundingChunkItem[];
    isQuotaFallback?: boolean;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [timetableImported, setTimetableImported] = useState(false);
  const [tasksImported, setTasksImported] = useState(false);

  // 1-Click Route Presets
  const ROUTE_PRESETS = [
    {
      label: 'Home ➔ Coffee ➔ Office',
      icon: '☕',
      origin: 'Home Residence',
      destination: 'Central Business District Office',
      stops: [{ id: 'p1', location: 'Downtown Espresso Lab', durationMinutes: 30, purpose: 'Coffee & Morning Triage' }],
      mode: 'driving' as const,
      style: 'resilient' as const,
    },
    {
      label: 'Metro Commute ➔ Tech Campus',
      icon: '🚆',
      origin: 'North Station Metro',
      destination: 'Silicon Innovation Campus',
      stops: [{ id: 'p2', location: 'Central Junction Station', durationMinutes: 15, purpose: 'Transit Transfer' }],
      mode: 'transit' as const,
      style: 'mobile_transit' as const,
    },
    {
      label: 'Client Roadshow & Site Visit',
      icon: '🏢',
      origin: 'Headquarters Office',
      destination: 'West Financial Branch',
      stops: [
        { id: 'p3', location: 'Alpha Client Tower', durationMinutes: 45, purpose: 'Executive Review' },
        { id: 'p4', location: 'Logistics Facility', durationMinutes: 30, purpose: 'On-site Inspection' },
      ],
      mode: 'driving' as const,
      style: 'stationary_stops' as const,
    },
  ];

  const applyPreset = (preset: typeof ROUTE_PRESETS[0]) => {
    triggerHaptic(20);
    setOrigin(preset.origin);
    setDestination(preset.destination);
    setStops(preset.stops.map((s, idx) => ({ ...s, id: `stop-${idx}-${Date.now()}` })));
    setTravelMode(preset.mode);
    setWorkStyle(preset.style);
  };

  // Add & Manage Stops
  const handleAddStop = () => {
    triggerHaptic(15);
    const newStop: TravelStop = {
      id: `stop-${Date.now()}`,
      location: '',
      durationMinutes: 25,
      purpose: 'Deep Focus Block',
    };
    setStops([...stops, newStop]);
  };

  const handleUpdateStop = (id: string, updates: Partial<TravelStop>) => {
    setStops(stops.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleRemoveStop = (id: string) => {
    triggerHaptic(20);
    setStops(stops.filter((s) => s.id !== id));
  };

  // GPS Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    triggerHaptic(20);
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ latitude, longitude });
        setOrigin(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        setIsLocating(false);
        setErrorMsg('Unable to retrieve GPS coordinates. Ensure Location Permissions are enabled for this app.');
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  // Task Selection Handlers across the 3 Columns
  const toggleTaskSelection = (taskId: string) => {
    triggerHaptic(10);
    if (selectedTaskIds.includes(taskId)) {
      setSelectedTaskIds(selectedTaskIds.filter((id) => id !== taskId));
    } else {
      setSelectedTaskIds([...selectedTaskIds, taskId]);
    }
  };

  const handleSelectAllTasks = () => {
    triggerHaptic(15);
    setSelectedTaskIds(tasks.filter((t) => !t.completed).map((t) => t.id));
  };

  const handleSelectNeedAndShould = () => {
    triggerHaptic(15);
    setSelectedTaskIds(tasks.filter((t) => !t.completed && (t.columnId === 'need' || t.columnId === 'should')).map((t) => t.id));
  };

  const handleClearSelectedTasks = () => {
    triggerHaptic(15);
    setSelectedTaskIds([]);
  };

  // Live Calculated Times: Starting Place ➔ Intermediate Stops ➔ Destination Arrival
  const calculatedSchedule = useMemo(() => {
    const { hours, minutes } = parseTimeString(departureTime);
    const startTotalMinutes = hours * 60 + minutes;

    // Base speed estimates per leg according to travelMode
    const baseLegDuration =
      travelMode === 'walking'
        ? 55
        : travelMode === 'bicycling'
        ? 30
        : travelMode === 'transit'
        ? 35
        : 25; // driving

    // Buffer percentage
    const bufferPct = trafficTolerance === 'tight' ? 0.1 : trafficTolerance === 'defensive' ? 0.35 : 0.2;
    const legBuffer = Math.round(baseLegDuration * bufferPct);
    const totalSingleLeg = baseLegDuration + legBuffer;

    const validStops = stops.filter((s) => s.location.trim().length > 0);
    const totalLegs = validStops.length + 1; // Origin to Stop 1... Stop N to Destination
    const totalTransitMinutes = totalLegs * totalSingleLeg;

    // Intermediate stops total duration
    const totalStopsDuration = validStops.reduce((sum, s) => sum + (s.durationMinutes || 25), 0);

    // Total journey window
    const totalJourneyMinutes = totalTransitMinutes + totalStopsDuration;
    const destinationArrivalTotalMinutes = startTotalMinutes + totalJourneyMinutes;

    // Build timeline milestones
    let runningMinutes = startTotalMinutes;
    const milestones: Array<{ label: string; location: string; time: string; type: 'origin' | 'leg' | 'stop' | 'destination'; durationMinutes?: number }> = [];

    // 1. Starting Place Departure
    milestones.push({
      label: 'Starting Place Departure',
      location: origin.trim() || 'Starting Point',
      time: formatMinutesToTime(runningMinutes),
      type: 'origin',
    });

    // 2. Intermediate legs & stops
    validStops.forEach((stop, idx) => {
      runningMinutes += totalSingleLeg;
      milestones.push({
        label: `Travel Leg ${idx + 1}`,
        location: `En route to ${stop.location}`,
        time: formatMinutesToTime(runningMinutes - totalSingleLeg) + ' – ' + formatMinutesToTime(runningMinutes),
        type: 'leg',
        durationMinutes: totalSingleLeg,
      });

      const stayDuration = stop.durationMinutes || 25;
      const stopArrivalTime = runningMinutes;
      runningMinutes += stayDuration;
      milestones.push({
        label: `Stop ${idx + 1}: ${stop.purpose || 'Focus Session'}`,
        location: stop.location,
        time: formatMinutesToTime(stopArrivalTime) + ' – ' + formatMinutesToTime(runningMinutes),
        type: 'stop',
        durationMinutes: stayDuration,
      });
    });

    // Final Leg to Destination
    runningMinutes += totalSingleLeg;
    milestones.push({
      label: `Final Transit Leg`,
      location: `To ${destination.trim() || 'Destination'}`,
      time: formatMinutesToTime(runningMinutes - totalSingleLeg) + ' – ' + formatMinutesToTime(runningMinutes),
      type: 'leg',
      durationMinutes: totalSingleLeg,
    });

    // Destination Arrival
    milestones.push({
      label: 'Destination Arrival',
      location: destination.trim() || 'Destination',
      time: formatMinutesToTime(destinationArrivalTotalMinutes),
      type: 'destination',
    });

    return {
      startTimeStr: formatMinutesToTime(startTotalMinutes),
      arrivalTimeStr: formatMinutesToTime(destinationArrivalTotalMinutes),
      totalJourneyMinutes,
      totalTransitMinutes,
      totalStopsDuration,
      milestones,
    };
  }, [departureTime, travelMode, trafficTolerance, stops, origin, destination]);

  // Tasks categorized across 3 Columns
  const tasksByColumn = useMemo(() => {
    const uncompleted = tasks.filter((t) => !t.completed);
    const need = uncompleted.filter((t) => t.columnId === 'need');
    const should = uncompleted.filter((t) => t.columnId === 'should');
    const can = uncompleted.filter((t) => t.columnId === 'can');

    const totalNeedMins = need.reduce((sum, t) => sum + (t.estimatedMinutes || 25), 0);
    const totalShouldMins = should.reduce((sum, t) => sum + (t.estimatedMinutes || 25), 0);
    const totalCanMins = can.reduce((sum, t) => sum + (t.estimatedMinutes || 25), 0);

    const selectedTasks = uncompleted.filter((t) => selectedTaskIds.includes(t.id));
    const selectedMins = selectedTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 25), 0);

    return {
      need,
      should,
      can,
      totalNeedMins,
      totalShouldMins,
      totalCanMins,
      selectedTasks,
      selectedMins,
    };
  }, [tasks, selectedTaskIds]);

  // Multi-stop Google Maps URL
  const getGoogleMapsDirectionsUrl = () => {
    const validOrigin = origin.trim() || 'My Location';
    const validDest = destination.trim() || 'Destination';
    const validWaypoints = stops.map((s) => s.location.trim()).filter(Boolean);

    let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(validOrigin)}&destination=${encodeURIComponent(validDest)}`;
    if (validWaypoints.length > 0) {
      url += `&waypoints=${encodeURIComponent(validWaypoints.join('|'))}`;
    }
    const modeMap = {
      driving: 'driving',
      transit: 'transit',
      walking: 'walking',
      bicycling: 'bicycling',
    };
    url += `&travelmode=${modeMap[travelMode] || 'driving'}`;
    return url;
  };

  // Perform AI 3-Column Task & Time Effectiveness Analysis
  const handleAnalyzeProductivity = async () => {
    if (!origin.trim()) {
      setErrorMsg('Please enter a starting location.');
      return;
    }
    if (!destination.trim()) {
      setErrorMsg('Please enter a destination.');
      return;
    }

    setErrorMsg(null);
    setIsGenerating(true);
    triggerHaptic(30);
    setGenerationStep('Auditing Google Maps transit times between Starting Place and Destination...');

    try {
      const activeChosenTasks = tasks
        .filter((t) => selectedTaskIds.includes(t.id))
        .map((t) => ({
          id: t.id,
          title: t.title,
          columnId: t.columnId,
          estimatedMinutes: t.estimatedMinutes || 25,
        }));

      const payload = {
        origin: origin.trim(),
        stops: stops.filter((s) => s.location.trim().length > 0),
        destination: destination.trim(),
        travelMode,
        workStyle,
        departureTime,
        trafficTolerance,
        tasks: activeChosenTasks,
        userLocation: userCoords || undefined,
      };

      setGenerationStep('Calculating 3-column task time distribution & productivity strategy...');

      const res = await fetch('/api/travel-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setPlanResult({
        text: data.text,
        model: data.model || 'Gemini 3.8 Flash',
        groundingChunks: data.groundingChunks || [],
        isQuotaFallback: !!data.isQuotaFallback,
      });
      setTimetableImported(false);
      setTasksImported(false);
      triggerHaptic(40);
    } catch (err: any) {
      console.error('Error generating analysis:', err);
      setErrorMsg(
        err.message ||
          'Failed to complete productivity analysis. Please check your connection or GEMINI_API_KEY in Settings > Secrets.'
      );
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // 1-Click Import to Daily Timetable
  const handleImportToTimetable = () => {
    triggerHaptic(30);
    const entries: Array<Omit<TimetableEntry, 'id'>> = [];

    const { hours, minutes } = parseTimeString(departureTime);
    let currentMinutes = hours * 60 + minutes;

    const formatTime = (totalM: number) => {
      const h = String(Math.floor(totalM / 60) % 24).padStart(2, '0');
      const m = String(Math.floor(totalM % 60)).padStart(2, '0');
      return `${h}:${m}`;
    };

    const firstStopName = stops[0]?.location ? stops[0].location : destination;
    const leg1Duration = travelMode === 'walking' ? 50 : 30;

    entries.push({
      title: `🚗 Transit Leg 1: ${origin} ➔ ${firstStopName}`,
      startTime: formatTime(currentMinutes),
      endTime: formatTime(currentMinutes + leg1Duration),
      category: 'study',
      notes: `Focus Mode: ${workStyle === 'handsfree' ? 'Hands-free voice notes & audio triage' : 'Mobile priority review'}`,
    });
    currentMinutes += leg1Duration;

    stops.forEach((stop, idx) => {
      if (stop.location.trim()) {
        const stayDuration = stop.durationMinutes || 25;
        entries.push({
          title: `📍 Work Stop ${idx + 1}: ${stop.location} (${stop.purpose || 'Focus Block'})`,
          startTime: formatTime(currentMinutes),
          endTime: formatTime(currentMinutes + stayDuration),
          category: 'need',
          notes: 'Stationary focus sprint for Need-To-Do high priority deliverable.',
        });
        currentMinutes += stayDuration;

        const nextDest = idx < stops.length - 1 && stops[idx + 1]?.location ? stops[idx + 1].location : destination;
        const subLegDuration = 25;
        entries.push({
          title: `🚗 Transit Leg ${idx + 2}: ${stop.location} ➔ ${nextDest}`,
          startTime: formatTime(currentMinutes),
          endTime: formatTime(currentMinutes + subLegDuration),
          category: 'study',
          notes: 'Buffer transit leg with traffic shock protection.',
        });
        currentMinutes += subLegDuration;
      }
    });

    entries.push({
      title: `🏁 Destination Milestone: ${destination}`,
      startTime: formatTime(currentMinutes),
      endTime: formatTime(currentMinutes + 45),
      category: 'need',
      notes: 'Arrival at destination. Execute primary agenda items and key deliverables.',
    });

    onAddTimetableEntries(entries);
    setTimetableImported(true);
  };

  // 1-Click Import Commute Tasks into Columns
  const handleImportCommuteTasks = () => {
    triggerHaptic(30);
    const newTasks: Array<{ title: string; columnId: ColumnId; estimatedMinutes: number; description?: string }> = [
      {
        title: `Need: Destination Core Agenda Execution (${destination})`,
        columnId: 'need',
        estimatedMinutes: 45,
        description: 'Critical deliverable scheduled right upon arrival at destination.',
      },
      {
        title: `Should: Commute Audio / Transit Triage Sprint`,
        columnId: 'should',
        estimatedMinutes: 25,
        description: 'Hands-free audio dictation or transit reading on route.',
      },
      {
        title: `Can: Traffic Shock Absorber (Floating Buffer)`,
        columnId: 'can',
        estimatedMinutes: 15,
        description: 'Discretionary buffer to drop or defer if transit traffic causes unexpected delays.',
      },
    ];

    onAddTasksToColumns(newTasks);
    setTasksImported(true);
  };

  const handleCopyPlan = () => {
    if (!planResult) return;
    navigator.clipboard.writeText(planResult.text);
    setCopied(true);
    triggerHaptic(15);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Compass className="w-3 h-3 text-indigo-300" />
              Google Maps Grounded
            </span>
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              3-Column Task & Time Optimizer
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-white mt-1">
            Route & 3-Column Task Productivity Analyzer
          </h1>
          <p className="text-xs text-slate-300 max-w-xl mt-0.5 leading-relaxed">
            Calculates transit times from your starting place to your destination, analyzes your 3 task columns, and optimizes your time management to maximize productivity.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={getGoogleMapsDirectionsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all"
          >
            <Navigation className="w-3.5 h-3.5 text-sky-400" />
            <span>Open in Maps</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </div>

      {/* 1-Tap Presets Pill Bar (Kept Same) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Quick Routes:</span>
        {ROUTE_PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => applyPreset(p)}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all font-semibold shadow-2xs"
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Live Calculated Timeline Card (Starting Place ➔ Destination) */}
      <div className="bg-linear-to-r from-indigo-900 via-slate-900 to-slate-950 rounded-2xl p-4 sm:p-5 text-white border border-indigo-500/30 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              Calculated Transit & Arrival Timeline
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-300 font-medium">Starting Time:</span>
            <span className="font-bold text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
              {calculatedSchedule.startTimeStr}
            </span>
            <span className="text-slate-400">➔</span>
            <span className="text-slate-300 font-medium">Calculated Arrival:</span>
            <span className="font-bold text-sky-400 px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20">
              {calculatedSchedule.arrivalTimeStr}
            </span>
          </div>
        </div>

        {/* Milestone Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3.5 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[11px] font-bold text-emerald-300 uppercase flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" />
              Starting Place
            </div>
            <div className="text-xs font-bold text-white mt-1 truncate">{origin || 'Starting Location'}</div>
            <div className="text-[11px] text-slate-300 mt-0.5 font-semibold">
              Departure: {calculatedSchedule.startTimeStr}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[11px] font-bold text-amber-300 uppercase flex items-center gap-1">
              <Car className="w-3 h-3 text-amber-400" />
              Calculated Transit & Stops
            </div>
            <div className="text-xs font-bold text-white mt-1">
              {calculatedSchedule.totalTransitMinutes}m Transit + {calculatedSchedule.totalStopsDuration}m Stops
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              Buffer: +{trafficTolerance === 'tight' ? '10%' : trafficTolerance === 'defensive' ? '35%' : '20%'} ({travelMode})
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[11px] font-bold text-sky-300 uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-sky-400" />
              Calculated Destination
            </div>
            <div className="text-xs font-bold text-white mt-1 truncate">{destination || 'Destination'}</div>
            <div className="text-[11px] text-sky-200 mt-0.5 font-bold">
              Arrive: {calculatedSchedule.arrivalTimeStr}
            </div>
          </div>
        </div>
      </div>

      {/* Route & Map Configuration Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            Route Settings (Google Maps)
          </h2>
          <button
            type="button"
            onClick={handleAddStop}
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Stop</span>
          </button>
        </div>

        {/* Visual Route Track */}
        <div className="relative pl-6 space-y-4">
          <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-slate-200 border-l border-dashed border-slate-300" />

          {/* 1. Starting Place (Origin) */}
          <div className="relative space-y-1">
            <div className="absolute -left-6 top-2.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 border-2 border-white" />
            <div className="flex items-center justify-between">
              <label htmlFor="origin-input" className="text-xs font-bold text-slate-700">Starting Place (Origin)</label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
              >
                <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Detecting...' : 'Use Current GPS'}</span>
              </button>
            </div>
            <input
              id="origin-input"
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. 120 Broadway, New York or Indiranagar, Bangalore"
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
            />
          </div>

          {/* 2. Intermediate Stops */}
          {stops.map((stop, index) => (
            <div key={stop.id} className="relative space-y-1">
              <div className="absolute -left-6 top-2.5 w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-amber-100 border-2 border-white" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700">Intermediate Stop {index + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveStop(stop.id)}
                  className="text-slate-400 hover:text-rose-600 text-[11px] font-medium flex items-center gap-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={stop.location}
                  onChange={(e) => handleUpdateStop(stop.id, { location: e.target.value })}
                  placeholder={`Address or place for Stop ${index + 1}`}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />

                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 text-xs text-slate-600">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <select
                      value={stop.durationMinutes}
                      onChange={(e) => handleUpdateStop(stop.id, { durationMinutes: Number(e.target.value) })}
                      className="px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
                    >
                      <option value={15}>15m</option>
                      <option value={25}>25m</option>
                      <option value={35}>35m</option>
                      <option value={45}>45m</option>
                      <option value={60}>60m</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    value={stop.purpose || ''}
                    onChange={(e) => handleUpdateStop(stop.id, { purpose: e.target.value })}
                    placeholder="Focus Goal"
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white w-32"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* 3. Final Destination */}
          <div className="relative space-y-1">
            <div className="absolute -left-6 top-2.5 w-3.5 h-3.5 rounded-full bg-indigo-600 ring-4 ring-indigo-100 border-2 border-white" />
            <label htmlFor="destination-input" className="text-xs font-bold text-slate-700">Final Destination</label>
            <input
              id="destination-input"
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Wall St Office or Innovation Hub"
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Departure Time & Quick "Now" Button */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Starting Departure Time</label>
              <button
                type="button"
                onClick={() => setDepartureTime(getCurrentFormattedTime())}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
              >
                Set to Now
              </button>
            </div>
            <input
              type="text"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              placeholder="e.g. 08:30 AM"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase">Commute Work Style</label>
            <select
              value={workStyle}
              onChange={(e) => setWorkStyle(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
            >
              <option value="resilient">Smart Hybrid (Auto-Switch based on leg)</option>
              <option value="handsfree">Hands-Free (Voice Notes & Audio Recaps)</option>
              <option value="mobile_transit">Transit Focus (Phone/Tablet Reading)</option>
              <option value="stationary_stops">Stationary Focus (Deep Work at Stops)</option>
            </select>
          </div>
        </div>

        {/* Travel Mode & Traffic Buffer */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Travel Mode */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Travel Mode</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'driving', label: 'Drive', icon: Car },
                { id: 'transit', label: 'Transit', icon: Train },
                { id: 'walking', label: 'Walk', icon: Footprints },
                { id: 'bicycling', label: 'Bike', icon: Bike },
              ].map((m) => {
                const Icon = m.icon;
                const active = travelMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTravelMode(m.id as any)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 mb-0.5" />
                    <span className="text-[10px]">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Traffic Shock Buffer */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Traffic Buffer</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'tight', label: 'Light (+10%)' },
                { id: 'moderate', label: 'Standard (+20%)' },
                { id: 'defensive', label: 'Defensive (+35%)' },
              ].map((b) => {
                const active = trafficTolerance === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setTrafficTolerance(b.id as any)}
                    className={`py-2 px-1 text-[11px] font-bold rounded-xl border text-center transition-all ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Task Analysis & Selection Manager */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Tasks in 3 Columns for Productivity Analysis
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select tasks across Need, Should, and Can to optimize your time against the calculated travel timeline.
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleSelectAllTasks}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleSelectNeedAndShould}
              className="text-[11px] font-bold text-slate-700 hover:text-slate-900 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Need & Should Only
            </button>
            <button
              type="button"
              onClick={handleClearSelectedTasks}
              className="text-[11px] font-medium text-slate-400 hover:text-slate-600 px-2 py-1"
            >
              Clear
            </button>
          </div>
        </div>

        {/* 3-Column Visual Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Column 1: Need To Do */}
          <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-900 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                Need To Do
              </span>
              <span className="text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">
                {tasksByColumn.need.length} tasks • {tasksByColumn.totalNeedMins}m
              </span>
            </div>

            {tasksByColumn.need.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic py-2">No active Need tasks on board.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {tasksByColumn.need.map((task) => {
                  const isSelected = selectedTaskIds.includes(task.id);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => toggleTaskSelection(task.id)}
                      className={`w-full text-left p-2 rounded-lg text-xs border transition-all flex items-start gap-2 ${
                        isSelected
                          ? 'bg-white border-rose-400 shadow-2xs text-rose-950 font-semibold'
                          : 'bg-white/60 border-rose-100 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 mt-0.5 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{task.title}</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          ~{task.estimatedMinutes || 25} mins • Critical Focus
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 2: Should Do */}
          <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Should Do
              </span>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                {tasksByColumn.should.length} tasks • {tasksByColumn.totalShouldMins}m
              </span>
            </div>

            {tasksByColumn.should.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic py-2">No active Should tasks on board.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {tasksByColumn.should.map((task) => {
                  const isSelected = selectedTaskIds.includes(task.id);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => toggleTaskSelection(task.id)}
                      className={`w-full text-left p-2 rounded-lg text-xs border transition-all flex items-start gap-2 ${
                        isSelected
                          ? 'bg-white border-amber-400 shadow-2xs text-amber-950 font-semibold'
                          : 'bg-white/60 border-amber-100 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 mt-0.5 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{task.title}</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          ~{task.estimatedMinutes || 25} mins • High-Value
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 3: Can Do */}
          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Can Do
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                {tasksByColumn.can.length} tasks • {tasksByColumn.totalCanMins}m
              </span>
            </div>

            {tasksByColumn.can.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic py-2">No active Can tasks on board.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {tasksByColumn.can.map((task) => {
                  const isSelected = selectedTaskIds.includes(task.id);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => toggleTaskSelection(task.id)}
                      className={`w-full text-left p-2 rounded-lg text-xs border transition-all flex items-start gap-2 ${
                        isSelected
                          ? 'bg-white border-emerald-400 shadow-2xs text-emerald-950 font-semibold'
                          : 'bg-white/60 border-emerald-100 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 mt-0.5 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{task.title}</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          ~{task.estimatedMinutes || 25} mins • Shock Buffer
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Time Balance Comparison Bar */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Time Capacity Comparison</span>
            </div>
            <div className="text-slate-500 text-[11px]">
              Selected Tasks: <strong className="text-slate-800">{tasksByColumn.selectedTasks.length} tasks ({tasksByColumn.selectedMins} mins)</strong> vs Calculated Commute Window: <strong className="text-indigo-600">{calculatedSchedule.totalJourneyMinutes} mins</strong>
            </div>
          </div>

          <div className="text-right sm:text-right">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
              tasksByColumn.selectedMins > calculatedSchedule.totalJourneyMinutes
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              <Zap className="w-3 h-3" />
              {tasksByColumn.selectedMins > calculatedSchedule.totalJourneyMinutes
                ? 'High-Density: AI will triage & buffer'
                : 'Balanced Capacity: High completion yield'}
            </span>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="flex-1">{errorMsg}</p>
          </div>
        )}

        {/* Primary Action Button */}
        <div>
          <button
            type="button"
            onClick={handleAnalyzeProductivity}
            disabled={isGenerating}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{generationStep || 'Auditing 3-column tasks with Google Maps...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Analyze 3-Column Tasks & Calculate Time Schedule</span>
                <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results View */}
      {planResult && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
          {/* Result Header & Actions */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  3-Column Task & Time Optimization Ready
                </span>
                <span className="text-[11px] text-slate-300 bg-white/10 px-2 py-0.5 rounded-full font-medium">
                  {planResult.model}
                </span>
                {planResult.isQuotaFallback && (
                  <span className="text-[10px] text-amber-300 bg-amber-500/20 border border-amber-400/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    Offline-Resilient Engine
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-1 line-clamp-1">
                {origin} ➔ {destination} ({calculatedSchedule.startTimeStr} – {calculatedSchedule.arrivalTimeStr})
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={getGoogleMapsDirectionsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navigate in Google Maps</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>

              <button
                type="button"
                onClick={handleCopyPlan}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/10"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Quick Workspace Sync Bar */}
          <div className="bg-indigo-50/70 p-3 sm:p-4 border-b border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <span className="text-xs text-indigo-950 font-bold">
              Sync this optimized schedule with your workspace:
            </span>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <button
                type="button"
                onClick={handleImportToTimetable}
                disabled={timetableImported}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-50 text-indigo-800 text-xs font-bold border border-indigo-200 transition-all shadow-2xs disabled:opacity-60"
              >
                <CalendarPlus className="w-3.5 h-3.5 text-indigo-600" />
                <span>{timetableImported ? 'Added to Timetable ✓' : 'Add Schedule to Timetable'}</span>
              </button>

              <button
                type="button"
                onClick={handleImportCommuteTasks}
                disabled={tasksImported}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-50 text-indigo-800 text-xs font-bold border border-indigo-200 transition-all shadow-2xs disabled:opacity-60"
              >
                <ListPlus className="w-3.5 h-3.5 text-indigo-600" />
                <span>{tasksImported ? 'Added to Columns ✓' : 'Add Strategy Tasks to Columns'}</span>
              </button>
            </div>
          </div>

          {/* Quota Optimization Notice */}
          {planResult.isQuotaFallback && (
            <div className="bg-amber-50/80 border-b border-amber-200/80 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>High-Precision Offline Mode:</strong> Schedule & 3-column task time distribution calculated via the built-in precision engine (Gemini API quota rate-limit active). To enable dynamic live Google Maps grounding, check your plan in <strong>Settings &gt; Secrets</strong>.
                </span>
              </div>
            </div>
          )}

          {/* Grounded Google Maps Places (if available) */}
          {planResult.groundingChunks && planResult.groundingChunks.length > 0 && (
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Verified Google Maps Places & Reviews
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {planResult.groundingChunks.map((chunk, idx) => {
                  const mapData = chunk.maps;
                  const webData = chunk.web;
                  const uri = mapData?.uri || webData?.uri;
                  const title = mapData?.title || webData?.title || `Place ${idx + 1}`;
                  const reviews = mapData?.placeAnswerSources?.reviewSnippets;

                  if (!uri && !title) return null;

                  return (
                    <a
                      key={idx}
                      href={uri || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-2xs transition-all block group"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 line-clamp-1">
                          {title}
                        </div>
                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                      </div>
                      {reviews && reviews.length > 0 && reviews[0].reviewText && (
                        <p className="text-[11px] text-slate-500 mt-1 italic line-clamp-2">
                          "{reviews[0].reviewText}"
                        </p>
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Analysis Markdown Content */}
          <div className="p-4 sm:p-6">
            <div className="markdown-body prose prose-slate max-w-none text-slate-800 text-xs sm:text-sm leading-relaxed">
              <Markdown>{planResult.text}</Markdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
