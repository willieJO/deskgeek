// AniList's extraLarge images use the CDN's /large/ directory, not /extraLarge/.
// Only upgrade recognized cover URLs; keep the original as a fallback for legacy records.
export function higherResolutionCoverUrl(source) {
  if (typeof source !== "string" || !source) return source;
  try {
    const url = new URL(source);
    if (
      ["https:", "http:"].includes(url.protocol) &&
      /^s\d+\.anilist\.co$/i.test(url.hostname) &&
      /^\/file\/anilistcdn\/media\/(anime|manga)\/cover\/(small|medium)\/[^/]+$/.test(
        url.pathname,
      )
    ) {
      url.pathname = url.pathname.replace(
        /\/cover\/(small|medium)\//,
        "/cover/large/",
      );
      return url.href;
    }
  } catch {
    /* Relative paths, local uploads and blob URLs retain their original source. */
  }
  return source;
}

export function coverImageCandidates(source) {
  if (!source) return [];
  return [...new Set([higherResolutionCoverUrl(source), source])];
}

export function bestAniListCover(cover) {
  return cover?.extraLarge || cover?.large || cover?.medium || "";
}
