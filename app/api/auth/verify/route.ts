import { NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import {
  RouteHandlerWithSession,
  ironSessionWrapper,
} from "@/lib/iron-session";

export const POST: RouteHandlerWithSession = ironSessionWrapper(
  async (request) => {
    try {
      const { message, signature } = await request.json();
      const siweMessage = new SiweMessage(message);
      const fields = await siweMessage.verify({ signature });

      if (fields.data.nonce !== request.session.nonce)
        return NextResponse.json(
          { message: "Invalid nonce." },
          { status: 422 }
        );

      // @ts-ignore
      request.session.siwe = fields;
      await request.session.save();
      return NextResponse.json({ ok: true });
    } catch (_error) {
      return NextResponse.json({ ok: false });
    }
  }
);
