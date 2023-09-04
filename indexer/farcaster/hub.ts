import {
  FARCASTER_EPOCH,
  HubRpcClient,
  MessageData,
  ReactionType,
  UserDataBody,
  VerificationAddEthAddressBody,
  getSSLHubRpcClient,
} from "@farcaster/hub-nodejs";
import { Farcaster } from "../db/farcaster";
import { Ethereum } from "../db/ethereum";
import { Reaction } from "../db/cast";

export class Client {
  public client: HubRpcClient;
  private hubRpcEndpoint: string;

  constructor() {
    this.hubRpcEndpoint = process.env.HUB_RPC_ENDPOINT as string;
    this.client = getSSLHubRpcClient(this.hubRpcEndpoint);
  }

  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = Date.now() + 5000;
      this.client.$.waitForReady(timeout, (e: any) => {
        if (e) {
          console.error(`Failed to connect to ${this.hubRpcEndpoint}:`, e);
          reject(e);
        } else {
          console.log(`Connected to ${this.hubRpcEndpoint}`);
          resolve();
        }
      });
    });
  }

  public async subscribe(args: any): Promise<any> {
    return await this.client.subscribe(args);
  }

  public async getFarcasterUser(fid: number): Promise<Farcaster | undefined> {
    const userDataMessages = await this.getUserDataMessages(fid);
    if (userDataMessages === undefined) {
      return undefined;
    }

    const pfp = userDataMessages.find(({ type }) => type === 1)?.value;
    const display = userDataMessages.find(({ type }) => type === 2)?.value;
    const bio = userDataMessages.find(({ type }) => type === 3)?.value;
    const fname = userDataMessages.find(({ type }) => type === 6)?.value;

    return {
      fid,
      fname,
      pfp,
      display,
      bio,
      source: "FARCASTER",
      verified: true,
    };
  }

  public async getVerifiedAddresses(fid: number): Promise<Ethereum[]> {
    const verificationMessages = await this.getVerificationMessages(fid);
    if (!verificationMessages.length) return [];

    const addresses = this.getAddresses(verificationMessages);

    return addresses;
  }

  public async getCastReactions(fid: number, hash: Uint8Array) {
    const messages = await this.getReactionMessages(fid, hash);
    if (!messages.length) return [];

    return messages
      .map(({ data }) => this.toReaction(data))
      .filter(Boolean) as Reaction[];
  }

  public toReaction(messageData?: MessageData) {
    const reactionBody = messageData?.reactionBody;
    if (
      !reactionBody ||
      reactionBody?.type === ReactionType.NONE ||
      !(reactionBody?.targetCastId || reactionBody?.targetUrl)
    ) {
      return;
    }

    const reactionType =
      reactionBody?.type === ReactionType.LIKE ? "like" : "recast";

    let reaction: Reaction | undefined;
    if (reactionBody?.targetCastId) {
      reaction = {
        target: convertToHex(reactionBody.targetCastId.hash),
        fid: messageData.fid,
        reactionType,
        targetFid: reactionBody.targetCastId.fid,
        targetType: "cast",
        timestamp: new Date(messageData.timestamp * 1000 + FARCASTER_EPOCH),
      };
    } else {
      reaction = {
        target: reactionBody.targetUrl || "",
        fid: messageData.fid,
        reactionType,
        targetFid: 0,
        targetType: "url",
        timestamp: new Date(messageData.timestamp * 1000 + FARCASTER_EPOCH),
      };
    }

    return reaction;
  }

  private async getReactionMessages(fid: number, hash: Uint8Array) {
    const reactions = await this.client.getReactionsByTarget({
      targetCastId: {
        hash,
        fid,
      },
    });
    if (!reactions.isOk()) {
      return [];
    }

    return reactions.value.messages;
  }

  private async getUserDataMessages(
    fid: number
  ): Promise<UserDataBody[] | undefined> {
    const userData = await this.client.getUserDataByFid({ fid });
    if (!userData.isOk()) return undefined;

    const userDataMessages = userData.value.messages
      .map(({ data }) => data?.userDataBody)
      .filter(Boolean) as UserDataBody[];

    return userDataMessages;
  }

  private async getVerificationMessages(
    fid: number
  ): Promise<VerificationAddEthAddressBody[]> {
    const verificationData = await this.client.getVerificationsByFid({ fid });
    if (!verificationData.isOk()) return [];

    const verificationMessages = verificationData.value.messages
      .map(({ data }) => data?.verificationAddEthAddressBody)
      .filter(Boolean) as VerificationAddEthAddressBody[];

    return verificationMessages;
  }

  public getAddresses(
    verificationMessages: VerificationAddEthAddressBody[]
  ): Ethereum[] {
    const addresses = verificationMessages
      .map(this.getAddress)
      .filter((v, i, a) => a.indexOf(v) === i);

    return addresses;
  }

  public getAddress({ address }: VerificationAddEthAddressBody): Ethereum {
    return {
      address: convertToHex(address),
      source: "FARCASTER",
      verified: true,
    };
  }
}

export const convertToHex = (buffer: Uint8Array) => {
  return `0x${Buffer.from(buffer).toString("hex").toLowerCase()}`;
};

export const getHubClient = async (): Promise<Client> => {
  const client = new Client();
  await client.connect();
  return client;
};
