const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  timestamp: string;
  formattedDate: string;
}

export interface GuestbookResponse {
  entries: GuestbookEntry[];
  visitorCount: number;
}

export interface VisitResponse {
  visitorCount: number;
}

export interface SubmitResponse {
  success: boolean;
  entry: GuestbookEntry;
}

// Get all guestbook entries and current visitor count
export async function getGuestbookEntries(): Promise<GuestbookResponse> {
  const response = await fetch(`${API_BASE}/api/guestbook`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch guestbook entries');
  }

  return response.json();
}

// Record a visit and get updated visitor count
export async function recordVisit(): Promise<VisitResponse> {
  const response = await fetch(`${API_BASE}/api/guestbook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'visit' }),
  });

  if (!response.ok) {
    throw new Error('Failed to record visit');
  }

  return response.json();
}

// Submit a new guestbook entry
export async function submitGuestbookEntry(
  name: string,
  message: string
): Promise<SubmitResponse> {
  const response = await fetch(`${API_BASE}/api/guestbook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, message }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit entry');
  }

  return response.json();
}
