import {
  HubRpcClient,
  LinkBody,
  UserDataBody,
  VerificationAddEthAddressBody,
  getSSLHubRpcClient,
} from "@farcaster/hub-nodejs";

export type FarcasterUser = {
  fid: number;
  fname?: string;
  display?: string;
  pfp?: string;
  bio?: string;
  addresses: string[];
  following: number[];
};

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

  public async getFarcasterUsers(fids: number[]): Promise<FarcasterUser[]> {
    return await Promise.all(
      fids.map((fid) => this.getFarcasterUser(fid, false))
    );
  }

  public async getFarcasterUser(
    fid: number,
    includeLinks = true
  ): Promise<FarcasterUser> {
    const promises = [];
    promises.push(this.getUserDataMessages(fid));
    promises.push(this.getVerificationMessages(fid));
    if (includeLinks) {
      promises.push(this.getLinkMessages(fid));
    }

    const results = await Promise.all(promises);
    const userDataMessages = results[0] as UserDataBody[];
    const verificationMessages = results[1] as VerificationAddEthAddressBody[];
    const linkMessages = (results[2] || []) as LinkBody[];

    const pfp = userDataMessages.find(({ type }) => type === 1)?.value;
    const display = userDataMessages.find(({ type }) => type === 2)?.value;
    const bio = userDataMessages.find(({ type }) => type === 3)?.value;
    const fname = userDataMessages.find(({ type }) => type === 6)?.value;
    const addresses = this.getAddresses(verificationMessages);

    const following = linkMessages
      .map(({ targetFid }) => targetFid)
      .filter(Boolean) as number[];

    return {
      fid,
      fname,
      pfp,
      display,
      bio,
      addresses,
      following,
    };
  }

  private async getUserDataMessages(fid: number): Promise<UserDataBody[]> {
    const userData = await this.client.getUserDataByFid({ fid });
    if (!userData.isOk()) return [];

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

  private async getLinkMessages(fid: number): Promise<LinkBody[]> {
    const linkData = await this.client.getLinksByFid({ fid });
    if (!linkData.isOk()) return [];

    const linkMessages = linkData.value.messages
      .map(({ data }) => data?.linkBody)
      .filter(Boolean) as LinkBody[];

    return linkMessages;
  }

  private getAddresses(
    verificationMessages: VerificationAddEthAddressBody[]
  ): string[] {
    const addresses = verificationMessages
      .map(
        ({ address }) =>
          `0x${Buffer.from(address).toString("hex").toLowerCase()}`
      )
      .filter((v, i, a) => a.indexOf(v) === i);

    return addresses;
  }
}

export const getHubClient = async (): Promise<Client> => {
  const client = new Client();
  await client.connect();
  return client;
};
