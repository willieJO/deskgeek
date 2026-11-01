import test from "node:test";
import assert from "node:assert/strict";
import {
  bestAniListCover,
  coverImageCandidates,
  higherResolutionCoverUrl,
} from "../src/utils/coverImages.js";

const small =
  "https://s4.anilist.co/file/anilistcdn/media/manga/cover/small/bx125116-ZfCpel1WOdmF.jpg";
const large = small.replace("/small/", "/large/");

test("upgrades the supplied legacy AniList manga cover and keeps an original fallback", () => {
  assert.equal(higherResolutionCoverUrl(small), large);
  assert.deepEqual(coverImageCandidates(small), [large, small]);
});

test("upgrades medium anime covers while preserving query and fragment", () => {
  const url =
    "https://s1.anilist.co/file/anilistcdn/media/anime/cover/medium/example.png?v=2#cover";
  assert.equal(
    higherResolutionCoverUrl(url),
    url.replace("/medium/", "/large/"),
  );
});

test("does not rewrite uploads, arbitrary providers, malformed URLs or unrelated AniList assets", () => {
  for (const source of [
    "/api/MediaDex/imagem/upload-small.jpg",
    "blob:http://localhost/123",
    "data:image/png;base64,abc",
    "https://example.com/cover/small/image.jpg",
    "https://s4.anilist.co.evil.test/file/anilistcdn/media/manga/cover/small/image.jpg",
    "https://s4.anilist.co/file/anilistcdn/staff/large/image.jpg",
    "not a URL",
    large,
  ]) {
    assert.equal(higherResolutionCoverUrl(source), source);
    assert.deepEqual(coverImageCandidates(source), [source]);
  }
});

test("selects the largest URL actually returned by AniList without inventing variants", () => {
  assert.equal(
    bestAniListCover({ extraLarge: "xl", large: "l", medium: "m" }),
    "xl",
  );
  assert.equal(
    bestAniListCover({ extraLarge: null, large: "l", medium: "m" }),
    "l",
  );
  assert.equal(bestAniListCover({ medium: small }), small);
  assert.equal(bestAniListCover(null), "");
  assert.deepEqual(coverImageCandidates(""), []);
});
