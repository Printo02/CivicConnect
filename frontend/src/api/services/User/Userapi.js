const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

export const getToken = () => localStorage.getItem('cc_access');
export const clearAuth = () => {
  localStorage.removeItem('cc_access');
  localStorage.removeItem('cc_refresh');
  localStorage.removeItem('cc_role');
  localStorage.removeItem('cc_name');
};

async function request(path, options = {}) {
  const { body, headers = {}, ...rest } = options;
  const token = getToken();
  const finalHeaders = { ...headers };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });

  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!response.ok) {
    const message = data?.detail || data?.message || data?.error ||
      (typeof data === 'object' ? Object.values(data).flat().join(' ') : data) ||
      `Request failed (${response.status})`;
    const error = new Error(String(message));
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  register: (payload) => request('/register/', { method:'POST', body:payload }),
  login: (payload) => request('/login/', { method:'POST', body:payload }),

  profile: () => request('/user/profile/'),
  updateProfile: (payload) => request('/user/profile/', { method:'PATCH', body:payload }),
  changePassword: (payload) => request('/user/change-password/', { method:'POST', body:payload }),

  nearby: ({ lat, lng, radius_km = 15 }) =>
    request(`/nearby/?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius_km=${radius_km}`),

  categories: () => request('/complaint-categories/'),
  createComplaint: (payload) => request('/complaints/', { method:'POST', body:payload }),
  myComplaints: () => request('/complaints/my/'),
  nearbyComplaints: ({ lat, lng, radius_km = 5 }) =>
    request(`/complaints/nearby/?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius_km=${radius_km}`),
  complaintDetail: (id) => request(`/complaints/${id}/detail/`),

  uploadAttachment: (id, formData) =>
    request(`/complaints/${id}/attachments/upload/`, { method:'POST', body:formData }),
  attachments: (id) => request(`/complaints/${id}/attachments/`),

  support: (complaintId) =>
    request('/complaints/like/', { method:'POST', body:{ complaint:complaintId } }),
  unsupport: (complaintId) =>
    request(`/complaints/${complaintId}/unlike/`, { method:'DELETE' }),

  translateText: (payload) => request('/translate/', { method:'POST', body:payload }),
  translateComplaint: (id) =>
    request(`/complaints/${id}/translate/`, { method:'POST', body:{} }),

  uploadVoice: (id, audioBlob, language='ml') => {
    const form = new FormData();
    const extension = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
    form.append('audio_file', audioBlob, `civicconnect-voice.${extension}`);
    form.append('voice_language', language);
    return request(`/complaints/${id}/voice-upload/`, { method:'POST', body:form });
  },
  voiceStatus: (id) => request(`/complaints/${id}/voice-status/`),

  escalate: (payload) => request('/complaints/escalate/', { method:'POST', body:payload }),
  escalations: (id) => request(`/complaints/${id}/escalations/`),
  feedback: (payload) => request('/complaints/feedback/', { method:'POST', body:payload }),
};

export default api;
