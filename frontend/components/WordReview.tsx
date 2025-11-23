"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  SoundOutlined,
  RetweetOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Alert, Tag, Button, Modal } from "antd";
import styles from "@/styles/wordReview.module.css";

interface Word {
  word: string;
  type: string;
  phonetic: string;
  definition: string;
  example: string;
  image: string;
  audio: string;
}

interface Props {
  data: Word[];
  title: string;
}

interface Progress {
  total: number;
  learned: number;
  remembered: number;
  review: number;
}

const getStorageKey = (title: string) =>
  `flashcard_progress_${title.replace(/\s+/g, "_").toLowerCase()}`;

const WordReview: React.FC<Props> = ({ data, title }) => {
  const STORAGE_KEY = getStorageKey(title);

  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isStopModalVisible, setIsStopModalVisible] = useState(false);
  const [shuffledData, setShuffledData] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);

  const [wordStatus, setWordStatus] = useState<{ [key: string]: string }>({});

  const [stats, setStats] = useState<Progress>({
    total: data.length,
    learned: 0,
    remembered: 0,
    review: 0,
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);

  /* ------------------- LOAD SAVED DATA + SHUFFLE ------------------- */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (parsed.wordStatus) setWordStatus(parsed.wordStatus);
      if (parsed.stats) setStats(parsed.stats);
    }

    const shuffled = [...data].sort(() => Math.random() - 0.5);
    setShuffledData(shuffled);
    setCurrentWord(shuffled[0]);
  }, [data, STORAGE_KEY]);

  /* ------------------- INDEX CHANGE ------------------- */
  useEffect(() => {
    if (shuffledData.length > 0) {
      setCurrentWord(shuffledData[index]);
    }
  }, [index, shuffledData]);

  /* ------------------- CẬP NHẬT PROGRESS ------------------- */
  const updateProgress = (updatedStatus: any) => {
    let learned = 0;
    let remembered = 0;
    let review = 0;

    Object.values(updatedStatus).forEach((st) => {
      if (st === "remembered") {
        remembered++;
        learned++; // bao gồm learned
      } else if (st === "review") {
        review++;
      }
    });

    const newStats: Progress = {
      total: data.length,
      learned,
      remembered,
      review,
    };

    setStats(newStats);

    // Lưu vào localStorage
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        stats: newStats,
        wordStatus: updatedStatus,
      })
    );

    console.log("Saved:", {
      stats: newStats,
      wordStatus: updatedStatus,
    });
  };

  /* ------------------- AUDIO ------------------- */
  const playAudio = (src: string) => {
    if (!audioRef.current) return;

    audioRef.current.src = src;
    audioRef.current.play();
    setCurrentAudio(src);
  };

  /* ------------------- NEXT / PREV ------------------- */
  const nextWord = () => {
    setIsFlipped(false);
    setIndex((i) => (i + 1 < shuffledData.length ? i + 1 : 0));
  };

  const prevWord = () => {
    setIsFlipped(false);
    setIndex((i) => (i - 1 >= 0 ? i - 1 : shuffledData.length - 1));
  };

  /* ------------------- HANDLE STATUS ------------------- */
  const handleStatus = (newStatus: string) => {
    if (!currentWord) return;

    const word = currentWord.word;

    const updated = {
      ...wordStatus,
      [word]: newStatus,
    };

    setWordStatus(updated);
    updateProgress(updated);

    nextWord();
  };

  const getCurrentWordStatus = () => {
    if (!currentWord) return "new";
    return wordStatus[currentWord.word] || "new";
  };

  const showStopModal = () => setIsStopModalVisible(true);

  const handleStopConfirm = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsStopModalVisible(false);
    window.history.back();
  };

  if (!currentWord) return <p>Đang tải...</p>;

  const currentStatus = getCurrentWordStatus();

  const isLearned =
    currentStatus === "learned" || currentStatus === "remembered";

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Luyện tập: {title}</h1>

      <div className={styles.headerLinks}>
        <button className={styles.backBtn} onClick={() => window.history.back()}>
          &lt;&lt; Quay lại
        </button>

        <button className={styles.stopBtn} onClick={showStopModal}>
          Dừng học list từ này
        </button>
      </div>

      <Alert
        message="Bạn được học tối đa 20 từ mới mỗi ngày để bảo đảm hiệu quả."
        type="warning"
        showIcon
      />

      {/* FLASHCARD */}
      <div className={styles.card}>
        <Tag
          className={`${styles.statusTag} ${
            isLearned ? styles.reviewTag : styles.newTag
          }`}
        >
          {isLearned ? "Ôn tập" : "Từ mới"}
        </Tag>

        <div
          className={`${styles.cardInner} ${isFlipped ? styles.flip : ""}`}
        >
          <div className={styles.cardFront}>
            <div className={styles.wordArea}>
              <div className={styles.wordBlock}>
                {currentWord.word}
                <SoundOutlined
                  className={styles.soundIcon}
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(currentWord.audio);
                  }}
                />
              </div>

              <div className={styles.phonetic}>
                ({currentWord.type}) /{currentWord.phonetic}/
              </div>
            </div>
          </div>

          <div className={styles.cardBack}>
            <div className={styles.backContent}>
              <div>
                <h2>Định nghĩa</h2>
                <p>{currentWord.definition}</p>

                <h3>Ví dụ</h3>
                <p>{currentWord.example}</p>
              </div>

              <img src={currentWord.image} alt="" className={styles.image} />
            </div>
          </div>
        </div>

        <div className={styles.leftButtons}>
          <Button icon={<LeftOutlined />} shape="circle" onClick={prevWord} />
          <Button icon={<RightOutlined />} shape="circle" onClick={nextWord} />
        </div>

        <div className={styles.rightButtons}>
          <Button
            icon={<RetweetOutlined />}
            shape="circle"
            onClick={() => setIsFlipped((p) => !p)}
          />
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className={styles.actionButtons}>
        <Button type="primary" onClick={() => handleStatus("remembered")}>
          Đã nhớ
        </Button>

        <Button onClick={() => handleStatus("review")}>Cần ôn lại</Button>
      </div>

      <Modal
        title="Xác nhận dừng học"
        open={isStopModalVisible}
        onOk={handleStopConfirm}
        onCancel={() => setIsStopModalVisible(false)}
      >
        <p>
          Bạn có chắc chắn muốn dừng không? Mọi dữ liệu sẽ bị xóa.
        </p>
      </Modal>

      <audio ref={audioRef} preload="auto" />
    </div>
  );
};

export default WordReview;
