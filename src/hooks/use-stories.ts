"use client";

import { useCallback, useEffect, useState } from "react";
import { readStories, writeStories, STORAGE_KEY, STORY_LIFETIME, type Story, type StoryImage } from "@/lib/stories";

export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    try {
      const { stories: current, cleaned } = readStories(window.localStorage);
      setStories(current);
      if (cleaned) writeStories(window.localStorage, current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Local storage is unavailable. Enable it to save your stories.");
    } finally { setReady(true); }
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY || event.key === null) refresh(); };
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  useEffect(() => {
    if (!stories.length) return;
    const nextExpiry = Math.min(...stories.map((story) => story.expiresAt));
    const timeout = window.setTimeout(refresh, Math.max(0, nextExpiry - Date.now()) + 25);
    return () => window.clearTimeout(timeout);
  }, [stories, refresh]);

  const mutate = useCallback((update: (current: Story[]) => Story[]) => {
    // Re-read at mutation time so another tab's recent updates are preserved.
    const { stories: current } = readStories(window.localStorage);
    const saved = writeStories(window.localStorage, update(current));
    setStories(saved);
    return saved;
  }, []);

  const addStory = useCallback((image: StoryImage, caption: string) => {
    const now = Date.now();
    const story: Story = { ...image, id: crypto.randomUUID(), caption: caption.trim().slice(0, 160), createdAt: now, expiresAt: now + STORY_LIFETIME, viewed: false };
    mutate((current) => [story, ...current]);
    return story;
  }, [mutate]);

  const markViewed = useCallback((id: string) => {
    try { mutate((current) => current.map((story) => story.id === id ? { ...story, viewed: true } : story)); }
    catch { setError("The story opened, but your browser couldn’t save its viewed status."); }
  }, [mutate]);

  const deleteStory = useCallback((id: string) => mutate((current) => current.filter((story) => story.id !== id)), [mutate]);

  return { stories, ready, error, clearError: () => setError(""), addStory, markViewed, deleteStory };
}
