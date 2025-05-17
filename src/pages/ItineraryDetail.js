import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography, Card, Row, Col, Tabs, Button, Tag, Timeline,
  Descriptions, List, Avatar, Spin, Empty, Statistic, Divider,
  message, Modal
} from 'antd';
import {
  CalendarOutlined, TeamOutlined, DollarOutlined,
  EditOutlined, DeleteOutlined, ShareAltOutlined,
  EnvironmentOutlined, ClockCircleOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, ArrowLeftOutlined
} from '@ant-design/icons';
import { apiService } from '../utils/api';
import { useAuth } from '../utils/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { confirm } = Modal;

const ItineraryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItineraryDetail();
  }, [id]);

  const fetchItineraryDetail = async () => {
    try {
      setLoading(true);
      const response = await apiService.itineraries.getById(id);
      setItinerary(response.data.itinerary);
    } catch (error) {
      console.error('获取行程详情失败:', error);
      message.error('获取行程详情失败');
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
                
                {itinerary.destinations && itinerary.destinations.length > 0 ? (
                  <List
                    itemLayout="horizontal"
                    dataSource={itinerary.destinations}
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
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar style={{ backgroundColor: '#87d068' }}>
                              {collaborator.username ? collaborator.username.charAt(0).toUpperCase() : 'U'}
                            </Avatar>
                          }
                          title={collaborator.username}
                          description={collaborator.email}
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty 
                    description="暂无协作者" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
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
            <Empty 
              description="协作功能即将上线" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Paragraph>
                敬请期待！该功能将允许您与朋友和家人一起规划行程。
              </Paragraph>
            </Empty>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ItineraryDetail; 