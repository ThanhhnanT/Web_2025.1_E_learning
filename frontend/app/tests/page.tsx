"use client";

import React from "react";
import TestList from "@/components/TestList";
import SearchForm from "@/components/SearchForm";

function TestPage() {
  const [keyword, setKeyword] = React.useState("");

  return (
    <div>
      <SearchForm onSearch={setKeyword} />
      <TestList keyword={keyword} />
    </div>
  );
}

export default TestPage;
