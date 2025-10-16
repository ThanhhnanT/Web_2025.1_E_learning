"use client";
import React from "react";
import styles from "./AuthForm.module.css";

interface props {
    title: string;
    onSubmit: (e: React.FormEvent) => void;
    children: React.ReactNode;
}
export default function AuthForm({ title, onSubmit, children }: props) {
    return (
        <form onSubmit={onSubmit} className={styles.formContainer}>
            <h2 className={styles.formTitle}>{title}</h2>
            {children}
        </form>
    )
}