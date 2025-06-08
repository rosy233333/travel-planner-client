import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Form, Input, DatePicker, InputNumber, Select, Button,
  Card, Typography, message, Spin, Steps, Row, Col,
  Divider, Space, Tag, Switch, Alert
} from 'antd';
import {
  CalendarOutlined, DollarOutlined, RocketOutlined,
  UserOutlined, SearchOutlined, SaveOutlined,
  RobotOutlined, ArrowLeftOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { apiService } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { TestDestinations } from '../assets/TestDestinations';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Step } = Steps;

const ItineraryCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [destinations, setDestinations] = useState([]);
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [useAI, setUseAI] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState(null);

  useEffect(() => {
    fetchDestinations();

    // 如果是从目的地详情页跳转来的，预填充目的地信息
    if (location.state && location.state.destination) {
      const { destination } = location.state;
      setSelectedDestinations([destination]);
      form.setFieldsValue({
        destinations: [destination.id]
      });
    }
  }, []);

  useEffect(() => {
    console.log("formData: ", formData);
  }, [formData])

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const response = await apiService.destinations.getAll();
      setDestinations(response.data.destinations);
    } catch (error) {
      console.error('获取目的地列表失败:', error);
      message.error('获取目的地列表失败');
      setDestinations(TestDestinations);
    } finally {
      setLoading(false);
    }
  };

  const handleDestinationChange = (selectedIds) => {
    const selected = destinations.filter(d => selectedIds.includes(d.id));
    setSelectedDestinations(selected);
  };

  const handleDestinationSearch = (searchText) => {
    // fetchDestinations(searchText);
  }

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

  const storeFormData = () => {
    const values = form.getFieldsValue();
    console.log("values: ", values);
    setFormData({ ...formData, ...values });
  }

  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(['title', 'destinations', 'dateRange', 'duration']);
      } else if (currentStep === 1) {
        await form.validateFields(['totalBudget', 'description']);
      }
      storeFormData();
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleUseAIChange = (checked) => {
    setUseAI(checked);
  };

  const handleGenerateItinerary = async () => {
    try {
      await form.validateFields();
      storeFormData();

      const values = formData;
      console.log(values);

      // 准备生成参数
      const generationParams = {
        title: values.title,
        destinations: values.destinations,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        duration: values.duration,
        totalBudget: values.totalBudget,
        preferences: {
          pacePreference: values.pacePreference,
          accommodationType: values.accommodationType,
          transportationType: values.transportationType,
          activityPreferences: values.activityPreferences,
          specialRequirements: values.specialRequirements
        }
      };

      setGenerating(true);

      // 调用生成API
      const response = await apiService.itineraries.generate(generationParams);
      setGeneratedItinerary(response.data.itinerary);

      message.success('行程生成成功！');
    } catch (error) {
      console.error('生成行程失败:', error);
      message.error('生成行程失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateItinerary = async () => {
    try {
      await form.validateFields();
      storeFormData();

      setLoading(true);

      const values = formData;
      console.log(values);

      // 准备创建行程的数据
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

      // 如果是使用AI生成的，则使用生成的行程
      if (useAI && generatedItinerary) {
        itineraryData.itineraryDays = generatedItinerary.itineraryDays;
        // 将itineraryDays数据序列化为JSON字符串并保存到dailyPlans字段
        itineraryData.dailyPlans = JSON.stringify(generatedItinerary.itineraryDays);
      }

      const response = await apiService.itineraries.create(itineraryData);
      console.log('创建行程响应:', response);

      message.success('行程创建成功！');

      // 设置刷新标志，让列表页面知道需要刷新数据
      localStorage.setItem('refreshItineraryList', 'true');

      // 获取后端返回的行程ID并检查是否存在
      const itineraryId = response.data.itinerary.id;
      console.log('行程ID:', itineraryId);

      if (itineraryId) {
        // 使用确认存在的ID进行跳转
        navigate(`/itineraries/${itineraryId}`);
      } else {
        // 如果没有获取到ID，则跳转到行程列表页
        console.error('未能获取有效的行程ID');
        message.warning('无法获取行程ID，请在行程列表中查看');
        navigate('/itineraries');
      }
    } catch (error) {
      console.error('创建行程失败:', error);
      message.error('创建行程失败');
    } finally {
      setLoading(false);
    }
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="step-content">
            <Form.Item
              name="title"
              label="行程标题"
              rules={[{ required: true, message: '请输入行程标题' }]}
            >
              <Input placeholder="例如：东京5日游" />
            </Form.Item>

            <Form.Item
              name="destinations"
              label="目的地"
              rules={[{ required: true, message: '请选择或输入至少一个目的地' }]}
            >
              <Select
                mode="tags"
                placeholder="选择或输入目的地"
                onChange={handleDestinationChange}
                onSearch={handleDestinationSearch}
                loading={loading}
                optionFilterProp="children"
              // filterOption={(input, option) =>
              //   option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              // }
              >
                {destinations.map(destination => (
                  <Option key={destination.id} value={destination.name}>
                    {destination.name} ({destination.country}, {destination.city})
                  </Option>
                ))}
              </Select>
            </Form.Item>

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

            <Form.Item
              name="duration"
              label="行程天数"
              rules={[{ required: true, message: '请输入行程天数' }]}
            >
              <InputNumber min={1} max={30} style={{ width: '100%' }} disabled />
            </Form.Item>

            {selectedDestinations.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>已选择的目的地：</Title>
                <Row gutter={[16, 16]}>
                  {selectedDestinations.map(destination => (
                    <Col key={destination.id} xs={24} sm={12} md={8}>
                      <Card size="small" hoverable>
                        <Card.Meta
                          title={destination.name}
                          description={
                            <>
                              <div>{destination.country} · {destination.city}</div>
                              {destination.category && <Tag color="blue">{destination.category}</Tag>}
                            </>
                          }
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="step-content">
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

            <Form.Item
              name="description"
              label="行程描述"
            >
              <TextArea
                placeholder="描述一下这次旅行的目的和期望..."
                rows={4}
              />
            </Form.Item>

            <Form.Item
              name="isShared"
              label="是否共享行程"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Divider orientation="left">偏好设置（可选）</Divider>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="pacePreference"
                  label="行程节奏"
                >
                  <Select placeholder="选择行程节奏">
                    <Option value="relaxed">轻松悠闲</Option>
                    <Option value="moderate">适中平衡</Option>
                    <Option value="intensive">密集充实</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="accommodationType"
                  label="住宿类型"
                >
                  <Select placeholder="选择住宿类型">
                    <Option value="budget">经济型</Option>
                    <Option value="mid-range">中档型</Option>
                    <Option value="luxury">豪华型</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="transportationType"
                  label="交通方式"
                >
                  <Select placeholder="选择主要交通方式">
                    <Option value="public">公共交通</Option>
                    <Option value="rental">租车自驾</Option>
                    <Option value="tour">跟团服务</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="activityPreferences"
                  label="活动偏好"
                >
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

              <Col xs={24}>
                <Form.Item
                  name="specialRequirements"
                  label="特殊需求"
                >
                  <TextArea
                    placeholder="如有特殊需求或注意事项，请在此说明..."
                    rows={3}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <Alert
              message="AI智能规划"
              description="开启AI智能规划，让我们帮您生成一个合理、定制化的行程安排。基于您的偏好和目的地，我们会推荐适合的活动、景点和时间安排。"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Space align="center">
                <Text>手动规划</Text>
                <Switch
                  checked={useAI}
                  onChange={handleUseAIChange}
                  checkedChildren="开启AI"
                  unCheckedChildren="关闭AI"
                />
                <Text strong={useAI}>AI智能规划</Text>
              </Space>
            </div>

            {useAI ? (
              <>
                {!generatedItinerary ? (
                  <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Button
                      type="primary"
                      icon={<RobotOutlined />}
                      onClick={handleGenerateItinerary}
                      loading={generating}
                      size="large"
                    >
                      {generating ? '正在生成行程...' : '生成AI行程'}
                    </Button>

                    {generating && (
                      <div style={{ marginTop: 24 }}>
                        <Spin spinning={true} />
                        <Paragraph style={{ marginTop: 16 }}>
                          正在为您智能规划行程，这可能需要几秒钟时间...
                        </Paragraph>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <Alert
                      message="AI行程已生成"
                      description="您的智能行程已生成成功！点击创建行程按钮可以保存此行程。"
                      type="success"
                      showIcon
                      style={{ marginBottom: 24 }}
                    />

                    <Card title="AI行程概览">
                      <Paragraph>
                        {generatedItinerary.description || '基于您的偏好，我们为您生成了一个定制化的行程安排。'}
                      </Paragraph>

                      {generatedItinerary.itineraryDays.map((day, index) => (
                        <Card
                          size="small"
                          title={`第 ${index + 1} 天 (${day.date})`}
                          style={{ marginBottom: 16 }}
                          key={index}
                        >
                          <ul style={{ paddingLeft: 20 }}>
                            {day.activities.map((activity, actIndex) => (
                              <li key={actIndex} style={{ marginBottom: 8 }}>
                                <Text strong>{activity.title}</Text>
                                {activity.timeStart && activity.timeEnd && (
                                  <Text type="secondary"> ({activity.timeStart}-{activity.timeEnd})</Text>
                                )}
                                {activity.description && (
                                  <div><Text type="secondary">{activity.description}</Text></div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </Card>
                      ))}
                    </Card>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <Text>您选择了手动规划行程。创建行程后，您可以在行程详情页面中添加每日活动计划。</Text>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="itinerary-create-container">
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/itineraries')}
        style={{ marginBottom: 16, padding: 0 }}
      >
        返回行程列表
      </Button>

      <Card>
        <div className="itinerary-create-header" style={{ marginBottom: 30 }}>
          <Title level={2}>创建新行程</Title>
          <Text type="secondary">填写以下信息，开始规划您的旅程</Text>
        </div>

        <Steps current={currentStep} style={{ marginBottom: 30 }}>
          <Step title="基本信息" icon={<CalendarOutlined />} />
          <Step title="预算和偏好" icon={<DollarOutlined />} />
          <Step title="智能规划" icon={<RocketOutlined />} />
        </Steps>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            duration: 1,
            isShared: false,
            pacePreference: 'moderate',
            accommodationType: 'mid-range',
            transportationType: 'public',
            activityPreferences: ['sightseeing', 'food']
          }}
        >
          {renderStepContent()}

          <div className="steps-action" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
            {currentStep > 0 && (
              <Button onClick={handlePrev}>
                上一步
              </Button>
            )}

            {currentStep < 2 && (
              <Button type="primary" onClick={handleNext}>
                下一步
              </Button>
            )}

            {currentStep === 2 && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleCreateItinerary}
                loading={loading}
              >
                创建行程
              </Button>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ItineraryCreate; 