'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Spin, Button, Select } from 'antd';
import { LoadingOutlined, BankOutlined } from '@ant-design/icons';

interface VNPayCheckoutProps {
  paymentData: {
    paymentId: string;
    paymentUrl?: string;
  };
}

const banks = [
  { code: 'VIETCOMBANK', name: 'Vietcombank' },
  { code: 'VIETINBANK', name: 'VietinBank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'AGRIBANK', name: 'Agribank' },
  { code: 'TECHCOMBANK', name: 'Techcombank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'MB', name: 'MB Bank' },
  { code: 'SACOMBANK', name: 'Sacombank' },
  { code: 'VPBank', name: 'VPBank' },
  { code: 'HDBANK', name: 'HDBank' },
];

export default function VNPayCheckout({ paymentData }: VNPayCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  const handleProceed = () => {
    if (paymentData.paymentUrl) {
      setLoading(true);
      // Add bank code to URL if selected
      let url = paymentData.paymentUrl;
      if (selectedBank) {
        url += `&vnp_BankCode=${selectedBank}`;
      }
      window.location.href = url;
    }
  };

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
          <BankOutlined style={{ marginRight: '8px' }} />
          Thanh toán VNPay
        </h4>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          Chọn ngân hàng của bạn để tiếp tục thanh toán
        </p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          Chọn ngân hàng (Tùy chọn)
        </label>
        <Select
          placeholder="Chọn ngân hàng của bạn"
          style={{ width: '100%' }}
          value={selectedBank}
          onChange={setSelectedBank}
          size="large"
          showSearch
          optionFilterProp="children"
        >
          {banks.map((bank) => (
            <Select.Option key={bank.code} value={bank.code}>
              {bank.name}
            </Select.Option>
          ))}
        </Select>
        <p style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
          Hoặc chọn ngân hàng trên trang thanh toán VNPay
        </p>
      </div>

      {!loading ? (
        <Button
          type="primary"
          size="large"
          block
          onClick={handleProceed}
          disabled={!paymentData.paymentUrl}
          icon={<BankOutlined />}
        >
          Tiếp tục đến VNPay
        </Button>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
          <p style={{ marginTop: '16px', color: '#666' }}>
            Đang chuyển đến VNPay...
          </p>
        </div>
      )}

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
        <p>
          🔒 Bảo mật bởi VNPay - Cổng thanh toán uy tín của Việt Nam
        </p>
      </div>
    </div>
  );
}

