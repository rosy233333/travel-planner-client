import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography, Card, Row, Col, Tabs, Button, Tag, Timeline,
  Descriptions, List, Avatar, Spin, Empty, Statistic, Divider,
  message, Modal, Space, Input, Switch, Tooltip
} from 'antd';
import {
  CalendarOutlined, TeamOutlined, DollarOutlined,
  EditOutlined, DeleteOutlined, ShareAltOutlined,
  EnvironmentOutlined, ClockCircleOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, ArrowLeftOutlined, LockOutlined,
  EyeOutlined, EditFilled, SettingOutlined
} from '@ant-design/icons';
import { apiService } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { TestItinerary } from '../assets/TestItinerary';
import { getDestinationsInItinerary } from '../utils/getDestinationsItIninerary';

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
      const itinerary_with_destinations = getDestinationsInItinerary(itinerary);
      setItinerary(itinerary_with_destinations);
    } catch (error) {
      console.error('获取行程详情失败:', error);
      message.error('获取行程详情失败');
      setItinerary(TestItinerary);
    } finally {
      setLoading(false);
    }
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
      const updatedPermissions = {
        ...collaborator.permissions,
        [permission]: value
      };

      await apiService.itineraries.updateCollaboratorPermissions(
        id,
        collaborator.email,
        updatedPermissions
      );

      message.success('权限更新成功');
      fetchItineraryDetail(); // 重新获取行程信息
    } catch (error) {
      console.error('更新权限失败:', error);
      message.error('更新权限失败');
    }
  };

  const showPermissionModal = (collaborator) => {
    setCurrentCollaborator(collaborator);
    setPermissionModalVisible(true);
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

                {itinerary.destinations_data && itinerary.destinations_data.length > 0 ? (
                  <List
                    itemLayout="horizontal"
                    dataSource={itinerary.destinations_data}
                    renderItem={destination => (
                      <List.Item
                        actions={[
                          <Button
                            type="link"
                            onClick={() => navigate(`/destinations/${destination.id}`)}
                          >
                            查看
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<Avatar icon={<EnvironmentOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                          title={destination.name}
                          description={
                            <>
                              {destination.country} · {destination.city}
                              {destination.category && <Tag color="blue" style={{ marginLeft: 8 }}>{destination.category}</Tag>}
                            </>
                          }
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
                                  avatar={<Avatar>{actIndex + 1}</Avatar>}
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
                              Modal.confirm({
                                title: '移除协作者',
                                content: `确定要移除协作者 ${collaborator.email} 吗？`,
                                okText: '确定',
                                okType: 'danger',
                                cancelText: '取消',
                                onOk: async () => {
                                  try {
                                    await apiService.itineraries.manageCollaborators(id, collaborator.email, 'remove');
                                    message.success('协作者移除成功');
                                    fetchItineraryDetail();
                                  } catch (error) {
                                    console.error('移除协作者失败:', error);
                                    message.error('移除协作者失败');
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
                  Modal.confirm({
                    title: '添加协作者',
                    content: (
                      <div>
                        <p>请输入要添加的协作者邮箱：</p>
                        <Input
                          placeholder="输入邮箱地址"
                          onChange={(e) => {
                            Modal.confirm({
                              title: '确认添加',
                              content: `确定要添加 ${e.target.value} 作为协作者吗？`,
                              onOk: async () => {
                                try {
                                  await apiService.itineraries.manageCollaborators(id, e.target.value, 'add');
                                  message.success('协作者添加成功');
                                  fetchItineraryDetail(); // 重新获取行程信息
                                } catch (error) {
                                  console.error('添加协作者失败:', error);
                                  message.error('添加协作者失败');
                                }
                              }
                            });
                          }}
                        />
                      </div>
                    ),
                    okText: '添加',
                    cancelText: '取消'
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
                          Modal.confirm({
                            title: '移除协作者',
                            content: `确定要移除协作者 ${collaborator.email} 吗？`,
                            okText: '确定',
                            okType: 'danger',
                            cancelText: '取消',
                            onOk: async () => {
                              try {
                                await apiService.itineraries.manageCollaborators(id, collaborator.email, 'remove');
                                message.success('协作者移除成功');
                                fetchItineraryDetail();
                              } catch (error) {
                                console.error('移除协作者失败:', error);
                                message.error('移除协作者失败');
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
      </Tabs>

      {/* 添加权限设置模态框 */}
      <Modal
        title="协作者权限设置"
        visible={permissionModalVisible}
        onCancel={() => setPermissionModalVisible(false)}
        footer={null}
      >
        {currentCollaborator && (
          <div>
            <p style={{ marginBottom: 16 }}>
              为 {currentCollaborator.username || currentCollaborator.email} 设置权限：
            </p>
            <List
              itemLayout="horizontal"
              dataSource={[
                {
                  key: 'canView',
                  title: '查看权限',
                  description: '允许查看行程的所有内容',
                  icon: <EyeOutlined />
                },
                {
                  key: 'canEdit',
                  title: '编辑权限',
                  description: '允许编辑行程的基本信息',
                  icon: <EditFilled />
                },
                {
                  key: 'canManageBudget',
                  title: '预算管理',
                  description: '允许查看和修改预算信息',
                  icon: <DollarOutlined />
                },
                {
                  key: 'canManageSchedule',
                  title: '日程管理',
                  description: '允许添加和修改日程安排',
                  icon: <CalendarOutlined />
                },
                {
                  key: 'canInviteOthers',
                  title: '邀请权限',
                  description: '允许邀请其他协作者',
                  icon: <TeamOutlined />
                }
              ]}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Switch
                      checked={currentCollaborator.permissions?.[item.key] ?? defaultPermissions[item.key]}
                      onChange={(checked) => handlePermissionChange(currentCollaborator, item.key, checked)}
                    />
                  ]}
                >
                  <List.Item.Meta
                    avatar={item.icon}
                    title={item.title}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ItineraryDetail; 