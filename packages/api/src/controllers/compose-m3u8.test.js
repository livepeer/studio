import { setMock, clearMocks, Response } from "node-fetch";
import * as testData from "./compose-m3u8.test-data";
import composeM3U8 from "./compose-m3u8";

describe("compose-m3u8", () => {
  beforeEach(() => {
    for (const [name, text] of Object.entries(testData)) {
      setMock(`test://${name}/stream/playlist.m3u8`, () => new Response(text));
    }
    setMock(
      "test://404.m3u8",
      () => new Response("not found", { status: 404 }),
    );
  });

  afterEach(() => {
    clearMocks();
  });

  it("should combine responses", async () => {
    const combined = await composeM3U8([
      "test://playlist1/stream/playlist.m3u8",
      "test://playlist2/stream/playlist.m3u8",
      "test://playlist3/stream/playlist.m3u8",
    ]);
    expect(combined).toEqual(testData.combinedPlaylist);
  });

  it("should ignore 404ing responses", async () => {
    const combined = await composeM3U8([
      "test://playlist1/stream/playlist.m3u8",
      "test://playlist2/stream/playlist.m3u8",
      "test://playlist3/stream/playlist.m3u8",
      "test://404.m3u8",
    ]);
    expect(combined).toEqual(testData.combinedPlaylist);
  });

  it("should 404 if it only gets 404s", async () => {
    const combined = await composeM3U8([
      "test://404.m3u8",
      "test://404.m3u8",
      "test://404.m3u8",
    ]);
    expect(combined).toBeNull();
  });

  it("should combine master playlists like sets", async () => {
    const combined = await composeM3U8([
      "test://masterPlaylist1/stream/playlist.m3u8",
      "test://masterPlaylist2/stream/playlist.m3u8",
      "test://masterPlaylist3/stream/playlist.m3u8",
    ]);
    expect(combined).toEqual(testData.combinedMasterPlaylist);
  });

  it("should reject mixed master/media playlists", async () => {
    let failed = false;
    try {
      await composeM3U8([
        "test://playlist1/stream/playlist.m3u8",
        "test://masterPlaylist1/stream/playlist.m3u8",
      ]);
    } catch (e) {
      failed = true;
    }
    expect(failed).toBe(true);
  });

  it("should reject empty playlists", async () => {
    let failed = false;
    try {
      await composeM3U8(["test://emptyPlaylist/stream/playlist.m3u8"]);
    } catch (e) {
      failed = true;
    }
    expect(failed).toBe(true);
  });

  it("should combine responses", async () => {
    const combined = await composeM3U8([
      "test://longPlaylistStore/stream/playlist.m3u8",
      "test://longPlaylistBroadcaster/stream/playlist.m3u8",
    ]);
    expect(combined).toEqual(testData.longPlaylistCombined);
  });

  it("should limit lines in the output", async () => {
    const combined = await composeM3U8(
      [
        "test://longPlaylistStore/stream/playlist.m3u8",
        "test://longPlaylistBroadcaster/stream/playlist.m3u8",
      ],
      { limit: 10 },
    );
    expect(combined).toEqual(testData.longPlaylistCombinedTen);
    const allCombined = await composeM3U8(
      [
        "test://longPlaylistStore/stream/playlist.m3u8",
        "test://longPlaylistBroadcaster/stream/playlist.m3u8",
      ],
      { limit: 99999999 },
    );
    expect(allCombined).toEqual(testData.longPlaylistCombined);
  });

  it("should rewrite urls in the output", async () => {
    const combined = await composeM3U8(
      [
        "test://longPlaylistStoreRewritten/stream/playlist.m3u8",
        "test://longPlaylistBroadcaster/stream/playlist.m3u8",
      ],
      {
        rewrite: {
          from: "test://longPlaylistBroadcaster/stream",
          to: "https://example.com/store",
        },
      },
    );
    expect(combined).toEqual(testData.longPlaylistCombinedRewritten);
  });
});
