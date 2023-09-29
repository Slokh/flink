import {
  RouteHandlerWithSession,
  ironSessionWrapper,
} from "@/lib/iron-session";
import { NextResponse } from "next/server";

export const GET: RouteHandlerWithSession = ironSessionWrapper(
  async (request) => {
    // @ts-ignore
    return NextResponse.json({ address: request.session.siwe?.data.address });
  }
);
