import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Input, 
  Select, 
  DatePicker, 
  Modal, 
  Form, 
  Tabs,
  Typography,
  message,
  Tooltip,
  Badge,
  Space,
  Row,
  Col,
  Timeline
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  ClockCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Appointment, Stylist } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface AppointmentDashboardProps {
  userRole: 'admin' | 'stylist';
  userId?: number;
}

const AppointmentDashboard: React.FC<AppointmentDashboardProps> = ({ userRole, userId }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedStylist, setSelectedStylist] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [editForm] = Form.useForm();

  // Appointment status colors for tags
  const statusColors = {
    'pending': 'blue',
    'confirmed': 'green',
    'in-progress': 'orange',
    'completed': 'success',
    'cancelled': 'red'
  };

  // Fetch appointments and stylists on component mount
  useEffect(() => {
    fetchAppointmentsAndStylists();
  }, []);

  // Filter appointments when date or stylist changes
  useEffect(() => {
    filterAppointments();
  }, [appointments, selectedDate, selectedStylist, searchText]);

  const fetchAppointmentsAndStylists = async () => {
    try {
      setLoading(true);
      
      // Fetch appointments based on user role
      let appointmentUrl = '/api/appointments';
      if (userRole === 'stylist' && userId) {
        appointmentUrl += `?stylistId=${userId}`;
      }
      
      const [appointmentsResponse, stylistsResponse] = await Promise.all([
        fetch(appointmentUrl),
        fetch('/api/stylists')
      ]);
      
      if (!appointmentsResponse.ok || !stylistsResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const [appointmentsData, stylistsData] = await Promise.all([
        appointmentsResponse.json(),
        stylistsResponse.json()
      ]);
      
      setAppointments(appointmentsData);
      setStylists(stylistsData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('加载数据失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];
    
    // Filter by date
    if (selectedDate) {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      filtered = filtered.filter(a => a.date === dateStr);
    }
    
    // Filter by stylist
    if (selectedStylist) {
      filtered = filtered.filter(a => a.stylistId === selectedStylist);
    }
    
    // Filter by search text (customer name, phone or appointment code)
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(a => 
        a.customerName.toLowerCase().includes(search) ||
        a.customerPhone.includes(search) ||
        a.appointmentCode.includes(search)
      );
    }
    
    // Sort by time
    filtered.sort((a, b) => {
      const dateTimeA = `${a.date} ${a.startTime}`;
      const dateTimeB = `${b.date} ${b.startTime}`;
      return dateTimeA.localeCompare(dateTimeB);
    });
    
    setFilteredAppointments(filtered);
    
    // Highlight appointments that are about to start (within 15 minutes)
    const now = dayjs();
    filtered.forEach(appointment => {
      if (appointment.date === now.format('YYYY-MM-DD') && 
          appointment.status === 'confirmed') {
        const appointmentTime = dayjs(`${appointment.date} ${appointment.startTime}`);
        const minutesDiff = appointmentTime.diff(now, 'minute');
        
        if (minutesDiff <= 15 && minutesDiff > 0) {
          // Mark appointments that are starting soon
          // We'll handle this in the render function
        }
      }
    });
  };

  const handleStatusChange = async (appointmentId: number, newStatus: Appointment['status']) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update appointment status');
      }
      
      const updatedAppointment = await response.json();
      
      // Update appointments list
      setAppointments(prevAppointments => 
        prevAppointments.map(a => 
          a.id === appointmentId ? updatedAppointment : a
        )
      );
      
      message.success('预约状态已更新');
    } catch (error) {
      console.error('Error updating appointment status:', error);
      message.error('更新预约状态失败');
    }
  };

  const showEditModal = (appointment: Appointment) => {
    setCurrentAppointment(appointment);
    
    // Populate form with current values
    editForm.setFieldsValue({
      stylistId: appointment.stylistId,
      date: dayjs(appointment.date),
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      notes: appointment.notes
    });
    
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      if (!currentAppointment) return;
      
      const values = await editForm.validateFields();
      
      const updatedAppointment = {
        ...currentAppointment,
        stylistId: values.stylistId,
        date: values.date.format('YYYY-MM-DD'),
        startTime: values.startTime,
        endTime: values.endTime,
        status: values.status,
        notes: values.notes
      };
      
      const response = await fetch(`/api/appointments/${currentAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedAppointment)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }
      
      const result = await response.json();
      
      // Update appointments list
      setAppointments(prevAppointments => 
        prevAppointments.map(a => 
          a.id === currentAppointment.id ? result : a
        )
      );
      
      message.success('预约信息已更新');
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error updating appointment:', error);
      message.error('更新预约信息失败');
    }
  };

  const handleRefresh = () => {
    fetchAppointmentsAndStylists();
  };

  const renderTimelineItem = (appointment: Appointment) => {
    const now = dayjs();
    const appointmentTime = dayjs(`${appointment.date} ${appointment.startTime}`);
    const minutesDiff = appointmentTime.diff(now, 'minute');
    const isSoon = appointment.status === 'confirmed' && minutesDiff <= 15 && minutesDiff > 0;
    
    // Determine the color of the timeline item based on status
    let color = 'blue';
    if (appointment.status === 'in-progress') color = 'orange';
    else if (appointment.status === 'completed') color = 'green';
    else if (appointment.status === 'cancelled') color = 'red';
    else if (isSoon) color = 'gold'; // Appointments starting soon
    
    return (
      <Timeline.Item 
        key={appointment.id}
        color={color}
        dot={isSoon ? <ClockCircleOutlined style={{ fontSize: '16px' }} /> : undefined}
      >
        <Card 
          size="small" 
          className={isSoon ? 'appointment-soon' : ''}
          style={isSoon ? { borderLeft: '4px solid gold' } : undefined}
        >
          <Row>
            <Col span={6}>
              <Text strong>{appointment.startTime} - {appointment.endTime}</Text>
              {isSoon && (
                <Badge 
                  count="即将到店" 
                  style={{ backgroundColor: '#faad14', marginLeft: '8px' }} 
                />
              )}
            </Col>
            <Col span={6}>
              <Text type="secondary"><UserOutlined /> {appointment.customerName}</Text>
            </Col>
            <Col span={6}>
              <Tag color={statusColors[appointment.status] as string}>
                {appointment.status === 'pending' && '待确认'}
                {appointment.status === 'confirmed' && '已确认'}
                {appointment.status === 'in-progress' && '服务中'}
                {appointment.status === 'completed' && '已完成'}
                {appointment.status === 'cancelled' && '已取消'}
              </Tag>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Space>
                {appointment.status === 'confirmed' && (
                  <Button 
                    size="small" 
                    type="primary" 
                    onClick={() => handleStatusChange(appointment.id, 'in-progress')}
                  >
                    开始服务
                  </Button>
                )}
                {appointment.status === 'in-progress' && (
                  <Button 
                    size="small" 
                    type="primary" 
                    onClick={() => handleStatusChange(appointment.id, 'completed')}
                  >
                    完成服务
                  </Button>
                )}
                {userRole === 'admin' && (
                  <Button 
                    size="small" 
                    type="default" 
                    icon={<EditOutlined />}
                    onClick={() => showEditModal(appointment)}
                  />
                )}
              </Space>
            </Col>
          </Row>
          <div style={{ marginTop: '8px' }}>
            <Text type="secondary">
              服务：{appointment.serviceName} | 发型师：{appointment.stylistName || '随机分配'} | 预约码：{appointment.appointmentCode}
            </Text>
            {appointment.notes && (
              <div style={{ marginTop: '4px' }}>
                <Text type="secondary" italic>备注: {appointment.notes}</Text>
              </div>
            )}
          </div>
        </Card>
      </Timeline.Item>
    );
  };
  
  // Group appointments by status for the timeline view
  const pendingAppointments = filteredAppointments.filter(a => a.status === 'pending' || a.status === 'confirmed');
  const activeAppointments = filteredAppointments.filter(a => a.status === 'in-progress');
  const completedAppointments = filteredAppointments.filter(a => 
    a.status === 'completed' && dayjs(a.date).isSame(selectedDate, 'day')
  );

  return (
    <div className="appointment-dashboard">
      <Card>
        <Title level={3}>预约管理</Title>
        
        <div className="dashboard-filters" style={{ marginBottom: '20px' }}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={6}>
              <DatePicker 
                value={selectedDate}
                onChange={date => setSelectedDate(date || dayjs())}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Select
                placeholder="选择发型师"
                value={selectedStylist}
                onChange={setSelectedStylist}
                allowClear
                style={{ width: '100%' }}
                disabled={userRole === 'stylist'}
              >
                {stylists.map(stylist => (
                  <Option key={stylist.id} value={stylist.id}>
                    {stylist.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={8}>
              <Input
                placeholder="搜索客户姓名/手机号/预约码"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                prefix={<SearchOutlined />}
                allowClear
              />
            </Col>
            <Col xs={24} sm={4} style={{ textAlign: 'right' }}>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                loading={loading}
              >
                刷新
              </Button>
            </Col>
          </Row>
        </div>
        
        <Tabs defaultActiveKey="timeline">
          <TabPane tab="时间轴视图" key="timeline">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>加载中...</div>
            ) : (
              <div className="appointment-timeline">
                <Title level={4}>
                  待服务 
                  <Badge 
                    count={pendingAppointments.length} 
                    style={{ backgroundColor: '#1890ff', marginLeft: '8px' }}
                  />
                </Title>
                {pendingAppointments.length > 0 ? (
                  <Timeline>
                    {pendingAppointments.map(renderTimelineItem)}
                  </Timeline>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    暂无待服务预约
                  </div>
                )}
                
                <Title level={4}>
                  服务中
                  <Badge 
                    count={activeAppointments.length} 
                    style={{ backgroundColor: '#fa8c16', marginLeft: '8px' }}
                  />
                </Title>
                {activeAppointments.length > 0 ? (
                  <Timeline>
                    {activeAppointments.map(renderTimelineItem)}
                  </Timeline>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    暂无正在服务中的预约
                  </div>
                )}
                
                <Title level={4}>
                  已完成
                  <Badge 
                    count={completedAppointments.length} 
                    style={{ backgroundColor: '#52c41a', marginLeft: '8px' }}
                  />
                </Title>
                {completedAppointments.length > 0 ? (
                  <Timeline>
                    {completedAppointments.map(renderTimelineItem)}
                  </Timeline>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    暂无已完成预约
                  </div>
                )}
              </div>
            )}
          </TabPane>
          
          <TabPane tab="表格视图" key="table">
            <Table
              dataSource={filteredAppointments}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              columns={[
                {
                  title: '日期',
                  dataIndex: 'date',
                  key: 'date',
                  width: 100,
                },
                {
                  title: '时间',
                  key: 'time',
                  width: 120,
                  render: (_, record) => `${record.startTime} - ${record.endTime}`
                },
                {
                  title: '客户姓名',
                  dataIndex: 'customerName',
                  key: 'customerName',
                  width: 100,
                },
                {
                  title: '手机号码',
                  dataIndex: 'customerPhone',
                  key: 'customerPhone',
                  width: 120,
                },
                {
                  title: '服务项目',
                  dataIndex: 'serviceName',
                  key: 'serviceName',
                  width: 120,
                },
                {
                  title: '发型师',
                  dataIndex: 'stylistName',
                  key: 'stylistName',
                  width: 100,
                  render: (text) => text || '随机分配'
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  width: 100,
                  render: (status: Appointment['status']) => (
                    <Tag color={statusColors[status] as string}>
                      {status === 'pending' && '待确认'}
                      {status === 'confirmed' && '已确认'}
                      {status === 'in-progress' && '服务中'}
                      {status === 'completed' && '已完成'}
                      {status === 'cancelled' && '已取消'}
                    </Tag>
                  )
                },
                {
                  title: '预约码',
                  dataIndex: 'appointmentCode',
                  key: 'appointmentCode',
                  width: 100,
                },
                {
                  title: '操作',
                  key: 'action',
                  fixed: 'right',
                  width: 180,
                  render: (_, record) => (
                    <Space>
                      {record.status === 'pending' && (
                        <Button 
                          size="small" 
                          type="primary" 
                          onClick={() => handleStatusChange(record.id, 'confirmed')}
                          icon={<CheckCircleOutlined />}
                        >
                          确认
                        </Button>
                      )}
                      {record.status === 'confirmed' && (
                        <Button 
                          size="small" 
                          type="primary" 
                          onClick={() => handleStatusChange(record.id, 'in-progress')}
                        >
                          开始服务
                        </Button>
                      )}
                      {record.status === 'in-progress' && (
                        <Button 
                          size="small" 
                          type="primary" 
                          onClick={() => handleStatusChange(record.id, 'completed')}
                        >
                          完成
                        </Button>
                      )}
                      {userRole === 'admin' && record.status !== 'completed' && record.status !== 'cancelled' && (
                        <Button 
                          size="small" 
                          danger
                          onClick={() => {
                            Modal.confirm({
                              title: '取消预约',
                              icon: <ExclamationCircleOutlined />,
                              content: '确定要取消这个预约吗？',
                              okText: '确定',
                              cancelText: '取消',
                              onOk: () => handleStatusChange(record.id, 'cancelled')
                            });
                          }}
                          icon={<CloseCircleOutlined />}
                        >
                          取消
                        </Button>
                      )}
                      {userRole === 'admin' && (
                        <Tooltip title="编辑预约">
                          <Button 
                            size="small" 
                            icon={<EditOutlined />} 
                            onClick={() => showEditModal(record)}
                          />
                        </Tooltip>
                      )}
                    </Space>
                  ),
                },
              ]}
              scroll={{ x: 1300 }}
            />
          </TabPane>
        </Tabs>
      </Card>
      
      {/* Edit Appointment Modal */}
      <Modal
        title="编辑预约信息"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleEditSubmit}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="stylistId"
                label="发型师"
              >
                <Select placeholder="选择发型师" allowClear>
                  {stylists.map(stylist => (
                    <Option key={stylist.id} value={stylist.id}>
                      {stylist.name}
                    </Option>
                  ))}
                  <Option value={null}>随机分配</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="date"
                label="预约日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startTime"
                label="开始时间"
                rules={[{ required: true, message: '请输入开始时间' }]}
              >
                <Input placeholder="09:00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endTime"
                label="结束时间"
                rules={[{ required: true, message: '请输入结束时间' }]}
              >
                <Input placeholder="10:00" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Option value="pending">待确认</Option>
              <Option value="confirmed">已确认</Option>
              <Option value="in-progress">服务中</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="notes"
            label="备注"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AppointmentDashboard;