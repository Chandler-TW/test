import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Spin, Alert, Row, Col, Card } from 'antd';
import { AppointmentForm } from '../../components/customer';
import { Service, Appointment } from '../../types';

const { Title } = Typography;

const AppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/services');
        
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        
        const data = await response.json();
        setServices(data);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('无法加载服务项目，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleSubmitAppointment = async (
    appointmentData: Omit<Appointment, 'id' | 'status' | 'appointmentCode' | 'createdAt' | 'updatedAt'>
  ): Promise<void> => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '预约提交失败');
      }

      const data = await response.json();
      
      // Store appointment data in session storage for confirmation page
      sessionStorage.setItem('appointmentConfirmation', JSON.stringify(data));
      
      // Navigate happens in the component that calls this function
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      throw new Error(err.message || '预约提交失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>加载服务项目...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container" style={{ padding: '20px' }}>
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          action={
            <a onClick={() => window.location.reload()}>重试</a>
          }
        />
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="no-services" style={{ padding: '20px' }}>
        <Alert
          message="无可用服务"
          description="当前没有可预约的服务项目，请稍后再试"
          type="info"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="appointment-page">
      <Row justify="center">
        <Col xs={24} sm={20} md={16} lg={14}>
          <Card className="appointment-container">
            <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>
              理发服务预约
            </Title>
            <AppointmentForm 
              services={services}
              onSubmit={handleSubmitAppointment}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AppointmentPage;