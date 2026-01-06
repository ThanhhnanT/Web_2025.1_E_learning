'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Modal, Button, message, Spin, Alert } from 'antd';
import { CameraOutlined, ReloadOutlined, CheckOutlined } from '@ant-design/icons';
import faceVerificationService, { BoundingBox } from '@/service/faceVerification';

interface FaceVerificationCameraProps {
  open: boolean;
  onClose: () => void;
  onCapture: (imageBase64: string) => Promise<void>;
  title?: string;
  mode?: 'register' | 'verify';
  onSkip?: () => void; // Optional skip handler
  showSkipButton?: boolean; // Whether to show skip button
}

export default function FaceVerificationCamera({
  open,
  onClose,
  onCapture,
  title,
  mode = 'verify',
  onSkip,
  showSkipButton = false,
}: FaceVerificationCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceBoxes, setFaceBoxes] = useState<BoundingBox[]>([]);
  const [detectionMessage, setDetectionMessage] = useState<string>('');

  // Start camera when modal opens
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open]);

  // Face detection loop
  useEffect(() => {
    if (!cameraReady || !videoRef.current || !overlayCanvasRef.current) {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      return;
    }

    const detectFaces = async () => {
      const video = videoRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      
      if (!video || !overlayCanvas || video.readyState < 2 || video.videoWidth === 0) {
        return;
      }

      try {
        // Capture current frame
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (!tempCtx) {
          return;
        }
        
        tempCtx.drawImage(video, 0, 0);
        const imageBase64 = tempCanvas.toDataURL('image/jpeg', 0.8);
        
        // Call AI service to detect faces
        const response = await faceVerificationService.detectFaces(imageBase64);
        
        if (response.success) {
          setFaceBoxes(response.faces);
          
          // Update message based on face count
          if (response.face_count === 0) {
            setDetectionMessage('Hãy cho mặt vào khung hình');
          } else if (response.face_count === 1) {
            setDetectionMessage('');
          } else {
            setDetectionMessage('Cảnh báo: Phát hiện nhiều hơn 1 khuôn mặt!');
          }
          
          // Draw bounding boxes
          const overlayCtx = overlayCanvas.getContext('2d');
          if (overlayCtx) {
            overlayCanvas.width = video.videoWidth;
            overlayCanvas.height = video.videoHeight;
            
            // Clear previous frame
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            
            // Draw each bounding box
            response.faces.forEach((box) => {
              const x1 = box.x1;
              const y1 = box.y1;
              const x2 = box.x2;
              const y2 = box.y2;
              const width = x2 - x1;
              const height = y2 - y1;
              
              // Choose color based on face count
              const color = response.face_count === 1 ? '#52c41a' : '#ff4d4f';
              
              // Draw bounding box
              overlayCtx.strokeStyle = color;
              overlayCtx.lineWidth = 3;
              overlayCtx.strokeRect(x1, y1, width, height);
              
              // Draw corners
              const cornerLength = 20;
              overlayCtx.lineWidth = 4;
              
              // Top-left corner
              overlayCtx.beginPath();
              overlayCtx.moveTo(x1, y1 + cornerLength);
              overlayCtx.lineTo(x1, y1);
              overlayCtx.lineTo(x1 + cornerLength, y1);
              overlayCtx.stroke();
              
              // Top-right corner
              overlayCtx.beginPath();
              overlayCtx.moveTo(x1 + width - cornerLength, y1);
              overlayCtx.lineTo(x1 + width, y1);
              overlayCtx.lineTo(x1 + width, y1 + cornerLength);
              overlayCtx.stroke();
              
              // Bottom-left corner
              overlayCtx.beginPath();
              overlayCtx.moveTo(x1, y1 + height - cornerLength);
              overlayCtx.lineTo(x1, y1 + height);
              overlayCtx.lineTo(x1 + cornerLength, y1 + height);
              overlayCtx.stroke();
              
              // Bottom-right corner
              overlayCtx.beginPath();
              overlayCtx.moveTo(x1 + width - cornerLength, y1 + height);
              overlayCtx.lineTo(x1 + width, y1 + height);
              overlayCtx.lineTo(x1 + width, y1 + height - cornerLength);
              overlayCtx.stroke();
              
              // Draw confidence if available
              if (box.confidence !== undefined) {
                overlayCtx.fillStyle = color;
                overlayCtx.font = '14px Arial';
                overlayCtx.fillText(
                  `${(box.confidence * 100).toFixed(1)}%`,
                  x1 + 5,
                  y1 - 5
                );
              }
            });
          }
        }
      } catch (error: any) {
        // Silent error handling
      }
    };

    // Start detection loop (every 500ms)
    detectionIntervalRef.current = setInterval(detectFaces, 500);
    
    // Initial detection
    detectFaces();

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [cameraReady]);

  const startCamera = async () => {
    try {
      setLoading(true);
      setCameraReady(false);

      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user', // Front camera
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        const video = videoRef.current;
        
        // Add multiple event listeners
        const handleLoadedMetadata = () => {
          if (video) {
            video.play()
              .then(() => {
                setCameraReady(true);
                setLoading(false);
              })
              .catch((error) => {
                setLoading(false);
                message.error('Không thể phát video từ camera: ' + error.message);
              });
          }
        };

        const handleCanPlay = () => {
          if (video && !cameraReady) {
            setCameraReady(true);
            setLoading(false);
          }
        };

        const handlePlaying = () => {
          if (video && !cameraReady) {
            setCameraReady(true);
            setLoading(false);
          }
        };

        const handleError = (e: any) => {
          setLoading(false);
          message.error('Lỗi video: ' + (video.error?.message || 'Unknown error'));
        };

        // Store cleanup function
        const cleanup = () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('canplay', handleCanPlay);
          video.removeEventListener('playing', handlePlaying);
          video.removeEventListener('error', handleError);
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        video.addEventListener('canplay', handleCanPlay, { once: true });
        video.addEventListener('playing', handlePlaying, { once: true });
        video.addEventListener('error', handleError);

        // Fallback: set ready after a delay if events don't fire
        const timeoutId = setTimeout(() => {
          if (video && (video.readyState >= 2 || video.videoWidth > 0)) {
            cleanup();
            setCameraReady(true);
            setLoading(false);
          } else {
            video.play()
              .then(() => {
                cleanup();
                setCameraReady(true);
                setLoading(false);
              })
              .catch(() => {
                setLoading(false);
                message.warning('Camera đang khởi động chậm. Vui lòng thử lại.');
              });
          }
        }, 2000);

        // Store cleanup in ref for later use
        (videoRef.current as any).__cleanup = cleanup;
        (videoRef.current as any).__timeoutId = timeoutId;
      } else {
        setLoading(false);
        message.error('Không tìm thấy video element');
      }
    } catch (error: any) {
      setLoading(false);
      
      let errorMessage = 'Không thể truy cập camera. ';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Vui lòng cấp quyền truy cập camera.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'Không tìm thấy camera.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Camera đang được sử dụng bởi ứng dụng khác.';
      } else {
        errorMessage += error.message || 'Vui lòng kiểm tra quyền truy cập camera của trình duyệt.';
      }
      
      message.error(errorMessage);
      // Don't close modal, let user retry
    }
  };

  const stopCamera = () => {
    // Stop detection loop
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    // Cleanup event listeners and timeout
    if (videoRef.current) {
      const video = videoRef.current as any;
      if (video.__cleanup) {
        video.__cleanup();
        video.__cleanup = null;
      }
      if (video.__timeoutId) {
        clearTimeout(video.__timeoutId);
        video.__timeoutId = null;
      }
      video.srcObject = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    setCameraReady(false);
    setLoading(false);
    setFaceBoxes([]);
    setDetectionMessage('');
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) {
      return;
    }

    try {
      setCapturing(true);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

      // Call onCapture callback
      await onCapture(imageBase64);

      message.success('Ảnh đã được chụp thành công!');
    } catch (error: any) {
      message.error('Lỗi khi chụp ảnh. Vui lòng thử lại.');
    } finally {
      setCapturing(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={title || (mode === 'register' ? 'Đăng ký khuôn mặt' : 'Xác thực khuôn mặt')}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Hủy
        </Button>,
        ...(showSkipButton && onSkip ? [
          <Button
            key="skip"
            onClick={onSkip}
            danger
          >
            Tạm thời bỏ qua
          </Button>
        ] : []),
        <Button
          key="retry"
          icon={<ReloadOutlined />}
          onClick={startCamera}
          disabled={loading || capturing}
        >
          Làm mới
        </Button>,
        <Button
          key="capture"
          type="primary"
          icon={<CameraOutlined />}
          onClick={captureImage}
          loading={capturing}
          disabled={!cameraReady || loading}
        >
          {capturing ? 'Đang xử lý...' : 'Chụp ảnh'}
        </Button>,
      ]}
      width={600}
      centered
      destroyOnClose
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div
          style={{
            position: 'relative',
            display: 'inline-block',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: '#000',
            width: '100%',
            maxWidth: '640px',
            minHeight: '480px',
          }}
        >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  maxWidth: '640px',
                  height: 'auto',
                  minHeight: '480px',
                  backgroundColor: '#000',
                  objectFit: 'contain',
                  opacity: cameraReady ? 1 : 0,
                  position: cameraReady ? 'relative' : 'absolute',
                  zIndex: cameraReady ? 1 : 0,
                }}
              />
              <canvas
                ref={overlayCanvasRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  maxWidth: '640px',
                  height: 'auto',
                  minHeight: '480px',
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              />
          {(!cameraReady || loading) && (
            <div
              style={{
                width: '100%',
                maxWidth: '640px',
                minHeight: '480px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#000',
                color: '#fff',
                position: cameraReady ? 'absolute' : 'relative',
                top: cameraReady ? 0 : 'auto',
                left: cameraReady ? 0 : 'auto',
                right: cameraReady ? 0 : 'auto',
                bottom: cameraReady ? 0 : 'auto',
              }}
            >
              <Spin size="large" />
              <p style={{ marginTop: '16px', color: '#fff' }}>
                {loading ? 'Đang khởi động camera...' : 'Đang tải video...'}
              </p>
              {process.env.NODE_ENV === 'development' && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                  <div>Camera Ready: {cameraReady ? 'Yes' : 'No'}</div>
                  <div>Loading: {loading ? 'Yes' : 'No'}</div>
                  <div>Stream: {streamRef.current ? 'Active' : 'None'}</div>
                  {videoRef.current && (
                    <>
                      <div>Video ReadyState: {videoRef.current.readyState}</div>
                      <div>Video Size: {videoRef.current.videoWidth}x{videoRef.current.videoHeight}</div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {detectionMessage && (
          <Alert
            message={detectionMessage}
            type={faceBoxes.length > 1 ? 'error' : 'warning'}
            showIcon
            style={{ marginTop: '16px', marginBottom: '8px' }}
          />
        )}
        <p style={{ marginTop: detectionMessage ? '8px' : '16px', color: '#666' }}>
          {mode === 'register'
            ? 'Vui lòng nhìn thẳng vào camera và nhấn "Chụp ảnh" để đăng ký khuôn mặt'
            : 'Vui lòng nhìn thẳng vào camera và nhấn "Chụp ảnh" để xác thực'}
        </p>
      </div>
    </Modal>
  );
}

