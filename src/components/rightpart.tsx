"use client";

import React, { useEffect, useState } from "react";
import generateusingperplexity from "./generateusingPerplexity";

interface RightPartProps {
  message: any;
  setMessage: (value: any) => void;
}

interface TextItem {
  title: string;
  authors: string;
  published: string;
  PublicationDate: string;
}

export default function RightPart({ message, setMessage }: RightPartProps) {
  const [text, setText] = useState<TextItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const [urls, setUrls] = useState<string[]>([
    "http://www.uspto.gov/",
    "https://patents.google.com/",
    "https://worldwide.espacenet.com/",
  ]);
  const [urlErrors, setUrlErrors] = useState<string[]>([""]);
  const [keywords, setKeywords] = useState<string>("");

  const getData = async () => {
    if (!message.result) {
      setLoading(true);
      const title = message.title;
      const item = message.item;

      try {
        const result = await generateusingperplexity(title, item, keywords, urls.join(", "));
        const parsedResult = typeof result === "string" ? JSON.parse(result) : result;
        setText(parsedResult);
      } catch (error) {
        console.error("Failed to generate:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    console.log("message: ", message);
    setKeywords(message.current.join(", "));
  }, [message]);

  const handleCheckboxChange = (index: number) => {
    setSelectedRows((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        newSelected.add(index);
      }
      return newSelected;
    });
  };

  const handleDone = () => {
    const res = text.filter((_, index) => selectedRows.has(index));
    setMessage({ ...message, result: res });
  };

  const handleAddUrl = () => {
    setUrls((prev) => [...prev, ""]);
    setUrlErrors((prev) => [...prev, ""]);
  };

  const handleUrlChange = (index: number, value: string) => {
    const updatedUrls = [...urls];
    updatedUrls[index] = value;
    setUrls(updatedUrls);
  };

  const handleUrlBlur = (index: number) => {
    const updatedUrls = [...urls];
    const updatedErrors = [...urlErrors];

    // If empty, remove this URL input
    if (updatedUrls[index].trim() === "") {
      updatedUrls.splice(index, 1);
      updatedErrors.splice(index, 1);
    } else {
      if (!isValidUrl(updatedUrls[index])) {
        updatedErrors[index] = "Invalid URL format.";
      } else {
        updatedErrors[index] = "";
      }
    }

    setUrls(updatedUrls);
    setUrlErrors(updatedErrors);
  };

  const isValidUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      const protocolOk = parsed.protocol === "http:" || parsed.protocol === "https:";
      const domainOk = parsed.hostname.includes(".");
      return protocolOk && domainOk;
    } catch {
      return false;
    }
  };

  const handleKeywordsChange = (value: string) => {
    setKeywords(value);
  };

  const formatKeywords = () => {
    const cleaned = keywords
      .split(",")
      .map((word) => word.trim())
      .filter((word) => word.length > 0)
      .join(", ");
    setKeywords(cleaned);
  };

  const handleGetArts = async () => {
    const allValid = urls.every((url) => url === "" || isValidUrl(url));
    if (!allValid) {
      console.log("Some URLs are invalid.");
      return;
    }
    console.log("Fetching arts with URLs:", urls);
    console.log("Keywords:", keywords);
    await getData();
    // Your fetch or generation logic here
  };

  return (
    <div className="p-4">
      <strong className="block text-lg font-semibold text-gray-800 mb-4">
        Input URLs and Keywords
      </strong>

      {/* URL Inputs */}
      <div className="space-y-4 mb-6">
        {urls.map((url, index) => (
          <div key={index}>
            <input
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(index, e.target.value)}
              onBlur={() => handleUrlBlur(index)}
              placeholder="Enter a valid URL"
              className="w-full p-2 border border-gray-300 rounded"
            />
            {urlErrors[index] && (
              <p className="text-red-500 text-sm mt-1">{urlErrors[index]}</p>
            )}
          </div>
        ))}
        <button
          onClick={handleAddUrl}
          className="mt-2 text-blue-600 hover:underline"
        >
          + Add another URL
        </button>
      </div>

      {/* Keywords Input */}
      <div className="mb-8">
        <input
          type="text"
          value={keywords}
          onChange={(e) => handleKeywordsChange(e.target.value)}
          onBlur={formatKeywords}
          placeholder="Enter keywords (comma separated)"
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      {/* Get Arts Button */}
      <div className="text-center mb-10">
        <button
          onClick={handleGetArts}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded"
        >
          Get Arts
        </button>
      </div>

      {/* Selection Section */}
      <strong className="block text-lg font-semibold text-gray-800 mb-4">
        Select the best ones!
      </strong>

      {loading ? (
        <div className="text-center my-10 text-gray-600 text-lg">Loading...</div>
      ) : (
        <>
          {text.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr>
                    <th className="border-b px-4 py-2 text-left">Title</th>
                    <th className="border-b px-4 py-2 text-left">Authors</th>
                    <th className="border-b px-4 py-2 text-left">Published</th>
                    <th className="border-b px-4 py-2 text-left">Publication Date</th>
                    <th className="border-b px-4 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {text.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-100">
                      <td className="border-b px-4 py-2">{item.title}</td>
                      <td className="border-b px-4 py-2">{item.authors}</td>
                      <td className="border-b px-4 py-2">{item.published}</td>
                      <td className="border-b px-4 py-2">{item.PublicationDate}</td>
                      <td className="border-b px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(index)}
                          onChange={() => handleCheckboxChange(index)}
                          className="w-5 h-5"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center my-10 text-gray-400">No data available</div>
          )}
        </>
      )}

      {!loading && text.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={handleDone}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
