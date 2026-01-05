'use client';

import React, { useState } from 'react';
import { Tabs, Button, QRCode, Alert } from 'antd';
import { MobileOutlined, QrcodeOutlined, GlobalOutlined } from '@ant-design/icons';

interface MomoCheckoutProps {
  paymentData: {
    paymentId: string;
    payUrl?: string;
    deeplink?: string;
    qrCodeUrl?: string;
  };
}

export default function MomoCheckout({ paymentData }: MomoCheckoutProps) {
  const [activeTab, setActiveTab] = useState('qr');

  const handleOpenMomoApp = () => {
    if (paymentData.deeplink) {
      window.location.href = paymentData.deeplink;
      // Fallback to web URL after a short delay if app doesn't open
      setTimeout(() => {
        if (paymentData.payUrl) {
          window.location.href = paymentData.payUrl;
        }
      }, 2000);
    } else if (paymentData.payUrl) {
      window.location.href = paymentData.payUrl;
    }
  };

  const handleWebPayment = () => {
    if (paymentData.payUrl) {
      window.location.href = paymentData.payUrl;
    }
  };

  const tabItems = [
    {
      key: 'qr',
      label: (
        <span>
          <QrcodeOutlined /> Mã QR
        </span>
      ),
      children: (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <h4 style={{ marginBottom: '16px' }}>Quét mã QR bằng ứng dụng MoMo</h4>
          {paymentData.payUrl ? (
            <>
              <div
                style={{
                  display: 'inline-block',
                  padding: '16px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <QRCode value={paymentData.payUrl} size={200} />
              </div>
              <div style={{ marginTop: '16px', color: '#666' }}>
                <p>1. Mở ứng dụng MoMo</p>
                <p>2. Chọn "Quét mã QR"</p>
                <p>3. Quét mã phía trên để thanh toán</p>
              </div>
            </>
          ) : (
            <Alert
              message="Mã QR không khả dụng"
              description="Vui lòng sử dụng một trong các phương thức thanh toán khác"
              type="warning"
            />
          )}
        </div>
      ),
    },
    {
      key: 'app',
      label: (
        <span>
          <MobileOutlined /> Mở ứng dụng
        </span>
      ),
      children: (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <MobileOutlined style={{ fontSize: '64px', color: '#a50064' }} />
          </div>
          <h4 style={{ marginBottom: '8px' }}>Thanh toán bằng ứng dụng MoMo</h4>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Nhấn nút bên dưới để mở ứng dụng MoMo và hoàn tất thanh toán
          </p>
          <Button
            type="primary"
            size="large"
            icon={<MobileOutlined />}
            onClick={handleOpenMomoApp}
            style={{
              backgroundColor: '#a50064',
              borderColor: '#a50064',
              minWidth: '200px',
            }}
          >
            Mở ứng dụng MoMo
          </Button>
          <p style={{ marginTop: '16px', fontSize: '12px', color: '#999' }}>
            Chưa có ứng dụng MoMo? Tải từ App Store hoặc Google Play
          </p>
        </div>
      ),
    },
    {
      key: 'web',
      label: (
        <span>
          <GlobalOutlined /> Thanh toán Web
        </span>
      ),
      children: (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <GlobalOutlined style={{ fontSize: '64px', color: '#a50064' }} />
          </div>
          <h4 style={{ marginBottom: '8px' }}>Thanh toán qua Website MoMo</h4>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Hoàn tất thanh toán trên trang thanh toán bảo mật của MoMo
          </p>
          <Button
            type="primary"
            size="large"
            icon={<GlobalOutlined />}
            onClick={handleWebPayment}
            style={{
              backgroundColor: '#a50064',
              borderColor: '#a50064',
              minWidth: '200px',
            }}
          >
            Tiếp tục đến MoMo
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        marginBottom: '16px',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
          <MobileOutlined style={{ marginRight: '8px', color: '#a50064' }} />
          Thanh toán MoMo
        </h4>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          Chọn phương thức thanh toán bạn muốn
        </p>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
        <p>
          🔒 Bảo mật bởi MoMo - Ví điện tử hàng đầu Việt Nam
        </p>
      </div>
    </div>
  );
}

