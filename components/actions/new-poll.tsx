import { useEffect, useState } from "react";
import { Cast } from "./new-cast";
import { Editor, EditorState } from "draft-js";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export const Poll = ({
  onChange,
}: {
  onChange: (c: Partial<Cast>) => void;
}) => {
  const [options, setOptions] = useState<string[]>([""]);
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );

  const addOption = () => {
    if (options.length < 5) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const getLength = (e: EditorState) => {
    const editorLength = new TextEncoder().encode(
      e.getCurrentContent().getPlainText()
    ).length;
    const optionsLength = options.reduce(
      (total, option) => total + option.trim().length + 4,
      0
    );
    return editorLength + optionsLength + 2;
  };

  useEffect(() => {
    const content = editorState.getCurrentContent().getPlainText();
    const cleanedOptions = options.filter((o) => o.trim().length > 0);
    const contentWithOptions = `${content}\n\n${cleanedOptions
      .map((o, i) => `${i + 1}. ${o}`)
      .join("\n")}`;
    const isValid =
      cleanedOptions.length > 1 &&
      contentWithOptions.length > 2 &&
      new TextEncoder().encode(contentWithOptions).length <= 320;
    onChange({
      text: contentWithOptions,
      isValid,
      pollData: {
        options: cleanedOptions,
        prompt: content,
      },
    });
  }, [editorState, options]);

  return (
    <div className="flex flex-col space-y-2">
      <div className="relative border rounded-lg w-[270px] sm:w-[462px] p-1 overflow-wrap break-word">
        <div className="p-1">
          <Editor
            editorState={editorState}
            onChange={setEditorState}
            placeholder="Ask a question..."
          />
        </div>
        <div className="flex flex-row justify-between items-end w-full mt-1">
          <span
            className={`text-xs${
              getLength(editorState) > 320 ? " text-red-500" : ""
            }`}
          >
            {`${getLength(editorState)}/320`}
          </span>
        </div>
      </div>
      {options.map((option, i) => (
        <div className="flex flex-row space-x-2" key={i}>
          <Input
            value={option}
            onChange={(e) => handleOptionChange(i, e.target.value)}
            placeholder="Add an option..."
          />
          <Button
            onClick={() => removeOption(i)}
            disabled={options.length === 1}
          >
            Remove
          </Button>
        </div>
      ))}
      {options.length < 5 && <Button onClick={addOption}>Add option</Button>}
    </div>
  );
};
