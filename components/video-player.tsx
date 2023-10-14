"use client";

import ReactPlayer from "react-player";

export const VideoPlayer = ({ url }: { url: string }) => {
  return <ReactPlayer url={url} controls />;
};
