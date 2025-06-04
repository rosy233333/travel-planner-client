import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Avatar, Space } from 'antd';
import {
  HomeOutlined,
  CompassOutlined,
  CarOutlined,
  WalletOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { useAuth } from '../utils/AuthContext';

const { Header } = Layout;

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  // 处理注销
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 用户下拉菜单
  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        <Link to="/profile">个人资料</Link>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  // 移动版菜单
  const showMobileMenu = () => {
    setMobileMenuVisible(!mobileMenuVisible);
  };

  return (
    <Header style={{ position: 'sticky', top: 0, zIndex: 10, width: '100%', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {/* Logo */}
      <div className="logo" style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
          旅游行程规划
        </Link>
      </div>
      
      {/* 桌面菜单 */}
      <div className="desktop-menu" style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
        {isAuthenticated && (
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['1']}
            style={{ minWidth: 500, display: 'flex', justifyContent: 'center' }}
          >
            <Menu.Item key="1" icon={<HomeOutlined />}>
              <Link to="/dashboard">首页</Link>
            </Menu.Item>
            <Menu.Item key="3" icon={<CarOutlined />}>
              <Link to="/itineraries">行程</Link>
            </Menu.Item>
            <Menu.Item key="2" icon={<CompassOutlined />}>
              <Link to="/destinations">发现</Link>
            </Menu.Item>
          </Menu>
        )}
      </div>
      
      {/* 用户区域 */}
      <div className="user-area">
        {isAuthenticated ? (
          <Space>
            <Dropdown overlay={userMenu} trigger={['click']}>
              <div style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span style={{ color: 'white', marginLeft: 8 }}>
                  {user?.username || '用户'}
                </span>
              </div>
            </Dropdown>
            
            {/* 移动端菜单按钮 */}
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={showMobileMenu}
              style={{ color: 'white', display: 'none' }}
              className="mobile-menu-button"
            />
          </Space>
        ) : (
          <Space>
            <Button type="primary" onClick={() => navigate('/login')}>
              登录
            </Button>
            <Button onClick={() => navigate('/register')}>
              注册
            </Button>
          </Space>
        )}
      </div>
      
      {/* 移动端菜单 */}
      {mobileMenuVisible && isAuthenticated && (
        <div
          className="mobile-menu"
          style={{
            position: 'absolute',
            top: 64,
            left: 0,
            width: '100%',
            background: '#001529',
            padding: '10px 0',
            zIndex: 999
          }}
        >
          <Menu theme="dark" mode="vertical">
            <Menu.Item key="1" icon={<HomeOutlined />}>
              <Link to="/dashboard">首页</Link>
            </Menu.Item>
            <Menu.Item key="3" icon={<CarOutlined />}>
              <Link to="/itineraries">行程</Link>
            </Menu.Item>
            <Menu.Item key="2" icon={<CompassOutlined />}>
              <Link to="/destinations">发现</Link>
            </Menu.Item>
            <Menu.Item key="4" icon={<WalletOutlined />}>
              <Link to="/profile">个人资料</Link>
            </Menu.Item>
            <Menu.Item key="5" icon={<LogoutOutlined />} onClick={handleLogout}>
              退出登录
            </Menu.Item>
          </Menu>
        </div>
      )}
      
      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-menu {
            display: none !important;
          }
          .mobile-menu-button {
            display: block !important;
          }
        }
      `}</style>
    </Header>
  );
};

export default Navbar; 