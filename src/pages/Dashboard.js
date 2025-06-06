import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Button, Spin, List, Tag, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../utils/api';
import { useAuth } from '../utils/AuthContext';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [recommendedDestinations, setRecommendedDestinations] = useState([]);
  const [recentItineraries, setRecentItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 获取推荐的目的地
        if (user && user.preferences) {
          try {
            const response = await apiService.destinations.getRecommendations(user.preferences);
            setRecommendedDestinations(response.data.destinations.slice(0, 3));
          } catch (error) {
            console.error('获取推荐目的地失败:', error);
          }
        }
        
        try {
          // 使用正确的API方法获取行程
          const myResponse = await apiService.itineraries.getAll({ limit: 10 });
          console.log('Dashboard - 获取我的行程响应:', myResponse);
          
          // 获取用户参与协作的行程
          const collaborativeResponse = await apiService.itineraries.getCollaborative({ limit: 10 });
          console.log('Dashboard - 获取协作行程响应:', collaborativeResponse);
          
          // 合并两个行程列表
          const myItineraries = myResponse.data.itineraries || [];
          const collaborativeItineraries = collaborativeResponse.data.itineraries || [];
          
          // 为协作行程添加标记
          const markedCollaborativeItineraries = collaborativeItineraries.map(itinerary => ({
            ...itinerary,
            isCollaborative: true
          }));
          
          // 合并并去重（根据ID）
          const allItineraries = [...myItineraries];
          
          // 只添加不存在于我的行程中的协作行程
          markedCollaborativeItineraries.forEach(collab => {
            if (!allItineraries.some(item => item.id === collab.id)) {
              allItineraries.push(collab);
            }
          });
          
          console.log('Dashboard - 合并后的行程列表:', allItineraries);
          
          if (allItineraries.length === 0) {
            console.log('Dashboard - 没有行程数据');
            setRecentItineraries([]);
          } else {
            // 获取最近的3个行程
            const recentItems = allItineraries.slice(0, 3);
            console.log('Dashboard - 最近行程:', recentItems);
            setRecentItineraries(recentItems);
          }
        } catch (error) {
          console.error('获取行程失败:', error);
          // 详细记录错误
          if (error.response) {
            console.error('错误响应:', error.response.status, error.response.data);
          }
          setRecentItineraries([]);
        }
      } catch (error) {
        console.error('获取Dashboard数据失败:', error);
        // 显示更具体的错误信息
        if (error.response) {
          message.error(`获取行程数据失败: ${error.response.status} - ${error.response.data?.message || '服务器错误'}`);
        } else if (error.request) {
          message.error('获取行程数据失败: 无法连接到服务器');
        } else {
          message.error(`获取行程数据失败: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // 打印每次渲染时的行程数据
  console.log('Dashboard渲染 - recentItineraries:', recentItineraries);

  // 获取正确的行程ID
  const getItineraryId = (itinerary) => {
    return itinerary.id || itinerary._id;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '20px' }}>加载中...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ marginBottom: '30px' }}>
        <Title level={2}>欢迎回来, {user?.username || '游客'}</Title>
        <Text type="secondary">开始规划您的下一段旅程吧</Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* 最近行程 */}
        <Col span={24}>
          <Card 
            title="最近行程" 
            extra={<Button type="link" onClick={() => navigate('/itineraries')}>查看全部</Button>}
          >
            {recentItineraries && recentItineraries.length > 0 ? (
              <List
                dataSource={recentItineraries}
                renderItem={itinerary => {
                  if (!itinerary) return null;
                  const itineraryId = getItineraryId(itinerary);
                  if (!itineraryId) return null;
                  
                  return (
                    <List.Item
                      key={itineraryId}
                      actions={[
                        <Button type="link" onClick={() => navigate(`/itineraries/${itineraryId}`)}>查看</Button>,
                        <Button type="link" onClick={() => navigate(`/itineraries/${itineraryId}/edit`)}>编辑</Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <span>
                            {itinerary.title}
                            {itinerary.isCollaborative && <Tag color="blue" style={{ marginLeft: 8 }}>协作</Tag>}
                          </span>
                        }
                        description={
                          <>
                            <div>{itinerary.startDate} 至 {itinerary.endDate}</div>
                            <div style={{ marginTop: 8 }}>
                              <Tag color="gold">预算: ¥{itinerary.totalBudget}</Tag>
                              <Tag color="purple">已花费: ¥{itinerary.currentSpent || 0}</Tag>
                            </div>
                          </>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Text type="secondary">暂无行程</Text>
                <div style={{ marginTop: '10px' }}>
                  <Button type="primary" onClick={() => navigate('/itineraries/create')}>
                    创建行程
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </Col>

        {/* 推荐目的地 */}
        <Col span={24}>
          <Card 
            title="推荐目的地" 
            extra={<Button type="link" onClick={() => navigate('/destinations')}>查看全部</Button>}
          >
            {recommendedDestinations.length > 0 ? (
              <Row gutter={[16, 16]}>
                {recommendedDestinations.map(destination => (
                  <Col key={destination.name} xs={24} sm={12} md={8}>
                    <Card
                      hoverable
                      cover={<div style={{ height: 150, background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{destination.name}</div>}
                      onClick={() => navigate(`/destinations/${destination.id}`)}
                    >
                      <Card.Meta
                        title={destination.name}
                        description={
                          <>
                            <div>{destination.country} · {destination.city}</div>
                            <div style={{ marginTop: 8 }}>
                              <Tag color="blue">{destination.category}</Tag>
                              <Tag color="green">¥{destination.averageCost}/人</Tag>
                            </div>
                          </>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Text type="secondary">暂无推荐目的地</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* 快速操作 */}
        <Col span={24}>
          <Card title="快速操作">
            <Row gutter={[16, 16]} justify="center">
              <Col xs={24} sm={12} md={8} lg={6}>
                <Button 
                  type="primary" 
                  block 
                  size="large"
                  onClick={() => navigate('/itineraries/create')}
                >
                  创建行程
                </Button>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Button 
                  block 
                  size="large"
                  onClick={() => navigate('/destinations')}
                >
                  发现
                </Button>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Button 
                  block 
                  size="large"
                  onClick={() => navigate('/profile')}
                >
                  个人设置
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 