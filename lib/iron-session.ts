import { IronSession, getIronSession } from "iron-session";

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

export const ironSessionWrapper = (
  handler: RouteHandlerWithSession
): RouteHandler => {
  return async (request, routeSegment) => {
    const cookieResponse = new Response();
    const session = await getIronSession(request, cookieResponse, {
      cookieName: "siwe",
      password: process.env.AUTH_PASSWORD as string,
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
