import styles from "@/styles/about.module.css";

export default function AboutPage() {
  return (
    <div>
      <header className={styles.header}>
        <h1>Learnify</h1>
        <h2>Knowledge At Your Fingertips</h2>
        <p>Nơi giúp bạn học mọi lúc, mọi nơi với phương pháp hiện đại</p>
      </header>

      <main className={styles.container}>
        <section className={styles.section}>
          <h2>Chúng tôi là ai?</h2>
          <p>
            Learnify được thành lập với mục tiêu cung cấp một nền tảng học tập linh hoạt, chất lượng cao, giúp người học từ mọi lứa tuổi tiếp cận kiến thức dễ dàng và hiệu quả. Chúng tôi kết hợp các khóa học đa dạng, giảng viên chuyên nghiệp và công nghệ hiện đại để nâng cao trải nghiệm học tập trực tuyến.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Sứ mệnh</h2>
          <p>
            Chúng tôi muốn mang đến cho người học một môi trường học tập thân thiện, dễ tiếp cận và phù hợp với nhu cầu cá nhân. Từ việc học kỹ năng nghề nghiệp, ngoại ngữ, đến các khóa học phát triển bản thân, chúng tôi đều hướng tới việc giúp người học đạt được mục tiêu của mình nhanh chóng và hiệu quả.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Đội ngũ của chúng tôi</h2>
          <div className={styles.team}>
            <div className={styles.member}>
              <img src="/avatar1.jpg" alt="Giảng viên 1" />
              <h3>Nguyễn Văn A</h3>
              <p>Chuyên gia phát triển web</p>
            </div>
            <div className={styles.member}>
              <img src="/avatar2.jpg" alt="Giảng viên 2" />
              <h3>Trần Thị B</h3>
              <p>Chuyên gia marketing và quản lý dự án</p>
            </div>
            <div className={styles.member}>
              <img src="/avatar3.jpg" alt="Giảng viên 3" />
              <h3>Phạm Văn C</h3>
              <p>Giảng viên ngoại ngữ</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Liên hệ</h2>
          <p>
            Nếu bạn có bất kỳ câu hỏi hoặc góp ý nào, hãy liên hệ với chúng tôi qua email: <a href="mailto:contact@webhoctructuyen.com">contact@webhoctructuyen.com</a>
          </p>
        </section>
      </main>
    </div>
  );
}
