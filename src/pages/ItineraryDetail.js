import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layout, Typography, Card, Row, Col, Tabs, Button, Tag, Timeline,
  Descriptions, List, Avatar, Spin, Empty, Statistic, Divider,
  message, Modal, Space, Input, Switch, Tooltip, Table, Form, Select
} from 'antd';
import {
  CalendarOutlined, TeamOutlined, DollarOutlined,
  EditOutlined, DeleteOutlined, ShareAltOutlined,
  EnvironmentOutlined, ClockCircleOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, ArrowLeftOutlined, LockOutlined,
  EyeOutlined, EditFilled, SettingOutlined, HistoryOutlined,
  RollbackOutlined
} from '@ant-design/icons';
import { apiService } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { TestItinerary } from '../assets/TestItinerary';
import { getDestinationsInItinerary } from '../utils/getDestinationsInItinerary';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { confirm } = Modal;

const ItineraryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [currentCollaborator, setCurrentCollaborator] = useState(null);
  const [versionHistory, setVersionHistory] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [versionDetailVisible, setVersionDetailVisible] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [versionData, setVersionData] = useState(null);
  const [loadingVersionDetail, setLoadingVersionDetail] = useState(false);

  // 权限配置
  const defaultPermissions = {
    canView: true,      // 查看权限
    canEdit: false,     // 编辑权限
    canManageBudget: false,  // 预算管理权限
    canManageSchedule: false,  // 日程管理权限
    canInviteOthers: false,  // 邀请其他协作者权限
  };

  useEffect(() => {
    fetchItineraryDetail();
  }, [id]);

  const fetchItineraryDetail = async () => {
    try {
      setLoading(true);
      const response = await apiService.itineraries.getById(id);
      const itinerary = response.data.itinerary;
      console.log('获取到的行程信息:', itinerary);
      console.log('协作者列表:', itinerary.collaborators);
      
      // 如果没有itineraryDays但有dailyPlans，尝试解析
      if (itinerary.dailyPlans) {
        try {
          console.log('尝试解析dailyPlans:', itinerary.dailyPlans);
          console.log('dailyPlans类型:', typeof itinerary.dailyPlans);
          
          // 确保dailyPlans是字符串
          let dailyPlansStr = itinerary.dailyPlans;
          if (typeof dailyPlansStr !== 'string') {
            console.log('dailyPlans不是字符串，进行转换');
            dailyPlansStr = JSON.stringify(dailyPlansStr);
          }
          
          // 尝试解析dailyPlans
          let dailyPlansObj;
          try {
            dailyPlansObj = JSON.parse(dailyPlansStr);
            console.log('解析后的dailyPlans对象:', dailyPlansObj);
            console.log('dailyPlansObj类型:', typeof dailyPlansObj);
            console.log('dailyPlansObj是否为数组:', Array.isArray(dailyPlansObj));
            
            // 如果解析结果是字符串，可能是双重编码，再次尝试解析
            if (typeof dailyPlansObj === 'string') {
              console.log('dailyPlansObj仍然是字符串，可能是双重编码，再次尝试解析');
              try {
                dailyPlansObj = JSON.parse(dailyPlansObj);
                console.log('二次解析后的dailyPlansObj:', dailyPlansObj);
                console.log('二次解析后dailyPlansObj类型:', typeof dailyPlansObj);
                console.log('二次解析后dailyPlansObj是否为数组:', Array.isArray(dailyPlansObj));
              } catch (e) {
                console.error('二次解析dailyPlans失败:', e);
              }
            }
          } catch (e) {
            console.error('解析dailyPlans字符串失败:', e);
            console.error('dailyPlansStr内容:', dailyPlansStr);
            // 尝试移除可能的转义字符
            try {
              dailyPlansStr = dailyPlansStr.replace(/\\/g, '');
              dailyPlansObj = JSON.parse(dailyPlansStr);
              console.log('移除转义字符后解析成功:', dailyPlansObj);
            } catch (e2) {
              console.error('移除转义字符后解析仍然失败:', e2);
              throw e; // 抛出原始错误
            }
          }
          
          // 将对象格式的dailyPlans转换为数组格式的itineraryDays
          // 从 {day1: {date:..., activities:[...]}, day2:{...}} 转换为 [{date:..., activities:[...]}, ...]
          const itineraryDays = [];
          
          // 处理两种可能的格式
          if (Array.isArray(dailyPlansObj)) {
            // 如果已经是数组格式，直接使用
            console.log('dailyPlans已经是数组格式，长度:', dailyPlansObj.length);
            itinerary.itineraryDays = dailyPlansObj;
          } else if (typeof dailyPlansObj === 'object' && dailyPlansObj !== null) {
            // 如果是对象格式，转换为数组
            console.log('dailyPlans是对象格式，转换为数组');
            console.log('对象键:', Object.keys(dailyPlansObj));
            
            Object.keys(dailyPlansObj).forEach(key => {
              const dayData = dailyPlansObj[key];
              console.log(`处理${key}:`, dayData);
              if (dayData && dayData.date) {
                itineraryDays.push({
                  date: dayData.date,
                  activities: dayData.activities || []
                });
              }
            });
            
            // 按日期排序
            itineraryDays.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            itinerary.itineraryDays = itineraryDays;
          } else {
            console.error('无法识别的dailyPlans格式:', dailyPlansObj);
            itinerary.itineraryDays = [];
          }
          
          console.log('解析后的itineraryDays:', itinerary.itineraryDays);
          console.log('itineraryDays长度:', itinerary.itineraryDays.length);
          
          // 确保每个日期的活动都是数组
          itinerary.itineraryDays.forEach((day, index) => {
            console.log(`检查第${index+1}天的活动:`, day);
            if (!day.activities) {
              console.log(`第${index+1}天没有activities字段，设置为空数组`);
              day.activities = [];
            } else if (!Array.isArray(day.activities)) {
              console.log(`第${index+1}天的activities不是数组，转换为数组`);
              day.activities = [day.activities];
            }
            console.log(`第${index+1}天的活动数量:`, day.activities.length);
          });
        } catch (e) {
          console.error('解析dailyPlans失败:', e);
          console.error('错误详情:', e.message);
          console.error('错误堆栈:', e.stack);
          // 确保有一个空数组
          itinerary.itineraryDays = itinerary.itineraryDays || [];
        }
      } else if (!itinerary.itineraryDays) {
        // 如果没有itineraryDays也没有dailyPlans，设置为空数组
        console.log('没有日程安排数据，设置为空数组');
        itinerary.itineraryDays = [];
      }
      
      // 确保每个活动都有必要的字段
      if (itinerary.itineraryDays && itinerary.itineraryDays.length > 0) {
        itinerary.itineraryDays.forEach(day => {
          if (day.activities) {
            day.activities = day.activities.map(activity => ({
              title: activity.title || '未命名活动',
              timeStart: activity.timeStart || '00:00',
              timeEnd: activity.timeEnd || '23:59',
              location: activity.location || '',
              description: activity.description || ''
            }));
          } else {
            day.activities = [];
          }
        });
      }
      
      console.log('处理后的itineraryDays:', itinerary.itineraryDays);
      setItinerary(itinerary);
      
      // 获取版本历史
      fetchVersionHistory(id);
    } catch (error) {
      console.error('获取行程详情失败:', error);
      message.error('获取行程详情失败');
      setItinerary(TestItinerary);
    } finally {
      setLoading(false);
    }
  };
  
  // 获取版本历史
  const fetchVersionHistory = async (itineraryId) => {
    try {
      setLoadingVersions(true);
      const response = await apiService.versions.getHistory(itineraryId);
      console.log('获取到的版本历史:', response.data);
      setVersionHistory(response.data || []);
    } catch (error) {
      console.error('获取版本历史失败:', error);
      message.error('获取版本历史失败');
    } finally {
      setLoadingVersions(false);
    }
  };
  
  // 恢复到指定版本
  const handleRestoreVersion = async (versionNumber) => {
    try {
      await apiService.versions.restoreVersion(id, versionNumber, `恢复到版本 ${versionNumber}`);
      message.success('版本恢复成功');
      
      // 重新获取行程详情
      await fetchItineraryDetail();
    } catch (error) {
      console.error('恢复版本失败:', error);
      message.error('恢复版本失败: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // 查看版本详情
  const handleViewVersionDetail = async (version) => {
    try {
      setSelectedVersion(version);
      setLoadingVersionDetail(true);
      setVersionDetailVisible(true);
      
      const response = await apiService.versions.getVersionData(id, version.versionNumber);
      console.log('版本详情数据:', response.data);
      
      // 解析数据
      let parsedData;
      try {
        parsedData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        
        // 解析 dailyPlans 为 itineraryDays
        if (parsedData.dailyPlans && !parsedData.itineraryDays) {
          try {
            console.log('尝试解析版本中的dailyPlans:', parsedData.dailyPlans);
            
            // 确保dailyPlans是字符串
            let dailyPlansStr = parsedData.dailyPlans;
            if (typeof dailyPlansStr !== 'string') {
              dailyPlansStr = JSON.stringify(dailyPlansStr);
            }
            
            const dailyPlansObj = JSON.parse(dailyPlansStr);
            console.log('解析后的dailyPlans对象:', dailyPlansObj);
            
            // 将对象格式的dailyPlans转换为数组格式的itineraryDays
            const itineraryDays = [];
            
            // 处理两种可能的格式
            if (Array.isArray(dailyPlansObj)) {
              // 如果已经是数组格式，直接使用
              parsedData.itineraryDays = dailyPlansObj;
            } else {
              // 如果是对象格式，转换为数组
              Object.keys(dailyPlansObj).forEach(key => {
                const dayData = dailyPlansObj[key];
                if (dayData && dayData.date) {
                  itineraryDays.push({
                    date: dayData.date,
                    activities: dayData.activities || []
                  });
                }
              });
              
              // 按日期排序
              itineraryDays.sort((a, b) => new Date(a.date) - new Date(b.date));
              parsedData.itineraryDays = itineraryDays;
            }
            
            console.log('解析后的版本itineraryDays:', parsedData.itineraryDays);
          } catch (e) {
            console.error('解析版本dailyPlans失败:', e);
            parsedData.itineraryDays = [];
          }
        }
      } catch (e) {
        console.error('解析版本数据失败:', e);
        parsedData = response.data;
      }
      
      setVersionData(parsedData);
    } catch (error) {
      console.error('获取版本详情失败:', error);
      message.error('获取版本详情失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingVersionDetail(false);
    }
  };
  
  // 关闭版本详情模态框
  const handleCloseVersionDetail = () => {
    setVersionDetailVisible(false);
    setSelectedVersion(null);
    setVersionData(null);
  };

  const handleDelete = () => {
    confirm({
      title: '确定要删除此行程吗?',
      icon: <ExclamationCircleOutlined />,
      content: '删除后无法恢复，所有相关的预算和日程安排也将被删除。',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          await apiService.itineraries.delete(id);
          message.success('行程已删除');
          navigate('/itineraries');
        } catch (error) {
          console.error('删除行程失败:', error);
          message.error('删除行程失败');
        }
      }
    });
  };

  const getItineraryStatus = () => {
    if (!itinerary) return {};

    const now = new Date();
    const startDate = new Date(itinerary.startDate);
    const endDate = new Date(itinerary.endDate);

    if (now < startDate) {
      return { text: '即将开始', color: 'blue' };
    } else if (now >= startDate && now <= endDate) {
      return { text: '进行中', color: 'green' };
    } else {
      return { text: '已结束', color: 'gray' };
    }
  };

  const handlePermissionChange = async (collaborator, permission, value) => {
    try {
      console.log(`更新协作者权限: ID=${collaborator.id}, 权限=${permission}, 值=${value}`);
      
      // 构建权限对象
      const permissions = {};
      permissions[permission] = value;
      
      // 使用协作者ID而不是邮箱
      const collaboratorId = collaborator.id ? collaborator.id.toString() : collaborator.email;
      
      // TODO: 调用后端API更新权限
      // await apiService.itineraries.updateCollaboratorPermissions(id, collaborator.email, permissions);
      
      // 临时处理：直接更新本地状态
      setItinerary(prev => {
        const updatedItinerary = { ...prev };
        updatedItinerary.collaborators = updatedItinerary.collaborators.map(c => {
          if ((collaborator.id && c.id === collaborator.id) || 
              (!collaborator.id && c.email === collaborator.email)) {
            return {
              ...c,
              permissions: {
                ...c.permissions,
                [permission]: value
              }
            };
          }
          return c;
        });
        return updatedItinerary;
      });
      
      message.success('权限设置已更新');
    } catch (error) {
      console.error('更新权限失败:', error);
      message.error('更新权限失败');
    }
  };

  const showPermissionModal = (collaborator) => {
    setCurrentCollaborator(collaborator);
    setPermissionModalVisible(true);
  };

  // 处理权限更新
  const handleUpdatePermission = async (values) => {
    try {
      if (!currentCollaborator) {
        message.error('未选择协作者');
        return;
      }
      
      console.log('更新权限:', currentCollaborator, values);
      
      // 根据选择的权限级别设置不同的权限
      const permissions = { ...defaultPermissions };
      
      if (values.permission === 'EDIT') {
        permissions.canEdit = true;
        permissions.canManageSchedule = true;
      } else {
        permissions.canEdit = false;
        permissions.canManageSchedule = false;
      }
      
      // 使用协作者邮箱而不是ID
      const collaboratorEmail = currentCollaborator.email;
      
      // 调用API更新权限
      await apiService.itineraries.updateCollaboratorPermissions(id, collaboratorEmail, permissions);
      
      // 更新本地状态
      setItinerary(prev => {
        const updatedItinerary = { ...prev };
        updatedItinerary.collaborators = updatedItinerary.collaborators.map(c => {
          if (c.email === collaboratorEmail) {
            return {
              ...c,
              permissions: permissions
            };
          }
          return c;
        });
        return updatedItinerary;
      });
      
      message.success('权限设置已更新');
      setPermissionModalVisible(false);
    } catch (error) {
      console.error('更新权限失败:', error);
      message.error('更新权限失败: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '20px' }}>加载行程详情...</div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <Empty
        description="行程不存在或已被删除"
        style={{ marginTop: 50 }}
      />
    );
  }

  const status = getItineraryStatus();

  // 版本列表表格列定义
  const versionColumns = [
    {
      title: '版本号',
      dataIndex: 'versionNumber',
      key: 'versionNumber',
    },
    {
      title: '更新时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '更新说明',
      dataIndex: 'changeDescription',
      key: 'changeDescription',
      ellipsis: true,
    },
    {
      title: '更新人',
      dataIndex: 'user',
      key: 'user',
      render: (user) => user?.username || '未知',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            onClick={() => handleViewVersionDetail(record)}
            style={{ padding: 0 }}
          >
            查看详情
          </Button>
          <Button 
            type="link" 
            onClick={() => handleRestoreVersion(record.versionNumber)}
            style={{ padding: 0 }}
            disabled={loadingVersions}
          >
            恢复此版本
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="itinerary-detail-container">
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/itineraries')}
        style={{ marginBottom: 16, padding: 0 }}
      >
        返回行程列表
      </Button>

      <div className="itinerary-header" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <Title level={2} style={{ marginBottom: 0, marginRight: 8 }}>{itinerary.title}</Title>
              <Tag color={status.color}>{status.text}</Tag>
              {itinerary.isShared && <Tag color="purple">共享</Tag>}
            </div>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                <CalendarOutlined style={{ marginRight: 8 }} />
                {itinerary.startDate} 至 {itinerary.endDate}
                {itinerary.duration && <span> ({itinerary.duration}天)</span>}
              </Text>
            </div>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={() => navigate(`/itineraries/${id}/edit`)}
              >
                编辑
              </Button>
              <Button
                icon={<DollarOutlined />}
                onClick={() => navigate(`/budgets/${id}`)}
              >
                预算
              </Button>
              <Button
                icon={<ShareAltOutlined />}
                onClick={() => {
                  // 显示分享弹窗
                  message.info('分享功能即将推出');
                }}
              >
                分享
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
              >
                删除
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Tabs defaultActiveKey="overview">
        <TabPane
          tab={
            <span>
              <CalendarOutlined />
              概览
            </span>
          }
          key="overview"
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} md={16}>
              {/* 行程概述 */}
              <Card style={{ marginBottom: 24 }}>
                <Paragraph>
                  {itinerary.description || '暂无描述'}
                </Paragraph>

                <Divider orientation="left">目的地</Divider>

                {itinerary.destinations && itinerary.destinations.length > 0 ? (
                  <List
                    itemLayout="horizontal"
                    dataSource={itinerary.destinations}
                    renderItem={destination => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={<EnvironmentOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                          title={typeof destination === 'object' ? destination.name : destination}
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="暂无目的地信息" />
                )}
              </Card>

              {/* 行程日程安排 */}
              <Card title="日程安排" style={{ marginBottom: 24 }}>
                {itinerary.itineraryDays && itinerary.itineraryDays.length > 0 ? (
                  <Timeline>
                    {itinerary.itineraryDays.map((day, index) => (
                      <Timeline.Item key={index} color="blue">
                        <div style={{ marginBottom: 8 }}>
                          <Text strong>第 {index + 1} 天 ({day.date})</Text>
                        </div>

                        {day.activities && day.activities.length > 0 ? (
                          <List
                            itemLayout="horizontal"
                            dataSource={day.activities}
                            renderItem={(activity, actIndex) => (
                              <List.Item>
                                <List.Item.Meta
                                  avatar={<Avatar style={{ backgroundColor: '#91d5ff' }}>{actIndex + 1}</Avatar>}
                                  title={
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <span>{activity.title}</span>
                                      {activity.timeStart && activity.timeEnd && (
                                        <Tag color="green" style={{ marginLeft: 8 }}>
                                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                                          {activity.timeStart}-{activity.timeEnd}
                                        </Tag>
                                      )}
                                    </div>
                                  }
                                  description={
                                    <>
                                      {activity.location && (
                                        <div>
                                          <EnvironmentOutlined style={{ marginRight: 4 }} />
                                          {activity.location}
                                        </div>
                                      )}
                                      {activity.description && <Paragraph>{activity.description}</Paragraph>}
                                    </>
                                  }
                                />
                              </List.Item>
                            )}
                          />
                        ) : (
                          <Empty description="暂无活动安排" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        )}
                      </Timeline.Item>
                    ))}
                  </Timeline>
                ) : (
                  <Empty
                    description="暂无日程安排"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Button
                      type="primary"
                      onClick={() => navigate(`/itineraries/${id}/edit`)}
                    >
                      开始规划日程
                    </Button>
                  </Empty>
                )}
              </Card>
            </Col>

            <Col xs={24} md={8}>
              {/* 行程信息卡片 */}
              <Card style={{ marginBottom: 24 }}>
                <Statistic
                  title="总预算"
                  value={itinerary.totalBudget || 0}
                  prefix="¥"
                  style={{ marginBottom: 16 }}
                />

                <Descriptions column={1} style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="创建者">{itinerary.createdBy?.username || '未知'}</Descriptions.Item>
                  <Descriptions.Item label="创建时间">{new Date(itinerary.createdAt).toLocaleDateString()}</Descriptions.Item>
                  <Descriptions.Item label="最后更新">{new Date(itinerary.updatedAt).toLocaleDateString()}</Descriptions.Item>
                </Descriptions>

                <div style={{ textAlign: 'center' }}>
                  <Button
                    type="primary"
                    onClick={() => navigate(`/budgets/${id}`)}
                    icon={<DollarOutlined />}
                    block
                  >
                    管理预算
                  </Button>
                </div>
              </Card>

              {/* 协作者 */}
              <Card title="协作者" style={{ marginBottom: 24 }}>
                {itinerary.collaborators && itinerary.collaborators.length > 0 ? (
                  <List
                    itemLayout="horizontal"
                    dataSource={itinerary.collaborators}
                    renderItem={collaborator => (
                      <List.Item
                        actions={[
                          <Button
                            type="text"
                            icon={<SettingOutlined />}
                            onClick={() => showPermissionModal(collaborator)}
                          >
                            权限设置
                          </Button>,
                          <Button
                            type="text"
                            danger
                            onClick={() => {
                              console.log('尝试移除协作者:', collaborator);
                              const collaboratorIdentifier = collaborator.id ? collaborator.id.toString() : collaborator.email;
                              Modal.confirm({
                                title: '移除协作者',
                                content: `确定要移除协作者 ${collaborator.email} 吗？`,
                                okText: '确定',
                                okType: 'danger',
                                cancelText: '取消',
                                onOk: async () => {
                                  try {
                                    console.log(`正在移除协作者，行程ID=${id}, 协作者标识=${collaboratorIdentifier}`);
                                    await apiService.itineraries.manageCollaborators(id, collaboratorIdentifier, 'remove');
                                    message.success('协作者移除成功');
                                    fetchItineraryDetail();
                                  } catch (error) {
                                    console.error('移除协作者失败:', error);
                                    message.error('移除协作者失败: ' + (error.response?.data?.message || error.message));
                                  }
                                }
                              });
                            }}
                          >
                            移除
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar style={{ backgroundColor: '#87d068' }}>
                              {collaborator.username ? collaborator.username.charAt(0).toUpperCase() : 'U'}
                            </Avatar>
                          }
                          title={
                            <Space>
                              {collaborator.username || '未设置用户名'}
                              {collaborator.permissions?.canEdit && (
                                <Tooltip title="可编辑">
                                  <EditFilled style={{ color: '#1890ff' }} />
                                </Tooltip>
                              )}
                              {collaborator.permissions?.canManageBudget && (
                                <Tooltip title="可管理预算">
                                  <DollarOutlined style={{ color: '#52c41a' }} />
                                </Tooltip>
                              )}
                            </Space>
                          }
                          description={collaborator.email}
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty
                    description="暂无协作者"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Paragraph>
                      添加协作者后，他们可以查看和编辑此行程。
                    </Paragraph>
                  </Empty>
                )}
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <Button
                    icon={<TeamOutlined />}
                    onClick={() => navigate(`/itineraries/${id}/edit`)}
                    block
                  >
                    管理协作者
                  </Button>
                </div>
              </Card>

              {/* 旅行清单 */}
              <Card title="旅行清单">
                {itinerary.checklist && itinerary.checklist.length > 0 ? (
                  <List
                    itemLayout="horizontal"
                    dataSource={itinerary.checklist}
                    renderItem={item => (
                      <List.Item
                        actions={[
                          <CheckCircleOutlined
                            style={{
                              color: item.checked ? '#52c41a' : '#d9d9d9',
                              fontSize: 16
                            }}
                          />
                        ]}
                      >
                        <Text delete={item.checked}>{item.name}</Text>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty
                    description="暂无清单项目"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <span>
              <TeamOutlined />
              协作
            </span>
          }
          key="collaborate"
        >
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<TeamOutlined />}
                onClick={() => {
                  // 使用状态变量保存输入的邮箱
                  let inputEmail = '';
                  
                  Modal.confirm({
                    title: '添加协作者',
                    content: (
                      <div>
                        <p>请输入要添加的协作者邮箱：</p>
                        <Input
                          placeholder="输入邮箱地址"
                          onChange={(e) => {
                            inputEmail = e.target.value;
                          }}
                        />
                      </div>
                    ),
                    okText: '添加',
                    cancelText: '取消',
                    onOk: async () => {
                      if (!inputEmail || inputEmail.trim() === '') {
                        message.error('请输入有效的邮箱地址');
                        return;
                      }
                      
                      try {
                        await apiService.itineraries.manageCollaborators(id, inputEmail, 'add');
                        message.success('协作者添加成功');
                        fetchItineraryDetail(); // 重新获取行程信息
                      } catch (error) {
                        console.error('添加协作者失败:', error);
                        message.error('添加协作者失败: ' + (error.response?.data?.message || error.message));
                      }
                    }
                  });
                }}
              >
                添加协作者
              </Button>
            </div>

            {itinerary.collaborators && itinerary.collaborators.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={itinerary.collaborators}
                renderItem={collaborator => (
                  <List.Item
                    actions={[
                      <Button
                        type="text"
                        icon={<SettingOutlined />}
                        onClick={() => showPermissionModal(collaborator)}
                      >
                        权限设置
                      </Button>,
                      <Button
                        type="text"
                        danger
                        onClick={() => {
                          console.log('尝试移除协作者:', collaborator);
                          const collaboratorIdentifier = collaborator.id ? collaborator.id.toString() : collaborator.email;
                          Modal.confirm({
                            title: '移除协作者',
                            content: `确定要移除协作者 ${collaborator.email} 吗？`,
                            okText: '确定',
                            okType: 'danger',
                            cancelText: '取消',
                            onOk: async () => {
                              try {
                                console.log(`正在移除协作者，行程ID=${id}, 协作者标识=${collaboratorIdentifier}`);
                                await apiService.itineraries.manageCollaborators(id, collaboratorIdentifier, 'remove');
                                message.success('协作者移除成功');
                                fetchItineraryDetail();
                              } catch (error) {
                                console.error('移除协作者失败:', error);
                                message.error('移除协作者失败: ' + (error.response?.data?.message || error.message));
                              }
                            }
                          });
                        }}
                      >
                        移除
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: '#87d068' }}>
                          {collaborator.username ? collaborator.username.charAt(0).toUpperCase() : 'U'}
                        </Avatar>
                      }
                      title={
                        <Space>
                          {collaborator.username || '未设置用户名'}
                          {collaborator.permissions?.canEdit && (
                            <Tooltip title="可编辑">
                              <EditFilled style={{ color: '#1890ff' }} />
                            </Tooltip>
                          )}
                          {collaborator.permissions?.canManageBudget && (
                            <Tooltip title="可管理预算">
                              <DollarOutlined style={{ color: '#52c41a' }} />
                            </Tooltip>
                          )}
                        </Space>
                      }
                      description={collaborator.email}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="暂无协作者"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Paragraph>
                  添加协作者后，他们可以查看和编辑此行程。
                </Paragraph>
              </Empty>
            )}

            <Divider />

            <div>
              <Title level={4}>协作说明</Title>
              <Paragraph>
                <ul>
                  <li>协作者权限分为：查看、编辑、预算管理、日程管理、邀请权限</li>
                  <li>查看权限：允许查看行程的所有内容</li>
                  <li>编辑权限：允许编辑行程的基本信息</li>
                  <li>预算管理：允许查看和修改预算信息</li>
                  <li>日程管理：允许添加和修改日程安排</li>
                  <li>邀请权限：允许邀请其他协作者</li>
                  <li>只有创建者可以删除行程或移除其他协作者</li>
                </ul>
              </Paragraph>
            </div>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <HistoryOutlined />
              版本历史
            </span>
          }
          key="history"
        >
          <Card>
            {loadingVersions ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin />
                <div style={{ marginTop: '20px' }}>加载版本历史...</div>
              </div>
            ) : versionHistory && versionHistory.length > 0 ? (
              <div>
                <Title level={4}>版本历史</Title>
                <Table
                  columns={versionColumns}
                  dataSource={versionHistory}
                  rowKey="versionNumber"
                  pagination={versionHistory.length > 10 ? { pageSize: 10 } : false}
                />
              </div>
            ) : (
              <Empty
                description="暂无版本历史"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Paragraph>
                  修改行程后会自动创建新版本。
                </Paragraph>
              </Empty>
            )}

            <Divider />

            <div>
              <Title level={4}>版本历史说明</Title>
              <Paragraph>
                <ul>
                  <li>版本历史记录了行程的修改历史</li>
                  <li>每次修改行程后会自动创建新版本</li>
                  <li>可以恢复到任意历史版本</li>
                  <li>恢复版本会创建新版本，不会丢失当前数据</li>
                  <li>只有创建者和有权限的协作者可以恢复历史版本</li>
                </ul>
              </Paragraph>
            </div>
          </Card>
        </TabPane>
      </Tabs>

      {/* 添加权限设置模态框 */}
      <Modal
        title="协作者权限设置"
        open={permissionModalVisible}
        onCancel={() => setPermissionModalVisible(false)}
        footer={null}
      >
        {currentCollaborator && (
          <Form
            labelCol={{ span: 10 }}
            wrapperCol={{ span: 14 }}
            initialValues={{
              canView: currentCollaborator.permissions?.canView !== false, // 默认为true
              canEdit: currentCollaborator.permissions?.canEdit || false,
              canManageBudget: currentCollaborator.permissions?.canManageBudget || false,
              canManageSchedule: currentCollaborator.permissions?.canManageSchedule || false,
              canInviteOthers: currentCollaborator.permissions?.canInviteOthers || false
            }}
            onFinish={async (values) => {
              try {
                // 直接使用表单值作为权限对象
                const permissions = {
                  canView: values.canView,
                  canEdit: values.canEdit,
                  canManageBudget: values.canManageBudget,
                  canManageSchedule: values.canManageSchedule,
                  canInviteOthers: values.canInviteOthers
                };
                
                // 使用协作者邮箱而不是ID
                const collaboratorEmail = currentCollaborator.email;
                
                // 调用API更新权限
                await apiService.itineraries.updateCollaboratorPermissions(id, collaboratorEmail, permissions);
                
                // 更新本地状态
                setItinerary(prev => {
                  const updatedItinerary = { ...prev };
                  updatedItinerary.collaborators = updatedItinerary.collaborators.map(c => {
                    if (c.email === collaboratorEmail) {
                      return {
                        ...c,
                        permissions: permissions
                      };
                    }
                    return c;
                  });
                  return updatedItinerary;
                });
                
                message.success('权限设置已更新');
                setPermissionModalVisible(false);
              } catch (error) {
                console.error('更新权限失败:', error);
                message.error('更新权限失败: ' + (error.response?.data?.message || error.message));
              }
            }}
          >
            <Form.Item
              name="canView"
              label="查看权限"
              valuePropName="checked"
              tooltip="允许查看行程的所有内容"
            >
              <Switch disabled defaultChecked />
            </Form.Item>
            
            <Form.Item
              name="canEdit"
              label="编辑权限"
              valuePropName="checked"
              tooltip="允许编辑行程的基本信息"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              name="canManageBudget"
              label="预算管理权限"
              valuePropName="checked"
              tooltip="允许查看和修改预算信息"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              name="canManageSchedule"
              label="日程管理权限"
              valuePropName="checked"
              tooltip="允许添加和修改日程安排"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              name="canInviteOthers"
              label="邀请权限"
              valuePropName="checked"
              tooltip="允许邀请其他协作者"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item wrapperCol={{ offset: 10, span: 14 }}>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* 版本详情模态框 */}
      <Modal
        title={selectedVersion ? `版本 ${selectedVersion.versionNumber} 详情` : '版本详情'}
        open={versionDetailVisible}
        onCancel={handleCloseVersionDetail}
        width={800}
        footer={[
          <Button key="close" onClick={handleCloseVersionDetail}>
            关闭
          </Button>,
          selectedVersion && (
            <Button
              key="restore"
              type="primary"
              onClick={() => {
                Modal.confirm({
                  title: '确认恢复',
                  content: `确定要恢复到版本 ${selectedVersion.versionNumber} 吗？`,
                  onOk: async () => {
                    await handleRestoreVersion(selectedVersion.versionNumber);
                    handleCloseVersionDetail();
                  },
                });
              }}
            >
              恢复到此版本
            </Button>
          ),
        ]}
      >
        {loadingVersionDetail ? (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>加载版本数据中...</div>
          </div>
        ) : versionData ? (
          <div>
            <Tabs defaultActiveKey="basic" style={{ marginBottom: 16 }}>
              <Tabs.TabPane tab="基本信息" key="basic">
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="行程名称">{versionData.name || '未设置'}</Descriptions.Item>
                  <Descriptions.Item label="开始日期">
                    {versionData.startDate ? dayjs(versionData.startDate).format('YYYY-MM-DD') : '未设置'}
                  </Descriptions.Item>
                  <Descriptions.Item label="结束日期">
                    {versionData.endDate ? dayjs(versionData.endDate).format('YYYY-MM-DD') : '未设置'}
                  </Descriptions.Item>
                  <Descriptions.Item label="目的地">
                    {versionData.destinations?.map(d => d.name || d).join(', ') || '未设置'}
                  </Descriptions.Item>
                  <Descriptions.Item label="描述">
                    {versionData.description || '无'}
                  </Descriptions.Item>
                </Descriptions>
              </Tabs.TabPane>
              <Tabs.TabPane tab="活动列表" key="activities">
                {versionData.itineraryDays?.length > 0 ? (
                  <List
                    dataSource={versionData.itineraryDays}
                    renderItem={(day, dayIndex) => (
                      <List.Item>
                        <Card 
                          title={`第 ${dayIndex + 1} 天 (${day.date})`} 
                          style={{ width: '100%' }}
                          type="inner"
                        >
                          {day.activities?.length > 0 ? (
                            <List
                              dataSource={day.activities}
                              renderItem={(activity, index) => (
                                <List.Item>
                                  <Card
                                    size="small"
                                    title={`活动 ${index + 1}: ${activity.title || '未命名活动'}`}
                                    style={{ width: '100%' }}
                                  >
                                    <p><strong>时间:</strong> {activity.timeStart || '未设置'} - {activity.timeEnd || '未设置'}</p>
                                    <p><strong>地点:</strong> {activity.location || '未设置'}</p>
                                    <p><strong>描述:</strong> {activity.description || '无'}</p>
                                  </Card>
                                </List.Item>
                              )}
                            />
                          ) : (
                            <Empty description="无活动安排" />
                          )}
                        </Card>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="无日程安排" />
                )}
              </Tabs.TabPane>
            </Tabs>
          </div>
        ) : (
          <Empty description="无版本数据" />
        )}
      </Modal>
    </div>
  );
};

export default ItineraryDetail; 