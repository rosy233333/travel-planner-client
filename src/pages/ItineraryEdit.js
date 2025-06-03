import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form, Input, DatePicker, InputNumber, Select, Button,
  Card, Typography, message, Spin, Tabs, Row, Col,
  Divider, List, Timeline, Modal, Space, Avatar, Tag, Empty, Switch, TimePicker
} from 'antd';
import {
  CalendarOutlined, EditOutlined, DeleteOutlined, PlusOutlined,
  SaveOutlined, ClockCircleOutlined, TeamOutlined, UserOutlined,
  ExclamationCircleOutlined, ArrowLeftOutlined, EnvironmentOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { apiService } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { TestItinerary } from '../assets/TestItinerary';
import { TestDestinations } from '../assets/TestDestinations';
import { getDestinationsInItinerary } from '../utils/getDestinationsInItinerary';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { confirm } = Modal;

const ItineraryEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [activeTabKey, setActiveTabKey] = useState('basic');
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [currentDay, setCurrentDay] = useState(null);
  const [activityForm] = Form.useForm();
  const [currentActivity, setCurrentActivity] = useState(null);
  const [collaboratorModalVisible, setCollaboratorModalVisible] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [activityTimeRange, setActivityTimeRange] = useState([]);

  useEffect(() => {
    fetchItineraryDetail();
    fetchDestinations();
  }, [id]);

  const fetchItineraryDetail = async () => {
    try {
      setLoading(true);
      var itinerary_;
      try {
        const response = await apiService.itineraries.getById(id);
        // itinerary_ = getDestinationsInItinerary(response.data.itinerary);
        itinerary_ = response.data.itinerary;
      } catch (error) {
        itinerary_ = TestItinerary;
      }
      setItinerary(itinerary_)

      setCollaborators(itinerary_.collaborators || []);

      // 设置表单值
      form.setFieldsValue({
        title: itinerary_.title,
        destinations: itinerary_.destinations,
        dateRange: [
          moment(itinerary_.startDate),
          moment(itinerary_.endDate)
        ],
        duration: itinerary_.duration,
        totalBudget: itinerary_.totalBudget,
        description: itinerary_.description,
        isShared: itinerary_.isShared,
        pacePreference: itinerary_.preferences?.pacePreference,
        accommodationType: itinerary_.preferences?.accommodationType,
        transportationType: itinerary_.preferences?.transportationType,
        activityPreferences: itinerary_.preferences?.activityPreferences,
        specialRequirements: itinerary_.preferences?.specialRequirements
      });

      // 设置已选择的目的地
      if (itinerary_.destinations && itinerary_.destinations.length > 0) {
        setSelectedDestinations(itinerary_.destinations);
      }
    } catch (error) {
      console.error('获取行程详情失败:', error);
      message.error('获取行程详情失败');

    } finally {
      setLoading(false);
    }
  };

  const fetchDestinations = async () => {
    try {
      const response = await apiService.destinations.getAll();
      setDestinations(response.data.destinations_data);
    } catch (error) {
      console.error('获取目的地列表失败:', error);
      message.error('获取目的地列表失败');
      setDestinations(TestDestinations);
    }
  };

  const handleDestinationChange = (selectedIds) => {
    const selected = destinations.filter(d => selectedIds.includes(d.id));
    setSelectedDestinations(selected);
  };

  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      const startDate = dates[0];
      const endDate = dates[1];
      const duration = endDate.diff(startDate, 'days') + 1;


      form.setFieldsValue({
        duration
      });
    }
  };

  const handleTabChange = (key) => {
    setActiveTabKey(key);
  };

  const handleSaveItinerary = async () => {
    try {
      await form.validateFields();

      setSaving(true);

      const values = form.getFieldsValue();

      // 准备更新行程的数据
      const itineraryData = {
        title: values.title,
        destinations: values.destinations,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        duration: values.duration,
        totalBudget: values.totalBudget,
        description: values.description,
        isShared: values.isShared || false,
        preferences: {
          pacePreference: values.pacePreference,
          accommodationType: values.accommodationType,
          transportationType: values.transportationType,
          activityPreferences: values.activityPreferences,
          specialRequirements: values.specialRequirements
        }
      };

      await apiService.itineraries.update(id, itineraryData);

      message.success('行程更新成功！');
      await fetchItineraryDetail(); // 重新获取行程信息
    } catch (error) {
      console.error('更新行程失败:', error);
      message.error('更新行程失败');
    } finally {
      setSaving(false);
    }
  };

  // 活动相关处理函数
  const showAddActivityModal = (day) => {
    setCurrentDay(day);
    setCurrentActivity(null);
    activityForm.resetFields();
    setActivityModalVisible(true);
  };

  const showEditActivityModal = (day, activity) => {
    setCurrentDay(day);
    setCurrentActivity(activity);
    // setActivityTimeRange([moment(activity.timeStart, 'HH:mm'), moment(activity.timeEnd, "HH:mm")]);

    activityForm.setFieldsValue({
      title: activity.title,
      time: [moment(activity.timeStart, 'HH:mm'), moment(activity.timeEnd, "HH:mm")],
      location: activity.location,
      description: activity.description
    });

    console.log(activityTimeRange);
    setActivityModalVisible(true);
  };

  const handleActivityModalCancel = () => {
    setActivityModalVisible(false);
    activityForm.resetFields();
  };

  const handleActivityModalOk = async () => {
    try {
      const values = await activityForm.validateFields();

      // 深拷贝当前行程
      const updatedItinerary = { ...itinerary };
      let dayIndex = -1;

      // 查找当前日期的索引
      if (updatedItinerary.itineraryDays) {
        dayIndex = updatedItinerary.itineraryDays.findIndex(d => d.date === currentDay.date);
      } else {
        updatedItinerary.itineraryDays = [];
      }

      // 如果找不到当前日期，则创建新的一天
      if (dayIndex === -1) {
        const newDay = {
          date: currentDay.date,
          activities: []
        };
        updatedItinerary.itineraryDays.push(newDay);
        dayIndex = updatedItinerary.itineraryDays.length - 1;
      }

      // 创建或更新活动
      console.log(activityTimeRange);
      const activity = {
        title: values.title,
        // timeStart: activityTimeRange[0].format("HH:mm"),
        // timeEnd: activityTimeRange[1].format("HH:mm"),
        timeStart: values.time[0].format("HH:mm"),
        timeEnd: values.time[1].format("HH:mm"),
        location: values.location,
        description: values.description
      };

      if (currentActivity) {
        // 更新现有活动
        const actIndex = updatedItinerary.itineraryDays[dayIndex].activities.findIndex(
          a => a.title === currentActivity.title && a.timeStart === currentActivity.timeStart
        );

        if (actIndex !== -1) {
          updatedItinerary.itineraryDays[dayIndex].activities[actIndex] = activity;
        }
      } else {
        // 添加新活动
        if (!updatedItinerary.itineraryDays[dayIndex].activities) {
          updatedItinerary.itineraryDays[dayIndex].activities = [];
        }
        updatedItinerary.itineraryDays[dayIndex].activities.push(activity);
      }

      // 更新行程
      await apiService.itineraries.update(id, updatedItinerary);

      message.success(currentActivity ? '活动更新成功' : '活动添加成功');
      setActivityModalVisible(false);
      activityForm.resetFields();
      await fetchItineraryDetail(); // 重新获取行程信息
    } catch (error) {
      console.error('保存活动失败:', error);
      message.error('保存活动失败');
    }
  };

  const handleDeleteActivity = (day, activity) => {
    confirm({
      title: '确定要删除此活动吗?',
      icon: <ExclamationCircleOutlined />,
      content: '删除后无法恢复。',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          // 深拷贝当前行程
          const updatedItinerary = { ...itinerary };
          const dayIndex = updatedItinerary.itineraryDays.findIndex(d => d.date === day.date);

          if (dayIndex !== -1) {
            const actIndex = updatedItinerary.itineraryDays[dayIndex].activities.findIndex(
              a => a.title === activity.title && a.timeStart === activity.timeStart
            );

            if (actIndex !== -1) {
              updatedItinerary.itineraryDays[dayIndex].activities.splice(actIndex, 1);

              // 更新行程
              await apiService.itineraries.update(id, updatedItinerary);

              message.success('活动删除成功');
              await fetchItineraryDetail(); // 重新获取行程信息
            }
          }
        } catch (error) {
          console.error('删除活动失败:', error);
          message.error('删除活动失败');
        }
      }
    });
  };

  // 协作者相关处理函数
  const showCollaboratorModal = () => {
    setUserEmail('');
    setCollaboratorModalVisible(true);
  };

  const handleCollaboratorModalCancel = () => {
    setCollaboratorModalVisible(false);
  };

  const handleAddCollaborator = async () => {
    try {
      if (!userEmail) {
        message.error('请输入用户邮箱');
        return;
      }

      await apiService.itineraries.manageCollaborators(id, userEmail, 'add');

      message.success('协作者添加成功');
      setCollaboratorModalVisible(false);
      await fetchItineraryDetail(); // 重新获取行程信息
    } catch (error) {
      console.error('添加协作者失败:', error);
      message.error('添加协作者失败');
    }
  };

  const handleRemoveCollaborator = (collaboratorId) => {
    confirm({
      title: '确定要移除此协作者吗?',
      icon: <ExclamationCircleOutlined />,
      content: '移除后该用户将无法访问此行程。',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          await apiService.itineraries.manageCollaborators(id, collaboratorId, 'remove');

          message.success('协作者移除成功');
          await fetchItineraryDetail(); // 重新获取行程信息
        } catch (error) {
          console.error('移除协作者失败:', error);
          message.error('移除协作者失败');
        }
      }
    });
  };

  // 生成行程日期数组
  const getDaysBetweenDates = (startDate, endDate) => {
    const start = moment(startDate);
    const end = moment(endDate);
    const days = [];

    let current = start;
    while (current <= end) {
      days.push({
        date: current.format('YYYY-MM-DD'),
        dayOfWeek: current.format('ddd'),
        activities: []
      });
      current = current.clone().add(1, 'days');
    }

    return days;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '20px' }}>加载行程信息...</div>
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

  // 获取行程日期范围内的所有天
  const days = getDaysBetweenDates(itinerary.startDate, itinerary.endDate);

  // 合并现有活动到日期数组
  if (itinerary.itineraryDays && itinerary.itineraryDays.length > 0) {
    itinerary.itineraryDays.forEach(day => {
      const index = days.findIndex(d => d.date === day.date);
      if (index !== -1) {
        days[index].activities = day.activities || [];
      }
    });
  }

  return (
    <div className="itinerary-edit-container">
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(`/itineraries/${id}`)}
        style={{ marginBottom: 16, padding: 0 }}
      >
        返回行程详情
      </Button>

      <div className="itinerary-edit-header" style={{ marginBottom: 24 }}>
        <Title level={2}>编辑行程: {itinerary.title}</Title>
        <Text type="secondary">在此页面编辑行程详情、日程安排和协作者</Text>
      </div>

      <Tabs activeKey={activeTabKey} onChange={handleTabChange}>
        <TabPane
          tab={<span><CalendarOutlined />基本信息</span>}
          key="basic"
        >
          <Card>
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                duration: 1,
                isShared: false
              }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="title"
                    label="行程标题"
                    rules={[{ required: true, message: '请输入行程标题' }]}
                  >
                    <Input placeholder="例如：东京5日游" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="dateRange"
                    label="行程日期"
                    rules={[{ required: true, message: '请选择行程日期' }]}
                  >
                    <RangePicker
                      style={{ width: '100%' }}
                      onChange={handleDateRangeChange}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="destinations"
                    label="目的地"
                    rules={[{ required: true, message: '请选择至少一个目的地' }]}
                  >
                    <Select
                      mode="multiple"
                      placeholder="选择目的地"
                      onChange={handleDestinationChange}
                      loading={loading}
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      {destinations.map(destination => (
                        <Option key={destination.id} value={destination.name}>
                          {destination.name} ({destination.country}, {destination.city})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="totalBudget"
                    label="总预算"
                    rules={[{ required: true, message: '请输入总预算' }]}
                  >
                    <InputNumber
                      min={0}
                      style={{ width: '100%' }}
                      formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\¥\s?|(,*)/g, '')}
                      placeholder="例如：5000"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    name="description"
                    label="行程描述"
                  >
                    <TextArea
                      placeholder="描述一下这次旅行的目的和期望..."
                      rows={4}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="duration"
                    label="行程天数"
                    rules={[{ required: true, message: '请输入行程天数' }]}
                  >
                    <InputNumber min={1} max={30} style={{ width: '100%' }} disabled />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="isShared"
                    label="是否共享行程"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">偏好设置（可选）</Divider>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item name="pacePreference" label="行程节奏">
                    <Select placeholder="选择行程节奏">
                      <Option value="relaxed">轻松悠闲</Option>
                      <Option value="moderate">适中平衡</Option>
                      <Option value="intensive">密集充实</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="accommodationType" label="住宿类型">
                    <Select placeholder="选择住宿类型">
                      <Option value="budget">经济型</Option>
                      <Option value="mid-range">中档型</Option>
                      <Option value="luxury">豪华型</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="transportationType" label="交通方式">
                    <Select placeholder="选择主要交通方式">
                      <Option value="public">公共交通</Option>
                      <Option value="rental">租车自驾</Option>
                      <Option value="tour">跟团服务</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="activityPreferences" label="活动偏好">
                    <Select mode="multiple" placeholder="选择活动偏好">
                      <Option value="sightseeing">观光游览</Option>
                      <Option value="culture">文化体验</Option>
                      <Option value="food">美食探索</Option>
                      <Option value="shopping">购物体验</Option>
                      <Option value="nature">自然探索</Option>
                      <Option value="adventure">冒险活动</Option>
                      <Option value="relaxation">休闲放松</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ marginTop: 24, textAlign: 'right' }}>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveItinerary}
                  loading={saving}
                >
                  保存修改
                </Button>
              </div>
            </Form>
          </Card>
        </TabPane>

        <TabPane
          tab={<span><CalendarOutlined />日程安排</span>}
          key="schedule"
        >
          <Card>
            <Timeline>
              {days.map((day, index) => (
                <Timeline.Item color="blue" key={day.date}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Title level={4}>
                        第 {index + 1} 天 ({day.date}) {day.dayOfWeek}
                      </Title>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => showAddActivityModal(day)}
                      >
                        添加活动
                      </Button>
                    </div>

                    {day.activities && day.activities.length > 0 ? (
                      <List
                        itemLayout="horizontal"
                        dataSource={day.activities}
                        renderItem={activity => (
                          <List.Item
                            actions={[
                              <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => showEditActivityModal(day, activity)}
                              >
                                编辑
                              </Button>,
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteActivity(day, activity)}
                              >
                                删除
                              </Button>
                            ]}
                          >
                            <List.Item.Meta
                              avatar={<Avatar>{day.activities.indexOf(activity) + 1}</Avatar>}
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
                      <Empty
                        description="暂无活动安排"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </TabPane>

        <TabPane
          tab={<span><TeamOutlined />协作者</span>}
          key="collaborators"
        >
          <Card title="管理协作者">
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={showCollaboratorModal}
              >
                添加协作者
              </Button>
            </div>

            <List
              itemLayout="horizontal"
              dataSource={collaborators}
              locale={{ emptyText: <Empty description="暂无协作者" /> }}
              renderItem={collaborator => (
                <List.Item
                  actions={[
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveCollaborator(collaborator.id)}
                    >
                      移除
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }}>
                        {collaborator.username ? collaborator.username.charAt(0).toUpperCase() : 'U'}
                      </Avatar>
                    }
                    title={collaborator.username}
                    description={collaborator.email}
                  />
                </List.Item>
              )}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 活动编辑/添加模态框 */}
      <Modal
        title={currentActivity ? "编辑活动" : "添加活动"}
        visible={activityModalVisible}
        onOk={handleActivityModalOk}
        onCancel={handleActivityModalCancel}
        okText={currentActivity ? "保存" : "添加"}
        cancelText="取消"
      >
        <Form
          form={activityForm}
          layout="vertical"
        >
          <Form.Item
            name="title"
            label="活动名称"
            rules={[{ required: true, message: '请输入活动名称' }]}
          >
            <Input placeholder="例如：参观博物馆" />
          </Form.Item>

          <Form.Item
            name="time"
            label="活动时间"
          >
            <TimePicker.RangePicker
              format="HH:mm"
              placeholder={["开始时间", "结束时间"]}
              style={{
                width: '100%'
              }}
            // value={[activityTimeRange[0], activityTimeRange[1]]}
            // onChange={(time) => {
            //   setActivityTimeRange([time[0], time[1]])
            // }}
            />
          </Form.Item>

          <Form.Item
            name="location"
            label="地点"
          >
            <Input placeholder="例如：东京国立博物馆" />
          </Form.Item>

          <Form.Item
            name="description"
            label="活动描述"
          >
            <TextArea
              placeholder="描述一下活动详情..."
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加协作者模态框 */}
      <Modal
        title="添加协作者"
        visible={collaboratorModalVisible}
        onOk={handleAddCollaborator}
        onCancel={handleCollaboratorModalCancel}
        okText="添加"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item
            label="用户邮箱"
            rules={[{ required: true, message: '请输入用户邮箱' }]}
          >
            <Input
              placeholder="输入用户邮箱地址"
              value={userEmail}
              onChange={e => setUserEmail(e.target.value)}
            />
          </Form.Item>
          <Text type="secondary">
            添加的用户将收到邀请通知，并可以查看和编辑此行程。
          </Text>
        </Form>
      </Modal>
    </div>
  );
};

export default ItineraryEdit; 