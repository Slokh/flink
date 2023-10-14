"use client";

import React, { useState } from "react";
import ReactPlayer from "react-player";

export const VideoPlayer = ({ url }: { url: string }) => {
  const [paddingTop, setPaddingTop] = useState("56.25%"); // default to 16:9 aspect ratio

  const handleReady = (player: any) => {
    const { videoWidth, videoHeight } = player.getInternalPlayer();
    setPaddingTop(`${(videoHeight / videoWidth) * 100}%`); // set aspect ratio based on video dimensions
  };

  return (
    <div
      className="w-full"
      style={{
        position: "relative",
        height: 0,
        overflow: "hidden",
        maxWidth: "100%",
        paddingTop,
      }}
    >
      <ReactPlayer
        url={url}
        controls
        width="100%"
        height="100%"
        style={{ position: "absolute", top: 0, left: 0 }}
        onReady={handleReady}
      />
    </div>
  );
};
