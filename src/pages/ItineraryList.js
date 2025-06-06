import React, { useState, useEffect } from 'react';
import {
  Typography, Card, List, Button, Tag, Space,
  Dropdown, Menu, Empty, Spin, Input, Select, DatePicker, Modal, message
} from 'antd';
import {
  PlusOutlined, CalendarOutlined, TeamOutlined,
  DollarOutlined, EllipsisOutlined, FilterOutlined,
  SearchOutlined, EnvironmentOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { TestItinerary } from '../assets/TestItinerary';
import { getDestinationsInItineraries } from '../utils/getDestinationsInItinerary';

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

  // 手动强制更新逻辑
  useEffect(() => {
    // 从localStorage中获取刷新标志
    const needRefresh = localStorage.getItem('refreshItineraryList');
    if (needRefresh === 'true') {
      fetchItineraries();
      // 清除刷新标志
      localStorage.removeItem('refreshItineraryList');
    }
    
    // 每次加载页面时刷新一次数据
    const timer = setTimeout(() => {
      fetchItineraries();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

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
      
      // 获取用户创建的行程
      const myResponse = await apiService.itineraries.getAll(params);
      console.log('获取我的行程列表响应:', myResponse);
      
      // 获取用户参与协作的行程
      const collaborativeResponse = await apiService.itineraries.getCollaborative(params);
      console.log('获取协作行程列表响应:', collaborativeResponse);
      
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
      
      console.log('合并后的行程列表:', allItineraries);
      
      setItineraries(allItineraries);
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

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确定要删除此行程吗?',
      content: '删除后将无法恢复，所有相关的行程数据都将被删除。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          await apiService.itineraries.delete(id);
          message.success('行程已成功删除');
          fetchItineraries(); // 重新获取行程列表
        } catch (error) {
          console.error('删除行程失败:', error);
          message.error('删除行程失败: ' + (error.response?.data?.message || error.message));
        }
      }
    });
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
          onClick: () => navigate(`/itineraries/${itinerary.id}`)
        },
        {
          key: '2',
          label: '编辑行程',
          onClick: () => navigate(`/itineraries/${itinerary.id}/edit`)
        },
        {
          key: '3',
          label: '管理预算',
          onClick: () => navigate(`/budgets/${itinerary.id}`)
        },
        {
          type: 'divider',
        },
        {
          key: '4',
          label: '删除行程',
          danger: true,
          onClick: () => {
            handleDelete(itinerary.id);
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
                      cover={
                        <div 
                          style={{ 
                            height: 120, 
                            background: '#f5f5f5', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            padding: '16px',
                            position: 'relative'
                          }}
                        >
                          <div style={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            right: 0, 
                            padding: '8px 16px', 
                            background: 'rgba(0,0,0,0.03)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <Tag color={status.color}>{status.text}</Tag>
                              {itinerary.isShared && <Tag color="purple">共享</Tag>}
                              {itinerary.isCollaborative && <Tag color="geekblue" icon={<TeamOutlined />}>协作</Tag>}
                            </div>
                            <Dropdown overlay={getMenu(itinerary)} placement="bottomRight">
                              <Button type="text" icon={<EllipsisOutlined />} />
                            </Dropdown>
                          </div>
                          <Title level={4} style={{ margin: 0, textAlign: 'center' }}>
                            {itinerary.title}
                          </Title>
                        </div>
                      }
                      actions={[
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => navigate(`/itineraries/${itinerary.id}/edit`)}
                        >
                          编辑
                        </Button>,
                        <Button
                          type="text"
                          icon={<CalendarOutlined />}
                          onClick={() => navigate(`/itineraries/${itinerary.id}`)}
                        >
                          查看
                        </Button>,
                        <Button
                          type="text"
                          icon={<DollarOutlined />}
                          onClick={() => navigate(`/budgets/${itinerary.id}`)}
                        >
                          预算
                        </Button>
                      ]}
                    >
                      <Card.Meta
                        description={
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <div>
                              <CalendarOutlined style={{ marginRight: 8 }} />
                              {itinerary.startDate} 至 {itinerary.endDate}
                              {itinerary.duration && <span> ({itinerary.duration}天)</span>}
                            </div>
                            {itinerary.destinations && itinerary.destinations.length > 0 && (
                              <div>
                                <EnvironmentOutlined style={{ marginRight: 8 }} />
                                {itinerary.destinations.map(d => typeof d === 'object' ? d.name : d).join(', ')}
                              </div>
                            )}
                            {itinerary.totalBudget && (
                              <div>
                                <DollarOutlined style={{ marginRight: 8 }} />
                                预算: ¥{itinerary.totalBudget}
                              </div>
                            )}
                          </Space>
                        }
                      />
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