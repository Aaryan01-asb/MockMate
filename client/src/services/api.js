const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

async function parseResponse(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed with status ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function checkHealth() {
  const res = await fetch(`${API_URL}/api/health`);
  return parseResponse(res);
}

export async function uploadResume(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_URL}/api/resume`, {
    method: 'POST',
    body: formData,
  });
  return parseResponse(res);
}

export async function getOpeningQuestion({ resumeText, category, tags, durationMin }) {
  const res = await fetch(`${API_URL}/api/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText, category, tags, durationMin }),
  });
  return parseResponse(res);
}

export async function evaluateTurn(payload) {
  const res = await fetch(`${API_URL}/api/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function saveSession(payload) {
  const res = await fetch(`${API_URL}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function getSession(sessionId) {
  const res = await fetch(`${API_URL}/api/sessions/${encodeURIComponent(sessionId)}`);
  return parseResponse(res);
}
