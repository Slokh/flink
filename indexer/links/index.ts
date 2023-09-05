export const URL_REGEX =
  /\b(?:https?:\/\/|www\.|ftp:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+([/?].*)?\b/gi;

export const extractLinks = (text?: string): string[] => {
  if (!text) return [];

  const items = text
    .toLowerCase()
    .trim()
    .split("\n")
    .map((t) => t.split(" "))
    .flat();

  const links: string[] = [];
  for (const item of items) {
    const matches = item.match(URL_REGEX);
    if (!matches) continue;

    const normalizedLinks = matches.map((link) => normalizeLink(link));

    const deduplicatedLinks = normalizedLinks.filter(
      (link, index) =>
        normalizedLinks.indexOf(link) === index && isValidLink(link)
    );

    links.push(...deduplicatedLinks);
  }

  return links;
};

export const normalizeLink = (link: string): string => {
  let normalized = link.trim().toLowerCase();
  if (normalized.includes(" ")) {
    normalized = normalized.split(" ")[0];
  }

  const startsWiths = ["http://", "https://", "www."];
  const endsWiths = ["/"];
  for (const startsWith of startsWiths) {
    if (normalized.startsWith(startsWith)) {
      normalized = normalized.replace(startsWith, "");
    }
  }
  for (const endsWith of endsWiths) {
    if (normalized.endsWith(endsWith)) {
      normalized = normalized.slice(0, -endsWith.length);
    }
  }

  return normalized;
};

export const isValidLink = (link: string) => {
  return !link.includes(" ") && link.match(URL_REGEX) && link.length > 5;
};
