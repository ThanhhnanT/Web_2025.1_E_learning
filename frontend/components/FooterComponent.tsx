"use client";
import { Layout, Row, Col } from "antd";
import Link from "next/link";
import "./FooterComponent.css";
import Image from "next/image";
const { Footer } = Layout;

export default function AppFooter() {
  return (

    <Footer 
    style={{
    position: "relative",
    backgroundImage: 'url(/footer.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    padding: "40px 48px",
    color: "#050505ff",
  }}
    >
      <Row gutter={[24, 24]} align="top">
        <Col xs={24} sm={12} md={6} lg={6}>
          <Image
            src="/logo.png"
            alt="Learnify Logo"
            width={200}
            height={200}
            style={{ objectFit: "contain" }}
          />
        </Col>
        <Col xs={24} sm={12} md={6} lg={6}>
          <h3 style={{ fontWeight: "bold" }}>Về chúng tôi</h3>
          <div>
            <Link href="/about" className="footer-link">
              Giới thiệu
            </Link>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6} lg={6}>
          <h3>Tài nguyên</h3>
          <div>
            <Link href="/tests" className="footer-link">
              Thư viện đề thi
            </Link>
          </div>
          <div>
            <Link href="/posts" className="footer-link">
              Blog
            </Link>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6} lg={6}>
          <h3>Chính sách chung</h3>
        </Col>
      </Row>

      <div style={{ textAlign: "center", marginTop: "24px" }}>
        © {new Date().getFullYear()} Learnify. All rights reserved.
      </div>
    </Footer>
  );
}
