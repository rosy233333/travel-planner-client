import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Button, Spin, List, Tag } from 'antd';
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
          const response = await apiService.destinations.getRecommendations(user.preferences);
          setRecommendedDestinations(response.data.destinations.slice(0, 3));
        }
        
        // 获取最近的行程
        const itinerariesResponse = await apiService.itineraries.getAll({ limit: 3 });
        setRecentItineraries(itinerariesResponse.data.itineraries);
        
      } catch (error) {
        console.error('获取Dashboard数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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
            {recentItineraries.length > 0 ? (
              <List
                dataSource={recentItineraries}
                renderItem={itinerary => (
                  <List.Item
                    key={itinerary._id}
                    actions={[
                      <Button type="link" onClick={() => navigate(`/itineraries/${itinerary._id}`)}>查看</Button>,
                      <Button type="link" onClick={() => navigate(`/itineraries/${itinerary._id}/edit`)}>编辑</Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={itinerary.title}
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
                )}
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