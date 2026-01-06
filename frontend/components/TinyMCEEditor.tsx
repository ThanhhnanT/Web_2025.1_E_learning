"use client";

import React, { useRef, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";

interface TinyMCEEditorProps {
  value?: string;
  onChange?: (value: string) => void;
}

const TinyMCEEditor: React.FC<TinyMCEEditorProps> = ({ value, onChange }) => {
  const editorRef = useRef<any>(null);

  // Sync value với editor content khi value thay đổi từ bên ngoài (form.setFieldsValue)
  useEffect(() => {
    if (editorRef.current && value !== undefined && editorRef.current.getContent() !== value) {
      editorRef.current.setContent(value || "");
    }
  }, [value]);

  return (
    <Editor
      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
      value={value}
      onInit={(evt, editor) => {
        editorRef.current = editor;
        // Set initial content nếu có
        if (value) {
          editor.setContent(value);
        }
      }}
      init={{
        height: 400,
        menubar: false,
        plugins: [
          "advlist",
          "autolink",
          "lists",
          "link",
          "charmap",
          "preview",
          "anchor",
          "searchreplace",
          "visualblocks",
          "code",
          "fullscreen",
          "insertdatetime",
          "table",
          "help",
          "wordcount",
        ],
        toolbar:
          "undo redo | blocks | bold italic underline | " +
          "alignleft aligncenter alignright alignjustify | " +
          "bullist numlist outdent indent | table | removeformat | help",
        content_style:
          "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
      }}
      onEditorChange={(content) => {
        onChange?.(content);
      }}
    />
  );
};

export default TinyMCEEditor;


