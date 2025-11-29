"use client";

import React from "react";
import TestList from "@/components/TestList";
import SearchForm, { type SearchFilters } from "@/components/SearchForm";

function TestPage() {
  const [filters, setFilters] = React.useState<SearchFilters>({
    keyword: "",
    skill: "all",
  });

  return (
    <div style={{ marginTop: '24px' }}>
      <SearchForm onSearch={setFilters} initialFilters={filters} />
      <TestList keyword={filters.keyword} skill={filters.skill} />
    </div>
  );
}

export default TestPage;
