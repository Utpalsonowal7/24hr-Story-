import { test } from "node:test";
import assert from "node:assert/strict";
import {
  activeStories,
  imageDimensions,
  readStories,
  writeStories,
  STORAGE_KEY,
  STORY_LIFETIME,
  MAX_STORAGE_CHARACTERS,
  type Story,
  type StoryStorage,
} from "../src/lib/stories";
import { prepareImage } from "../src/lib/images";

const now = 1_800_000_000_000;
function story(overrides: Partial<Story> = {}): Story {
  return {
    id: "moment-1",
    name: "photo.webp",
    caption: "A small moment",
    dataUrl: "data:image/webp;base64,QUJDRA==",
    width: 1080,
    height: 1920,
    createdAt: now,
    expiresAt: now + STORY_LIFETIME,
    viewed: false,
    ...overrides,
  };
}
function memoryStorage(): StoryStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

test("a story is active before, but not at, its exact 24-hour expiry", () => {
  const s = story();
  assert.equal(activeStories([s], s.expiresAt - 1).length, 1);
  assert.equal(activeStories([s], s.expiresAt).length, 0);
});

test("reopening after 24 hours prunes old data but retains a fresh story", () => {
  const storage = memoryStorage();
  const fresh = story({
    id: "new",
    createdAt: now + STORY_LIFETIME,
    expiresAt: now + STORY_LIFETIME * 2,
  });
  storage.setItem(STORAGE_KEY, JSON.stringify([story(), fresh]));
  assert.deepEqual(readStories(storage, now + STORY_LIFETIME), {
    stories: [fresh],
    cleaned: true,
  });
});

test("valid base64 story survives serialization with all metadata", () => {
  const storage = memoryStorage();
  writeStories(storage, [story()], now);
  assert.deepEqual(readStories(storage, now), {
    stories: [story()],
    cleaned: false,
  });
});

test("malformed JSON and wrong payload shapes are recoverable", () => {
  const storage = memoryStorage();
  for (const payload of ["not json", "null", "{}", "42"]) {
    storage.setItem(STORAGE_KEY, payload);
    assert.deepEqual(readStories(storage, now), { stories: [], cleaned: true });
  }
});

test("untrusted storage cannot introduce URLs, HTML, SVG, invalid dimensions, or immortal stories", () => {
  const storage = memoryStorage();
  const invalid = [
    story({ dataUrl: "https://example.com/tracker.jpg" }),
    story({ dataUrl: "data:image/svg+xml;base64,QUJD" }),
    story({ width: 1081 }),
    story({ height: 1921 }),
    story({ width: 0 }),
    story({ width: 10.5 }),
    story({ expiresAt: now + 100 * STORY_LIFETIME }),
    story({ caption: "x".repeat(161) }),
    { id: "incomplete" },
    null,
  ];
  storage.setItem(STORAGE_KEY, JSON.stringify(invalid));
  assert.deepEqual(readStories(storage, now), { stories: [], cleaned: true });
});

test("duplicate IDs are removed without losing the original record", () => {
  const storage = memoryStorage();
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify([story(), story({ caption: "duplicate" })]),
  );
  assert.deepEqual(readStories(storage, now), {
    stories: [story()],
    cleaned: true,
  });
});

test("removing the final story clears the localStorage key", () => {
  const storage = memoryStorage();
  writeStories(storage, [story()], now);
  writeStories(storage, [], now);
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test("saving prunes expired records instead of wasting the storage budget", () => {
  const storage = memoryStorage();
  assert.deepEqual(writeStories(storage, [story()], now + STORY_LIFETIME), []);
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test("quota errors preserve existing data and report failure", () => {
  const storage = memoryStorage();
  writeStories(storage, [story()], now);
  const failingStorage: StoryStorage = {
    ...storage,
    setItem() {
      throw new Error("QuotaExceededError");
    },
  };
  assert.throws(
    () => writeStories(failingStorage, [story({ id: "replacement" })], now),
    /could not save/,
  );
  assert.equal(readStories(storage, now).stories[0].id, "moment-1");
});

test("oversized data is rejected before touching storage", () => {
  const storage = memoryStorage();
  assert.throws(
    () =>
      writeStories(
        storage,
        [story({ dataUrl: "x".repeat(MAX_STORAGE_CHARACTERS) })],
        now,
      ),
    /space is full/,
  );
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test("portrait, landscape, and square images stay inside the required bounds", () => {
  assert.deepEqual(imageDimensions(2160, 3840), { width: 1080, height: 1920 });
  assert.deepEqual(imageDimensions(4000, 2000), { width: 1080, height: 540 });
  assert.deepEqual(imageDimensions(3000, 3000), { width: 1080, height: 1080 });
  assert.deepEqual(imageDimensions(1000, 4000), { width: 480, height: 1920 });
});

test("small images are not upscaled and extreme aspect ratios remain valid", () => {
  assert.deepEqual(imageDimensions(300, 200), { width: 300, height: 200 });
  assert.deepEqual(imageDimensions(1, 100000), { width: 1, height: 1920 });
  for (const [w, h] of [
    [0, 1],
    [1, -1],
    [Infinity, 2],
    [NaN, 2],
  ])
    assert.throws(() => imageDimensions(w, h), /invalid dimensions/);
});

test("unsupported and oversized upload files fail before any browser processing", async () => {
  await assert.rejects(
    prepareImage(new File(["<svg/>"], "unsafe.svg", { type: "image/svg+xml" })),
    /Choose a JPG/,
  );
  await assert.rejects(
    prepareImage(new File([], "empty.jpg", { type: "image/jpeg" })),
    /smaller than 20 MB/,
  );
  await assert.rejects(
    prepareImage(
      new File([new Uint8Array(21 * 1024 * 1024)], "huge.png", {
        type: "image/png",
      }),
    ),
    /smaller than 20 MB/,
  );
});
