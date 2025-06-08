import axios from 'axios';

// 创建API实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 从本地存储获取令牌
    const token = localStorage.getItem('token');

    // 如果有令牌，添加到请求头
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('请求发送: ', config);
    return config;
  },
  (error) => {
    console.log('请求发送错误: ', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('响应接收: ', response);
    return response;
  },
  (error) => {
    console.log('响应接收错误: ', error);
    // 处理401未授权错误
    if (error.response && error.response.status === 401) {
      // 清除本地令牌
      localStorage.removeItem('token');

      // 如果不是登录/注册页面，重定向到登录页
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API请求方法
const apiService = {
  // 用户认证
  auth: {
    login: (credentials) => api.post('/account/login', credentials),
    register: (userData) => api.post('/account/register', userData),
    getCurrentUser: () => api.get('/account/me'),
    updatePreferences: (preferences) => api.put('/account/preferences', { preferences })
  },

  // 目的地
  destinations: {
    getAll: (params) => api.get('/destinations', { params }),
    getById: (id) => api.get(`/destinations/${id}`),
    getRecommendations: (preferences) => api.post('/destinations/recommendations', { preferences }),
    create: (destinationData) => api.post('/destinations', destinationData),
    update: (id, destinationData) => api.put(`/destinations/${id}`, destinationData),
    delete: (id) => api.delete(`/destinations/${id}`)
  },

  // 行程
  itineraries: {
    getAll: (params) => api.get('/itineraries/my', { params }),
    getById: (id) => api.get(`/itineraries/${id}`),
    getCollaborative: (params) => api.get('/itineraries/collaborative', { params }),
    generate: (generationParams) => api.post('/itineraries/generate', generationParams),
    create: (itineraryData) => api.post('/itineraries', itineraryData),
    update: (id, itineraryData) => {
      // 提取版本控制相关字段
      const { _createNewVersion, _versionMessage, ...cleanItineraryData } = itineraryData;
      
      // 将版本控制字段作为查询参数发送
      const params = {};
      if (_createNewVersion !== undefined) {
        params.createNewVersion = _createNewVersion;
      }
      if (_versionMessage) {
        params.versionMessage = _versionMessage;
      }
      
      // 发送不包含特殊字段的数据作为请求体
      return api.put(`/itineraries/${id}`, cleanItineraryData, { params });
    },
    manageCollaborators: (id, collaboratorId, action) =>
      api.post(`/itineraries/${id}/manage-collaborators`, { collaboratorId, action }),
    updateCollaboratorPermissions: (id, collaboratorId, permissions) =>
      api.put(`/itineraries/${id}/collaborators/${collaboratorId}/permissions`, { permissions }),
    delete: (id) => api.delete(`/itineraries/${id}`)
  },

  // 预算
  budgets: {
    getByItinerary: (itineraryId) => api.get(`/budgets/${itineraryId}`),
    createOrUpdate: (itineraryId, budgetData) => api.post(`/budgets/${itineraryId}`, budgetData),
    addExpense: (itineraryId, expenseData) => api.post(`/budgets/expense/${itineraryId}`, expenseData),
    deleteExpense: (itineraryId, expenseId) => api.delete(`/budgets/expense/${itineraryId}/${expenseId}`),
  },
  
  // 版本历史
  versions: {
    getHistory: (itineraryId) => api.get(`/versions/history/${itineraryId}`),
    getVersionData: (itineraryId, versionNumber) => api.get(`/versions/${itineraryId}/${versionNumber}`),
    restoreVersion: (itineraryId, versionNumber, changeDescription) => 
      api.post('/versions/restore', { itineraryId, versionNumber, changeDescription }),
    getLatestVersion: (itineraryId) => api.get(`/versions/latest/${itineraryId}`)
  }
};

export default api;
export { apiService }; 