import { CHANNELS_BY_ID } from "@/lib/channels";
import {
  RouteHandlerWithSession,
  ironSessionWrapper,
} from "@/lib/iron-session";
import prisma from "@/lib/prisma";
import { JsonArray, JsonObject } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";

export const POST: RouteHandlerWithSession = ironSessionWrapper(
  async (request, { params }) => {
    const address = request.session.siwe?.data.address;
    if (!address) {
      return NextResponse.json(
        {
          status: 401,
          statusText: "Unauthorized",
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const channel = params?.channel as string;
    const parentUrl =
      CHANNELS_BY_ID[channel]?.parentUrl || decodeURIComponent(channel);

    const isValidChannel = await prisma.farcasterChannelStats.findFirst({
      where: {
        url: parentUrl,
      },
    });
    if (!isValidChannel) {
      return NextResponse.json(
        {
          status: 400,
          statusText: "Bad Request",
          error: "Invalid channel",
        },
        { status: 400 }
      );
    }

    const fid = parseInt(params.fid as string);
    const user = await prisma.user.findFirst({
      where: {
        address: address.toLowerCase(),
        fid,
      },
    });

    let preferences: JsonObject = {};
    if (user?.preferences && typeof user?.preferences === "object") {
      preferences = user.preferences as JsonObject;
    }

    let channels: JsonArray = [];
    if (preferences.channels && Array.isArray(preferences.channels)) {
      channels = preferences.channels as JsonArray;
    }

    preferences.channels = channels
      .filter((c) => c !== parentUrl)
      .concat([parentUrl]);

    await prisma.userPreferences.upsert({
      where: {
        address_fid: { address: address.toLowerCase(), fid },
      },
      create: { address: address.toLowerCase(), fid, preferences },
      update: { preferences },
    });

    return NextResponse.json({});
  }
);

export const DELETE: RouteHandlerWithSession = ironSessionWrapper(
  async (request, { params }) => {
    const address = request.session.siwe?.data.address;
    if (!address) {
      return NextResponse.json(
        {
          status: 401,
          statusText: "Unauthorized",
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const channel = params?.channel as string;
    const parentUrl =
      CHANNELS_BY_ID[channel]?.parentUrl || decodeURIComponent(channel);

    const isValidChannel = await prisma.farcasterChannelStats.findFirst({
      where: {
        url: parentUrl,
      },
    });
    if (!isValidChannel) {
      return NextResponse.json(
        {
          status: 400,
          statusText: "Bad Request",
          error: "Invalid channel",
        },
        { status: 400 }
      );
    }

    const fid = parseInt(params.fid as string);
    const user = await prisma.user.findFirst({
      where: {
        address: address.toLowerCase(),
        fid,
      },
    });

    let preferences: JsonObject = {};
    if (user?.preferences && typeof user?.preferences === "object") {
      preferences = user.preferences as JsonObject;
    }

    let channels: JsonArray = [];
    if (preferences.channels && Array.isArray(preferences.channels)) {
      channels = preferences.channels as JsonArray;
    }

    preferences.channels = channels.filter((c) => c !== parentUrl);

    await prisma.userPreferences.upsert({
      where: {
        address_fid: { address: address.toLowerCase(), fid },
      },
      create: { address: address.toLowerCase(), fid, preferences },
      update: { preferences },
    });

    return NextResponse.json({});
  }
);
