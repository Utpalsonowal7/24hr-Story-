export const STORAGE_KEY = "daylight.stories.v1";
export const STORY_LIFETIME = 24 * 60 * 60 * 1000;
export const MAX_STORAGE_CHARACTERS = 4_000_000;
export const MAX_WIDTH = 1080;
export const MAX_HEIGHT = 1920;

export interface Story {
  id: string;
  dataUrl: string;
  name: string;
  caption: string;
  width: number;
  height: number;
  createdAt: number;
  expiresAt: number;
  viewed: boolean;
}

export type StoryImage = Pick<Story, "dataUrl" | "width" | "height" | "name">;
export type StoryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function isStory(value: unknown): value is Story {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.id === "string" &&
    s.id.length > 0 &&
    s.id.length <= 100 &&
    typeof s.dataUrl === "string" &&
    /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/.test(
      s.dataUrl,
    ) &&
    typeof s.name === "string" &&
    s.name.length <= 100 &&
    typeof s.caption === "string" &&
    s.caption.length <= 160 &&
    typeof s.width === "number" &&
    Number.isInteger(s.width) &&
    s.width > 0 &&
    s.width <= MAX_WIDTH &&
    typeof s.height === "number" &&
    Number.isInteger(s.height) &&
    s.height > 0 &&
    s.height <= MAX_HEIGHT &&
    typeof s.createdAt === "number" &&
    Number.isSafeInteger(s.createdAt) &&
    s.createdAt >= 0 &&
    typeof s.expiresAt === "number" &&
    s.expiresAt === s.createdAt + STORY_LIFETIME &&
    typeof s.viewed === "boolean"
  );
}

export function activeStories(stories: Story[], now = Date.now()): Story[] {
  return stories.filter((story) => story.expiresAt > now);
}

export function readStories(
  storage: StoryStorage,
  now = Date.now(),
): { stories: Story[]; cleaned: boolean } {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return { stories: [], cleaned: false };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { stories: [], cleaned: true };
  }
  if (!Array.isArray(parsed)) return { stories: [], cleaned: true };
  const ids = new Set<string>();
  const stories = parsed.filter((item): item is Story => {
    if (!isStory(item) || item.expiresAt <= now || ids.has(item.id))
      return false;
    ids.add(item.id);
    return true;
  });
  return { stories, cleaned: stories.length !== parsed.length };
}

export function writeStories(
  storage: StoryStorage,
  stories: Story[],
  now = Date.now(),
): Story[] {
  const current = activeStories(stories, now);
  const serialized = JSON.stringify(current);
  if (serialized.length > MAX_STORAGE_CHARACTERS) {
    throw new Error(
      "Your story space is full. Delete an older story and try again.",
    );
  }
  try {
    if (current.length) storage.setItem(STORAGE_KEY, serialized);
    else storage.removeItem(STORAGE_KEY);
  } catch {
    throw new Error(
      "Your browser could not save this change. Free up space or enable local storage, then try again.",
    );
  }
  return current;
}

export function imageDimensions(
  width: number,
  height: number,
): { width: number; height: number } {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error("This image has invalid dimensions.");
  }
  const scale = Math.min(1, MAX_WIDTH / width, MAX_HEIGHT / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function timeAgo(createdAt: number, now = Date.now()): string {
  const minutes = Math.floor(Math.max(0, now - createdAt) / 60_000);
  return minutes < 1
    ? "Just now"
    : minutes < 60
      ? `${minutes}m ago`
      : `${Math.floor(minutes / 60)}h ago`;
}

export function timeLeft(expiresAt: number, now = Date.now()): string {
  const minutes = Math.max(1, Math.ceil((expiresAt - now) / 60_000));
  return minutes >= 60
    ? `${Math.ceil(minutes / 60)}h left`
    : `${minutes}m left`;
}
