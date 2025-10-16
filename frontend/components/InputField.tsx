"use client";
import React from "react";
import styles from "./InputField.module.css";

interface props {
    label: string;
    type?: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
}

export default function InputField({ label, type = "text", name, value, onChange, required = false }: props) {
    return (
        <div className={styles.inputGroup}>
            <label className={styles.label}>{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                className={styles.input}
            />
        </div>
    )
}