"use client";

import styles from "@/styles/about.module.css";
import { useEffect, useState } from "react";

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={styles.aboutPage}>
      {/* Hero Section */}
      <header className={`${styles.header} ${isVisible ? styles.fadeIn : ""}`}>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>📚</div>
          <h1 className={styles.mainTitle}>Learnify</h1>
          <h2 className={styles.subtitle}>Knowledge At Your Fingertips</h2>
          <p className={styles.tagline}>Nơi giúp bạn học mọi lúc, mọi nơi với phương pháp hiện đại</p>
          <div className={styles.headerDecoration}></div>
        </div>
      </header>

      <main className={styles.container}>
        {/* Features Section */}
        <section className={`${styles.featuresSection} ${isVisible ? styles.slideUp : ""}`}>
          <div className={styles.features}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎯</div>
              <h3>Học tập linh hoạt</h3>
              <p>Học mọi lúc, mọi nơi theo lịch trình của bạn</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>👨‍🏫</div>
              <h3>Giảng viên chuyên nghiệp</h3>
              <p>Đội ngũ giảng viên giàu kinh nghiệm và tận tâm</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🚀</div>
              <h3>Công nghệ hiện đại</h3>
              <p>Nền tảng học tập với công nghệ tiên tiến</p>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className={`${styles.section} ${styles.aboutSection} ${isVisible ? styles.fadeInDelay1 : ""}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>🏢</span>
            <h2>Chúng tôi là ai?</h2>
          </div>
          <div className={styles.contentCard}>
            <p>
              Learnify được thành lập với mục tiêu cung cấp một nền tảng học tập linh hoạt, chất lượng cao, 
              giúp người học từ mọi lứa tuổi tiếp cận kiến thức dễ dàng và hiệu quả. Chúng tôi kết hợp các 
              khóa học đa dạng, giảng viên chuyên nghiệp và công nghệ hiện đại để nâng cao trải nghiệm học 
              tập trực tuyến.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className={`${styles.section} ${styles.missionSection} ${isVisible ? styles.fadeInDelay2 : ""}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>🎯</span>
            <h2>Sứ mệnh</h2>
          </div>
          <div className={styles.contentCard}>
            <p>
              Chúng tôi muốn mang đến cho người học một môi trường học tập thân thiện, dễ tiếp cận và phù hợp 
              với nhu cầu cá nhân. Từ việc học kỹ năng nghề nghiệp, ngoại ngữ, đến các khóa học phát triển bản 
              thân, chúng tôi đều hướng tới việc giúp người học đạt được mục tiêu của mình nhanh chóng và hiệu quả.
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className={`${styles.statsSection} ${isVisible ? styles.fadeInDelay3 : ""}`}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>10,000+</div>
              <div className={styles.statLabel}>Học viên</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>500+</div>
              <div className={styles.statLabel}>Khóa học</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>98%</div>
              <div className={styles.statLabel}>Hài lòng</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>50+</div>
              <div className={styles.statLabel}>Giảng viên</div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className={`${styles.section} ${styles.teamSection} ${isVisible ? styles.fadeInDelay4 : ""}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>👥</span>
            <h2>Đội ngũ của chúng tôi</h2>
          </div>
          <div className={styles.team}>
            <div className={styles.member}>
              <div className={styles.memberImageWrapper}>
                <img src="/avatar1.jpg" alt="Giảng viên 1" />
                <div className={styles.memberOverlay}>
                  <div className={styles.memberSocial}>
                    <span>👤</span>
                  </div>
                </div>
              </div>
              <h3>Nguyễn Văn A</h3>
              <p className={styles.memberRole}>Chuyên gia phát triển web</p>
              <div className={styles.memberBadge}>⭐ Expert</div>
            </div>
            <div className={styles.member}>
              <div className={styles.memberImageWrapper}>
                <img src="/avatar2.jpg" alt="Giảng viên 2" />
                <div className={styles.memberOverlay}>
                  <div className={styles.memberSocial}>
                    <span>👤</span>
                  </div>
                </div>
              </div>
              <h3>Trần Thị B</h3>
              <p className={styles.memberRole}>Chuyên gia marketing và quản lý dự án</p>
              <div className={styles.memberBadge}>⭐ Expert</div>
            </div>
            <div className={styles.member}>
              <div className={styles.memberImageWrapper}>
                <img src="/avatar3.jpg" alt="Giảng viên 3" />
                <div className={styles.memberOverlay}>
                  <div className={styles.memberSocial}>
                    <span>👤</span>
                  </div>
                </div>
              </div>
              <h3>Phạm Văn C</h3>
              <p className={styles.memberRole}>Giảng viên ngoại ngữ</p>
              <div className={styles.memberBadge}>⭐ Expert</div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
