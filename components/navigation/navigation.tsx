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
  <div>
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
    className={buttonVariants({
      variant: isSelected ? "default" : "secondary",
      size: "sm",
    })}
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
    className={`flex flex-row space-x-2 overflow-auto overflow-x-scroll whitespace-nowrap h-12 items-center px-2 ${
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
