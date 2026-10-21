# Daylight — 24hr Story

A small, private space for everyday moments. Built with **Next.js, TypeScript, and React**, Daylight lets you post image stories that expire after 24 hours, entirely in your browser.

## Getting started

Use Node.js 22 or newer and npm.

```bash
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Features

- Add a story from the plus button, select an image, and optionally add a caption.
- Resize images proportionally to a maximum of **1080 × 1920** without upscaling.
- Convert images to compressed base64 data URLs and persist them in localStorage.
- Automatically remove stories **24 hours after posting**.
- View stories with 3-second automatic playback, progress bars, previous/next controls, and pause/play.
- Navigate with taps, horizontal swipes, or keyboard arrow keys; hold an image to pause.
- Delete stories with a confirmation step and distinguish viewed from unseen stories.
- Keep open tabs in sync through the browser storage event.
- Try bundled inspiration images without needing your own image first.
- Responsive layouts and native modal dialogs with focus containment and Escape support.

## Scripts

| Command             | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Start the Next.js development server                      |
| `npm run typecheck` | Check TypeScript types                                    |
| `npm test`          | Verify expiry, validation, resizing, and storage behavior |
| `npm run build`     | Build static production assets into `out/`                |

## How it works

The `daylight.stories.v1` localStorage key holds an array of story records. Each record contains an ID, compressed image data URL, image dimensions, original filename, optional caption, creation time, expiry time, and viewed status.

Expiry is based on timestamps, not a timer alone. The application validates and removes expired records on startup, focus, visibility changes, storage changes, and a timeout scheduled for the next expiry. A closed browser cannot run cleanup code; expired stories are removed as soon as the app is opened again. Expiry depends on the device clock.

Uploads accept JPG, PNG, WebP, AVIF, and GIF files up to 20 MB. Browser canvas processing preserves the aspect ratio and uses WebP compression, with PNG as a browser fallback. Animated images become still images. Unsupported or unreadable files show an error before saving. Individual images and the total saved data have conservative size limits; quota failures are reported without claiming the story was saved.

The initial inspiration cards are bundled assets, **not posted stories**. Selecting one opens the composer; it becomes a real 24-hour story only after you choose **Post story**.

## Privacy and limitations

- No backend, database, login, analytics, or external image upload is used.
- Stories belong to one browser profile and origin. They do not sync between devices or different hosting URLs.
- Clearing site data or using temporary/private browsing can remove stories.
- Browser localStorage has a small quota. Delete older stories if your story space is full.
- Do not use this as a secure vault for sensitive photos: browser storage is accessible to scripts running on the same origin.

## Project structure

```text
src/app/                 App entry, metadata, and responsive styles
src/components/          Story dashboard, composer, viewer, native modal
src/hooks/use-stories.ts Persistence, cross-tab refresh, expiry scheduling
src/lib/images.ts        File validation and canvas resizing/compression
src/lib/stories.ts       Story schema, expiry, storage, formatting
public/images/           Bundled sample photography
tests/                   Storage and image dimension checks
```

## Production

```bash
npm ci
npm run typecheck
npm test
npm run build
```

`output: "export"` produces a fully static site. Deploy `out/` to a static host, or import this repository into Vercel using its Next.js preset. No environment variables are needed. When hosting under a subdirectory rather than a domain root, configure Next.js `basePath` and adjust bundled asset paths before building.

## Credits

Project brief: [roadmap.sh Stories project](https://roadmap.sh/projects/stories-feature).

Sample photography served by Unsplash: [lake](https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1), [coffee](https://images.unsplash.com/photo-1442512595331-e89e73853f31), and [nature](https://images.unsplash.com/photo-1500534623283-312aade485b7). Images are bundled locally. Icons by [Lucide](https://lucide.dev/).
