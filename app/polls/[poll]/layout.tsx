import { Metadata } from "next";
import { getPoll } from "@/lib/requests";

export const generateMetadata = async ({
  params,
}: {
  params: { poll: string };
}): Promise<Metadata> => {
  const poll = await getPoll(params.poll);

  const { prompt, results } = poll;

  return {
    description: results.map(({ option }) => option).join(", "),
    icons: {
      icon: "/favicon.ico",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `https://flink.fyi/polls${params.poll}`,
      title: prompt,
      description: results.map(({ option }) => option).join(", "),
      images: [`/api/polls/${params.poll}/og`],
      siteName: "flink",
    },
  };
};

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  return (
    <div className="flex flex-col w-full h-full flex-grow">{children}</div>
  );
}
