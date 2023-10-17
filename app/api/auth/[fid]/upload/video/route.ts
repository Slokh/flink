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
    const fileName = `${Date.now()}_${body.get("name")}`;

    const s3Params = {
      Bucket: "flinkfyi",
      Key: fileName,
      ContentType: body.get("type"),
      Expires: 60 * 60, // URL expires in 1 hour
    };

    try {
      const url = await new Promise<string>((resolve, reject) => {
        s3.getSignedUrl("putObject", s3Params, (err, url) => {
          if (err) reject(err);
          else resolve(url);
        });
      });

      return NextResponse.json({
        fileName,
        url,
      });
    } catch (err) {
      return NextResponse.json(
        {
          status: 500,
          statusText: "Internal Server Error",
          error: "Failed to generate pre-signed URL.",
        },
        { status: 500 }
      );
    }
  }
);
