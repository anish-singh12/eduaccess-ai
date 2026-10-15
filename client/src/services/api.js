/**
 * Centralized API Client for EduAccess AI Platform
 * Supports HttpOnly cookie authentication with Bearer token fallback.
 */

const API_BASE_URL = '/api';

/**
 * Enhanced fetch wrapper that handles JSON serialization,
 * error extraction, and authentication headers.
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Accept': 'application/json',
    ...options.headers
  };

  // Attach token from localStorage if present (bearer fallback)
  const token = localStorage.getItem('eduaccess_token');
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Auto-set Content-Type for non-FormData bodies
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
    credentials: 'include' // Send and receive HttpOnly cookies
  };

  try {
    const response = await fetch(url, config);

    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true };
    }

    const data = await response.json().catch(() => ({
      success: false,
      error: { code: 'INVALID_JSON_RESPONSE', message: 'Server returned a non-JSON response.' }
    }));

    if (!response.ok) {
      const error = new Error(data.error?.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.code = data.error?.code || 'API_ERROR';
      error.details = data.error?.details || [];
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      const netError = new Error('Cannot connect to the server. Please check your internet connection or verify the backend is running.');
      netError.code = 'NETWORK_ERROR';
      throw netError;
    }
    throw err;
  }
}

export const api = {
  // System Health
  system: {
    getHealth: () => apiFetch('/health')
  },

  // Authentication & Profile
  auth: {
    register: (credentials) => apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
    login: (credentials) => apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
    logout: () => apiFetch('/auth/logout', { method: 'POST' }),
    getMe: () => apiFetch('/auth/me'),
    updateProfile: (profileData) => apiFetch('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    }),
    deleteAccount: (password) => apiFetch('/auth/account', {
      method: 'DELETE',
      body: JSON.stringify({ password })
    })
  },

  // Study Notes Documents
  documents: {
    list: (params = {}) => {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.set('search', params.search);
      if (params.sort) searchParams.set('sort', params.sort);
      if (params.order) searchParams.set('order', params.order);
      const queryString = searchParams.toString();
      return apiFetch(`/documents${queryString ? `?${queryString}` : ''}`);
    },
    getById: (id) => apiFetch(`/documents/${id}`),
    create: (docData) => apiFetch('/documents', {
      method: 'POST',
      body: JSON.stringify(docData)
    }),
    update: (id, docData) => apiFetch(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(docData)
    }),
    delete: (id) => apiFetch(`/documents/${id}`, { method: 'DELETE' }),
    uploadPdf: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiFetch('/documents/upload-pdf', {
        method: 'POST',
        body: formData
      });
    }
  },

  // Concept Maps
  conceptMaps: {
    list: () => apiFetch('/concept-maps'),
    getById: (id) => apiFetch(`/concept-maps/${id}`),
    create: (mapData) => apiFetch('/concept-maps', {
      method: 'POST',
      body: JSON.stringify(mapData)
    }),
    update: (id, mapData) => apiFetch(`/concept-maps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mapData)
    }),
    delete: (id) => apiFetch(`/concept-maps/${id}`, { method: 'DELETE' })
  },

  // Quizzes
  quizzes: {
    list: () => apiFetch('/quizzes'),
    getById: (id, mode = 'take') => apiFetch(`/quizzes/${id}?mode=${mode}`),
    create: (quizData) => apiFetch('/quizzes', {
      method: 'POST',
      body: JSON.stringify(quizData)
    }),
    delete: (id) => apiFetch(`/quizzes/${id}`, { method: 'DELETE' })
  },

  // Quiz Attempts
  attempts: {
    submit: (attemptData) => apiFetch('/attempts', {
      method: 'POST',
      body: JSON.stringify(attemptData)
    }),
    list: () => apiFetch('/attempts'),
    getById: (id) => apiFetch(`/attempts/${id}`)
  },

  // Learning Insights
  insights: {
    get: () => apiFetch('/insights')
  },

  // Analytics
  analytics: {
    getDashboard: () => apiFetch('/analytics/dashboard'),
    getAdminUserGrowth: (range = 30) => apiFetch(`/analytics/admin/user-growth?range=${range}`)
  },

  // AI Services
  ai: {
    getStatus: () => apiFetch('/ai/status'),
    simplify: (text, targetAudience = 'beginner') => apiFetch('/ai/simplify', {
      method: 'POST',
      body: JSON.stringify({ text, targetAudience })
    }),
    generateConceptMap: (text, title = 'Concept Map') => apiFetch('/ai/concept-map', {
      method: 'POST',
      body: JSON.stringify({ text, title })
    }),
    generateQuiz: (text, numQuestions = 5, difficulty = 'medium', topic = '') => apiFetch('/ai/quiz', {
      method: 'POST',
      body: JSON.stringify({ text, numQuestions, difficulty, topic })
    }),
    generatePractice: (weakTopics, numQuestions = 5, difficulty = 'medium') => apiFetch('/ai/practice', {
      method: 'POST',
      body: JSON.stringify({ weakTopics, numQuestions, difficulty })
    })
  }
};

// Aliases for convenient named imports across views
export const authApi = {
  register: (credentials) => api.auth.register(credentials),
  login: (credentials) => api.auth.login(credentials),
  logout: () => api.auth.logout(),
  getMe: () => api.auth.getMe(),
  updateProfile: (data) => api.auth.updateProfile(data),
  deleteAccount: (password) => api.auth.deleteAccount(password)
};

export const documentApi = {
  getAll: async (params) => {
    const res = await api.documents.list(params);
    const documents = res?.documents || res?.data?.documents || [];
    return { ...res, documents, data: { documents } };
  },
  list: async (params) => {
    const res = await api.documents.list(params);
    const documents = res?.documents || res?.data?.documents || [];
    return { ...res, documents, data: { documents } };
  },
  getById: async (id) => {
    const res = await api.documents.getById(id);
    const document = res?.document || res?.data?.document || res?.data;
    return { ...res, document, data: { document } };
  },
  create: async (data) => {
    const res = await api.documents.create(data);
    const document = res?.document || res?.data?.document || res?.data;
    return { ...res, document, data: { document } };
  },
  update: async (id, data) => {
    const res = await api.documents.update(id, data);
    const document = res?.document || res?.data?.document || res?.data;
    return { ...res, document, data: { document } };
  },
  delete: (id) => api.documents.delete(id),
  uploadPdf: (file) => api.documents.uploadPdf(file),
  uploadDocument: (file) => api.documents.uploadPdf(file)
};

export const conceptMapApi = {
  getAll: async () => {
    const res = await api.conceptMaps.list();
    const conceptMaps = res?.conceptMaps || res?.data?.conceptMaps || [];
    return { ...res, conceptMaps, data: { conceptMaps } };
  },
  list: async () => {
    const res = await api.conceptMaps.list();
    const conceptMaps = res?.conceptMaps || res?.data?.conceptMaps || [];
    return { ...res, conceptMaps, data: { conceptMaps } };
  },
  getById: async (id) => {
    const res = await api.conceptMaps.getById(id);
    const conceptMap = res?.conceptMap || res?.data?.conceptMap || res?.data;
    return { ...res, conceptMap, data: { conceptMap } };
  },
  create: async (data) => {
    const res = await api.conceptMaps.create(data);
    const conceptMap = res?.conceptMap || res?.data?.conceptMap || res?.data;
    return { ...res, conceptMap, data: { conceptMap } };
  },
  update: async (id, data) => {
    const res = await api.conceptMaps.update(id, data);
    const conceptMap = res?.conceptMap || res?.data?.conceptMap || res?.data;
    return { ...res, conceptMap, data: { conceptMap } };
  },
  delete: (id) => api.conceptMaps.delete(id)
};

export const quizApi = {
  getAll: async () => {
    const res = await api.quizzes.list();
    const quizzes = res?.quizzes || res?.data?.quizzes || [];
    return { ...res, quizzes, data: { quizzes } };
  },
  list: async () => {
    const res = await api.quizzes.list();
    const quizzes = res?.quizzes || res?.data?.quizzes || [];
    return { ...res, quizzes, data: { quizzes } };
  },
  getById: async (id, mode) => {
    const res = await api.quizzes.getById(id, mode);
    const quiz = res?.quiz || res?.data?.quiz || res?.data;
    return { ...res, quiz, data: { quiz } };
  },
  create: async (data) => {
    const res = await api.quizzes.create(data);
    const quiz = res?.quiz || res?.data?.quiz || res?.data;
    return { ...res, quiz, data: { quiz } };
  },
  delete: (id) => api.quizzes.delete(id),
  generate: async ({ topic, numQuestions, difficulty, sourceText }) => {
    // Generate quiz via AI then create Quiz document in DB
    const aiRes = await api.ai.generateQuiz(sourceText || topic, numQuestions, difficulty, topic);
    const quizData = aiRes?.quiz || aiRes?.data?.quiz || aiRes?.data || aiRes;
    if (quizData && Array.isArray(quizData.questions) && quizData.questions.length > 0) {
      try {
        const created = await api.quizzes.create({
          title: quizData.title || `${topic || 'Practice'} Assessment`,
          topic: topic || quizData.topic || 'General',
          difficulty: difficulty || 'medium',
          questions: quizData.questions,
          sourceDocumentId: quizData.sourceDocumentId || null
        });
        const finalQuiz = created?.quiz || created?.data?.quiz || quizData;
        return { quiz: finalQuiz, data: { quiz: finalQuiz } };
      } catch {
        // If DB save is not available, student can still take the generated quiz
        return { quiz: quizData, data: { quiz: quizData } };
      }
    }
    return { quiz: quizData, data: { quiz: quizData } };
  },
  submitAttempt: async (attemptData) => {
    const res = await api.attempts.submit(attemptData);
    const attempt = res?.attempt || res?.data?.attempt || res?.data;
    return { ...res, attempt, data: { attempt } };
  },
  getAttempts: async (params) => {
    const res = await api.attempts.list(params);
    const attempts = res?.attempts || res?.data?.attempts || [];
    return { ...res, attempts, data: { attempts } };
  },
  getAttemptById: async (id) => {
    const res = await api.attempts.getById(id);
    const attempt = res?.attempt || res?.data?.attempt || res?.data;
    return { ...res, attempt, data: { attempt } };
  }
};

export const insightApi = {
  getSummary: async () => {
    const res = await api.insights.get();
    const insights = res?.insights || res?.data || res;
    return { ...insights, data: insights };
  },
  getInsights: async () => {
    const res = await api.insights.get();
    const insights = res?.insights || res?.data || res;
    return { ...insights, data: insights };
  }
};

export const insightsApi = insightApi;

export const analyticsApi = {
  getDashboard: async () => {
    const res = await api.analytics.getDashboard();
    return res?.data || res;
  },
  getAdminUserGrowth: async (range) => {
    const res = await api.analytics.getAdminUserGrowth(range);
    return res?.data || res;
  }
};

export const aiApi = {
  extractDocument: async (formDataOrFile) => {
    const file = formDataOrFile instanceof FormData ? formDataOrFile.get('file') : formDataOrFile;
    const res = await api.documents.uploadPdf(file);
    const extractedText = res?.extractedText || res?.data?.extractedText || res?.data?.text || res?.text || '';
    const topic = res?.topic || res?.data?.topic || '';
    return {
      ...res,
      extractedText,
      text: extractedText,
      topic,
      data: res?.data || { text: extractedText, topic }
    };
  },
  extractPdf: async function(formDataOrFile) {
    return this.extractDocument(formDataOrFile);
  },
  simplifyNotes: async ({ text, options }) => {
    const res = await api.ai.simplify(text, options?.level || 'beginner');
    const result = res?.result || res?.data?.result || res?.data || res;
    return { result };
  },
  generateConceptMap: async ({ topic, text, options }) => {
    const res = await api.ai.generateConceptMap(text || topic, topic);
    const conceptMap = res?.conceptMap || res?.data?.conceptMap || res?.data || res;
    return { conceptMap };
  },
  generateQuiz: (params) => quizApi.generate(params),
  generatePracticeQuiz: (weakTopics, numQuestions, difficulty) =>
    api.ai.generatePractice(weakTopics, numQuestions, difficulty)
};

export default api;
