import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in the environment.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Time calculation helpers for deterministic fallback
function parseTime(timeStr: string): { hours: number; minutes: number } {
  let hours = 8;
  let minutes = 30;
  const clean = (timeStr || '').trim();
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

function formatMinutes(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  const meridiem = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : `${m}`;
  return `${displayH}:${displayM} ${meridiem}`;
}

// Built-in Deterministic Productivity & Commute Engine
// Guarantees zero downtime if Gemini API quota is rate-limited (429)
function generateDeterministicProductivityPlan(params: {
  origin: string;
  stops: any[];
  destination: string;
  travelMode: string;
  workStyle: string;
  departureTime: string;
  trafficTolerance: string;
  tasks: any[];
}): string {
  const {
    origin,
    stops = [],
    destination,
    travelMode = 'driving',
    workStyle = 'resilient',
    departureTime = '08:30 AM',
    trafficTolerance = 'moderate',
    tasks = [],
  } = params;

  const { hours, minutes } = parseTime(departureTime);
  const startMinutes = hours * 60 + minutes;

  // Base speed estimates per leg
  const baseLeg =
    travelMode === 'walking'
      ? 50
      : travelMode === 'bicycling'
      ? 28
      : travelMode === 'transit'
      ? 35
      : 24; // driving

  const bufferPct = trafficTolerance === 'tight' ? 0.1 : trafficTolerance === 'defensive' ? 0.35 : 0.2;
  const legBuffer = Math.round(baseLeg * bufferPct);
  const totalSingleLeg = baseLeg + legBuffer;

  const validStops = stops.filter((s: any) => s.location && s.location.trim().length > 0);
  const totalLegs = validStops.length + 1;
  const totalTransitMinutes = totalLegs * totalSingleLeg;
  const totalStopsDuration = validStops.reduce((sum: number, s: any) => sum + (s.durationMinutes || 25), 0);
  const totalJourneyMinutes = totalTransitMinutes + totalStopsDuration;
  const arrivalMinutes = startMinutes + totalJourneyMinutes;

  const startTimeStr = formatMinutes(startMinutes);
  const arrivalTimeStr = formatMinutes(arrivalMinutes);

  // Group tasks
  const needTasks = tasks.filter((t: any) => t.columnId === 'need');
  const shouldTasks = tasks.filter((t: any) => t.columnId === 'should');
  const canTasks = tasks.filter((t: any) => t.columnId === 'can');

  const totalNeedMins = needTasks.reduce((s: number, t: any) => s + (t.estimatedMinutes || 25), 0);
  const totalShouldMins = shouldTasks.reduce((s: number, t: any) => s + (t.estimatedMinutes || 25), 0);
  const totalCanMins = canTasks.reduce((s: number, t: any) => s + (t.estimatedMinutes || 25), 0);

  const needTaskList = needTasks.length > 0
    ? needTasks.map((t: any) => `  - **${t.title}** (~${t.estimatedMinutes || 25} mins)`).join('\n')
    : '  - *No specific Need tasks active on board. Protect destination arrival milestone as prime focus.*';

  const shouldTaskList = shouldTasks.length > 0
    ? shouldTasks.map((t: any) => `  - **${t.title}** (~${t.estimatedMinutes || 25} mins)`).join('\n')
    : '  - *No Should tasks pending.*';

  const canTaskList = canTasks.length > 0
    ? canTasks.map((t: any) => `  - **${t.title}** (~${t.estimatedMinutes || 25} mins)`).join('\n')
    : '  - *No Can tasks pending.*';

  const workStyleAdvice =
    workStyle === 'handsfree'
      ? 'Voice-first protocol: Utilize hands-free audio recording and speech dictation during travel legs to draft messages without physical screen interaction.'
      : workStyle === 'mobile_transit'
      ? 'Transit reader mode: Leverage smooth commuter legs for passive review, document audit, and low-friction triage on mobile.'
      : workStyle === 'stationary_stops'
      ? 'Stationary deep sprints: Reserve heavy cognitive synthesis exclusively for dedicated coffee/hub stops; keep transit legs pure low-stress transition.'
      : 'Smart hybrid mode: Dynamically shift from audio triage while in motion to concentrated deep sprints during intermediate stops.';

  return `### ⏱️ Calculated Times & Transit Schedule
- **Starting Place Departure:** **${startTimeStr}** at **${origin}**
- **Calculated Transit Duration:** **${totalTransitMinutes} mins** total across ${totalLegs} leg(s) (${travelMode} mode with **+${Math.round(bufferPct * 100)}%** ${trafficTolerance} traffic buffer)
- **Intermediate Stop Windows:** **${totalStopsDuration} mins** allocated across ${validStops.length} stop(s)
- **Calculated Destination Arrival Time:** **${arrivalTimeStr}** at **${destination}**
- **Total Productivity & Journey Window:** **${totalJourneyMinutes} mins** (${startTimeStr} ➔ ${arrivalTimeStr})
- **Primary Corridor Strategy:** Main arterial transit route optimized for minimal choke-point exposure and maximum schedule predictability.

---

### 📊 3-Column Task Time & Feasibility Analysis

#### 🔴 Need To Do Execution Strategy (${needTasks.length} task${needTasks.length === 1 ? '' : 's'}, ${totalNeedMins} mins)
${needTaskList}
- **Optimal Time Allocation:** Execute the highest-friction Need task either **pre-departure** (${startTimeStr}) or immediately in the first **30-minute high-focus block** upon arrival at ${destination} (${arrivalTimeStr}).
- **Cognitive Guardrail:** Do not attempt split-attention execution of complex Need deliverables during moving transit. Dedicate intermediate stops or the destination desk to lock in uninterrupted flow.

#### 🟡 Should Do Batching & Optimization (${shouldTasks.length} task${shouldTasks.length === 1 ? '' : 's'}, ${totalShouldMins} mins)
${shouldTaskList}
- **Optimal Transition Windows:** Batch Should tasks into single 20–25 minute sprints immediately following an intermediate stop or during stationary layovers.
- **Workflow Synergy:** ${workStyleAdvice}

#### 🟢 Can Do Transit Alignment & Buffer Utility (${canTasks.length} task${canTasks.length === 1 ? '' : 's'}, ${totalCanMins} mins)
${canTaskList}
- **Low-Stakes Opportunistic Wins:** Use travel legs for asynchronous voice notes, reading drafts, or brief administrative sorting.
- **Traffic Shock Absorber:** If transit encounters heavy congestion, immediately defer Can Do items. These tasks exist as discretionary shock buffers to absorb delays without sacrificing Need deliverables.

---

### 🧠 Time Management & Productivity Acceleration
- **Parkinson's Law Time-Boxing:** Your calculated arrival time of **${arrivalTimeStr}** serves as a hard deadline. Structure pre-departure work to finish 10 minutes prior to ${startTimeStr}, creating natural urgency that eliminates procrastination.
- **Cognitive Energy Allocation:** Front-load high-demand analytical thinking before leaving or at intermediate focus stops; utilize transit time for passive consumption or mental decompression so you arrive at ${destination} sharp and alert.
- **Estimated Time Saved:** By orchestrating task columns around calculated transit legs, you capture approximately **${Math.round(totalJourneyMinutes * 0.45)} minutes of reclaimed productivity** that would otherwise be lost to idle commuting.

---

### 🛡️ Traffic Delay Contingency Rules
- **If delayed +15 mins:** Automatically absorb the delay into the +${Math.round(bufferPct * 100)}% traffic buffer. Shift Should tasks back by 15 minutes while leaving 🔴 Need deliverables untouched.
- **If delayed +30+ mins:** Immediately pause all 🟢 Can Do tasks and shorten intermediate stop stay to minimum essential sprint. Notify destination contacts with your revised ETA.

---

### 🎒 Actionable 3-Point Pre-Departure Checklist
- [ ] **Lock In Primary Need:** Finalize prerequisite files or offline assets at ${origin} before departure.
- [ ] **Set Mobile Focus State:** Configure phone to ${workStyle === 'handsfree' ? 'Do Not Disturb / Audio Dictation' : 'Work Focus mode'} for seamless travel.
- [ ] **Check Real-Time Navigation:** Confirm live traffic on Google Maps and departure prompt at ${startTimeStr}.`;
}

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString()
  });
});

// Travel & Commute Workflow Planning Endpoint with Google Maps Grounding
app.post('/api/travel-plan', async (req, res) => {
  try {
    const {
      origin,
      stops = [],
      destination,
      travelMode = 'driving',
      workStyle = 'resilient',
      departureTime = '08:30 AM',
      trafficTolerance = 'moderate',
      tasks = [],
      userLocation,
    } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Origin and destination are required to calculate a commute workflow.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(401).json({
        error: 'API_KEY_REQUIRED',
        message: 'Gemini API key is required. Please provide GEMINI_API_KEY in the environment or Settings > Secrets.',
      });
    }

    const ai = getGeminiClient();

    // Construct detailed prompt for Maps Grounding and traffic resilience
    const formattedStops = stops && stops.length > 0
      ? stops.map((s: any, idx: number) => `Stop ${idx + 1}: ${s.location} (Stay duration: ${s.durationMinutes || 30} mins${s.purpose ? `, Purpose: ${s.purpose}` : ''})`).join('\n')
      : 'None (Direct route with transit buffers)';

    const formattedTasks = tasks && tasks.length > 0
      ? tasks.map((t: any) => `- [${(t.columnId || 'TASK').toUpperCase()}] ${t.title} (~${t.estimatedMinutes || 25} mins)`).join('\n')
      : '- [NEED] Review daily priorities and agenda\n- [SHOULD] Respond to high-priority messages and client follow-ups\n- [CAN] Listen to strategic audio recap or brainstorm future concepts';

    // Separate tasks by the 3 columns for focused analysis
    const needTasks = tasks?.filter((t: any) => t.columnId === 'need') || [];
    const shouldTasks = tasks?.filter((t: any) => t.columnId === 'should') || [];
    const canTasks = tasks?.filter((t: any) => t.columnId === 'can') || [];

    const formatTaskList = (list: any[], defaultMsg: string) => {
      if (!list || list.length === 0) return defaultMsg;
      return list.map((t: any) => `  • ${t.title} (~${t.estimatedMinutes || 25} mins)`).join('\n');
    };

    const formattedNeedTasks = formatTaskList(needTasks, '  • No specific Need tasks entered (treat core deliverables as priority)');
    const formattedShouldTasks = formatTaskList(shouldTasks, '  • No specific Should tasks entered');
    const formattedCanTasks = formatTaskList(canTasks, '  • No specific Can tasks entered');

    const prompt = `You are an elite Time Management & Task Productivity Strategist integrated with real Google Maps routing data for the "Now or Never" workflow system.

YOUR PRIMARY MISSION:
Instead of just generating a generic travel itinerary, you must deeply ANALYZE the user's tasks across the 3 COLUMNS (Need to do, Should do, Can do) and help them MANAGE THEIR TIME MORE EFFECTIVELY.
Use the real-time Google Maps route data between the Starting Place and Final Destination to calculate exact times, allocate cognitive energy, and maximize overall productivity.

ROUTE & MAP DETAILS (From Google Maps):
• Starting Place: ${origin}
• Intermediate Stops:
${formattedStops}
• Final Destination: ${destination}
• Primary Travel Mode: ${travelMode}
• Work Style Mode: ${workStyle} (handsfree audio/voice notes, mobile transit focus, stationary work at stops, or resilient hybrid)
• Starting Departure Time: ${departureTime}
• Traffic Buffer Tolerance: ${trafficTolerance} (+10% tight, +20% moderate, +35% defensive)

USER'S ENTERED TASKS IN 3 COLUMNS:
🔴 1. NEED TO DO (Critical / High Stakes / Non-Negotiable):
${formattedNeedTasks}

🟡 2. SHOULD DO (Important / High-Value):
${formattedShouldTasks}

🟢 3. CAN DO (Discretionary / Low-Stakes / Quick Wins):
${formattedCanTasks}

MANDATORY RESPONSE FORMAT (Strictly format as structured Markdown):

### ⏱️ Calculated Times & Transit Schedule
- **Starting Place Departure:** ${departureTime} at **${origin}**
- **Calculated Transit Duration:** [Accurate travel time between Starting Place and Destination via Google Maps with ${trafficTolerance} buffer]
- **Calculated Destination Arrival Time:** [Compute and state the exact calculated time user will arrive at ${destination}, accounting for all legs and stops]
- **Total Productivity & Travel Window:** [Sum of travel duration + stop durations]
- **Primary Transit Corridors:** [Highways, transit lines, or primary avenues identified via Google Maps]

### 📊 3-Column Task Time & Feasibility Analysis
Analyze each column in direct relation to the journey and time constraints:
- **🔴 Need To Do Execution Strategy:**
  - Audit the entered Need tasks against available high-focus blocks (e.g. pre-departure at starting place, intermediate stop sprint, or immediately post-arrival at destination).
  - Explicitly assign which Need tasks should be tackled when and where to guarantee completion without burnout.
- **🟡 Should Do Batching & Optimization:**
  - Where do Should tasks fit into transition gaps, transit legs, or second-wave focus blocks?
  - Recommended batching strategy to prevent them from slipping into tomorrow.
- **🟢 Can Do Transit Alignment & Buffer Utility:**
  - Identify which Can Do tasks can be turned into quick transit wins (e.g. voice memos, audio review, quick phone check) during the journey.
  - Designate which Can Do tasks act as "shock buffers" that can be safely paused if traffic delays occur.

### 🧠 Time Management & Productivity Acceleration
- **Parkinson's Law Time-Boxing:** How to use the calculated arrival time at ${destination} as a non-negotiable deadline to boost task speed.
- **Cognitive Energy Allocation:** When to spend high-focus mental bandwidth vs. when to switch to low-friction or resting modes to avoid mental fatigue before reaching the destination.
- **Estimated Time Saved:** Concrete estimation of minutes saved by orchestrating these tasks alongside the commute.

### 🛡️ Traffic Delay Contingency Rules
- **If delayed +15 mins:** [Tactical adjustment to protect Need tasks]
- **If delayed +30+ mins:** [Defensive triage: specific Can Do item dropped or converted to voice to preserve Need deliverables]

### 🎒 Actionable 3-Point Pre-Departure Checklist
- [ ] [Specific preparation at starting place before heading out]
- [ ] [Task asset / document preloaded for the journey]
- [ ] [Navigation & audio/hands-free setup checked]

Ensure the tone is direct, analytical, highly actionable, and focused on maximizing the user's time and productivity.`;

    // Multi-tier model and tool fallback strategy
    // Tier 1: gemini-3.8-flash with Google Maps Grounding
    // Tier 2: gemini-3.1-flash-lite with Google Maps Grounding
    // Tier 3: gemini-3.8-flash without tools (for grounding quota limits)
    // Tier 4: gemini-3.1-flash-lite without tools
    // Tier 5: Built-in deterministic productivity engine (100% reliability for 429 quota exhaustion)
    let result: any = null;
    let chosenModel = '';
    let lastErr: any = null;
    let isQuotaFallback = false;

    // 1. Try with Google Maps tool on approved models
    const mapsCandidates = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    for (const modelName of mapsCandidates) {
      try {
        const config: any = {
          tools: [{ googleMaps: {} }],
        };

        if (userLocation?.latitude && userLocation?.longitude) {
          config.toolConfig = {
            retrievalConfig: {
              latLng: {
                latitude: Number(userLocation.latitude),
                longitude: Number(userLocation.longitude),
              },
            },
          };
        }

        result = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config,
        });

        chosenModel = `${modelName} (Google Maps Grounded)`;
        break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`[Travel Planner] ${modelName} with Maps tool call failed:`, err?.message || err);
      }
    }

    // 2. If maps tool failed (often due to tool-specific quota or 429), try pure generative text
    if (!result) {
      const textCandidates = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
      for (const modelName of textCandidates) {
        try {
          result = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
          });

          chosenModel = modelName;
          break;
        } catch (err: any) {
          lastErr = err;
          console.warn(`[Travel Planner] ${modelName} pure text call failed:`, err?.message || err);
        }
      }
    }

    // 3. If all Gemini calls failed due to 429 RESOURCE_EXHAUSTED or API issues, activate the built-in deterministic engine
    if (!result) {
      console.warn('[Travel Planner] All Gemini model attempts encountered quota or network limits. Engaging deterministic productivity calculation engine.');
      isQuotaFallback = true;
      const fallbackText = generateDeterministicProductivityPlan({
        origin,
        stops,
        destination,
        travelMode,
        workStyle,
        departureTime,
        trafficTolerance,
        tasks,
      });

      return res.json({
        success: true,
        model: 'Now or Never Productivity Engine (Active Quota Fallback)',
        text: fallbackText,
        groundingChunks: [],
        webSearchQueries: [],
        isQuotaFallback: true,
      });
    }

    const candidate = result.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;
    const groundingChunks = groundingMetadata?.groundingChunks || [];
    const webSearchQueries = groundingMetadata?.webSearchQueries || [];

    return res.json({
      success: true,
      model: chosenModel,
      text: result.text || 'Commute workflow generated successfully.',
      groundingChunks,
      webSearchQueries,
      isQuotaFallback: false,
    });
  } catch (error: any) {
    console.error('Error generating travel plan:', error);
    // Even on uncaught errors, provide the deterministic productivity plan so the user is never stranded
    try {
      const fallbackText = generateDeterministicProductivityPlan({
        origin: req.body?.origin || 'Starting Place',
        stops: req.body?.stops || [],
        destination: req.body?.destination || 'Destination',
        travelMode: req.body?.travelMode || 'driving',
        workStyle: req.body?.workStyle || 'resilient',
        departureTime: req.body?.departureTime || '08:30 AM',
        trafficTolerance: req.body?.trafficTolerance || 'moderate',
        tasks: req.body?.tasks || [],
      });

      return res.json({
        success: true,
        model: 'Now or Never Productivity Engine (Emergency Fallback)',
        text: fallbackText,
        groundingChunks: [],
        webSearchQueries: [],
        isQuotaFallback: true,
      });
    } catch {
      return res.status(500).json({
        error: 'GENERATION_ERROR',
        message: error?.message || 'Failed to generate traffic-proof travel plan.',
      });
    }
  }
});


// Cloud Sync Endpoints (Vercel KV)
app.post('/api/sync/push', async (req, res) => {
  try {
    const { syncCode, data } = req.body;
    if (!syncCode || !data) {
      return res.status(400).json({ error: 'Missing syncCode or data' });
    }

    const { kv } = await import('@vercel/kv');
    
    // Check if KV is configured
    if (!process.env.KV_REST_API_URL) {
       return res.status(500).json({ 
         error: 'Vercel KV not configured', 
         message: 'Please enable Vercel KV in your Vercel project dashboard.' 
       });
    }

    // Save payload to Redis (expires in 30 days to save space)
    await kv.set(`sync:${syncCode.toUpperCase()}`, data, { ex: 60 * 60 * 24 * 30 });
    return res.json({ success: true });
  } catch (err: any) {
    console.error('Push Sync Error:', err);
    return res.status(500).json({ error: 'Sync failed', message: err?.message });
  }
});

app.get('/api/sync/pull', async (req, res) => {
  try {
    const syncCode = req.query.code as string;
    if (!syncCode) {
      return res.status(400).json({ error: 'Missing sync code' });
    }

    const { kv } = await import('@vercel/kv');

    if (!process.env.KV_REST_API_URL) {
      return res.status(500).json({ 
        error: 'Vercel KV not configured', 
        message: 'Please enable Vercel KV in your Vercel project dashboard.' 
      });
    }

    const data = await kv.get(`sync:${syncCode.toUpperCase()}`);
    return res.json({ success: true, data: data || null });
  } catch (err: any) {
    console.error('Pull Sync Error:', err);
    return res.status(500).json({ error: 'Sync failed', message: err?.message });
  }
});

// Vite middleware setup
async function start() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

start();

export default app;
