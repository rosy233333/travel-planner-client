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
    { value: '餐饮服务', label: '餐饮服务' },
    { value: '道路附属设施', label: '道路附属设施' },
    { value: '地名地址信息', label: '地名地址信息' },
    { value: '风景名胜', label: '风景名胜' },
    { value: '公共设施', label: '公共设施' },
    { value: '公司企业', label: '公司企业' },
    { value: '购物服务', label: '购物服务' },
    { value: '交通设施服务', label: '交通设施服务' },
    { value: '金融保险服务', label: '金融保险服务' },
    { value: '科教文化服务', label: '科教文化服务' },
    { value: '摩托车服务', label: '摩托车服务' },
    { value: '汽车服务', label: '汽车服务' },
    { value: '汽车维修', label: '汽车维修' },
    { value: '汽车销售', label: '汽车销售' },
    { value: '商务住宅', label: '商务住宅' },
    { value: '生活服务', label: '生活服务' },
    { value: '事件活动', label: '事件活动' },
    { value: '室内设施', label: '室内设施' },
    { value: '体育休闲服务', label: '体育休闲服务' },
    { value: '通行设施', label: '通行设施' },
    { value: '虚拟数据', label: '虚拟数据' },
    { value: '医疗保健服务', label: '医疗保健服务' },
    { value: '政府机构及社会团体', label: '政府机构及社会团体' },
    { value: '住宿服务', label: '住宿服务' }
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