import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Typography, Form, Input, Button, Tabs, Select,
  Switch, Avatar, Upload, message, Row, Col, Divider,
  List, Tag, Skeleton, Empty, Modal
} from 'antd';
import {
  UserOutlined, LockOutlined, MailOutlined, SaveOutlined,
  HeartOutlined, HistoryOutlined, SettingOutlined,
  UploadOutlined, LogoutOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { apiService } from '../utils/api';
import { useAuth } from '../utils/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { confirm } = Modal;

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, logout, updateUserInfo } = useAuth();
  const [profileForm] = Form.useForm();
  const [preferenceForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedItineraries, setSavedItineraries] = useState([]);
  const [historyItineraries, setHistoryItineraries] = useState([]);
  const [activeTabKey, setActiveTabKey] = useState('profile');

  useEffect(() => {
    if (user) {
      loadUserData();
      fetchUserItineraries();
    } else {
      setLoading(false);
      message.warning('请先登录');
      navigate('/login');
    }
  }, [user]);

  const loadUserData = () => {
    // 初始化表单数据
    profileForm.setFieldsValue({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      bio: user.bio
    });

    // 初始化偏好设置表单
    preferenceForm.setFieldsValue({
      destinationPreferences: user.preferences?.destinationPreferences || [],
      accommodationType: user.preferences?.accommodationType || 'mid-range',
      transportationType: user.preferences?.transportationType || 'public',
      travelStyle: user.preferences?.travelStyle || ['relaxing', 'sightseeing'],
      budgetLevel: user.preferences?.budgetLevel || 'medium',
      receiveNotifications: user.preferences?.receiveNotifications !== false
    });
  };

  const fetchUserItineraries = async () => {
    try {
      setLoading(true);
      // 获取用户的行程
      const response = await apiService.itineraries.getAll();
      
      // 分类为收藏的和历史行程
      const itineraries = response.data.itineraries || [];
      const now = new Date();
      
      // 将行程分为过去和未来的
      const past = [];
      const future = [];
      
      itineraries.forEach(itinerary => {
        const endDate = new Date(itinerary.endDate);
        if (endDate < now) {
          past.push(itinerary);
        } else {
          future.push(itinerary);
        }
      });
      
      setSavedItineraries(future);
      setHistoryItineraries(past);
    } catch (error) {
      console.error('获取用户行程失败:', error);
      message.error('获取行程信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key) => {
    setActiveTabKey(key);
  };

  const handleUpdateProfile = async () => {
    try {
      await profileForm.validateFields();
      const values = profileForm.getFieldsValue();
      
      setSaving(true);
      
      // 调用API更新用户信息
      const response = await apiService.auth.updateProfile(values);
      
      // 更新本地用户信息
      updateUserInfo(response.data.user);
      
      message.success('个人资料更新成功');
    } catch (error) {
      console.error('更新个人资料失败:', error);
      message.error('更新个人资料失败');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePreferences = async () => {
    try {
      await preferenceForm.validateFields();
      const values = preferenceForm.getFieldsValue();
      
      setSaving(true);
      
      // 调用API更新用户偏好
      await apiService.auth.updatePreferences(values);
      
      // 更新本地用户信息
      const userResponse = await apiService.auth.getCurrentUser();
      updateUserInfo(userResponse.data.user);
      
      message.success('偏好设置更新成功');
    } catch (error) {
      console.error('更新偏好设置失败:', error);
      message.error('更新偏好设置失败');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      await passwordForm.validateFields();
      const { currentPassword, newPassword, confirmPassword } = passwordForm.getFieldsValue();
      
      if (newPassword !== confirmPassword) {
        message.error('两次输入的新密码不一致');
        return;
      }
      
      setSaving(true);
      
      // 调用API更新密码
      await apiService.auth.changePassword({
        currentPassword,
        newPassword
      });
      
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error) {
      console.error('修改密码失败:', error);
      message.error('修改密码失败');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    confirm({
      title: '确定要退出登录吗?',
      icon: <ExclamationCircleOutlined />,
      content: '退出后需要重新登录才能使用所有功能。',
      okText: '确定',
      cancelText: '取消',
      onOk() {
        logout();
        navigate('/login');
      }
    });
  };

  const destinationTypes = [
    { value: 'beach', label: '海滩', color: 'blue' },
    { value: 'mountain', label: '山地', color: 'green' },
    { value: 'city', label: '城市', color: 'purple' },
    { value: 'countryside', label: '乡村', color: 'orange' },
    { value: 'desert', label: '沙漠', color: 'volcano' },
    { value: 'culture', label: '文化古迹', color: 'magenta' },
    { value: 'theme-park', label: '主题公园', color: 'cyan' }
  ];

  const travelStyles = [
    { value: 'relaxing', label: '轻松度假' },
    { value: 'sightseeing', label: '观光游览' },
    { value: 'adventure', label: '冒险探索' },
    { value: 'food', label: '美食之旅' },
    { value: 'shopping', label: '购物体验' },
    { value: 'photography', label: '摄影旅行' },
    { value: 'backpacking', label: '背包旅行' }
  ];

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <Skeleton active avatar paragraph={{ rows: 4 }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Empty
          description="请先登录以查看个人资料"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
        <Button 
          type="primary" 
          style={{ marginTop: 16 }}
          onClick={() => navigate('/login')}
        >
          去登录
        </Button>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <div className="user-profile-header" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Avatar 
              size={64} 
              icon={<UserOutlined />} 
              src={user.avatarUrl}
            />
          </Col>
          <Col>
            <Title level={2} style={{ margin: 0 }}>{user.username || '用户'}</Title>
            <Text type="secondary">{user.email}</Text>
          </Col>
          <Col style={{ marginLeft: 'auto' }}>
            <Button 
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
            >
              退出登录
            </Button>
          </Col>
        </Row>
      </div>
      
      <Tabs activeKey={activeTabKey} onChange={handleTabChange}>
        <TabPane 
          tab={<span><UserOutlined />个人资料</span>} 
          key="profile"
        >
          <Card>
            <Form
              form={profileForm}
              layout="vertical"
              style={{ maxWidth: 600 }}
            >
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="用户名" />
              </Form.Item>
              
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="邮箱" disabled />
              </Form.Item>
              
              <Form.Item
                name="fullName"
                label="姓名"
              >
                <Input placeholder="您的真实姓名" />
              </Form.Item>
              
              <Form.Item
                name="phone"
                label="联系电话"
              >
                <Input placeholder="联系电话" />
              </Form.Item>
              
              <Form.Item
                name="bio"
                label="个人简介"
              >
                <Input.TextArea rows={4} placeholder="简单介绍一下自己..." />
              </Form.Item>
              
              <Form.Item>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleUpdateProfile}
                  loading={saving}
                >
                  保存修改
                </Button>
              </Form.Item>
            </Form>
          </Card>
          
          <Card title="修改密码" style={{ marginTop: 24 }}>
            <Form
              form={passwordForm}
              layout="vertical"
              style={{ maxWidth: 600 }}
            >
              <Form.Item
                name="currentPassword"
                label="当前密码"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="当前密码" />
              </Form.Item>
              
              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码长度不能少于6位' }
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="新密码" />
              </Form.Item>
              
              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  })
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="确认新密码" />
              </Form.Item>
              
              <Form.Item>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleChangePassword}
                  loading={saving}
                >
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
        
        <TabPane 
          tab={<span><SettingOutlined />偏好设置</span>} 
          key="preferences"
        >
          <Card>
            <Form
              form={preferenceForm}
              layout="vertical"
            >
              <Form.Item
                name="destinationPreferences"
                label="目的地偏好"
                help="选择您感兴趣的目的地类型，我们会为您推荐相关的旅游目的地"
              >
                <Select
                  mode="multiple"
                  placeholder="选择您喜欢的目的地类型"
                  style={{ width: '100%' }}
                >
                  {destinationTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      <Tag color={type.color}>{type.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="accommodationType"
                    label="住宿偏好"
                  >
                    <Select placeholder="选择住宿类型">
                      <Option value="budget">经济型</Option>
                      <Option value="mid-range">中档型</Option>
                      <Option value="luxury">豪华型</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} md={12}>
                  <Form.Item
                    name="transportationType"
                    label="交通偏好"
                  >
                    <Select placeholder="选择交通方式">
                      <Option value="public">公共交通</Option>
                      <Option value="rental">租车自驾</Option>
                      <Option value="tour">跟团服务</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                name="travelStyle"
                label="旅行风格"
              >
                <Select
                  mode="multiple"
                  placeholder="选择您的旅行风格"
                  style={{ width: '100%' }}
                >
                  {travelStyles.map(style => (
                    <Option key={style.value} value={style.value}>
                      {style.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                name="budgetLevel"
                label="预算等级"
              >
                <Select placeholder="选择您的预算等级">
                  <Option value="low">经济实惠</Option>
                  <Option value="medium">中等预算</Option>
                  <Option value="high">高端奢华</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="receiveNotifications"
                label="接收通知"
                valuePropName="checked"
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
              
              <Form.Item>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleUpdatePreferences}
                  loading={saving}
                >
                  保存偏好设置
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
        
        <TabPane 
          tab={<span><HeartOutlined />我的行程</span>} 
          key="itineraries"
        >
          <Card title="即将开始的行程">
            {savedItineraries.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={savedItineraries}
                renderItem={itinerary => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        onClick={() => navigate(`/itineraries/${itinerary._id}`)}
                      >
                        查看
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<HeartOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                      title={itinerary.title}
                      description={
                        <>
                          <div>{itinerary.startDate} 至 {itinerary.endDate}</div>
                          <div style={{ marginTop: 8 }}>
                            {itinerary.destinations?.map((dest, index) => (
                              <Tag key={index} color="blue">{dest.name}</Tag>
                            ))}
                          </div>
                        </>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="暂无即将开始的行程"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button
                  type="primary"
                  onClick={() => navigate('/itineraries/create')}
                >
                  创建新行程
                </Button>
              </Empty>
            )}
          </Card>
          
          <Card title="历史行程" style={{ marginTop: 24 }}>
            {historyItineraries.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={historyItineraries}
                renderItem={itinerary => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        onClick={() => navigate(`/itineraries/${itinerary._id}`)}
                      >
                        查看
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<HistoryOutlined />} style={{ backgroundColor: '#52c41a' }} />}
                      title={itinerary.title}
                      description={
                        <>
                          <div>{itinerary.startDate} 至 {itinerary.endDate}</div>
                          <div style={{ marginTop: 8 }}>
                            {itinerary.destinations?.map((dest, index) => (
                              <Tag key={index} color="green">{dest.name}</Tag>
                            ))}
                          </div>
                        </>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="暂无历史行程"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default UserProfile; 