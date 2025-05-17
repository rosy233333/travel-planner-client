import React from 'react';
import { Layout, Row, Col, Typography, Space, Divider } from 'antd';

const { Footer: AntFooter } = Layout;
const { Text, Link: TextLink } = Typography;

const Footer = () => {
  return (
    <AntFooter style={{ textAlign: 'center', background: '#f0f2f5', padding: '24px 50px' }}>
      <Row gutter={[16, 24]}>
        <Col xs={24} sm={24} md={8}>
          <div style={{ textAlign: 'center' }}>
            <h3>旅游行程规划系统</h3>
            <Text type="secondary">为旅行者提供智能规划服务</Text>
          </div>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <h4>主要功能</h4>
          <Space direction="vertical">
            <TextLink>目的地推荐</TextLink>
            <TextLink>路线生成</TextLink>
            <TextLink>预算管理</TextLink>
            <TextLink>多端协同编辑</TextLink>
          </Space>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <h4>技术支持</h4>
          <Space direction="vertical">
            <TextLink href="https://reactjs.org/" target="_blank">React</TextLink>
            <TextLink href="https://ant.design/" target="_blank">Ant Design</TextLink>
            <TextLink href="https://nodejs.org/" target="_blank">Node.js</TextLink>
            <TextLink href="https://www.mongodb.com/" target="_blank">MongoDB</TextLink>
          </Space>
        </Col>
      </Row>
      
      <Divider style={{ margin: '24px 0 12px' }} />
      
      <Text type="secondary">
        &copy; {new Date().getFullYear()} 旅游行程规划系统 - 版权所有
      </Text>
    </AntFooter>
  );
};

export default Footer; 