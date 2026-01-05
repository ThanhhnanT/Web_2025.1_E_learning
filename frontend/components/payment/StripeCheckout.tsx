'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface StripeCheckoutProps {
  paymentData: {
    paymentId: string;
    sessionId?: string;
    url?: string;
  };
  onSuccess?: (paymentId: string) => void;
}

export default function StripeCheckout({ paymentData, onSuccess }: StripeCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (paymentData.url) {
      // Redirect to Stripe Checkout
      setTimeout(() => {
        window.location.href = paymentData.url!;
      }, 1000);
    } else {
      setError('No payment URL received from server');
      setLoading(false);
    }
  }, [paymentData]);

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        marginBottom: '16px',
        textAlign: 'center',
      }}
    >
      {loading && !error && (
        <>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
          <p style={{ marginTop: '16px', color: '#666' }}>
            Redirecting to secure payment page...
          </p>
          <p style={{ fontSize: '12px', color: '#999' }}>
            Please do not close this window
          </p>
        </>
      )}

      {error && (
        <Alert
          message="Payment Error"
          description={error}
          type="error"
          showIcon
          style={{ textAlign: 'left' }}
        />
      )}

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#999' }}>
        <p>
          🔒 Powered by Stripe - Your payment information is secure and encrypted
        </p>
      </div>
    </div>
  );
}

