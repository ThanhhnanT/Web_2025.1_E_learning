"use client";

import React, { useEffect, useState } from "react";
import { ThunderboltOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import Link from "next/link";
import { Alert, Collapse } from "antd";
import FlashCard from "@/components/FlashCard";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/auth/ModalAuth";
import { checkAuth } from "@/lib/helper";
import { HeaderSection } from "../components/FlashCardHeaderSection";

interface FlashCardItem {
  href: string;
  title: string;
  wordCount: number;
  userCount: number;
  userAvatar: string;
  username: string;
}

function FlashcardPage() {
  const [data, setData] = useState<FlashCardItem[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/flashcards.json")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  const handleFlashcardClick = (href: string,title:string) => {
    if (checkAuth()) {
      localStorage.setItem("current_flashcard_title", title);
      router.push(href);
    } else {
      localStorage.setItem("auth_redirect","/flashcards");
      setAuthModalOpen(true);
    }
  };

  return (
    <>
      
      <HeaderSection />
      <div
        style={{
          marginTop: 30,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", // Responsive Grid
          gap: 20,
        }}
      >
        {data.map((item, index) => (
          <div key={index} onClick={() => handleFlashcardClick(item.href,item.title)} style={{ cursor: "pointer" }}>
            <FlashCard {...item} />
          </div>
        ))}
      </div>

      <AuthModal
        visible={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        setOpen={(open: boolean) => {
          setAuthModalOpen(open);
          if (!open && checkAuth()) {
              const redirect = localStorage.getItem("auth_redirect");
              if (redirect) {
                localStorage.removeItem("auth_redirect"); 
                router.push(redirect);                    
                    }          }
        }}
      />
    </>
  );
}

export default FlashcardPage;
