"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  ArrowRight,
  Check,
  ImagePlus,
  LoaderCircle,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { ACCEPTED_IMAGES, prepareImage } from "@/lib/images";
import type { StoryImage } from "@/lib/stories";
import { Modal } from "./modal";

export function StoryComposer({
  initialImage,
  onClose,
  onPublish,
}: {
  initialImage?: StoryImage;
  onClose: () => void;
  onPublish: (image: StoryImage, caption: string) => void;
}) {
  const [image, setImage] = useState<StoryImage | undefined>(initialImage);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function selectFile(file?: File) {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    try {
      setImage(await prepareImage(file));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "This image could not be opened.",
      );
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    void selectFile(event.dataTransfer.files[0]);
  }

  return (
    <Modal
      onClose={onClose}
      labelId="composer-title"
      className="composer-modal"
    >
      <div className="composer-header">
        <div>
          <span className="eyebrow">MAKE IT A MOMENT</span>
          <h2 id="composer-title">Your next story.</h2>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close upload"
        >
          <X size={21} />
        </button>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!image || busy) return;
          try {
            onPublish(image, caption);
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Could not save your story.",
            );
          }
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_IMAGES}
          className="visually-hidden"
          id="story-image"
          disabled={busy}
          tabIndex={-1}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            void selectFile(event.target.files?.[0])
          }
        />
        <div
          className={`upload-area ${image ? "has-image" : ""} ${dragging ? "is-dragging" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {image ? (
            <>
              <img
                src={image.dataUrl}
                alt="Your story preview"
                className="upload-preview"
              />
              <button
                type="button"
                className="change-image"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus size={16} />
                Change image
              </button>
              <span className="image-dimensions">
                <Check size={12} />
                {image.width} × {image.height}
              </span>
            </>
          ) : (
            <button
              type="button"
              className="upload-prompt"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              <span className="upload-symbol">
                <Upload size={28} strokeWidth={1.5} />
              </span>
              <strong>Drop a little moment here</strong>
              <span>or click to choose an image</span>
              <small>JPG, PNG, WebP, AVIF, GIF · Up to 20 MB</small>
            </button>
          )}
          {busy && (
            <div className="upload-loading" role="status">
              <LoaderCircle className="spin" size={25} />
              <span>Getting your image ready…</span>
            </div>
          )}
        </div>
        <label className="caption-label" htmlFor="story-caption">
          A few words <span>optional</span>
        </label>
        <textarea
          id="story-caption"
          placeholder="What’s the story?"
          maxLength={160}
          rows={2}
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
        />
        <div className="caption-counter">{caption.length}/160</div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="composer-note">
          <ShieldCheck size={16} />
          <span>Only on this device. Gone in 24 hours.</span>
        </div>
        <button
          className="button button-primary publish-button"
          type="submit"
          disabled={!image || busy}
        >
          Post story <ArrowRight size={18} />
        </button>
      </form>
    </Modal>
  );
}
