"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clock3, Pause, Play, Sun, Trash2, X } from "lucide-react";
import { timeAgo, timeLeft, type Story } from "@/lib/stories";
import { Modal } from "./modal";

const DURATION = 3_000;

export function StoryViewer({ stories, selectedId, onSelect, onClose, onView, onDelete }: {
  stories: Story[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const index = stories.findIndex((story) => story.id === selectedId);
  const story = stories[index];
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const elapsed = useRef(0);
  const pointer = useRef<{ x: number; y: number; at: number } | null>(null);
  const isPaused = paused || holding || hidden || confirmDelete || loadedId !== story?.id;

  const next = useCallback(() => {
    if (index < stories.length - 1) onSelect(stories[index + 1].id);
    else onClose();
  }, [index, stories, onSelect, onClose]);
  const previous = useCallback(() => {
    if (index > 0) onSelect(stories[index - 1].id);
    else { elapsed.current = 0; setProgress(0); }
  }, [index, stories, onSelect]);

  useEffect(() => {
    if (!story) { onClose(); return; }
    elapsed.current = 0;
    setProgress(0);
    setConfirmDelete(false);
    setError("");
    onView(story.id);
    // Reset only when changing stories, not when viewed metadata updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  useEffect(() => {
    const visibility = () => setHidden(document.visibilityState !== "visible");
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (confirmDelete) return;
      if (event.key === "ArrowRight") { event.preventDefault(); next(); }
      if (event.key === "ArrowLeft") { event.preventDefault(); previous(); }
      if (event.code === "Space" && !(event.target instanceof HTMLElement && event.target.closest("button"))) { event.preventDefault(); setPaused((value) => !value); }
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, [next, previous, confirmDelete]);

  useEffect(() => {
    if (isPaused || !story) return;
    let frame = 0;
    let last: number | null = null;
    const tick = (time: number) => {
      if (last !== null) elapsed.current += time - last;
      last = time;
      setProgress(Math.min(1, elapsed.current / DURATION));
      if (elapsed.current >= DURATION) next();
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPaused, story, next]);

  if (!story) return null;
  return <Modal onClose={onClose} labelId="viewer-title" className="viewer-modal">
    <div className="viewer-shell">
      <div className="viewer-desktop-brand"><Sun size={27} /><span>daylight<span className="brand-dot">.</span></span></div>
      <button className="viewer-outer-close icon-button" onClick={onClose} aria-label="Close story viewer"><X size={25} /></button>
      <button className="viewer-arrow viewer-prev" onClick={previous} aria-label="Previous story" disabled={index === 0}><ChevronLeft /></button>
      <div className="story-stage" onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
        pointer.current = { x: event.clientX, y: event.clientY, at: Date.now() };
        setHolding(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      }} onPointerUp={(event) => {
        setHolding(false);
        const start = pointer.current;
        pointer.current = null;
        if (!start) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) { if (dx < 0) next(); else previous(); }
        else if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && Date.now() - start.at < 300) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX - bounds.left < bounds.width * 0.35) previous(); else next();
        }
      }} onPointerCancel={() => { setHolding(false); pointer.current = null; }}>
        <img key={story.id} className="story-photo" src={story.dataUrl} alt={story.caption || story.name} onLoad={() => setLoadedId(story.id)} onError={() => { setLoadedId(story.id); setPaused(true); setError("This saved image could not be displayed. You can delete it or move to the next story."); }} draggable={false} />
        <div className="story-shade" />
        <div className="viewer-top">
          <div className="story-progress" aria-label={`Story ${index + 1} of ${stories.length}`}>
            {stories.map((item, i) => <span key={item.id} className="progress-track"><span style={{ transform: `scaleX(${i < index ? 1 : i === index ? progress : 0})` }} /></span>)}
          </div>
          <div className="viewer-toolbar"><span className="viewer-avatar"><Sun size={20} /></span><div className="viewer-user"><h2 id="viewer-title">Your story</h2><span>{timeAgo(story.createdAt)}</span></div>
            <button className="icon-button" aria-label={paused ? "Play story" : "Pause story"} onClick={() => setPaused((value) => !value)}>{paused ? <Play size={19} /> : <Pause size={19} />}</button>
            <button className="icon-button" aria-label="Delete story" onClick={() => setConfirmDelete((value) => !value)}><Trash2 size={18} /></button>
            <button className="icon-button viewer-mobile-close" onClick={onClose} aria-label="Close story"><X size={22} /></button>
          </div>
        </div>
        {confirmDelete && <div className="delete-confirm" onPointerDown={(event) => event.stopPropagation()}><strong>Let this moment go?</strong><p>This story will be deleted from this device.</p><div><button className="button button-small button-light" onClick={() => setConfirmDelete(false)}>Keep it</button><button className="button button-small button-danger" onClick={() => {
          try { onDelete(story.id); if (stories.length === 1) onClose(); else onSelect((stories[index + 1] || stories[index - 1]).id); }
          catch (err) { setError(err instanceof Error ? err.message : "Could not delete story."); setConfirmDelete(false); }
        }}>Delete story</button></div></div>}
        {holding && <span className="hold-indicator"><Pause size={13} />Paused</span>}
        <div className="viewer-caption">{story.caption && <p>{story.caption}</p>}<span><Clock3 size={13} />{timeLeft(story.expiresAt)}<span className="viewer-caption-dot">·</span><Check size={13} />Only you</span>{error && <p className="viewer-error" role="alert">{error}</p>}</div>
      </div>
      <button className="viewer-arrow viewer-next" onClick={next} aria-label="Next story"><ChevronRight /></button>
      <p className="viewer-hint">Tap to move · Hold to pause · Swipe to explore</p>
      <span className="viewer-count">{String(index + 1).padStart(2, "0")} <span>/ {String(stories.length).padStart(2, "0")}</span></span>
    </div>
  </Modal>;
}
