import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, ConfigProvider, message } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';

// 页面组件导入
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DestinationList from './pages/DestinationList';
import DestinationDetail from './pages/DestinationDetail';
import ItineraryList from './pages/ItineraryList';
import ItineraryDetail from './pages/ItineraryDetail';
import ItineraryEdit from './pages/ItineraryEdit';
import ItineraryCreate from './pages/ItineraryCreate';
import BudgetManager from './pages/BudgetManager';
import UserProfile from './pages/UserProfile';

// 组件导入
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// 上下文导入
import { AuthProvider } from './utils/AuthContext';
import { SocketProvider } from './utils/SocketContext';

// 样式导入
import './App.css';

const { Content } = Layout;

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 应用初始化，检查认证状态等
    setTimeout(() => {
      setLoading(false);
    }, 0);
  }, []);

  if (loading) {
    return <div className="app-loader">加载中...</div>;
  }

  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <SocketProvider>
          <Layout className="app-layout">
            <Navbar />
            <Content className="app-content">
              <Routes>
                <Route path="/" element={<Navigate replace to="/dashboard" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />

                <Route path="/destinations" element={
                  <ProtectedRoute>
                    <DestinationList />
                  </ProtectedRoute>
                } />

                <Route path="/destinations/:id" element={
                  <ProtectedRoute>
                    <DestinationDetail />
                  </ProtectedRoute>
                } />

                <Route path="/itineraries" element={
                  <ProtectedRoute>
                    <ItineraryList />
                  </ProtectedRoute>
                } />

                <Route path="/itineraries/create" element={
                  <ProtectedRoute>
                    <ItineraryCreate />
                  </ProtectedRoute>
                } />

                <Route path="/itineraries/:id" element={
                  <ProtectedRoute>
                    <ItineraryDetail />
                  </ProtectedRoute>
                } />

                <Route path="/itineraries/:id/edit" element={
                  <ProtectedRoute>
                    <ItineraryEdit />
                  </ProtectedRoute>
                } />

                <Route path="/budgets/:itineraryId" element={
                  <ProtectedRoute>
                    <BudgetManager />
                  </ProtectedRoute>
                } />

                <Route path="/profile" element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate replace to="/dashboard" />} />
              </Routes>
            </Content>
            <Footer />
          </Layout>
        </SocketProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App; 