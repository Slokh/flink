import { Loading as LoadingIcon } from "../components/loading";

export default function Loading() {
  return (
    <div className="w-full h-full justify-center items-center flex">
      <LoadingIcon width={32} />
    </div>
  );
}
