"use client";

import { useState } from "react";
import { Input } from "./ui/input";
import { Loading } from "./loading";
import { generateId } from "@/lib/utils";
import { useUser } from "@/context/user";

export const FileUpload = ({
  onFileUpload,
  isDisabled,
  children,
}: {
  onFileUpload: ({
    url,
    contentType,
    urlHost,
  }: {
    url: string;
    contentType: string;
    urlHost: string;
  }) => void;
  isDisabled?: boolean;
  children: React.ReactNode;
}) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && !isDisabled) {
      setLoading(true);
      const file = e.target.files[0];
      const fileType = file.type;

      // Read the file as a data URL (base64)
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        if (fileType.startsWith("video")) {
          const fileSize = file.size / 1024 / 1024;
          const maxFileSize = 200;
          if (fileSize > maxFileSize) {
            alert(`File size should not exceed ${maxFileSize} MB`);
            setLoading(false);
            return;
          }

          const formData = new FormData();
          formData.append("name", file.name);
          formData.append("type", file.type);
          const res = await fetch(`/api/auth/${user?.fid}/upload/video`, {
            method: "POST",
            body: formData,
          });
          const { fileName, url } = await res.json();

          const response = await fetch(url, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
            },
          });
          if (response.status === 200) {
            onFileUpload({
              url: `https://files.flink.fyi/${fileName}`,
              urlHost: "flink.fyi",
              contentType: file.type,
            });
          }
        } else if (fileType.startsWith("image")) {
          const base64data: string = reader.result as string;

          // Remove the prefix that says what kind of data it is
          const base64string = base64data.split(",")[1];

          const res = await fetch(`/api/auth/${user?.fid}/upload/image`, {
            method: "POST",
            body: JSON.stringify({
              image: base64string,
            }),
          });

          if (res.status === 200) {
            const { data } = await res.json();
            onFileUpload({
              url: data.link,
              urlHost: "imgur.com",
              contentType: file.type,
            });
          }
        }

        setLoading(false);
      };
    }
  };

  const id = generateId();

  return (
    <>
      <label htmlFor={id}>{loading ? <Loading /> : children}</label>
      <Input
        id={id}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isDisabled || loading}
        accept="image/*,video/*"
      />
    </>
  );
};
