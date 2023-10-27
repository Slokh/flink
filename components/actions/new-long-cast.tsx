/* eslint-disable @next/next/no-img-element */
import React, { useRef, useState } from "react";
import { EditorState, RichUtils } from "draft-js";
import { Cast } from "./new-cast";
import * as htmlToImage from "html-to-image";
import Editor from "@draft-js-plugins/editor";
import createImagePlugin from "@draft-js-plugins/image";
import createDragNDropPlugin from "@draft-js-plugins/drag-n-drop";
import {
  CameraIcon,
  FontBoldIcon,
  FontItalicIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from "@radix-ui/react-icons";
const imagePlugin = createImagePlugin();
const dragNDropPlugin = createDragNDropPlugin();

export const LongCast = ({
  onChange,
}: {
  onChange: (c: Partial<Cast>) => void;
}) => {
  const editorRef = useRef(null);
  const divRef = useRef(null);
  const fileRef = useRef(null);
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [imgData, setImgData] = useState("");

  const handleKeyCommand = (command: string, editorState: EditorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);

    if (newState) {
      handleChange(newState);
      return "handled";
    }

    return "not-handled";
  };

  const toggleInlineStyle = (inlineStyle: string) => {
    const newState = RichUtils.toggleInlineStyle(editorState, inlineStyle);
    handleChange(newState);
  };

  const handleChange = (newState: EditorState) => {
    const text = newState.getCurrentContent().getPlainText();
    setEditorState(newState);

    if (divRef.current) {
      htmlToImage.toPng(divRef.current).then((data) => {
        setImgData(data);
        onChange({
          text: data || "",
          isValid: text.length > 0,
        });
      });
    }
  };

  const handleImageUpload = (event: any) => {
    Array.from(event.target.files).forEach((file: any) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        if (reader?.result) {
          const newEditorState = imagePlugin.addImage(
            editorState,
            reader.result as string,
            {}
          );
          setEditorState(newEditorState);
        }
      };

      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="relative">
      <div className="bg-background z-50 sticky top-0 flex justify-end mx-4 space-x-2">
        <div
          className="p-2 cursor-pointer border rounded-lg"
          onClick={() => toggleInlineStyle("BOLD")}
        >
          <FontBoldIcon />
        </div>
        <div
          className="p-2 cursor-pointer border rounded-lg"
          onClick={() => toggleInlineStyle("ITALIC")}
        >
          <FontItalicIcon />
        </div>
        <div
          className="p-2 cursor-pointer border rounded-lg"
          onClick={() => toggleInlineStyle("UNDERLINE")}
        >
          <UnderlineIcon />
        </div>
        <div
          className="p-2 cursor-pointer border rounded-lg"
          onClick={() => toggleInlineStyle("STRIKETHROUGH")}
        >
          <StrikethroughIcon />
        </div>
        <div
          className="p-2 cursor-pointer border rounded-lg"
          onClick={() => {
            // @ts-ignore
            fileRef.current.value = "";
            // @ts-ignore
            fileRef.current.click();
          }}
        >
          <CameraIcon className="h-4 w-4" />
          <input
            type="file"
            ref={fileRef}
            style={{ display: "none" }}
            onChange={handleImageUpload}
            multiple
          />
        </div>
      </div>
      <div
        ref={divRef}
        className="w-[270px] sm:w-[462px] p-4 overflow-wrap break-word bg-black text-white"
        style={{ width: "100%", height: "100%" }}
      >
        <div className="relative p-4 border rounded-lg">
          <Editor
            ref={editorRef}
            editorState={editorState}
            onChange={handleChange}
            handleKeyCommand={handleKeyCommand}
            placeholder="Type your cast here..."
            plugins={[imagePlugin, dragNDropPlugin]}
          />
        </div>
      </div>
    </div>
  );
};

export default LongCast;
