import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Service, Stylist, TimeSlot, Appointment, Customer } from '../../types';
import { Form, Button, Select, DatePicker, Input, Card, Row, Col, Alert, Typography, Space } from 'antd';
import { ClockCircleOutlined, UserOutlined, ScissorOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

interface AppointmentFormProps {
  onSubmit: (appointment: Omit<Appointment, 'id' | 'status' | 'appointmentCode' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  services: Service[];
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ onSubmit, services }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedStylist, setSelectedStylist] = useState<number | 'random'>(0);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch stylists when service changes
  useEffect(() => {
    if (!selectedService) return;
    
    const fetchStylists = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/stylists?serviceId=${selectedService.id}`);
        if (!response.ok) throw new Error('Failed to fetch stylists');
        
        const data = await response.json();
        setStylists(data);
      } catch (err) {
        setError('Error loading stylists. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStylists();
  }, [selectedService]);

  // Fetch available time slots when date and service change
  useEffect(() => {
    if (!selectedDate || !selectedService) return;
    
    const fetchTimeSlots = async () => {
      try {
        setLoading(true);
        let url = `/api/timeslots?date=${selectedDate}&serviceId=${selectedService.id}`;
        if (selectedStylist && selectedStylist !== 'random') {
          url += `&stylistId=${selectedStylist}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch time slots');
        
        const data = await response.json();
        setAvailableTimeSlots(data);
      } catch (err) {
        setError('Error loading available time slots. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimeSlots();
  }, [selectedDate, selectedService, selectedStylist]);

  const handleServiceChange = (serviceId: number) => {
    const service = services.find(s => s.id === serviceId) || null;
    setSelectedService(service);
    form.setFieldsValue({ stylistId: null, timeSlot: null });
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (!date) {
      setSelectedDate('');
      return;
    }
    setSelectedDate(date.format('YYYY-MM-DD'));
    form.setFieldsValue({ timeSlot: null });
  };

  const handleStylistChange = (value: number | 'random') => {
    setSelectedStylist(value);
    form.setFieldsValue({ timeSlot: null });
  };

  const validatePhone = (_: any, value: string) => {
    const phoneRegex = /^1[3456789]\d{9}$/;  // Chinese phone format
    if (!value || phoneRegex.test(value)) {
      return Promise.resolve();
    }
    return Promise.reject(new Error('请输入有效的手机号码'));
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const selectedTimeSlot = availableTimeSlots.find(t => t.id === values.timeSlot);
      if (!selectedTimeSlot) throw new Error('Invalid time slot selected');
      
      const appointmentData = {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        serviceId: selectedService!.id,
        serviceName: selectedService!.name,
        stylistId: values.stylistId === 'random' ? undefined : values.stylistId,
        date: selectedDate,
        startTime: selectedTimeSlot.startTime,
        endTime: selectedTimeSlot.endTime,
        notes: values.notes || ''
      };
      
      await onSubmit(appointmentData);
      navigate('/appointment/confirmation');
    } catch (err) {
      console.error(err);
      setError('预约提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const disabledDate = (current: dayjs.Dayjs) => {
    // Disable dates before today and more than 7 days in the future
    return current.isBefore(dayjs().startOf('day')) || 
           current.isAfter(dayjs().add(7, 'day').endOf('day'));
  };
  
  return (
    <Card className="appointment-form-card">
      <Title level={3}>预约理发服务</Title>
      
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark="optional"
      >
        <Form.Item
          name="serviceId"
          label="选择服务"
          rules={[{ required: true, message: '请选择服务类型' }]}
        >
          <Select 
            placeholder="选择您需要的服务" 
            onChange={handleServiceChange}
            suffixIcon={<ScissorOutlined />}
          >
            {services.map(service => (
              <Option key={service.id} value={service.id}>
                {service.name} - {service.duration}分钟 - ¥{service.price}
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item
          name="appointmentDate"
          label="选择日期"
          rules={[{ required: true, message: '请选择预约日期' }]}
        >
          <DatePicker 
            style={{ width: '100%' }} 
            disabledDate={disabledDate}
            onChange={handleDateChange}
            placeholder="选择日期"
          />
        </Form.Item>
        
        {selectedService && (
          <Form.Item
            name="stylistId"
            label="选择发型师"
            rules={[{ required: true, message: '请选择发型师或随机分配' }]}
          >
            <Select 
              placeholder="选择发型师"
              onChange={handleStylistChange}
              loading={loading}
              suffixIcon={<UserOutlined />}
            >
              <Option value="random">随机分配发型师</Option>
              {stylists.map(stylist => (
                <Option key={stylist.id} value={stylist.id}>
                  {stylist.name} - 评分: {stylist.rating.toFixed(1)} - 服务: {stylist.appointmentCount}次
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}
        
        {selectedDate && selectedService && (
          <Form.Item
            name="timeSlot"
            label="选择时间段"
            rules={[{ required: true, message: '请选择预约时间段' }]}
          >
            <Select 
              placeholder="选择可用的时间段"
              loading={loading}
              disabled={availableTimeSlots.length === 0}
              suffixIcon={<ClockCircleOutlined />}
            >
              {availableTimeSlots.length > 0 ? (
                availableTimeSlots
                  .filter(slot => slot.isAvailable)
                  .map(slot => (
                    <Option key={slot.id} value={slot.id}>
                      {slot.startTime} - {slot.endTime}
                    </Option>
                  ))
              ) : (
                <Option disabled value="none">当前日期没有可用时间段</Option>
              )}
            </Select>
          </Form.Item>
        )}
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="customerName"
              label="姓名"
              rules={[{ required: true, message: '请输入您的姓名' }]}
            >
              <Input placeholder="您的姓名" maxLength={50} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="customerPhone"
              label="手机号码"
              rules={[
                { required: true, message: '请输入您的手机号码' },
                { validator: validatePhone }
              ]}
            >
              <Input placeholder="11位手机号码" maxLength={11} />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
          name="notes"
          label="预约备注 (可选)"
        >
          <TextArea 
            placeholder="请填写特殊需求或其他备注信息" 
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={200} 
            showCount
          />
        </Form.Item>
        
        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button type="default" onClick={() => navigate('/')}>取消</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              提交预约
            </Button>
          </Space>
        </Form.Item>
      </Form>
      
      {selectedService && (
        <Alert 
          message="预约提示" 
          description={`${selectedService.name}服务时长约${selectedService.duration}分钟，请提前10分钟到店，迟到超过15分钟可能会取消预约。`}
          type="info"
          showIcon
        />
      )}
    </Card>
  );
};

export default AppointmentForm;