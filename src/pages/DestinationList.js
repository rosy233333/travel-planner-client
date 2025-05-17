import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Input, Select, Tag, Spin, Pagination, Empty, Button } from 'antd';
import { SearchOutlined, EnvironmentOutlined, DollarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../utils/api';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const DestinationList = () => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const navigate = useNavigate();

  // 定义目的地类别选项
  const categories = [
    { value: 'all', label: '全部' },
    { value: '自然景观', label: '自然景观' },
    { value: '历史文化', label: '历史文化' },
    { value: '休闲度假', label: '休闲度假' },
    { value: '美食探索', label: '美食探索' },
    { value: '冒险体验', label: '冒险体验' }
  ];

  useEffect(() => {
    fetchDestinations();
  }, [page, pageSize, searchQuery, categoryFilter]);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      
      const params = {
        page,
        limit: pageSize,
        search: searchQuery,
      };
      
      if (categoryFilter && categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      
      const response = await apiService.destinations.getAll(params);
      setDestinations(response.data.destinations);
      setTotal(response.data.total);
    } catch (error) {
      console.error('获取目的地列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setPage(1); // 重置到第一页
  };

  const handleCategoryChange = (value) => {
    setCategoryFilter(value);
    setPage(1); // 重置到第一页
  };

  const handlePageChange = (page, pageSize) => {
    setPage(page);
    setPageSize(pageSize);
  };

  return (
    <div className="destination-list-container">
      <div className="destination-list-header" style={{ marginBottom: 30 }}>
        <Title level={2}>探索目的地</Title>
        <Text type="secondary">发现世界各地的精彩旅行目的地</Text>
      </div>
      
      <div className="destination-filters" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} lg={8}>
            <Search
              placeholder="搜索目的地名称、国家或城市"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={8}>
            <Select
              placeholder="按类别筛选"
              style={{ width: '100%' }}
              size="large"
              value={categoryFilter}
              onChange={handleCategoryChange}
            >
              {categories.map(category => (
                <Option key={category.value} value={category.value}>
                  {category.label}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '20px' }}>加载目的地...</div>
        </div>
      ) : (
        <>
          {destinations.length > 0 ? (
            <Row gutter={[24, 24]}>
              {destinations.map(destination => (
                <Col key={destination.id} xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    cover={
                      <div
                        style={{
                          height: 200,
                          background: '#f0f2f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
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
                    }
                    onClick={() => navigate(`/destinations/${destination.id}`)}
                  >
                    <Card.Meta
                      title={destination.name}
                      description={
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                            <EnvironmentOutlined style={{ marginRight: 5 }} />
                            <Text>{destination.country} · {destination.city}</Text>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                            <DollarOutlined style={{ marginRight: 5 }} />
                            <Text>参考费用: ¥{destination.averageCost}/人</Text>
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <Tag color="blue">{destination.category}</Tag>
                            {destination.bestTimeToVisit && (
                              <Tag color="green">最佳旅行时间: {destination.bestTimeToVisit}</Tag>
                            )}
                          </div>
                        </>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Empty
              description="暂无符合条件的目的地"
              style={{ marginTop: 50 }}
            />
          )}
        </>
      )}
      
      {total > 0 && (
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
            showSizeChanger
            showQuickJumper
            showTotal={(total) => `共 ${total} 个目的地`}
          />
        </div>
      )}
    </div>
  );
};

export default DestinationList; 