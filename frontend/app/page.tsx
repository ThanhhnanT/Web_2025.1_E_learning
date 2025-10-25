"use client";

import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <Link href="/tests">
        <Image
          src="/image.png"
          alt="Learnify Banner"
          width={1200} 
          height={400}
          style={{ width: "100%", height: "auto" }}
          priority
        />
      </Link>
    </div>
  );
}
