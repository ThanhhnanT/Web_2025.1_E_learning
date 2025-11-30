"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Carousel } from "antd";
import CourseOnline from "@/components/CourseOnline";
import TestList, { type Test } from "@/components/TestList";
import styles from "@/styles/page.module.css"; 
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";


export default function Home() {
  const [tests, setTests] = useState<Test[]>([]);

      useEffect(() => {
      const fetchTests = async () => {
        try {
          const res = await fetch("/tests.json");
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

          const data = await res.json();
          console.log("Dữ liệu nhận được:", data);
          const sorted = data.sort((a: any, b: any) => b.id - a.id);
          console.log("Dữ liệu sau khi sắp xếp:", sorted.map((t: any) => t.id));
          const randomEight = sorted.slice(0, 8);
          console.log("8 bài test mới nhất:", randomEight.map((t: any) => t.id));
          setTests(randomEight);
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
