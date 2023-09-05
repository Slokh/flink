import { Card as BaseCard, CardContent, CardHeader } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const CardItem = ({
    platform,
    identity,
    url,
    verified,
    image,
  }: {
    platform: string;
    identity: string;
    url: string;
    verified: boolean;
    image?: string;
  }) => (
    <a href={url} target="_blank">
      <div className="flex flex-row items-center space-x-2 w-full">
        <div className="w-7">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image || `/${platform.toLowerCase()}.png`}
            alt="farcaster"
            className="max-w-7 max-h-7"
          />
        </div>
        <div className="flex flex-col w-64">
          <div className="font-semibold whitespace-normal break-words	">
            {identity}
          </div>
          <div className="text-sm text-slate-400 flex flex-row items-center space-x-1">
            <span>{platform}</span>
            {verified && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="bg-green-400 rounded-full">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
                          fill="black"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Verified</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
    </a>
  );
  
  export const Card = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <BaseCard className="w-full">
      <CardHeader>{title}</CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">{children}</div>
      </CardContent>
    </BaseCard>
  );