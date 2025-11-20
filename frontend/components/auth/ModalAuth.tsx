import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Form, Input, Button, message, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, SafetyOutlined, GoogleOutlined, FacebookOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';
import { useMessageApi } from '../providers/Message'; 
import { handleLogin, handleRegister, handleVerify } from '@/service/auth';
import VerifyEmailModal from './ModalVerify';
import modalStyles from '@/styles/modal.module.css';
import authModalStyles from '@/styles/authModal.module.css';
 
const { Title, Text, Link } = Typography;
 
const AuthModal= (props: any) => {
  const { visible, onClose, setOpen } = props;
  const [verify, setVerify] = useState(false);
  const messageApi = useMessageApi();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  // Cleanup handler when modal closes
  const handleAfterClose = () => {
    // Reset forms
    loginForm.resetFields();
    registerForm.resetFields();
    // Reset active tab to login
    setActiveTab('login');
    // Reset loading state
    setLoading(false);
    // Reset verify modal state
    setVerify(false);
  };

  // Reset forms when modal opens
  useEffect(() => {
    if (visible) {
      loginForm.resetFields();
      registerForm.resetFields();
      setActiveTab('login');
      setLoading(false);
      setVerify(false);
    }
  }, [visible, loginForm, registerForm]);


  const handleSubmit = async () => {
    try {
    const currentForm = activeTab === 'login' ? loginForm : registerForm;
    const values = await currentForm.validateFields();
    setLoading(true);
    const data = activeTab === 'login' ? {
      email: values.email,
      password: values.password
    } : {
      name: values.name,
      email: values.email,
      password: values.password,
      phone: values.phone
    }
    console.log(data)
    console.log(activeTab)
    try {
      const res = activeTab === 'login' ? (await handleLogin(data)) : (await handleRegister(data))
      console.log(res)
      if (res.statusCode !=200 && res.statusCode!=201){
        messageApi.error('Xảy ra lỗi! Vui lòng kiểm tra thông tin ')
        setLoading(false)
        return
      }
      if (activeTab === 'login') {
        Cookies.set('access_token', res.access_token)
        setLoading(false)
        messageApi.success('Đăng nhập thành công')
        // Delay để message hiển thị trước khi reload
        setTimeout(() => {
          setOpen(false)
          window.location.reload()
        }, 500)
      } else {
        Cookies.set('email', values.email)
        setLoading(false)
        setOpen(false)
        setVerify(true)
      }
      
    } catch(e) {
      console.log(e)
    }
      
    } catch (error) {
      console.log('Validation Failed:', error);
    }
  };
const tabItems = [
    {
      key: 'login',
      label: (
        <span className={authModalStyles.tabLabel}>
          <UserOutlined className={authModalStyles.tabLabelIcon} />
          Đăng nhập
        </span>
      ),
      children: (
        <div className={authModalStyles.formContainer}>
          <Form form={loginForm} layout="vertical" size="large" className={authModalStyles.form}>
          <Form.Item
            name="email"
              label={<span className={authModalStyles.label}>Email</span>}
              className={authModalStyles.formItem}
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
              <Input 
                prefix={<MailOutlined className={authModalStyles.inputIcon} />}
                placeholder="Nhập email của bạn" 
                className={authModalStyles.input}
              />
          </Form.Item>

          <Form.Item
            name="password"
              label={<span className={authModalStyles.label}>Mật khẩu</span>}
              className={authModalStyles.formItemSmall}
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
              <Input.Password 
                prefix={<LockOutlined className={authModalStyles.inputIcon} />}
                placeholder="Nhập mật khẩu của bạn" 
                className={authModalStyles.input}
              />
            </Form.Item>

            <Form.Item className={authModalStyles.formItemLink}>
              <div className={authModalStyles.linkContainer}>
                <Link href="#" className={authModalStyles.forgotPasswordLink} onClick={(e) => {
                  e.preventDefault();
                  messageApi.info('Tính năng quên mật khẩu đang được phát triển');
                }}>
                  Quên mật khẩu?
                </Link>
              </div>
          </Form.Item>

            <Divider className={authModalStyles.divider}>Hoặc</Divider>

            <div className={authModalStyles.socialButtonsContainer}>
              <Button
                size="large"
                icon={<GoogleOutlined className={authModalStyles.googleIcon} />}
                className={`${authModalStyles.socialButton} ${authModalStyles.googleButton}`}
                onClick={() => messageApi.info('Đăng nhập với Google đang được phát triển')}
              >
                Đăng nhập với Google
              </Button>
              <Button
                size="large"
                icon={<FacebookOutlined className={authModalStyles.facebookIcon} />}
                className={`${authModalStyles.socialButton} ${authModalStyles.facebookButton}`}
                onClick={() => messageApi.info('Đăng nhập với Facebook đang được phát triển')}
              >
                Đăng nhập với Facebook
              </Button>
            </div>
        </Form>
        </div>
      ),
    },
    {
      key: 'register',
      label: (
        <span className={authModalStyles.tabLabel}>
          <UserOutlined className={authModalStyles.tabLabelIcon} />
          Đăng ký
        </span>
      ),
      children: (
        <div 
          className={`${authModalStyles.formContainerScroll} ${modalStyles.registerFormScroll}`}
        >
          <Form form={registerForm} layout="vertical" size="large" className={authModalStyles.form}>
          <Form.Item
            name="name"
              label={<span className={authModalStyles.label}>Họ và tên</span>}
              className={authModalStyles.formItem}
            rules={[
              { required: true, message: 'Vui lòng nhập tên của bạn' },
            ]}
          >
              <Input 
                prefix={<UserOutlined className={authModalStyles.inputIcon} />}
                placeholder="Nhập họ và tên của bạn" 
                className={authModalStyles.input}
              />
          </Form.Item>

          <Form.Item
            name="email"
              label={<span className={authModalStyles.label}>Email</span>}
              className={authModalStyles.formItem}
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
              <Input 
                prefix={<MailOutlined className={authModalStyles.inputIcon} />}
                placeholder="Nhập email của bạn" 
                className={authModalStyles.input}
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label={<span className={authModalStyles.label}>Số điện thoại</span>}
              className={authModalStyles.formItem}
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại của bạn' },
              ]}
            >
              <Input 
                prefix={<PhoneOutlined className={authModalStyles.inputIcon} />}
                placeholder="Nhập số điện thoại của bạn" 
                className={authModalStyles.input}
              />
          </Form.Item>

          <Form.Item
            name="password"
              label={<span className={authModalStyles.label}>Mật khẩu</span>}
              className={authModalStyles.formItem}
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
              <Input.Password 
                prefix={<LockOutlined className={authModalStyles.inputIcon} />}
                placeholder="Nhập mật khẩu của bạn" 
                className={authModalStyles.input}
              />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
              label={<span className={authModalStyles.label}>Xác nhận mật khẩu</span>}
              className={authModalStyles.formItem}
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu không khớp!'));
                },
              }),
            ]}
          >
              <Input.Password 
                prefix={<SafetyOutlined className={authModalStyles.inputIcon} />}
                placeholder="Nhập lại mật khẩu của bạn" 
                className={authModalStyles.input}
              />
          </Form.Item>
        </Form>
        </div>
      ),
    },
  ];

  return (
    <>
    <VerifyEmailModal open={verify} onClose={() => setVerify(false)}/>

    <Modal
      open={visible}
      title={
        <div className={authModalStyles.modalTitle}>
          <Title level={3} className={authModalStyles.modalTitleText}>
            {activeTab === 'login' ? '👋 Chào mừng trở lại!' : '🎉 Tạo tài khoản mới'}
          </Title>
          <Text type="secondary" className={authModalStyles.modalSubtitle}>
            {activeTab === 'login' ? 'Đăng nhập để tiếp tục học tập' : 'Đăng ký để bắt đầu hành trình học tập của bạn'}
          </Text>
        </div>
      }
      onCancel={onClose}
      afterClose={handleAfterClose}
      destroyOnClose={true}
      maskClosable={true}
      footer={[
        <Button key="cancel" onClick={onClose} size="large" className={authModalStyles.cancelButton}>
          Hủy
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading} 
          onClick={handleSubmit}
          size="large"
          className={authModalStyles.submitButton}
        >
          {activeTab === 'login' ? 'Đăng nhập' : 'Đăng ký'}
        </Button>,
      ]}
      width={480}
      centered
      styles={{
        body: { 
          padding: '24px',
          maxHeight: 'calc(60vh)',
          overflowY: 'auto',
          overflowX: 'hidden'
        }
      }}
      style={{
        maxHeight: 'calc(70vh)',
        margin: 0,
        paddingBottom: 0
      }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          if (key === 'login') loginForm.resetFields();
          else registerForm.resetFields();
          setActiveTab(key as 'login' | 'register');
        }}
        items={tabItems}
        style={{ marginTop: '16px' }}
      />
    </Modal>
    </>

  );
};

export default AuthModal