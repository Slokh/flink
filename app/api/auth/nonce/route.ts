import { IronSession, getIronSession } from "iron-session";
import { NextResponse } from "next/server";
import { generateNonce } from "siwe";

export type DynamicSegments = {
  params: { slug: string } | undefined;
};

export type RouteHandler = (
  request: Request,
  routeSegment: DynamicSegments
) => Promise<Response>;

export type RouteHandlerWithSession = (
  request: Request & { session: IronSession },
  routeSegment: DynamicSegments
) => Promise<Response>;

const ironSessionWrapper = (handler: RouteHandlerWithSession): RouteHandler => {
  return async (request, routeSegment) => {
    const cookieResponse = new Response();
    const session = await getIronSession(request, cookieResponse, {
      cookieName: "siwe",
      password: "complex_password_at_least_32_characters_long",
      cookieOptions: {
        secure: process.env.NODE_ENV === "production",
      },
    });

    const sessionRequest = Object.assign(request, { session });
    const response = await handler(sessionRequest, routeSegment);

    const setCookie = cookieResponse.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }

    return response;
  };
};

export const GET: RouteHandlerWithSession = ironSessionWrapper(
  async (request: Request & { session: IronSession }) => {
    request.session.nonce = generateNonce();
    await request.session.save();
    return NextResponse.json({ nonce: request.session.nonce });
  }
);
