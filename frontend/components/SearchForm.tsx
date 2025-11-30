"use client";

import React from "react";
import { Input, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import styles from "@/styles/searchForm.module.css";

export type SkillOption = "all" | "reading" | "listening" | "speaking" | "writing";

export type SearchFilters = {
  keyword: string;
  skill: SkillOption;
};

type SearchFormProps = {
  onSearch: (params: SearchFilters) => void;
  initialFilters?: SearchFilters;
};

const skillOptions = [
  { value: "all", label: "Tất cả kỹ năng" },
  { value: "reading", label: "Reading" },
  { value: "listening", label: "Listening" },
  { value: "speaking", label: "Speaking" },
  { value: "writing", label: "Writing" },
];

const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  initialFilters = { keyword: "", skill: "all" },
}) => {
  const [value, setValue] = React.useState(initialFilters.keyword);
  const [skill, setSkill] = React.useState<SkillOption>(initialFilters.skill);

  const submitFilters = React.useCallback(
    (next: { keyword?: string; skill?: SkillOption }) => {
      onSearch({
        keyword: (next.keyword ?? value).trim(),
        skill: next.skill ?? skill,
      });
    },
    [onSearch, value, skill]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setValue(nextValue);
    submitFilters({ keyword: nextValue });
  };

  const handleSkillChange = (val: SkillOption) => {
    setSkill(val);
    submitFilters({ skill: val });
  };

  return (
    <form className={styles.searchForm}>
      <Input
        id="search-input"
        name="search"
        placeholder="Tìm kiếm đề thi..."
        prefix={<SearchOutlined />}
        value={value}
        onChange={handleChange}
        allowClear
        className={styles.searchInput}
      />
      <Select
        value={skill}
        onChange={handleSkillChange}
        options={skillOptions}
        className={styles.skillSelect}
        size="large"
      />
    </form>

  );
};

export default SearchForm;
