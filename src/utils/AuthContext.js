import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { message } from 'antd';
import api from './api';

// 创建认证上下文
const AuthContext = createContext(null);

// 自定义Hook，用于访问认证上下文
export const useAuth = () => useContext(AuthContext);

// 认证提供者组件
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // 初始化加载时从本地存储获取身份验证状态
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        try {
          // 配置全局请求头
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // 获取用户信息
          const response = await api.get('/auth/me');
          setUser(response.data.user);
        } catch (error) {
          console.error('身份验证错误:', error);
          logout(); // 如果获取用户信息失败，注销
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  // 登录方法
  const login = async (email, password) => {
    try {
      // 硬编码的测试用户
      const testUser = {
        email: 'test@qq.com',
        password: '111111'
      };
      
      // 检查是否匹配测试用户
      if (email === testUser.email && password === testUser.password) {
        // 创建模拟的用户数据和令牌
        const userData = {
          id: 'user1',
          username: 'test',
          email: 'test@qq.com',
          preferences: {
            travelStyle: '休闲',
            budgetLevel: '中等'
          }
        };
        
        const newToken = 'fake-jwt-token-123456';
        
        // 保存到本地存储
        localStorage.setItem('token', newToken);
        
        // 设置请求头
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        // 更新状态
        setToken(newToken);
        setUser(userData);
        
        message.success('登录成功');
        return { success: true };
      } else {
        // 登录失败
        message.error('邮箱或密码不正确');
        return { success: false, error: '邮箱或密码不正确' };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || '登录失败，请检查邮箱和密码';
      message.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // 注册方法
  const register = async (username, email, password) => {
    try {
      // 检查邮箱是否为 test@qq.com（已存在的测试用户）
      if (email === 'test@qq.com') {
        message.error('用户名或邮箱已被使用');
        return { success: false, error: '用户名或邮箱已被使用' };
      }
      
      // 创建模拟的用户数据和令牌
      const userData = {
        id: 'user2',
        username,
        email,
        preferences: {
          travelStyle: '休闲',
          budgetLevel: '中等'
        }
      };
      
      const newToken = 'fake-jwt-token-123456';
      
      // 保存到本地存储
      localStorage.setItem('token', newToken);
      
      // 设置请求头
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // 更新状态
      setToken(newToken);
      setUser(userData);
      
      message.success('注册成功');
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || '注册失败';
      message.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // 注销方法
  const logout = () => {
    // 清除本地存储
    localStorage.removeItem('token');
    
    // 清除请求头
    delete axios.defaults.headers.common['Authorization'];
    
    // 重置状态
    setToken(null);
    setUser(null);
    
    message.success('已退出登录');
  };

  // 更新用户信息
  const updateUserProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      setUser(response.data.user);
      message.success('个人资料已更新');
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || '更新失败';
      message.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // 更新用户偏好
  const updateUserPreferences = async (preferences) => {
    try {
      const response = await api.put('/auth/preferences', { preferences });
      setUser({ ...user, preferences: response.data.preferences });
      message.success('偏好设置已更新');
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || '更新偏好失败';
      message.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // 提供上下文值
  const contextValue = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    updateUserProfile,
    updateUserPreferences
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}; 