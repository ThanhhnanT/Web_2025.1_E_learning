"use client"
import React,{useState,useEffect} from 'react'
import WordReview from '@/components/WordReview'

interface Word {
  word: string;
  type: string;
  phonetic: string;
  definition: string;
  example: string;
  image: string;
  audio: string; 
}

function WordReviewPage(){
    const [data, setData] = useState<Word[]>([]);
    const [title,setTitle] = useState("");
    const [loading, setLoading] = useState(true);
  
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
  
  return <WordReview data={data} title={title} />;
  
}
export default WordReviewPage