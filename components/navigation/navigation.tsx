import Link from "next/link";
import { buttonVariants } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export const NavigationSelect = ({
  defaultValue,
  placeholder,
  onValueChange,
  options,
}: {
  defaultValue: string;
  placeholder: string;
  onValueChange: (value: any) => void;
  options: { value: string; label: string }[];
}) => (
  <div className="mr-2">
    <Select defaultValue={defaultValue} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(({ value, label }) => (
          <SelectItem key={value} value={value} className="whitespace-nowrap">
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export const NavigationButton = ({
  href,
  isSelected,
  children,
}: {
  href: string;
  isSelected: boolean;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className={`mr-2 ${buttonVariants({
      variant: isSelected ? "default" : "secondary",
      size: "sm",
    })}`}
  >
    {children}
  </Link>
);

export const NavigationGroup = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`flex flex-row overflow-auto overflow-x-scroll whitespace-nowrap sm:h-12 h-fit items-center py-2 sm:py-0 px-2 ${
      className ? ` ${className}` : ""
    }`}
  >
    {children}
  </div>
);

export const Navigation = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b">
    {children}
  </div>
);
