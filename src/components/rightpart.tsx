"use client";

import React, { useEffect, useState } from "react";
import generateusingperplexity from "./generateusingPerplexity"

interface RightPartProps {
  message: any;
  setMessage: (value: any) => void;
}

export default function RightPart({ message, setMessage }: RightPartProps) {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [text3, setText3] = useState("");
  const [loading, setLoading] = useState(0);

  const texts = [text1, text2, text3];

  useEffect(() => {
    const get = async () => {
      if (!message.result) {
        const title = message.title;
        const item = message.item;
        const current = message.current;

        setLoading(1);
        let text = await generateusingperplexity(title, item, current);
        setText1(text);
        console.log("at first selection: ", text);

        setLoading(2);
        text = await generateusingperplexity(title, item, text);
        setText2(text);
        console.log("at second selection: ", text);

        setLoading(3);
        text = await generateusingperplexity(title, item, text);
        setText3(text);
        console.log("at third selection: ", text);

        setLoading(0); // All done
      }
    };
    get();
  }, [message]);

  const onclick = (text: string) => {
    setMessage({ ...message, result: text });
  };

  return (
    <div>
      <strong className="block text-lg font-semibold text-gray-800 mb-2">
        Select best one!!!
      </strong>

      {texts.map((text, index) => (
        <div key={index} className="mb-4">
          <button
            className="w-full min-h-[60px] px-3 py-2 no-border rounded-md bg-white shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 flex items-center justify-center"
            onClick={() => onclick(text)}
            disabled={loading !== 0} // Disable buttons while loading
          >
            {loading === index + 1 ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8z"
                  ></path>
                </svg>
                Loading...
              </span>
            ) : (
              text || "Generating..."
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
