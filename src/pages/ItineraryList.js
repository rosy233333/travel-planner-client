import React, { useState, useEffect } from 'react';
import {
  Typography, Card, List, Button, Tag, Space,
  Dropdown, Menu, Empty, Spin, Input, Select, DatePicker
} from 'antd';
import {
  PlusOutlined, CalendarOutlined, TeamOutlined,
  DollarOutlined, EllipsisOutlined, FilterOutlined,
  SearchOutlined, EnvironmentOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { TestItinerary } from '../assets/TestItinerary';
import { getDestinationsInItineraries } from '../utils/getDestinationsItIninerary';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ItineraryList = () => {
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchItineraries();
  }, [searchTerm, statusFilter, dateRange]);

  const fetchItineraries = async () => {
    try {
      setLoading(true);

      const params = {};

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      console.log(params);
      const response = await apiService.itineraries.getAll(params);
      const itineraries = response.data.itineraries;
      const itineraries_with_destinations = await getDestinationsInItineraries(itineraries);
      setItineraries(itineraries_with_destinations);
    } catch (error) {
      console.error('获取行程列表失败:', error);
      setItineraries([TestItinerary]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  const getItineraryStatus = (itinerary) => {
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

  const getMenu = (itinerary) => (
    <Menu
      items={[
        {
          key: '1',
          label: '查看详情',
          onClick: () => navigate(`/itineraries/${itinerary._id}`)
        },
        {
          key: '2',
          label: '编辑行程',
          onClick: () => navigate(`/itineraries/${itinerary._id}/edit`)
        },
        {
          key: '3',
          label: '管理预算',
          onClick: () => navigate(`/budgets/${itinerary._id}`)
        },
        {
          type: 'divider',
        },
        {
          key: '4',
          label: '删除行程',
          danger: true,
          onClick: () => {
            // 这里应该弹出确认框，确认后调用删除API
            console.log('删除行程:', itinerary._id);
          }
        },
      ]}
    />
  );

  return (
    <div className="itinerary-list-container">
      <div className="itinerary-list-header" style={{ marginBottom: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>我的行程</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/itineraries/create')}
          >
            创建行程
          </Button>
        </div>
        <Text type="secondary">管理您的所有旅行计划</Text>
      </div>

      {/* 筛选器 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Input
              placeholder="搜索行程名称"
              allowClear
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div style={{ minWidth: 150 }}>
            <Select
              placeholder="行程状态"
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <Option value="all">全部状态</Option>
              <Option value="upcoming">即将开始</Option>
              <Option value="ongoing">进行中</Option>
              <Option value="completed">已结束</Option>
            </Select>
          </div>
          <div style={{ minWidth: 280 }}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
              onChange={handleDateRangeChange}
            />
          </div>
        </div>
      </Card>

      {/* 行程列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '20px' }}>加载行程...</div>
        </div>
      ) : (
        <>
          {itineraries.length > 0 ? (
            <List
              grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
              dataSource={itineraries}
              renderItem={itinerary => {
                const status = getItineraryStatus(itinerary);

                return (
                  <List.Item>
                    <Card
                      hoverable
                      style={{ height: '100%' }}
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {itinerary.title}
                          </div>
                          <Dropdown overlay={getMenu(itinerary)} trigger={['click']} placement="bottomRight">
                            <Button type="text" icon={<EllipsisOutlined />} onClick={e => e.preventDefault()} />
                          </Dropdown>
                        </div>
                      }
                      onClick={() => navigate(`/itineraries/${itinerary._id}`)}
                      actions={[
                        <Button
                          type="text"
                          icon={<CalendarOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/itineraries/${itinerary._id}`);
                          }}
                        >
                          详情
                        </Button>,
                        <Button
                          type="text"
                          icon={<TeamOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/itineraries/${itinerary._id}/edit`);
                          }}
                        >
                          编辑
                        </Button>,
                        <Button
                          type="text"
                          icon={<DollarOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/budgets/${itinerary._id}`);
                          }}
                        >
                          预算
                        </Button>
                      ]}
                    >
                      <div>
                        <div style={{ marginBottom: 12 }}>
                          <Tag color={status.color}>{status.text}</Tag>
                          {itinerary.isShared && <Tag color="purple">共享</Tag>}
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <CalendarOutlined style={{ marginRight: 8 }} />
                          <Text>{itinerary.startDate} 至 {itinerary.endDate}</Text>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <EnvironmentOutlined style={{ marginRight: 8 }} />
                          <Text>{itinerary.destinations_data?.map(d => d.name).join(', ') || '未指定目的地'}</Text>
                        </div>
                        <div>
                          <DollarOutlined style={{ marginRight: 8 }} />
                          <Text>预算: ¥{itinerary.totalBudget || 0}</Text>
                        </div>
                      </div>
                    </Card>
                  </List.Item>
                );
              }}
            />
          ) : (
            <Empty
              description="暂无行程"
              style={{ marginTop: 50 }}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/itineraries/create')}
              >
                创建第一个行程
              </Button>
            </Empty>
          )}
        </>
      )}
    </div>
  );
};

export default ItineraryList; 