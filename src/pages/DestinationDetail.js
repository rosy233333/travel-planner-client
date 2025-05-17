import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Typography, Card, Row, Col, Tag, Button, 
  Descriptions, Divider, Spin, Empty, List, Rate, Avatar
} from 'antd';
import { 
  EnvironmentOutlined, CalendarOutlined, DollarOutlined,
  HeartOutlined, HeartFilled, PlusOutlined, ArrowLeftOutlined
} from '@ant-design/icons';
import { apiService } from '../utils/api';

const { Title, Text, Paragraph } = Typography;

const DestinationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchDestinationDetail();
  }, [id]);

  const fetchDestinationDetail = async () => {
    try {
      setLoading(true);
      const response = await apiService.destinations.getById(id);
      setDestination(response.data.destination);
      // 这里应该从用户收藏列表中检查是否收藏，现在简单模拟
      setIsFavorite(Math.random() > 0.5);
    } catch (error) {
      console.error('获取目的地详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = () => {
    // 这里应该调用API更新用户收藏，现在简单模拟
    setIsFavorite(!isFavorite);
  };

  const handleCreateItinerary = () => {
    // 跳转到创建行程页面并传递目的地信息
    navigate('/itineraries/create', { state: { destination } });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '20px' }}>加载目的地信息...</div>
      </div>
    );
  }

  if (!destination) {
    return (
      <Empty 
        description="目的地信息不存在或已被删除" 
        style={{ marginTop: 50 }}
      />
    );
  }

  return (
    <div className="destination-detail-container">
      <Button 
        type="link" 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/destinations')}
        style={{ marginBottom: 16, padding: 0 }}
      >
        返回目的地列表
      </Button>

      <div className="destination-header" style={{ marginBottom: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>{destination.name}</Title>
          <div>
            <Button 
              type="text" 
              icon={isFavorite ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />} 
              onClick={handleToggleFavorite}
              style={{ marginRight: 8 }}
            >
              {isFavorite ? '已收藏' : '收藏'}
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleCreateItinerary}
            >
              创建行程
            </Button>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8 }}>
          <Tag icon={<EnvironmentOutlined />} color="blue">
            {destination.country} · {destination.city}
          </Tag>
          <Tag icon={<CalendarOutlined />} color="green">
            最佳旅行时间: {destination.bestTimeToVisit || '全年'}
          </Tag>
          <Tag icon={<DollarOutlined />} color="gold">
            参考费用: ¥{destination.averageCost}/人
          </Tag>
          <Tag color="purple">{destination.category}</Tag>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          {/* 目的地图片 */}
          <Card style={{ marginBottom: 24 }}>
            <div 
              style={{ 
                height: 300, 
                background: '#f0f2f5', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: 16
              }}
            >
              {destination.imageUrl ? (
                <img 
                  src={destination.imageUrl} 
                  alt={destination.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                destination.name
              )}
            </div>
            <Paragraph>
              {destination.description || '暂无详细描述'}
            </Paragraph>
          </Card>

          {/* 景点介绍 */}
          <Card title="主要景点" style={{ marginBottom: 24 }}>
            {destination.attractions && destination.attractions.length > 0 ? (
              <List
                itemLayout="vertical"
                dataSource={destination.attractions || []}
                renderItem={attraction => (
                  <List.Item>
                    <List.Item.Meta
                      title={attraction.name}
                      description={
                        <div>
                          <Rate disabled defaultValue={attraction.rating || 4.5} />
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            门票: ¥{attraction.price || '免费'}
                          </Text>
                        </div>
                      }
                    />
                    <Paragraph>{attraction.description}</Paragraph>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无景点信息" />
            )}
          </Card>

          {/* 用户评论 */}
          <Card title="旅行者评论">
            {destination.reviews && destination.reviews.length > 0 ? (
              <List
                itemLayout="vertical"
                dataSource={destination.reviews || []}
                renderItem={review => (
                  <List.Item
                    actions={[
                      <Rate disabled defaultValue={review.rating} />
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar>{review.userName.charAt(0)}</Avatar>}
                      title={review.userName}
                      description={<span>{review.date}</span>}
                    />
                    <div style={{ marginTop: 8 }}>{review.content}</div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无评论" />
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          {/* 基本信息 */}
          <Card title="基本信息" style={{ marginBottom: 24 }}>
            <Descriptions column={1}>
              <Descriptions.Item label="国家">{destination.country}</Descriptions.Item>
              <Descriptions.Item label="城市">{destination.city}</Descriptions.Item>
              <Descriptions.Item label="类型">{destination.category}</Descriptions.Item>
              <Descriptions.Item label="平均费用">¥{destination.averageCost}/人</Descriptions.Item>
              <Descriptions.Item label="最佳旅行时间">{destination.bestTimeToVisit || '全年'}</Descriptions.Item>
              <Descriptions.Item label="语言">{destination.language || '当地语言'}</Descriptions.Item>
              <Descriptions.Item label="时区">{destination.timezone || 'GMT+8'}</Descriptions.Item>
              <Descriptions.Item label="货币">{destination.currency || '人民币(CNY)'}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 旅行贴士 */}
          <Card title="旅行贴士">
            <List
              itemLayout="horizontal"
              dataSource={destination.tips || [
                '携带充足的现金和信用卡',
                '提前了解当地天气情况',
                '尊重当地习俗和文化',
                '准备必要的药品',
                '保持通讯畅通'
              ]}
              renderItem={tip => (
                <List.Item>
                  <Text>• {tip}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DestinationDetail; 