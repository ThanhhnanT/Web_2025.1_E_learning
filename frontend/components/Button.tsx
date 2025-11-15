"use client";
import React from "react";
import styles from "@/styles/button.module.css";
interface props {
    type?: "button" | "submit";
    // onClick?: () => void;
    // children: React.ReactNode;
    // disabled?: boolean;
    text: string;
}

export default function Button({ type = "button", text }: props) {
    return (
        <button type={type} className={styles.button}>
            {text}
        </button>
    )
}