import {
  HubRpcClient,
  UserDataBody,
  VerificationAddEthAddressBody,
  getSSLHubRpcClient,
} from "@farcaster/hub-nodejs";
import { Farcaster } from "../db/farcaster";
import { Ethereum } from "../db/ethereum";

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

  public async getCast(fid: number, castHash: string) {
    const hash = Uint8Array.from(Buffer.from(castHash.slice(2), "hex"));
    const cast = await this.client.getCast({ hash, fid });
    if (cast.isOk()) {
      return cast.value;
    } else {
      console.log(
        `[hub-error] Failed to get cast ${fid} ${castHash} - ${cast.error}`
      );
    }
  }

  public async getVerifiedAddresses(fid: number): Promise<Ethereum[]> {
    const verificationMessages = await this.getVerificationMessages(fid);
    if (!verificationMessages.length) return [];

    const addresses = this.getAddresses(verificationMessages);

    return addresses;
  }

  public async getReactionMessages(fid: number, castHash: string) {
    const hash = Uint8Array.from(Buffer.from(castHash.slice(2), "hex"));
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
