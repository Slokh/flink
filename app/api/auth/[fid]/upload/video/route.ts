import {
  RouteHandlerWithSession,
  ironSessionWrapper,
} from "@/lib/iron-session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import AWS from "aws-sdk";

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

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
    const signer = await prisma.user.findFirst({
      where: { address: address.toLowerCase(), fid },
    });
    if (!signer?.signerUuid) {
      return NextResponse.json(
        {
          status: 401,
          statusText: "Unauthorized",
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const body = await request.formData();
    const video = body.get("video") as unknown as File;
    if (!video) {
      return NextResponse.json(
        {
          status: 400,
          statusText: "Bad Request",
          error: "No video provided.",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await video.arrayBuffer());
    const s3Params = {
      Bucket: "flinkfyi",
      Key: `${Date.now()}_${body.get("name")}`,
      Body: buffer,
      ContentDisposition: "inline",
      ContentType: video.type,
    };

    try {
      const res = await s3.upload(s3Params).promise();
      return NextResponse.json({
        data: {
          link: res.Location.replace(
            "flinkfyi.s3.amazonaws.com",
            "files.flink.fyi"
          ),
        },
      });
    } catch (err) {
      console.log(err);
      return NextResponse.json(
        {
          status: 500,
          statusText: "Internal Server Error",
          error: "Failed to upload video.",
        },
        { status: 500 }
      );
    }
  }
);
