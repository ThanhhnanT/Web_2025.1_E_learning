"use client";

import React from "react";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import styles from "./SearchForm.module.css";

type SearchFormProps = {
  onSearch: (keyword: string) => void;
};

const SearchForm: React.FC<SearchFormProps> = ({ onSearch }) => {
  const [value, setValue] = React.useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); 
    onSearch(value.trim());
  };

  return (
    <form className={styles.searchForm} onSubmit={handleSubmit}>
      <Input
        id="search-input"
        name="search"
        placeholder="Tìm kiếm đề thi..."
        prefix={<SearchOutlined />}
        value={value}
        onChange={handleChange}
        allowClear
        className={styles.searchInput}
      /> <br />
      <button type="submit" className={styles.searchButton}>
        Tìm kiếm
      </button>
    </form>

  );
};

export default SearchForm;
