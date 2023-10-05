import { Input } from "./ui/input";

export const FileUpload = ({
  onFileUpload,
  isDisabled,
  children,
}: {
  onFileUpload: (url: string) => void;
  isDisabled?: boolean;
  children: React.ReactNode;
}) => {
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && !isDisabled) {
      const file = e.target.files[0];
      // Read the file as a data URL (base64)
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data: string = reader.result as string;

        // Remove the prefix that says what kind of data it is
        const base64string = base64data.split(",")[1];

        const res = await fetch("https://imgur-apiv3.p.rapidapi.com/3/image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Client-ID 2c72c9f7fc84329",
            "X-RapidApi-Key":
              "0bb3ce13d0msh95902c15e7eb132p153594jsn33b6ad91d004",
          },
          body: JSON.stringify({ image: base64string }),
        });

        if (res.status !== 200) {
          return;
        }

        const { data } = await res.json();
        onFileUpload(data.link);
      };
    }
  };

  return (
    <>
      <label htmlFor="embed">{children}</label>
      <Input
        id="embed"
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isDisabled}
        accept="image/*"
      />
    </>
  );
};
