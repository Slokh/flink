"use client";

export const CopyLink = ({ link }: { link: string }) => (
  <div
    className="hover:underline cursor-pointer"
    onClick={() => {
      navigator.clipboard.writeText(link);
    }}
  >
    copy link
  </div>
);
