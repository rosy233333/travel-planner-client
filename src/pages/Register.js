import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Card, Divider, message, Radio } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from '../utils/AuthContext';

const { Title, Text } = Typography;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const onFinish = async (values) => {
    setLoading(true);
    
    try {
      // 构建偏好数据
      const preferences = {
        travelStyle: values.travelStyle,
        budgetLevel: values.budgetLevel || '中等'
      };
      
      const result = await register(
        values.username,
        values.email,
        values.password,
        preferences
      );
      
      if (result.success) {
        message.success('注册成功，欢迎加入！');
        navigate('/dashboard');
      }
    } catch (error) {
      message.error('注册失败，请稍后重试');
      console.error('注册错误:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0' }}>
      <Card style={{ width: 500, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2}>创建账户</Title>
          <Text type="secondary">加入旅游行程规划系统，开始您的旅行规划</Text>
        </div>
        
        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          requiredMark="optional"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少为3个字符' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
              size="large" 
            />
          </Form.Item>
          
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="邮箱" 
              size="large" 
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少为6个字符' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码" 
              size="large" 
            />
          </Form.Item>
          
          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="确认密码" 
              size="large" 
            />
          </Form.Item>
          
          <Title level={4} style={{ marginTop: 20 }}>旅行偏好</Title>
          
          <Form.Item
            name="travelStyle"
            label="您喜欢的旅行风格是?"
            initialValue="休闲"
          >
            <Radio.Group>
              <Radio.Button value="休闲">休闲</Radio.Button>
              <Radio.Button value="冒险">冒险</Radio.Button>
              <Radio.Button value="文化">文化</Radio.Button>
              <Radio.Button value="美食">美食</Radio.Button>
              <Radio.Button value="奢华">奢华</Radio.Button>
              <Radio.Button value="经济">经济</Radio.Button>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item
            name="budgetLevel"
            label="您的预算等级是?"
            initialValue="中等"
          >
            <Radio.Group>
              <Radio.Button value="经济">经济</Radio.Button>
              <Radio.Button value="中等">中等</Radio.Button>
              <Radio.Button value="高端">高端</Radio.Button>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large"
              block
              loading={loading}
            >
              注册
            </Button>
          </Form.Item>
        </Form>
        
        <Divider>或者</Divider>
        
        <div style={{ textAlign: 'center' }}>
          <Text>已有账号？</Text>
          <Link to="/login" style={{ marginLeft: 8 }}>
            立即登录
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Register; 