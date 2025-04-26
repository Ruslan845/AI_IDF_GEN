"use client";

import React, { useState } from "react";
import LeftPart from "../components/leftpart";
import RightPart from "../components/rightpart";

export default function SplitPage() {
  const [message, setMessage] = useState({});

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left side */}
      <div style={{ flex: 1, borderRight: "1px solid #ccc", overflow: "auto" }}>
        <LeftPart message={message} setMessage={setMessage} />
      </div>

      {/* Right side */}
      {Object.keys(message).length ?
        <div style={{ flex: 1, overflow: "auto" }}>
          <RightPart message={message} setMessage={setMessage}/>
        </div>:<></>
      }
    </div>
  );
}
