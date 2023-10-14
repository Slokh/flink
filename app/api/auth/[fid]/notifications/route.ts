import { getCastsByFidHashes } from "@/lib/casts";
import {
  RouteHandlerWithSession,
  ironSessionWrapper,
} from "@/lib/iron-session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET: RouteHandlerWithSession = ironSessionWrapper(
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

    const fid = parseInt(params.fid as string);
    const signer = await prisma.user.findFirst({
      where: { address: address.toLowerCase(), fid },
    });
    if (!signer) {
      return NextResponse.json(
        {
          status: 401,
          statusText: "Unauthorized",
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    let preferences = await prisma.userPreferences.findFirst({
      where: { address: address.toLowerCase(), fid },
    });
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: {
          address: address.toLowerCase(),
          fid,
        },
      });
    }

    const [likes, recasts, follows, replies, mentions] = await Promise.all([
      prisma.farcasterCastReaction.findMany({
        where: {
          reactionType: "like",
          targetFid: fid,
          timestamp: {
            gt: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000),
          },
          deleted: false,
        },
      }),
      prisma.farcasterCastReaction.findMany({
        where: {
          reactionType: "recast",
          targetFid: fid,
          timestamp: {
            gt: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000),
          },
          deleted: false,
        },
      }),
      prisma.farcasterLink.findMany({
        where: {
          linkType: "follow",
          targetFid: fid,
          timestamp: {
            gt: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000),
          },
          deleted: false,
        },
      }),
      prisma.farcasterCast.findMany({
        where: {
          parentFid: fid,
          timestamp: {
            gt: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000),
          },
          deleted: false,
        },
        include: {
          mentions: true,
        },
      }),
      prisma.farcasterCastMention.findMany({
        where: {
          mention: fid,
          timestamp: {
            gt: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000),
          },
          deleted: false,
        },
      }),
    ]);

    const fidHashes = [
      ...likes.map(({ targetFid, targetHash }) => ({
        fid: targetFid,
        hash: targetHash,
      })),
      ...recasts.map(({ targetFid, targetHash }) => ({
        fid: targetFid,
        hash: targetHash,
      })),
      ...mentions.map(({ fid, hash }) => ({ fid, hash })),
    ];

    const casts = await getCastsByFidHashes(fidHashes);
    const allCasts = casts.concat(replies);

    const castMap = allCasts.reduce((map, cast) => {
      map[cast.hash] = cast;
      return map;
    }, {} as Record<string, any>);

    const fids = [
      ...likes.map((like) => like.fid),
      ...recasts.map((recast) => recast.fid),
      ...follows.map((follow) => follow.fid),
      ...replies.map((reply) => reply.fid),
      ...allCasts.flatMap((cast) =>
        cast.mentions.map((mention) => mention.fid)
      ),
    ].filter((fid, index, self) => self.indexOf(fid) === index);

    const users = await prisma.farcaster.findMany({
      where: { fid: { in: fids } },
    });

    const userMap = users.reduce((map, user) => {
      map[user.fid] = user;
      return map;
    }, {} as Record<string, any>);

    const likeNotifications = likes
      .map((like) => ({
        type: "like",
        timestamp: like.timestamp,
        user: userMap[like.fid],
        data: castMap[like.targetHash]
          ? {
              ...castMap[like.targetHash],
              mentions: castMap[like.targetHash].mentions.map(
                ({ mention, mentionPosition }: any) => ({
                  mention: userMap[mention],
                  position: mentionPosition,
                })
              ),
            }
          : undefined,
      }))
      .filter(({ data }) => data);

    const recastNotifications = recasts
      .map((recast) => ({
        type: "recast",
        timestamp: recast.timestamp,
        user: userMap[recast.fid],
        data: castMap[recast.targetHash]
          ? {
              ...castMap[recast.targetHash],
              mentions: castMap[recast.targetHash].mentions.map(
                ({ mention, mentionPosition }: any) => ({
                  mention: userMap[mention],
                  position: mentionPosition,
                })
              ),
            }
          : undefined,
      }))
      .filter(({ data }) => data);

    const followNotifications = follows.map((follow) => ({
      type: "follow",
      timestamp: follow.timestamp,
      user: userMap[follow.fid],
    }));

    const replyNotifications = replies
      .map((reply) => ({
        type: "reply",
        timestamp: reply.timestamp,
        user: userMap[reply.fid],
        data: castMap[reply.hash]
          ? {
              ...castMap[reply.hash],
              mentions: castMap[reply.hash].mentions.map(
                ({ mention, mentionPosition }: any) => ({
                  mention: userMap[mention],
                  position: mentionPosition,
                })
              ),
            }
          : undefined,
      }))
      .filter(({ data }) => data);

    const mentionNotifications = mentions
      .map((mention) => ({
        type: "mention",
        timestamp: mention.timestamp,
        user: userMap[mention.fid],
        data: castMap[mention.hash]
          ? {
              ...castMap[mention.hash],
              mentions: castMap[mention.hash].mentions.map(
                ({ mention, mentionPosition }: any) => ({
                  mention: userMap[mention],
                  position: mentionPosition,
                })
              ),
            }
          : undefined,
      }))
      .filter(({ data }) => data);

    const notifications = [
      ...likeNotifications,
      ...recastNotifications,
      ...followNotifications,
      ...replyNotifications,
      ...mentionNotifications,
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .filter(({ user }) => user.fid !== fid);

    const notificationsViewedAt = preferences.notificationsViewedAt;
    let unreadNotifications = notifications.length;
    if (notificationsViewedAt) {
      unreadNotifications = notifications.filter(
        (n) => notificationsViewedAt < n.timestamp
      ).length;
    }
    return NextResponse.json({
      notifications: notifications.map((n) => ({
        ...n,
        viewed:
          preferences?.notificationsViewedAt &&
          preferences.notificationsViewedAt >= n.timestamp,
      })),
      notificationsViewedAt: preferences.notificationsViewedAt,
      unreadNotifications,
    });
  }
);

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

    const fid = parseInt(params.fid as string);
    const preferences = await prisma.userPreferences.findFirst({
      where: { address: address.toLowerCase(), fid },
    });
    if (!preferences) {
      return NextResponse.json(
        {
          status: 401,
          statusText: "Unauthorized",
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    await prisma.userPreferences.update({
      where: {
        address_fid: { address: address.toLowerCase(), fid },
      },
      data: {
        notificationsViewedAt: new Date(),
      },
    });

    return NextResponse.json({});
  }
);
