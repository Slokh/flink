import {
  RouteHandlerWithSession,
  ironSessionWrapper,
} from "@/lib/iron-session";
import { NextResponse } from "next/server";
import { generateNonce } from "siwe";

export const GET: RouteHandlerWithSession = ironSessionWrapper(
  async (request) => {
    request.session.nonce = generateNonce();
    await request.session.save();
    return NextResponse.json({ nonce: request.session.nonce });
  }
);
