"use client";
import React, { useRef, useState, useEffect } from "react";
import { SoundOutlined } from "@ant-design/icons";
import styles from "@/styles/wordDetail.module.css";
import { useRouter } from "next/navigation";

interface Word {
  word: string;
  type: string;
  phonetic: string;
  definition: string;
  example: string;
  image: string;
  audio: string;
}

interface Progress {
  total: number;
  learned: number;
  remembered: number;
  review: number;
}

interface WordDetailProps {
  data: Word[];
  href: string;
  title: string;
  progress?: Progress;
}

const WordDetail: React.FC<WordDetailProps> = ({ data, href, title }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const router = useRouter();

  const [progressState, setProgress] = useState<Progress>({
    total: data.length,
    learned: 0,
    remembered: 0,
    review: 0,
  });

  
  useEffect(() => {
    const getStorageKey = (title: string) =>
    `flashcard_progress_${title.replace(/\s+/g, "_").toLowerCase()}`;
    const STORAGE_KEY = getStorageKey(title);
     const saved = localStorage.getItem(STORAGE_KEY);
     console.log("Saved data:", saved);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log("Parsed:", parsed);

        if (parsed && parsed.stats) {
          setProgress(parsed.stats);
        } else {
          setProgress(parsed);
        }
      } catch (e) {
        console.error("JSON parse error:", e);
      }
    }
  }, [href]);

  if (!data || data.length === 0)
    return <p className="text-center mt-8">Không có dữ liệu để hiển thị</p>;

  const handlePlay = (src: string) => {
    if (!audioRef.current) return;

    if (!audioRef.current.paused && currentAudio !== src) {
      audioRef.current.pause();
    }

    if (currentAudio === src && !audioRef.current.paused) {
      audioRef.current.pause();
      return;
    }

    audioRef.current.src = src;
    audioRef.current.play();
    setCurrentAudio(src);
  };

  const handlePractice = () => {
    router.push(`${href}/review`);
  };

  const { total, learned, remembered, review } = progressState;

  return (
    <div className={styles.container}>
      <h1 className="text-2xl font-bold mb-6">Flashcard: {title}</h1>

      <div className={styles.buttonWrapper}>
        <button className={styles.practiceButton} onClick={handlePractice}>
          Luyện tập Flashcard
        </button>
      </div>

      {/* ─────────── PROGRESS BAR ─────────── */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div className={styles.progressLabels}>
            <span>
              <span className={styles.totalValue}>{total}</span>
              Tổng số từ
            </span>

            <span>
              <span className={styles.learnedValue}>{learned}</span>
              Đã học
            </span>

            <span>
              <span className={styles.rememberedValue}>{remembered}</span>
              Đã nhớ
            </span>

            <span>
              <span className={styles.reviewValue}>{review}</span>
              Cần ôn tập
            </span>
          </div>
        </div>
      </div>

      {/* ─────────── LIST WORDS ─────────── */}
      <div className="space-y-6">
        {data.map((card, idx) => (
          <div key={idx} className={styles.card}>
            <div className={styles.content}>
              <h2>
                {card.word}{" "}
                <span className="text-gray-500">({card.type})</span>
                <span className="text-gray-400">/{card.phonetic}/</span>

                {card.audio && (
                  <SoundOutlined
                    className="text-[20px] ml-2 cursor-pointer hover:text-blue-600"
                    onClick={() => handlePlay(card.audio)}
                  />
                )}
              </h2>

              <div className={styles.definition}>
                <div className={styles.definitionTitle}>Định nghĩa:</div>
                <div>{card.definition}</div>
              </div>

              <div className={styles.example}>
                <div className={styles.exampleTitle}>Ví dụ:</div>
                <ul>
                  <li>{card.example}</li>
                </ul>
              </div>
            </div>

            {card.image && (
              <div className={styles.imageContainer}>
                <img src={card.image} alt={card.word} />
              </div>
            )}
          </div>
        ))}
      </div>

      <audio ref={audioRef} preload="auto" />
    </div>
  );
};

export default WordDetail;
