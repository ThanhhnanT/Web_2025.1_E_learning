"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CourseOnline from "@/components/CourseOnline";
import TestList, { type Test } from "@/components/TestList"; 


export default function Home() {
  const [tests, setTests] = useState<Test[]>([]);

      useEffect(() => {
      const fetchTests = async () => {
        try {
          const res = await fetch("/tests.json");
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

          const data = await res.json();
          console.log("Dữ liệu nhận được:", data);
          // Sắp xếp theo id giảm dần (mới nhất trước)
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


  return (
    <div>
      <div>
        <Link href="/tests">
        <div style={{ position: "relative", width: "100%", height: "0", paddingBottom: "40%" }}>
          <Image
            src="/image.png"
            alt="Learnify Banner"
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </div>
      </Link>
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
