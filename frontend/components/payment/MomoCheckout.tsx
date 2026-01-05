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
          <QrcodeOutlined /> QR Code
        </span>
      ),
      children: (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <h4 style={{ marginBottom: '16px' }}>Scan with MoMo App</h4>
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
                <p>1. Open your MoMo app</p>
                <p>2. Select "Scan QR"</p>
                <p>3. Scan the code above to pay</p>
              </div>
            </>
          ) : (
            <Alert
              message="QR Code not available"
              description="Please use one of the other payment methods"
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
          <MobileOutlined /> Open App
        </span>
      ),
      children: (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <MobileOutlined style={{ fontSize: '64px', color: '#a50064' }} />
          </div>
          <h4 style={{ marginBottom: '8px' }}>Pay with MoMo App</h4>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Click the button below to open MoMo app and complete your payment
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
            Open MoMo App
          </Button>
          <p style={{ marginTop: '16px', fontSize: '12px', color: '#999' }}>
            Don't have MoMo app? Download it from App Store or Google Play
          </p>
        </div>
      ),
    },
    {
      key: 'web',
      label: (
        <span>
          <GlobalOutlined /> Web Payment
        </span>
      ),
      children: (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <GlobalOutlined style={{ fontSize: '64px', color: '#a50064' }} />
          </div>
          <h4 style={{ marginBottom: '8px' }}>Pay via MoMo Website</h4>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Complete your payment on MoMo's secure payment page
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
            Continue to MoMo
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
          MoMo Payment
        </h4>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          Choose your preferred payment method
        </p>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
        <p>
          🔒 Secured by MoMo - Vietnam's leading e-wallet
        </p>
      </div>
    </div>
  );
}

