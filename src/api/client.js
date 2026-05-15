const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4200/api'

export function getToken() {
  return localStorage.getItem('codeshelf_token')
}

export function setToken(token) {
  if (token) localStorage.setItem('codeshelf_token', token)
  else localStorage.removeItem('codeshelf_token')
}

export async function api(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Something went wrong.')
  return data
}

export const authApi = {
  login: (payload) => api('/auth/login', { method: 'POST', body: payload }),
  signup: (payload) => api('/auth/signup', { method: 'POST', body: payload }),
  me: () => api('/auth/me'),
}

export const notesApi = {
  list: (params = {}) => api(`/notes${toQuery(params)}`),
  get: (id) => api(`/notes/${id}`),
  create: (payload) => api('/notes', { method: 'POST', body: payload }),
  update: (id, payload) => api(`/notes/${id}`, { method: 'PUT', body: payload }),
  remove: (id) => api(`/notes/${id}`, { method: 'DELETE' }),
  like: (id) => api(`/notes/${id}/like`, { method: 'POST' }),
  share: (id, payload) => api(`/notes/${id}/share`, { method: 'POST', body: payload }),
}

export const groupsApi = {
  list: () => api('/groups'),
  create: (payload) => api('/groups', { method: 'POST', body: payload }),
  addMember: (groupId, payload) => api(`/groups/${groupId}/members`, { method: 'POST', body: payload }),
  addNote: (groupId, payload) => api(`/groups/${groupId}/notes`, { method: 'POST', body: payload }),
}

export const assistApi = {
  summarize: (payload) => api('/assist/summarize', { method: 'POST', body: payload }),
  concept: (payload) => api('/assist/concept', { method: 'POST', body: payload }),
}

export const dashboardApi = {
  get: () => api('/dashboard'),
}

export const leetcodeApi = {
  profile: (username) => api(`/leetcode/profile?username=${encodeURIComponent(username)}`),
  connect: (payload) => api('/leetcode/connect', { method: 'POST', body: payload }),
  sync: (payload) => api('/leetcode/sync', { method: 'POST', body: payload }),
  publishSolution: (payload) => api('/leetcode/solution', { method: 'POST', body: payload }),
}

function toQuery(params) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}
