import { Channel } from "./types";
import channels from "./channels.json";

export const CHANNELS_BY_URL: { [key: string]: Channel } = channels
  .map((c) => ({
    ...c,
    channelId: c.id,
    parentUrl: c.url,
    image: c.imageUrl,
  }))
  .reduce((acc, channel) => {
    acc[channel.parentUrl] = {
      ...channel,
      image: `/channels/${channel.channelId}.jpg`,
    };
    return acc;
  }, {} as { [key: string]: Channel });

export const CHANNELS_BY_ID: { [key: string]: Channel } = channels
  .map((c) => ({
    ...c,
    channelId: c.id,
    parentUrl: c.url,
    image: c.imageUrl,
  }))
  .reduce((acc, channel) => {
    acc[channel.channelId] = {
      ...channel,
      image: `/channels/${channel.channelId}.jpg`,
    };
    return acc;
  }, {} as { [key: string]: Channel });

export const CHANNELS = channels
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((channel) => ({
    ...channel,
    channelId: channel.id,
    parentUrl: channel.url,
    image: `/channels/${channel.id}.jpg`,
  }));
