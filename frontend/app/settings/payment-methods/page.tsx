'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  List,
  Button,
  Empty,
  message,
  Modal,
  Tag,
  Spin,
  Space,
} from 'antd';
import {
  CreditCardOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
  PlusOutlined,
} from '@ant-design/icons';
import paymentService, { PaymentMethod } from '../../../service/paymentService';

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ visible: boolean; method: PaymentMethod | null }>({
    visible: false,
    method: null,
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      message.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (method: PaymentMethod) => {
    setDeleteModal({ visible: true, method });
  };

  const confirmDelete = async () => {
    if (!deleteModal.method) return;

    try {
      await paymentService.deletePaymentMethod(deleteModal.method._id);
      message.success('Payment method removed successfully');
      setDeleteModal({ visible: false, method: null });
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
      message.error('Failed to remove payment method');
    }
  };

  const getCardBrandIcon = (brand?: string) => {
    // In a real app, you would return actual card brand icons
    return <CreditCardOutlined style={{ fontSize: '24px' }} />;
  };

  const formatCardNumber = (last4?: string) => {
    if (!last4) return 'N/A';
    return `•••• •••• •••• ${last4}`;
  };

  const formatExpiry = (month?: number, year?: number) => {
    if (!month || !year) return 'N/A';
    return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 600, margin: 0 }}>
            Payment Methods
          </h1>
          <p style={{ color: '#666', marginTop: '8px' }}>
            Manage your saved payment methods
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => message.info('Add payment method functionality will be available when making a purchase')}
        >
          Add Method
        </Button>
      </div>

      {paymentMethods.length === 0 ? (
        <Card>
          <Empty
            description="No payment methods saved"
            style={{ padding: '48px 0' }}
          >
            <p style={{ marginTop: '16px', color: '#666' }}>
              Payment methods will be saved automatically when you make a purchase with the "Save for future" option checked.
            </p>
          </Empty>
        </Card>
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
          dataSource={paymentMethods}
          renderItem={(method) => (
            <List.Item>
              <Card
                hoverable
                style={{
                  border: method.isDefault ? '2px solid #1890ff' : '1px solid #d9d9d9',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Space size="middle">
                    <div style={{ fontSize: '32px' }}>
                      {getCardBrandIcon(method.brand)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 600 }}>
                          {method.brand || method.methodType}
                        </span>
                        {method.isDefault && (
                          <Tag color="blue" icon={<StarFilled />}>
                            Default
                          </Tag>
                        )}
                        <Tag color={
                          method.gateway === 'stripe' ? 'purple' :
                          method.gateway === 'vnpay' ? 'green' :
                          method.gateway === 'momo' ? 'magenta' : 'default'
                        }>
                          {paymentService.getGatewayLabel(method.gateway)}
                        </Tag>
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {formatCardNumber(method.last4)}
                      </div>
                      {(method.expiryMonth || method.expiryYear) && (
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                          Expires: {formatExpiry(method.expiryMonth, method.expiryYear)}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        Added: {new Date(method.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </Space>
                  <Space>
                    {!method.isDefault && (
                      <Button
                        icon={<StarOutlined />}
                        onClick={() => message.info('Set as default functionality coming soon')}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(method)}
                    >
                      Remove
                    </Button>
                  </Space>
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}

      <Modal
        title="Remove Payment Method"
        open={deleteModal.visible}
        onOk={confirmDelete}
        onCancel={() => setDeleteModal({ visible: false, method: null })}
        okText="Remove"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>
          Are you sure you want to remove this payment method?
        </p>
        {deleteModal.method && (
          <Card style={{ marginTop: '16px', backgroundColor: '#f5f5f5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {getCardBrandIcon(deleteModal.method.brand)}
              <div>
                <div style={{ fontWeight: 600 }}>
                  {deleteModal.method.brand || deleteModal.method.methodType}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {formatCardNumber(deleteModal.method.last4)}
                </div>
              </div>
            </div>
          </Card>
        )}
        <p style={{ marginTop: '16px', color: '#ff4d4f', fontSize: '14px' }}>
          This action cannot be undone.
        </p>
      </Modal>

      <Card style={{ marginTop: '24px', backgroundColor: '#f5f5f5' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
          💡 Payment Method Tips
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#666' }}>
          <li>Saved payment methods are encrypted and stored securely</li>
          <li>You can save a payment method during checkout for faster purchases</li>
          <li>Set a default payment method for quicker checkout</li>
          <li>You can remove any saved payment method at any time</li>
        </ul>
      </Card>
    </div>
  );
}

