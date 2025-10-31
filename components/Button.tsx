"use client";
import React from "react";
import styles from "./Button.module.css";
interface props {
    type?: "button" | "submit";
    // onClick?: () => void;
    // children: React.ReactNode;
    // disabled?: boolean;
    text: string;
    disabled?: boolean;
}

export default function Button({ type = "button", text }: props) {
    return (
        <button type={type} className={styles.button}>
            {text}
        </button>
    )
}