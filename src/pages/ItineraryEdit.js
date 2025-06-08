import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form, Input, DatePicker, InputNumber, Select, Button,
  Card, Typography, message, Spin, Tabs, Row, Col,
  Divider, List, Timeline, Modal, Space, Avatar, Tag, Empty, Switch, TimePicker, AutoComplete
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
  const [searchedDestinations, setSearchedDestinations] = useState([]);
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
        console.log('API返回的原始数据:', response.data);

        // itinerary_ = getDestinationsInItinerary(response.data.itinerary);
        itinerary_ = response.data.itinerary;
        console.log('行程基本信息:', itinerary_);
        console.log('dailyPlans原始数据:', itinerary_.dailyPlans);
        console.log('itineraryDays原始数据:', itinerary_.itineraryDays);

        // 如果没有itineraryDays但有dailyPlans，尝试解析
        if (itinerary_.dailyPlans) {
          try {
            console.log('尝试解析dailyPlans:', itinerary_.dailyPlans);
            console.log('dailyPlans类型:', typeof itinerary_.dailyPlans);

            // 确保dailyPlans是字符串
            let dailyPlansStr = itinerary_.dailyPlans;
            if (typeof dailyPlansStr !== 'string') {
              console.log('dailyPlans不是字符串，进行转换');
              dailyPlansStr = JSON.stringify(dailyPlansStr);
            }

            // 尝试解析dailyPlans
            let dailyPlansObj;
            try {
              dailyPlansObj = JSON.parse(dailyPlansStr);
              console.log('解析后的dailyPlans对象:', dailyPlansObj);
              console.log('dailyPlansObj类型:', typeof dailyPlansObj);
              console.log('dailyPlansObj是否为数组:', Array.isArray(dailyPlansObj));

              // 如果解析结果是字符串，可能是双重编码，再次尝试解析
              if (typeof dailyPlansObj === 'string') {
                console.log('dailyPlansObj仍然是字符串，可能是双重编码，再次尝试解析');
                try {
                  dailyPlansObj = JSON.parse(dailyPlansObj);
                  console.log('二次解析后的dailyPlansObj:', dailyPlansObj);
                  console.log('二次解析后dailyPlansObj类型:', typeof dailyPlansObj);
                  console.log('二次解析后dailyPlansObj是否为数组:', Array.isArray(dailyPlansObj));
                } catch (e) {
                  console.error('二次解析dailyPlans失败:', e);
                }
              }
            } catch (e) {
              console.error('解析dailyPlans字符串失败:', e);
              console.error('dailyPlansStr内容:', dailyPlansStr);
              // 尝试移除可能的转义字符
              try {
                dailyPlansStr = dailyPlansStr.replace(/\\/g, '');
                dailyPlansObj = JSON.parse(dailyPlansStr);
                console.log('移除转义字符后解析成功:', dailyPlansObj);
              } catch (e2) {
                console.error('移除转义字符后解析仍然失败:', e2);
                throw e; // 抛出原始错误
              }
            }

            // 将对象格式的dailyPlans转换为数组格式的itineraryDays
            // 从 {day1: {date:..., activities:[...]}, day2:{...}} 转换为 [{date:..., activities:[...]}, ...]
            const itineraryDays = [];

            // 处理两种可能的格式
            if (Array.isArray(dailyPlansObj)) {
              // 如果已经是数组格式，直接使用
              console.log('dailyPlans已经是数组格式，长度:', dailyPlansObj.length);
              itinerary_.itineraryDays = dailyPlansObj;
            } else if (typeof dailyPlansObj === 'object' && dailyPlansObj !== null) {
              // 如果是对象格式，转换为数组
              console.log('dailyPlans是对象格式，转换为数组');
              console.log('对象键:', Object.keys(dailyPlansObj));

              Object.keys(dailyPlansObj).forEach(key => {
                const dayData = dailyPlansObj[key];
                console.log(`处理${key}:`, dayData);
                if (dayData && dayData.date) {
                  itineraryDays.push({
                    date: dayData.date,
                    activities: dayData.activities || []
                  });
                }
              });

              // 按日期排序
              itineraryDays.sort((a, b) => new Date(a.date) - new Date(b.date));

              itinerary_.itineraryDays = itineraryDays;
            } else {
              console.error('无法识别的dailyPlans格式:', dailyPlansObj);
              itinerary_.itineraryDays = [];
            }

            console.log('解析后的itineraryDays:', itinerary_.itineraryDays);
            console.log('itineraryDays长度:', itinerary_.itineraryDays.length);

            // 确保每个日期的活动都是数组
            itinerary_.itineraryDays.forEach((day, index) => {
              console.log(`检查第${index + 1}天的活动:`, day);
              if (!day.activities) {
                console.log(`第${index + 1}天没有activities字段，设置为空数组`);
                day.activities = [];
              } else if (!Array.isArray(day.activities)) {
                console.log(`第${index + 1}天的activities不是数组，转换为数组`);
                day.activities = [day.activities];
              }
              console.log(`第${index + 1}天的活动数量:`, day.activities.length);
            });
          } catch (e) {
            console.error('解析dailyPlans失败:', e);
            console.error('错误详情:', e.message);
            console.error('错误堆栈:', e.stack);
            // 确保有一个空数组
            itinerary_.itineraryDays = itinerary_.itineraryDays || [];
          }
        } else if (!itinerary_.itineraryDays) {
          // 如果没有itineraryDays也没有dailyPlans，设置为空数组
          console.log('没有日程安排数据，设置为空数组');
          itinerary_.itineraryDays = [];
        }
      } catch (error) {
        console.error('获取行程API调用失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
        itinerary_ = TestItinerary;
      }

      console.log('设置到状态的行程数据:', itinerary_);
      console.log('行程中的日程安排数据:', itinerary_.itineraryDays);
      setItinerary(itinerary_);

      setCollaborators(itinerary_.collaborators || []);

      // 设置表单值
      form.setFieldsValue({
        title: itinerary_.title,
        destinations: itinerary_.destinations,
        dateRange: [
          moment(itinerary_.startDate),
          moment(itinerary_.endDate)
        ],
        duration: moment(itinerary_.endDate).diff(moment(itinerary_.startDate), 'days') + 1,
        totalBudget: itinerary_.totalBudget,
        description: itinerary_.description,
        isShared: itinerary_.isShared,
        pacePreference: itinerary_.preferences?.pacePreference,
        accommodationType: itinerary_.preferences?.accommodationType,
        transportationType: itinerary_.preferences?.transportationType,
        activityPreferences: itinerary_.preferences?.activityPreferences,
        specialRequirements: itinerary_.preferences?.specialRequirements
      });

      // // 设置已选择的目的地
      // if (itinerary_.destinations && itinerary_.destinations.length > 0) {
      //   setSelectedDestinations(itinerary_.destinations);
      // }
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
      if (response.data.destinations) {
        setDestinations(response.data.destinations);
      }
      else {
        throw new Error('目的地数据格式不正确');
      }

    } catch (error) {
      console.error('获取目的地列表失败:', error);
      message.error('获取目的地列表失败');
      setDestinations(TestDestinations);
    }
  };

  // const handleDestinationChange = (selectedIds) => {
  //   const selected = destinations.filter(d => selectedIds.includes(d.id));
  //   setSelectedDestinations(selected);
  // };

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

      // 添加版本控制参数（这些将被后端单独处理，不是实体的一部分）
      itineraryData._createNewVersion = true; // 指示后端创建新版本
      itineraryData._versionMessage = '更新了行程基本信息'; // 版本说明

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

  // 保存日程安排修改并创建新版本
  const handleSaveScheduleChanges = async () => {
    try {
      setSaving(true);

      // 深拷贝当前行程
      const updatedItinerary = JSON.parse(JSON.stringify(itinerary));

      // 确保将itineraryDays数据序列化为JSON字符串并保存到dailyPlans字段
      if (updatedItinerary.itineraryDays) {
        // 将数组格式的itineraryDays转换为对象格式的dailyPlans
        // 后端期望的格式为 {day1: {date:..., activities:[...]}, day2:{...}}
        const formattedDailyPlans = {};
        updatedItinerary.itineraryDays.forEach((day, index) => {
          // 确保活动数据完整
          const activities = day.activities.map(activity => ({
            title: activity.title || '未命名活动',
            timeStart: activity.timeStart || '00:00',
            timeEnd: activity.timeEnd || '23:59',
            location: activity.location || '',
            description: activity.description || ''
          }));

          formattedDailyPlans[`day${index + 1}`] = {
            date: day.date,
            activities: activities
          };
        });

        updatedItinerary.dailyPlans = JSON.stringify(formattedDailyPlans);
        console.log('序列化后的dailyPlans:', updatedItinerary.dailyPlans);
      }

      // 创建一个精简版的数据对象，只包含必要的字段
      // 注意：_createNewVersion和_versionMessage必须作为独立参数发送，不能作为itinerary实体的一部分
      const minimalUpdate = {
        id: updatedItinerary.id,
        dailyPlans: updatedItinerary.dailyPlans
      };

      // 添加版本控制参数（这些将被后端单独处理，不是实体的一部分）
      minimalUpdate._createNewVersion = true; // 指示后端创建新版本
      minimalUpdate._versionMessage = '更新了日程安排'; // 版本说明

      try {
        // 更新行程
        const response = await apiService.itineraries.update(id, minimalUpdate);
        console.log('保存日程安排响应:', response);

        message.success('日程安排已保存，并创建了新版本');
        await fetchItineraryDetail(); // 重新获取行程信息
      } catch (updateError) {
        console.error('API调用失败:', updateError);
        console.error('响应数据:', updateError.response?.data);
        message.error('保存日程安排失败: ' + (updateError.response?.data?.message || updateError.message));
      }
    } catch (error) {
      console.error('保存日程安排失败:', error);
      message.error('保存日程安排失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  // 保存协作者修改并创建新版本
  const handleSaveCollaboratorChanges = async () => {
    try {
      setSaving(true);

      // 创建一个精简版的数据对象，只包含协作者信息
      const collaboratorUpdate = {
        id: itinerary.id,
        collaborators: collaborators,
        _createNewVersion: true, // 指示后端创建新版本
        _versionMessage: '更新了协作者' // 版本说明
      };

      await apiService.itineraries.update(id, collaboratorUpdate);
      message.success('协作者信息已保存，并创建了新版本');
      await fetchItineraryDetail(); // 重新获取行程信息
    } catch (error) {
      console.error('保存协作者信息失败:', error);
      message.error('保存协作者信息失败: ' + (error.response?.data?.message || error.message));
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
      const updatedItinerary = JSON.parse(JSON.stringify(itinerary));
      let dayIndex = -1;

      // 确保itineraryDays存在
      if (!updatedItinerary.itineraryDays) {
        updatedItinerary.itineraryDays = [];
      }

      // 查找当前日期的索引
      dayIndex = updatedItinerary.itineraryDays.findIndex(d => d.date === currentDay.date);

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
      const activity = {
        title: values.title,
        timeStart: values.time[0].format("HH:mm"),
        timeEnd: values.time[1].format("HH:mm"),
        location: values.location,
        description: values.description
      };

      // 确保activities数组存在
      if (!updatedItinerary.itineraryDays[dayIndex].activities) {
        updatedItinerary.itineraryDays[dayIndex].activities = [];
      }

      if (currentActivity) {
        // 更新现有活动
        const actIndex = updatedItinerary.itineraryDays[dayIndex].activities.findIndex(
          a => a.title === currentActivity.title && a.timeStart === currentActivity.timeStart
        );

        if (actIndex !== -1) {
          updatedItinerary.itineraryDays[dayIndex].activities[actIndex] = activity;
        } else {
          // 如果找不到活动（罕见情况），添加新活动
          updatedItinerary.itineraryDays[dayIndex].activities.push(activity);
        }
      } else {
        // 添加新活动
        updatedItinerary.itineraryDays[dayIndex].activities.push(activity);
      }

      console.log('更新行程数据:', updatedItinerary);
      console.log('日程安排数据:', updatedItinerary.itineraryDays);

      // 将数组格式的itineraryDays转换为对象格式的dailyPlans
      // 后端期望的格式为 {day1: {date:..., activities:[...]}, day2:{...}}
      const formattedDailyPlans = {};
      updatedItinerary.itineraryDays.forEach((day, index) => {
        // 确保活动数据完整
        const activities = day.activities.map(activity => ({
          title: activity.title || '未命名活动',
          timeStart: activity.timeStart || '00:00',
          timeEnd: activity.timeEnd || '23:59',
          location: activity.location || '',
          description: activity.description || ''
        }));

        formattedDailyPlans[`day${index + 1}`] = {
          date: day.date,
          activities: activities
        };
      });

      // 更新dailyPlans字段
      updatedItinerary.dailyPlans = JSON.stringify(formattedDailyPlans);
      console.log('序列化后的dailyPlans:', updatedItinerary.dailyPlans);

      // 创建一个精简版的数据对象，只包含必要的字段
      const minimalUpdate = {
        id: updatedItinerary.id,
        dailyPlans: updatedItinerary.dailyPlans
      };

      // 不创建新版本，只在点击"保存修改"按钮时创建
      // minimalUpdate._createNewVersion = true; 
      // minimalUpdate._versionMessage = currentActivity ? `更新了活动: ${values.title}` : `添加了新活动: ${values.title}`;
      console.log('发送的更新数据:', minimalUpdate);

      try {
        // 更新行程
        const response = await apiService.itineraries.update(id, minimalUpdate);
        console.log('保存活动响应:', response);

        message.success(currentActivity ? '活动更新成功' : '活动添加成功');
        setActivityModalVisible(false);
        activityForm.resetFields();
        await fetchItineraryDetail(); // 重新获取行程信息
      } catch (updateError) {
        console.error('API调用失败:', updateError);
        console.error('响应数据:', updateError.response?.data);
        message.error('保存活动失败: ' + (updateError.response?.data?.message || updateError.message));
      }
    } catch (error) {
      console.error('保存活动失败:', error);
      message.error('保存活动失败');
    }
  };

  const handleRemoveActivity = async (day, activity) => {
    try {
      // 深拷贝当前行程
      const updatedItinerary = JSON.parse(JSON.stringify(itinerary));

      // 确保itineraryDays存在
      if (!updatedItinerary.itineraryDays) {
        message.error('行程数据不完整，无法删除活动');
        return;
      }

      const dayIndex = updatedItinerary.itineraryDays.findIndex(d => d.date === day.date);

      if (dayIndex !== -1) {
        // 确保activities数组存在
        if (!updatedItinerary.itineraryDays[dayIndex].activities) {
          message.error('该日期没有活动数据');
          return;
        }

        const actIndex = updatedItinerary.itineraryDays[dayIndex].activities.findIndex(
          a => a.title === activity.title && a.timeStart === activity.timeStart
        );

        if (actIndex !== -1) {
          // 移除活动
          updatedItinerary.itineraryDays[dayIndex].activities.splice(actIndex, 1);

          // 将数组格式的itineraryDays转换为对象格式的dailyPlans
          // 后端期望的格式为 {day1: {date:..., activities:[...]}, day2:{...}}
          const formattedDailyPlans = {};
          updatedItinerary.itineraryDays.forEach((day, index) => {
            // 确保活动数据完整
            const activities = day.activities.map(activity => ({
              title: activity.title || '未命名活动',
              timeStart: activity.timeStart || '00:00',
              timeEnd: activity.timeEnd || '23:59',
              location: activity.location || '',
              description: activity.description || ''
            }));

            formattedDailyPlans[`day${index + 1}`] = {
              date: day.date,
              activities: activities
            };
          });

          // 更新dailyPlans字段
          updatedItinerary.dailyPlans = JSON.stringify(formattedDailyPlans);

          // 创建一个精简版的数据对象，只包含必要的字段
          const minimalUpdate = {
            id: updatedItinerary.id,
            dailyPlans: updatedItinerary.dailyPlans
          };

          // 不创建新版本，只在点击"保存修改"按钮时创建
          // minimalUpdate._createNewVersion = true;
          // minimalUpdate._versionMessage = `删除了活动: ${activity.title}`;

          console.log('发送的更新数据:', minimalUpdate);

          try {
            // 更新行程
            const response = await apiService.itineraries.update(id, minimalUpdate);
            console.log('删除活动响应:', response);

            message.success('活动删除成功');
            await fetchItineraryDetail(); // 重新获取行程信息
          } catch (updateError) {
            console.error('API调用失败:', updateError);
            console.error('响应数据:', updateError.response?.data);
            message.error('删除活动失败: ' + (updateError.response?.data?.message || updateError.message));
          }
        } else {
          message.error('找不到要删除的活动');
        }
      } else {
        message.error('找不到对应的日期');
      }
    } catch (error) {
      console.error('删除活动失败:', error);
      message.error('删除活动失败');
    }
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

  // 生成行程日期范围内的所有天
  const getDaysBetweenDates = (startDate, endDate) => {
    console.log('生成日期范围:', startDate, endDate);
    if (!startDate || !endDate) {
      console.warn('缺少开始日期或结束日期');
      return [];
    }

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
  console.log('生成的日期范围数组:', days);

  // 合并现有活动到日期数组
  if (itinerary.itineraryDays && itinerary.itineraryDays.length > 0) {
    console.log('合并前的itineraryDays:', itinerary.itineraryDays);

    // 确保每个活动都有必要的字段
    itinerary.itineraryDays.forEach(day => {
      if (day.activities) {
        day.activities = day.activities.map(activity => {
          return {
            title: activity.title || '未命名活动',
            timeStart: activity.timeStart || '00:00',
            timeEnd: activity.timeEnd || '23:59',
            location: activity.location || '',
            description: activity.description || ''
          };
        });
      } else {
        day.activities = [];
      }

      const index = days.findIndex(d => d.date === day.date);
      console.log(`处理日期 ${day.date}, 在days中的索引: ${index}`);

      if (index !== -1) {
        console.log(`日期 ${day.date} 的活动:`, day.activities);
        days[index].activities = day.activities || [];
      } else {
        console.warn(`日期 ${day.date} 不在行程范围内`);
      }
    });

    console.log('合并后的days数组:', days);
  } else {
    console.log('没有itineraryDays数据可合并');
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
                    rules={[{ required: true, message: '请选择或输入至少一个目的地' }]}
                  >
                    <Select
                      mode="tags"
                      placeholder="选择或输入目的地"
                      // onChange={handleDestinationChange}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={4}>日程安排</Title>
              <Button
                type="primary"
                onClick={handleSaveScheduleChanges}
                loading={saving}
              >
                保存修改
              </Button>
            </div>

            <Timeline>
              {days.map((day, index) => {
                console.log(`渲染第${index + 1}天 ${day.date}:`, day);
                return (
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
                        <>
                          <div style={{ marginBottom: 8 }}>活动数量: {day.activities.length}</div>
                          <List
                            itemLayout="horizontal"
                            dataSource={day.activities}
                            renderItem={(activity, actIndex) => {
                              console.log(`渲染活动 ${actIndex + 1}:`, activity);
                              return (
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
                                      onClick={() => handleRemoveActivity(day, activity)}
                                    >
                                      删除
                                    </Button>
                                  ]}
                                >
                                  <List.Item.Meta
                                    avatar={<Avatar style={{ backgroundColor: '#91d5ff' }}>{actIndex + 1}</Avatar>}
                                    title={
                                      <div>
                                        {activity.title}
                                        <Tag color="blue" style={{ marginLeft: 8 }}>
                                          {activity.timeStart} - {activity.timeEnd}
                                        </Tag>
                                      </div>
                                    }
                                    description={
                                      <>
                                        <div><EnvironmentOutlined /> {activity.location || '未设置地点'}</div>
                                        <div>{activity.description || '无描述'}</div>
                                      </>
                                    }
                                  />
                                </List.Item>
                              )
                            }}
                          />
                        </>
                      ) : (
                        <Empty description="暂无活动安排" />
                      )}
                    </div>
                  </Timeline.Item>
                )
              })}
            </Timeline>
          </Card>
        </TabPane>

        <TabPane
          tab={<span><TeamOutlined />协作者</span>}
          key="collaborators"
        >
          <Card title="管理协作者">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={showCollaboratorModal}
              >
                添加协作者
              </Button>

              <Button
                type="primary"
                onClick={handleSaveCollaboratorChanges}
                loading={saving}
              >
                保存修改
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
            <AutoComplete
              placeholder="选择或输入活动地点"
              loading={loading}
              optionFilterProp="children"
              onSearch={value => {
                if (value) {
                  const filtered = destinations.filter(destination =>
                    destination.name.includes(value)
                  );
                  setSearchedDestinations(filtered);
                } else {
                  setSearchedDestinations(destinations);
                }
              }}
            >
              {
                searchedDestinations.map(destination => (
                  <Option key={destination.id} value={destination.name}>
                    {destination.name} ({destination.country}, {destination.city})
                  </Option>
                ))
              }
            </AutoComplete>
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
    </div >
  );
};

export default ItineraryEdit; 