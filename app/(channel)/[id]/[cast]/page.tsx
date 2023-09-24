import { CastThread } from "@/components/casts/cast-thread";
import { getCast } from "@/lib/requests";

export default async function Cast({ params }: { params: { cast: string } }) {
  const cast = await getCast(params.cast);
  return cast ? (
    <CastThread cast={cast} hash={params.cast} isMinified />
  ) : (
    <></>
  );
}
