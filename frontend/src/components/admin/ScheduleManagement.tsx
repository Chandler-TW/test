import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Calendar, 
  Modal, 
  Form, 
  TimePicker, 
  Input, 
  Button, 
  Select, 
  Switch, 
  message, 
  Table,
  Tag,
  Row,
  Col,
  Typography,
  Space,
  Badge,
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import type { CalendarMode } from 'antd/es/calendar/generateCalendar';
import type { Moment } from 'moment';
import moment from 'moment';
import { Stylist, ScheduleDay } from '../../types';

const { Option } = Select;
const { RangePicker } = TimePicker;
const { Title, Text } = Typography;

interface ScheduleManagementProps {}

const ScheduleManagement: React.FC<ScheduleManagementProps> = () => {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [selectedStylist, setSelectedStylist] = useState<number | null>(null);
  const [scheduleData, setScheduleData] = useState<{[date: string]: ScheduleDay}>({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isBatchModalVisible, setIsBatchModalVisible] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Fetch stylists when component mounts
  useEffect(() => {
    fetchStylists();
  }, []);

  // Fetch schedule data when stylist changes
  useEffect(() => {
    if (selectedStylist) {
      fetchScheduleForStylist(selectedStylist);
    }
  }, [selectedStylist]);

  const fetchStylists = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stylists');
      
      if (!response.ok) {
        throw new Error('Failed to fetch stylists');
      }
      
      const data = await response.json();
      setStylists(data);
      
      if (data.length > 0) {
        setSelectedStylist(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching stylists:', error);
      message.error('加载发型师数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleForStylist = async (stylistId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stylists/${stylistId}/schedule`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }
      
      const data = await response.json();
      
      // Convert array to object with date as key
      const scheduleObj: {[date: string]: ScheduleDay} = {};
      data.forEach((item: ScheduleDay) => {
        scheduleObj[item.date] = item;
      });
      
      setScheduleData(scheduleObj);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      message.error('加载排班数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStylistChange = (value: number) => {
    setSelectedStylist(value);
  };

  const handleCalendarSelect = (date: Moment) => {
    const dateStr = date.format('YYYY-MM-DD');
    setCurrentDate(dateStr);
    
    // Initialize form with existing values or defaults
    if (scheduleData[dateStr]) {
      const schedule = scheduleData[dateStr];
      form.setFieldsValue({
        isWorkDay: schedule.isWorkDay,
        timeRange: schedule.startTime && schedule.endTime 
          ? [moment(schedule.startTime, 'HH:mm'), moment(schedule.endTime, 'HH:mm')] 
          : undefined,
        maxAppointments: schedule.maxAppointments,
        isHoliday: schedule.isHoliday,
      });
    } else {
      form.setFieldsValue({
        isWorkDay: true,
        timeRange: [moment('09:00', 'HH:mm'), moment('20:00', 'HH:mm')],
        maxAppointments: 10,
        isHoliday: false,
      });
    }
    
    setIsModalVisible(true);
  };

  const handleDateCellRender = (date: Moment) => {
    const dateStr = date.format('YYYY-MM-DD');
    const scheduleDay = scheduleData[dateStr];
    
    if (!scheduleDay) {
      return null;
    }
    
    if (!scheduleDay.isWorkDay) {
      return (
        <div className="schedule-cell">
          <Badge status="error" text="休息日" />
        </div>
      );
    }
    
    if (scheduleDay.isHoliday) {
      return (
        <div className="schedule-cell">
          <Badge status="warning" text="特殊工作日" />
          <div>
            {scheduleDay.startTime} - {scheduleDay.endTime}
          </div>
          <div>最多: {scheduleDay.maxAppointments}位</div>
        </div>
      );
    }
    
    return (
      <div className="schedule-cell">
        <Badge status="success" text="工作日" />
        <div>
          {scheduleDay.startTime} - {scheduleDay.endTime}
        </div>
        <div>最多: {scheduleDay.maxAppointments}位</div>
      </div>
    );
  };

  const handleSaveSchedule = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      if (!selectedStylist) {
        message.error('请先选择发型师');
        return;
      }
      
      const scheduleDay: ScheduleDay = {
        date: currentDate,
        isWorkDay: values.isWorkDay,
        startTime: values.isWorkDay ? values.timeRange[0].format('HH:mm') : undefined,
        endTime: values.isWorkDay ? values.timeRange[1].format('HH:mm') : undefined,
        maxAppointments: values.isWorkDay ? values.maxAppointments : undefined,
        isHoliday: values.isHoliday,
      };
      
      const response = await fetch(`/api/stylists/${selectedStylist}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleDay),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save schedule');
      }
      
      // Update local state
      setScheduleData(prev => ({
        ...prev,
        [currentDate]: scheduleDay,
      }));
      
      message.success('排班已保存');
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error saving schedule:', error);
      message.error('保存排班失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async () => {
    try {
      if (!selectedStylist || !currentDate) {
        return;
      }
      
      setLoading(true);
      
      const response = await fetch(`/api/stylists/${selectedStylist}/schedule/${currentDate}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }
      
      // Update local state
      const newScheduleData = { ...scheduleData };
      delete newScheduleData[currentDate];
      setScheduleData(newScheduleData);
      
      message.success('排班已删除');
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error deleting schedule:', error);
      message.error('删除排班失败');
    } finally {
      setLoading(false);
    }
  };

  const showBatchModal = () => {
    batchForm.resetFields();
    setIsBatchModalVisible(true);
  };

  const handleSaveBatchSchedule = async () => {
    try {
      const values = await batchForm.validateFields();
      setLoading(true);
      
      if (!selectedStylist) {
        message.error('请先选择发型师');
        return;
      }
      
      // Prepare dates based on weekday selection
      const startDate = moment(values.dateRange[0]);
      const endDate = moment(values.dateRange[1]);
      const selectedWeekdays = values.weekdays || [];
      const batchScheduleDays: ScheduleDay[] = [];
      
      // Iterate through date range
      let currentDate = startDate.clone();
      while (currentDate.isSameOrBefore(endDate)) {
        // If the current day of week is selected or no weekdays selected (apply to all days)
        if (selectedWeekdays.length === 0 || 
            selectedWeekdays.includes(currentDate.day().toString())) {
          batchScheduleDays.push({
            date: currentDate.format('YYYY-MM-DD'),
            isWorkDay: values.isWorkDay,
            startTime: values.isWorkDay ? values.timeRange[0].format('HH:mm') : undefined,
            endTime: values.isWorkDay ? values.timeRange[1].format('HH:mm') : undefined,
            maxAppointments: values.isWorkDay ? values.maxAppointments : undefined,
            isHoliday: values.isHoliday,
          });
        }
        currentDate.add(1, 'days');
      }
      
      const response = await fetch(`/api/stylists/${selectedStylist}/schedule/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchScheduleDays),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save batch schedule');
      }
      
      // Update local state
      const newScheduleData = { ...scheduleData };
      batchScheduleDays.forEach(day => {
        newScheduleData[day.date] = day;
      });
      setScheduleData(newScheduleData);
      
      message.success(`已为 ${batchScheduleDays.length} 天设置排班`);
      setIsBatchModalVisible(false);
    } catch (error) {
      console.error('Error saving batch schedule:', error);
      message.error('批量设置排班失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="schedule-management">
      <div style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>排班管理</Title>
          </Col>
          <Col flex="auto">
            <Select
              style={{ width: 200 }}
              placeholder="选择发型师"
              value={selectedStylist}
              onChange={handleStylistChange}
              loading={loading && !selectedStylist}
            >
              {stylists.map(stylist => (
                <Option key={stylist.id} value={stylist.id}>{stylist.name}</Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={showBatchModal}
            >
              批量设置
            </Button>
          </Col>
        </Row>
      </div>

      <div className="schedule-calendar">
        <Calendar 
          onSelect={handleCalendarSelect}
          dateCellRender={handleDateCellRender}
          loading={loading}
        />
      </div>

      {/* Single Day Schedule Modal */}
      <Modal
        title={`设置 ${currentDate} 排班`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button 
            key="delete" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={handleDeleteSchedule}
            loading={loading}
          >
            删除排班
          </Button>,
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            取消
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleSaveSchedule}
            loading={loading}
          >
            保存
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="isWorkDay"
            label="工作日"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren={<CheckCircleOutlined />}
              unCheckedChildren={<CloseCircleOutlined />}
            />
          </Form.Item>
          
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.isWorkDay !== currentValues.isWorkDay}
          >
            {({ getFieldValue }) => 
              getFieldValue('isWorkDay') ? (
                <>
                  <Form.Item
                    name="timeRange"
                    label="工作时间"
                    rules={[{ required: true, message: '请选择工作时间' }]}
                  >
                    <RangePicker 
                      format="HH:mm"
                      minuteStep={30}
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name="maxAppointments"
                    label="最大预约数"
                    rules={[{ required: true, message: '请输入最大预约数' }]}
                  >
                    <Input type="number" min={1} max={50} />
                  </Form.Item>
                  
                  <Form.Item
                    name="isHoliday"
                    label="特殊工作日"
                    valuePropName="checked"
                    tooltip="特殊工作日会在日历上用不同颜色标记"
                  >
                    <Switch 
                      checkedChildren={<CheckCircleOutlined />}
                      unCheckedChildren={<CloseCircleOutlined />}
                    />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>

      {/* Batch Schedule Modal */}
      <Modal
        title="批量设置排班"
        open={isBatchModalVisible}
        onCancel={() => setIsBatchModalVisible(false)}
        onOk={handleSaveBatchSchedule}
        okText="批量保存"
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={batchForm}
          layout="vertical"
        >
          <Form.Item
            name="dateRange"
            label="日期范围"
            rules={[{ required: true, message: '请选择日期范围' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="weekdays"
            label="选择星期几应用"
          >
            <Select
              mode="multiple"
              placeholder="不选则应用于所有日期"
              style={{ width: '100%' }}
            >
              <Option value="0">星期日</Option>
              <Option value="1">星期一</Option>
              <Option value="2">星期二</Option>
              <Option value="3">星期三</Option>
              <Option value="4">星期四</Option>
              <Option value="5">星期五</Option>
              <Option value="6">星期六</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="isWorkDay"
            label="设为工作日"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch 
              checkedChildren={<CheckCircleOutlined />}
              unCheckedChildren={<CloseCircleOutlined />}
            />
          </Form.Item>
          
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.isWorkDay !== currentValues.isWorkDay}
          >
            {({ getFieldValue }) => 
              getFieldValue('isWorkDay') ? (
                <>
                  <Form.Item
                    name="timeRange"
                    label="工作时间"
                    rules={[{ required: true, message: '请选择工作时间' }]}
                    initialValue={[moment('09:00', 'HH:mm'), moment('20:00', 'HH:mm')]}
                  >
                    <RangePicker 
                      format="HH:mm"
                      minuteStep={30}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name="maxAppointments"
                    label="最大预约数"
                    rules={[{ required: true, message: '请输入最大预约数' }]}
                    initialValue={10}
                  >
                    <Input type="number" min={1} max={50} />
                  </Form.Item>
                  
                  <Form.Item
                    name="isHoliday"
                    label="标记为特殊工作日"
                    valuePropName="checked"
                    initialValue={false}
                    tooltip="特殊工作日(如节假日)会在日历中用不同颜色标记"
                  >
                    <Switch 
                      checkedChildren={<CheckCircleOutlined />}
                      unCheckedChildren={<CloseCircleOutlined />}
                    />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ScheduleManagement;