const API_BASE = '/api';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export const api = {
  auth: {
    login: (usernameOrEmail: string, password: string) =>
      fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail, password }),
      }),
    register: (userData: any) =>
      fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    logout: () =>
      fetchAPI('/auth/logout', { method: 'POST' }),
    me: () =>
      fetchAPI('/auth/me'),
  },

  users: {
    getAll: () => fetchAPI('/users'),
    getPending: () => fetchAPI('/users/pending'),
    approve: (id: string, role: string) =>
      fetchAPI(`/users/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ role }),
      }),
    reject: (id: string) =>
      fetchAPI(`/users/${id}/reject`, { method: 'DELETE' }),
    update: (id: string, updates: any) =>
      fetchAPI(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    remove: (id: string) =>
      fetchAPI(`/users/${id}`, { method: 'DELETE' }),
  },

  inventory: {
    getAll: () => fetchAPI('/inventory'),
    create: (data: any) =>
      fetchAPI('/inventory', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, updates: any) =>
      fetchAPI(`/inventory/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    delete: (id: string) =>
      fetchAPI(`/inventory/${id}`, { method: 'DELETE' }),
  },

  equipment: {
    getAll: () => fetchAPI('/equipment'),
    create: (data: any) =>
      fetchAPI('/equipment', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, updates: any) =>
      fetchAPI(`/equipment/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    delete: (id: string) =>
      fetchAPI(`/equipment/${id}`, { method: 'DELETE' }),
  },

  checklists: {
    getByType: (listType?: string) =>
      fetchAPI(`/checklists${listType ? `?listType=${listType}` : ''}`),
    create: (data: any) =>
      fetchAPI('/checklists', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, updates: any) =>
      fetchAPI(`/checklists/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    delete: (id: string) =>
      fetchAPI(`/checklists/${id}`, { method: 'DELETE' }),
  },

  tasks: {
    getAll: () => fetchAPI('/tasks'),
    create: (data: any) =>
      fetchAPI('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, updates: any) =>
      fetchAPI(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    delete: (id: string) =>
      fetchAPI(`/tasks/${id}`, { method: 'DELETE' }),
    complete: (id: string, photo: string) =>
      fetchAPI(`/tasks/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ photo }),
      }),
    getCompletions: (id: string) =>
      fetchAPI(`/tasks/${id}/completions`),
  },

  chat: {
    getAll: () => fetchAPI('/chat'),
    send: (data: any) =>
      fetchAPI('/chat', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  timeline: {
    getAll: () => fetchAPI('/timeline'),
    create: (data: any) =>
      fetchAPI('/timeline', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  menu: {
    getAll: () => fetchAPI('/menu'),
    create: (data: any) =>
      fetchAPI('/menu', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchAPI(`/menu/${id}`, { method: 'DELETE' }),
    getIngredients: (id: string) =>
      fetchAPI(`/menu/${id}/ingredients`),
    addIngredient: (id: string, data: any) =>
      fetchAPI(`/menu/${id}/ingredients`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateIngredient: (id: string, data: any) =>
      fetchAPI(`/ingredients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deleteIngredient: (id: string) =>
      fetchAPI(`/ingredients/${id}`, { method: 'DELETE' }),
  },

  notifications: {
    getAll: () => fetchAPI('/notifications'),
    getCount: () => fetchAPI('/notifications/count'),
    markAsRead: (id: string) =>
      fetchAPI(`/notifications/${id}/read`, { method: 'POST' }),
    markAllAsRead: () =>
      fetchAPI('/notifications/read-all', { method: 'POST' }),
  },

  admin: {
    createUser: (data: any) =>
      fetchAPI('/users/create', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
