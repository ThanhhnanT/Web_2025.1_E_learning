"use client";
import React, { useEffect, useState } from "react";
import WordDetail from "@/components/WordDetail";
import { useSearchParams } from "next/navigation";

interface Word {
  word: string;
  type: string;
  phonetic: string;
  definition: string;
  example: string;
  image: string;
  audio: string; 
}

const OfficeEnglishPage = () => {
  const [data, setData] = useState<Word[]>([]);
  const [title,setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();


  useEffect(() => {

    const savedTitle = localStorage.getItem("current_flashcard_title");
    if (savedTitle) setTitle(savedTitle);

    fetch("/officeEnglish.json")
      .then((res) => {
        if (!res.ok) throw new Error("Không tìm thấy file JSON");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-center mt-8">Đang tải dữ liệu...</p>;

  return <WordDetail data={data} href="/flashcards/discover/office-english" title={title} />;
};

export default OfficeEnglishPage;
