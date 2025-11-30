"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Carousel } from "antd";
import CourseOnline from "@/components/CourseOnline";
import TestList, { type Test } from "@/components/TestList";
import styles from "@/styles/page.module.css"; 
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { get } from "@/helper/api";


export default function Home() {
  const [tests, setTests] = useState<Test[]>([]);

      useEffect(() => {
      const fetchTests = async () => {
        try {
          const payload = await get("tests?page=1&pageSize=8");
          const data = payload?.data;
          if (Array.isArray(data)) {
            setTests(data);
          } else {
            console.error("Unexpected tests payload:", payload);
          }
        } catch (error) {
          console.error("Lỗi khi tải test:", error);
        }
      };

      fetchTests();
    }, []);


  // Danh sách ảnh cho slide (có thể thêm nhiều ảnh)
  const slideImages = [
    { src: "/image.png", alt: "Learnify Banner" },
    // Có thể thêm nhiều ảnh khác ở đây
    { src: "/bg2.png", alt: "Banner 2" },
  ];

  return (
    <div>
      <div className={styles.slideContainer}>
        <Carousel
          autoplay
          autoplaySpeed={3000}
          effect="fade"
          dots={true}
          draggable={true}
          swipe={true}
          className={styles.carousel}
          // adaptiveHeight={true}
          // centerMode={true}
        >
          {slideImages.map((item, index) => (
            <div key={index}>
                <div className={styles.slideItem}>
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    style={{ objectFit: "cover" }}
                    priority={index === 0}
                  />
                </div>
            </div>
          ))}
        </Carousel>
      </div>
      
      <div className="course-box" style={{ backgroundColor: "#e8f2ff", padding: "30px", borderRadius: "8px",marginTop:"20px" }}>
        <CourseOnline />
      </div>
    


      <div className="tests" style={{backgroundColor:"#ffffff",borderRadius:"8px",padding:"30px",marginTop:"20px"}}>
      <h2 style={{ textAlign: "center" }}>
          Bài kiểm tra mới nhất
        </h2>
        <TestList tests={tests} />
      </div>
    </div>
  );
}
