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

  useEffect(() => {
    const get = async () => {
      if (!message.result) {
        setLoading(true);
        const title = message.title;
        const item = message.item;
        const current = message.current;
        let res = ""; 
        current.map((item : any) => {
              res = res + item + ",";
          });

        try {
          console.log("message: ", message);
          console.log("res: ", res);
          const result = await generateusingperplexity(title, item, res);
          console.log("result: ", result);
          const parsedResult = typeof result === "string" ? JSON.parse(result) : result;
          setText(parsedResult);
        } catch (error) {
          console.error("Failed to generate:", error);
        } finally {
          setLoading(false); // Always stop loading
        }
      }
    };
    get();
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
    console.log("res: ", res)
    setMessage({ ...message, result: res });
  };

  return (
    <div className="p-4">
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
