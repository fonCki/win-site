// Analytics service for win.ridao.ar
// Fire-and-forget logging to DynamoDB via Lambda

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const LOG_API_URL = `${API_BASE}/api/log`;
const IP_API_URL = import.meta.env.VITE_IP_API_URL || 'https://api.ipify.org?format=json';

// Cache IP in sessionStorage to avoid repeated API calls
let cachedIP: string | null = null;
let sessionId: string | null = null;

// Generate a unique session ID
const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Get or create session ID
export const getSessionId = (): string => {
  if (!sessionId) {
    sessionId = sessionStorage.getItem('win95-session-id');
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem('win95-session-id', sessionId);
    }
  }
  return sessionId;
};

// Get user's IP address (cached)
export const getIP = async (): Promise<string> => {
  if (cachedIP) return cachedIP;

  const stored = sessionStorage.getItem('win95-user-ip');
  if (stored) {
    cachedIP = stored;
    return stored;
  }

  try {
    const response = await fetch(IP_API_URL);
    const data = await response.json();
    cachedIP = data.ip;
    sessionStorage.setItem('win95-user-ip', data.ip);
    return data.ip;
  } catch {
    return 'unknown';
  }
};

// Fire-and-forget log function (non-blocking)
const logEvent = async (event: Record<string, unknown>): Promise<void> => {
  try {
    const ip = await getIP();
    fetch(LOG_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...event, ip, sessionId: getSessionId() }),
    }).catch(() => {}); // Silently fail - don't block UI
  } catch {
    // Silently fail
  }
};

// Log visit event (on page load)
export const logVisit = async (): Promise<void> => {
  const ip = await getIP();
  logEvent({
    type: 'win-visit',
    userAgent: navigator.userAgent,
    referrer: document.referrer || 'direct',
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  });
};

// Log click event (desktop icons, menu items, buttons)
export const logClick = (element: string, target?: string): void => {
  logEvent({
    type: 'win-click',
    element,
    target,
  });
};

// Log window action (open, close, minimize, maximize)
export const logWindowAction = (action: string, appName: string): void => {
  logEvent({
    type: 'win-window',
    action,
    appName,
  });
};

// Log chat message
export const logChat = (userMessage: string, botResponse: string): void => {
  logEvent({
    type: 'win-chat',
    userMessage,
    botResponse,
  });
};

// Log CV interaction
export const logCVAction = (action: string, pageNumber?: number): void => {
  logEvent({
    type: 'win-cv',
    action,
    pageNumber,
  });
};

// Log session end (call on beforeunload)
export const logSessionEnd = (durationMs: number): void => {
  const ip = cachedIP || 'unknown';
  // Use sendBeacon for reliable delivery on page unload
  const data = JSON.stringify({
    type: 'win-session',
    ip,
    sessionId: getSessionId(),
    durationMs,
    durationFormatted: formatDuration(durationMs),
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(LOG_API_URL, data);
  } else {
    // Fallback for older browsers
    fetch(LOG_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data,
      keepalive: true,
    }).catch(() => {});
  }
};

// Format duration in human-readable format
const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};
