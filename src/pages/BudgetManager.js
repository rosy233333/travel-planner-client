import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Table, Typography, Button, Row, Col, Progress,
  Statistic, Modal, Form, Input, InputNumber, Select,
  DatePicker, Divider, message, Spin, Popconfirm, Tag,
  Empty, Tabs
} from 'antd';
import { Pie } from '@ant-design/charts';
import {
  DollarOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  ArrowLeftOutlined, SaveOutlined, WarningOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { apiService } from '../utils/api';
import { TestItinerary } from '../assets/TestItinerary'
import { TestBudget } from '../assets/TestBudget';
import FormItem from 'antd/es/form/FormItem';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { confirm } = Modal;

const categoryOptions = [
  { value: 'accommodation', label: '住宿', color: '#1890ff' },
  { value: 'food', label: '餐饮', color: '#52c41a' },
  { value: 'transportation', label: '交通', color: '#faad14' },
  { value: 'activities', label: '活动', color: '#722ed1' },
  { value: 'shopping', label: '购物', color: '#eb2f96' },
  { value: 'other', label: '其他', color: '#f5222d' }
];

const BudgetManager = () => {
  const { itineraryId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [form1] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [itinerary, setItinerary] = useState(null);
  const [budget, setBudget] = useState(null);
  const [tempTotalBudget, setTempTotalBudget] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [expenseModalMode, setExpenseModalMode] = useState('add'); // 'add' or 'edit'
  const [currentExpense, setCurrentExpense] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);
  const [savingBudget, setSavingBudget] = useState(false);

  useEffect(() => {
    fetchItineraryAndBudget();
  }, [itineraryId]);

  const fetchItineraryAndBudget = async () => {
    try {
      setLoading(true);

      // 获取行程信息
      try {
        const itineraryResponse = await apiService.itineraries.getById(itineraryId);
        setItinerary(itineraryResponse.data.itinerary);
      } catch (error) {
        console.error('获取行程信息失败:', error);
        message.error('获取行程信息失败');
        setItinerary(TestItinerary);
      }

      // 获取预算信息
      var budget_ = {};
      try {
        const budgetResponse = await apiService.budgets.getByItinerary(itineraryId);
        if (budgetResponse.data.budget) {
          budget_ = budgetResponse.data.budget;
        } else {
          // 如果还没有预算，创建一个空预算对象
          budget_ = {
            totalBudget: itinerary.totalBudget || 0,
            expenses: []
          };
          await apiService.budgets.createOrUpdate(itineraryId, budget_);
        }
      } catch (error) {
        console.error('获取预算信息失败:', error);
        message.error('获取预算信息失败');
        budget_ = TestBudget;
      }
      setBudget(budget_)

      const expenses_ = budget_.expenses || [];
      setExpenses(expenses_);
      // 计算各类别统计信息
      calculateCategoryStats(expenses_);

    } catch (error) {
      console.error('获取行程和预算信息失败:', error);
      message.error('获取预算信息失败');
    } finally {
      setLoading(false);
    }
  };

  const calculateCategoryStats = (expenseList) => {
    if (expenseList.length > 0) {
      const stats = {};

      // 初始化所有类别
      categoryOptions.forEach(category => {
        stats[category.value] = {
          category: category.value,
          categoryLabel: category.label,
          color: category.color,
          amount: 0,
          count: 0
        };
      });

      // 累计各类别金额
      expenseList.forEach(expense => {
        if (stats[expense.category]) {
          stats[expense.category].amount += expense.amount;
          stats[expense.category].count += 1;
        }
      });

      // 转换为数组
      const statsArray = Object.values(stats).filter(item => item.amount > 0);
      setCategoryStats(statsArray);
    }
    else {
      setCategoryStats([]);
    }
  };

  const showAddExpenseModal = () => {
    setExpenseModalMode('add');
    setCurrentExpense(null);
    form.resetFields();
    setModalVisible(true);
  };

  const showEditExpenseModal = (expense) => {
    setExpenseModalMode('edit');
    setCurrentExpense(expense);

    form.setFieldsValue({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date ? moment(expense.date) : null,
      description: expense.description
    });

    setModalVisible(true);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      var expenseData = {
        title: values.title,
        amount: values.amount,
        category: values.category,
        description: values.description
      };
      if (values.date) {
        expenseData = {
          ...expenseData,
          date: values.date?.format('YYYY-MM-DD'),
        }
      }
      else {
        expenseData = {
          ...expenseData,
          date: moment().format('YYYY-MM-DD'),
        }
      }


      if (expenseModalMode === 'add') {
        // 添加新支出
        await apiService.budgets.addExpense(itineraryId, expenseData);
        message.success('支出记录添加成功');
      } else {
        // 编辑现有支出
        // 首先移除旧支出
        const updatedExpenses = expenses.filter(exp => exp._id !== currentExpense._id);

        // 然后添加编辑后的支出
        updatedExpenses.push({
          ...currentExpense,
          ...expenseData
        });

        // 更新预算
        await apiService.budgets.createOrUpdate(itineraryId, {
          totalBudget: budget.totalBudget,
          expenses: updatedExpenses
        });

        message.success('支出记录更新成功');
      }

      setModalVisible(false);
      form.resetFields();
      fetchItineraryAndBudget(); // 重新获取预算信息
    } catch (error) {
      console.error('保存支出记录失败:', error);
      message.error('保存支出记录失败');
    }
  };

  const handleDeleteExpense = async (expense) => {
    try {
      await apiService.budgets.deleteExpense(itineraryId, expense._id);
      message.success('支出记录删除成功');
      fetchItineraryAndBudget(); // 重新获取预算信息
    } catch (error) {
      console.error('删除支出记录失败:', error);
      message.error('删除支出记录失败');
    }
  };

  const handleUpdateBudget = async () => {
    try {
      setSavingBudget(true);
      const newTotalBudget = form1.getFieldValue('totalBudget');

      await apiService.budgets.createOrUpdate(itineraryId, {
        totalBudget: newTotalBudget,
        expenses: expenses
      });

      // 同时更新行程中的总预算
      await apiService.itineraries.update(itineraryId, {
        totalBudget: newTotalBudget
      });

      message.success('预算金额更新成功');
      fetchItineraryAndBudget(); // 重新获取预算信息
    } catch (error) {
      console.error('更新预算失败:', error);
      message.error('更新预算失败');
    } finally {
      setSavingBudget(false);
    }
  };

  // 计算总支出
  const getTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  // 计算剩余预算
  const getRemainingBudget = () => {
    const totalBudget = budget?.totalBudget || 0;
    const totalExpenses = getTotalExpenses();
    return totalBudget - totalExpenses;
  };

  // 计算预算使用百分比
  const getBudgetPercentage = () => {
    const totalBudget = budget?.totalBudget || 0;
    if (totalBudget === 0) return 0;

    const totalExpenses = getTotalExpenses();
    return Math.min(Math.round((totalExpenses / totalBudget) * 100), 100);
  };

  // 获取进度条的状态
  const getProgressStatus = () => {
    const percentage = getBudgetPercentage();
    if (percentage >= 100) return 'exception';
    if (percentage >= 80) return 'warning';
    return 'active';
  };

  const columns = [
    {
      title: '支出项目',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `¥${amount.toFixed(2)}`,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (category) => {
        const categoryObj = categoryOptions.find(opt => opt.value === category);
        return (
          <Tag color={categoryObj?.color} key={category}>
            {categoryObj?.label || category}
          </Tag>
        );
      },
      filters: categoryOptions.map(option => ({ text: option.label, value: option.value })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (date) => date ? moment(date).format('YYYY-MM-DD') : '-',
      sorter: (a, b) => {
        if (!a.date) return -1;
        if (!b.date) return 1;
        return moment(a.date).diff(moment(b.date));
      },
    },
    {
      title: '备注',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showEditExpenseModal(record)}
            style={{ marginRight: 8 }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条支出记录吗?"
            onConfirm={() => handleDeleteExpense(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '20px' }}>加载预算信息...</div>
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

  const totalExpenses = getTotalExpenses();
  const remainingBudget = getRemainingBudget();
  const budgetPercentage = getBudgetPercentage();
  const progressStatus = getProgressStatus();

  return (
    <div className="budget-manager-container">
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(`/itineraries/${itineraryId}`)}
        style={{ marginBottom: 16, padding: 0 }}
      >
        返回行程详情
      </Button>

      <div className="budget-header" style={{ marginBottom: 24 }}>
        <Title level={2}>预算管理: {itinerary.title}</Title>
        <Text type="secondary">管理和跟踪您的行程支出</Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Statistic
                  title="总预算"
                  value={budget.totalBudget}
                  precision={2}
                  prefix="¥"
                  suffix={
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => {
                        form1.setFieldValue('totalBudget', budget.totalBudget)
                        confirm({
                          title: '修改总预算',
                          content: (
                            <Form
                              form={form1}
                              onFinish={handleUpdateBudget}
                            >
                              <Form.Item
                                name='totalBudget'
                                label='请输入新的总预算'>
                                <InputNumber
                                  min={0}
                                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                  parser={value => value.replace(/\¥\s?|(,*)/g, '')}
                                />
                              </Form.Item>
                            </Form>
                          ),
                          okText: '确定',
                          cancelText: '取消',
                          onOk: form1.submit,
                        });
                      }}
                    >
                      编辑
                    </Button>
                  }
                />
              </Col>

              <Col span={24}>
                <Statistic
                  title="已用预算"
                  value={totalExpenses}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: totalExpenses > budget.totalBudget ? '#ff4d4f' : '#3f8600' }}
                />
              </Col>

              <Col span={24}>
                <Statistic
                  title="剩余预算"
                  value={remainingBudget}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: remainingBudget < 0 ? '#ff4d4f' : '#3f8600' }}
                />
              </Col>

              <Col span={24}>
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>预算使用</Text>
                    <Text>{budgetPercentage}%</Text>
                  </div>
                  <Progress
                    percent={budgetPercentage}
                    status={progressStatus}
                    showInfo={false}
                  />
                </div>
              </Col>

              {remainingBudget < 0 && (
                <Col span={24}>
                  <div style={{ backgroundColor: '#fff2f0', padding: 16, borderRadius: 4, marginTop: 16 }}>
                    <WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                    <Text type="danger">您已超出预算，请考虑调整支出计划或增加预算。</Text>
                  </div>
                </Col>
              )}
            </Row>
          </Card>

          {
            categoryStats.length > 0 && (
              <Card title="支出分类统计" style={{ marginTop: 24 }}>
                <div style={{ height: 200 }}>
                  <Pie
                    data={categoryStats.map(stat => ({
                      type: stat.categoryLabel,
                      value: stat.amount
                    }))}
                    angleField="value"
                    colorField="type"
                    radius={0.8}
                    interactions={[{ type: 'element-active' }]}
                  />
                </div>

                <Divider style={{ margin: '24px 0 16px' }} />

                <ul style={{ padding: 0, listStyle: 'none' }}>
                  {categoryStats.map((stat) => (
                    <li key={stat.category} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <Tag color={stat.color}>{stat.categoryLabel}</Tag>
                        <Text>{stat.count}笔</Text>
                      </div>
                      <Text strong>¥{stat.amount.toFixed(2)}</Text>
                    </li>
                  ))}
                </ul>
              </Card>
            )
          }
        </Col >

        <Col xs={24} lg={16}>
          <Card
            title="支出记录"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={showAddExpenseModal}
              >
                添加支出
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={expenses.map(exp => ({ ...exp, key: exp._id }))}
              pagination={expenses.length > 10 ? { pageSize: 10 } : false}
              locale={{ emptyText: '暂无支出记录' }}
            />
          </Card>
        </Col>
      </Row >

      {/* 添加/编辑支出的模态框 */}
      < Modal
        title={expenseModalMode === 'add' ? '添加支出' : '编辑支出'}
        visible={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText={expenseModalMode === 'add' ? '添加' : '保存'}
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="title"
            label="支出项目"
            rules={[{ required: true, message: '请输入支出项目名称' }]}
          >
            <Input placeholder="例如：酒店住宿、餐饮费用等" />
          </Form.Item>

          <Form.Item
            name="amount"
            label="金额"
            rules={[{ required: true, message: '请输入支出金额' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\¥\s?|(,*)/g, '')}
              placeholder="例如：299.99"
            />
          </Form.Item>

          <Form.Item
            name="category"
            label="类别"
            rules={[{ required: true, message: '请选择支出类别' }]}
          >
            <Select placeholder="选择支出类别">
              {categoryOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <Tag color={option.color}>{option.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="date"
            label="日期"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="description"
            label="备注"
          >
            <Input.TextArea rows={3} placeholder="添加支出备注信息..." />
          </Form.Item>
        </Form>
      </Modal >
    </div >
  );
};

export default BudgetManager; 