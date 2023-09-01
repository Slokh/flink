import fetch from "node-fetch";

export const URL_REGEX =
  /\b(?:https?:\/\/|www\.|ftp:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+([/?].*)?\b/gi;

const MAX_RETRIES = 3;

export const fetchWithRetry = async (
  url: string,
  options?: any,
  retries = MAX_RETRIES
): Promise<any> => {
  try {
    const data = await fetch(url, options);
    if (data.status === 200) {
      return data.json();
    }
  } catch (err) {
    console.log(err);
  }
  if (retries === 0) return undefined;
  await new Promise((r) => setTimeout(r, 1000));
  return await fetchWithRetry(url, options, retries - 1);
};
