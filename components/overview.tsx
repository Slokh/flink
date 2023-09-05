import { Entity } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export const Overview = ({
  id,
  entity: { pfps, displays, bios },
}: {
  id: string;
  entity: Entity;
}) => {
  const pfp = pfps[0];
  const display = displays[0];
  const bio = bios[0];

  return bios?.length > 0 || pfps?.length > 0 || displays?.length > 0 ? (
    <>
      <Avatar>
        <AvatarImage src={pfp?.value} className="object-cover" />
        <AvatarFallback>?</AvatarFallback>
      </Avatar>
      <div className="font-semibold text-2xl  text-center">
        {display?.value || id}
      </div>
      <div className="text-center">{bio?.value}</div>
    </>
  ) : (
    <></>
  );
};
