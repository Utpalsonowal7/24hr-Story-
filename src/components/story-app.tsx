"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Clock3, ImagePlus, Leaf, LoaderCircle, Play, Plus, ShieldCheck, Sparkles, Sun, X } from "lucide-react";
import { useStories } from "@/hooks/use-stories";
import { prepareImage } from "@/lib/images";
import { MAX_STORAGE_CHARACTERS, timeAgo, timeLeft, type StoryImage } from "@/lib/stories";
import { StoryComposer } from "./story-composer";
import { StoryViewer } from "./story-viewer";
import { Modal } from "./modal";

const samples = [
  { src: "/images/lakeside.jpg", title: "Somewhere quiet", subtitle: "A breath of fresh air.", tag: "THE GREAT OUTDOORS", className: "sample-lake" },
  { src: "/images/slow-morning.jpg", title: "Slow mornings", subtitle: "Good things take their time.", tag: "THE LITTLE THINGS", className: "sample-coffee" },
  { src: "/images/golden-hour.jpg", title: "Chasing the light", subtitle: "A little golden, a little wild.", tag: "OUT & ABOUT", className: "sample-golden" },
];

export function StoryApp() {
  const { stories, ready, error, clearError, addStory, markViewed, deleteStory } = useStories();
  const [composer, setComposer] = useState<{ image?: StoryImage } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [toast, setToast] = useState("");
  const [sampleBusy, setSampleBusy] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  const momentRef = useRef<HTMLElement>(null);

  useEffect(() => { const timer = window.setInterval(() => setTick((tick) => tick + 1), 60_000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 4500); return () => clearTimeout(timer); }, [toast]);

  async function trySample(index: number) {
    if (sampleBusy !== null) return;
    setSampleBusy(index);
    try {
      const sample = samples[index];
      const response = await fetch(sample.src);
      if (!response.ok) throw new Error("The sample image could not be loaded.");
      const file = new File([await response.blob()], `${sample.title}.jpg`, { type: "image/jpeg" });
      setComposer({ image: await prepareImage(file) });
    } catch (err) { setToast(err instanceof Error ? err.message : "Could not open sample."); }
    finally { setSampleBusy(null); }
  }

  const unseen = stories.filter((story) => !story.viewed).length;
  const storagePercent = Math.min(100, Math.round(JSON.stringify(stories).length / MAX_STORAGE_CHARACTERS * 100));
  return <>
    <header className="site-header shell"><a href="/" className="brand" aria-label="Daylight home"><Sun size={30} strokeWidth={1.8} /><span>daylight<span className="brand-dot">.</span></span></a><nav aria-label="Main navigation"><a href="#your-stories" className="nav-current">Your space</a><button onClick={() => setHelp(true)}>How it works <ArrowUpRight size={14} /></button></nav><div className="header-right"><span className="private-badge"><span />Your private little corner</span><button className="profile-avatar" onClick={() => setHelp(true)} aria-label="About your private space">U</button></div></header>

    <main className="shell">
      <section className="stories-section" id="your-stories" aria-labelledby="stories-heading"><div className="section-top"><div className="section-heading"><h1 id="stories-heading">Your stories</h1><span className="section-dot">·</span><span>A little here, a little now.</span></div><div className="strip-controls"><span className="expiry-label"><Clock3 size={14} />Here for 24 hours</span><button className="icon-button" aria-label="Scroll stories left" onClick={() => stripRef.current?.scrollBy({ left: -300, behavior: "smooth" })}><ChevronLeft size={18} /></button><button className="icon-button" aria-label="Scroll stories right" onClick={() => stripRef.current?.scrollBy({ left: 300, behavior: "smooth" })}><ChevronRight size={18} /></button></div></div>
        <div className="stories-strip" ref={stripRef}>
          <button className="story-bubble add-bubble" onClick={() => setComposer({})} disabled={!ready}><span className="add-circle"><Plus size={28} strokeWidth={1.5} /><span className="tiny-plus"><Plus size={11} strokeWidth={3} /></span></span><span>Add a story</span></button>
          {stories.map((story, index) => <button key={story.id} className={`story-bubble ${story.viewed ? "is-viewed" : ""}`} onClick={() => setSelectedId(story.id)} aria-label={`View story ${index + 1}${story.caption ? `: ${story.caption}` : ""}`}><span className="story-ring"><img src={story.dataUrl} alt="" /></span><span>{timeAgo(story.createdAt)}</span></button>)}
          {!stories.length && <div className="strip-empty"><div className="empty-bubbles"><span /><span /><span /></div><p>{ready ? "Your everyday deserves a story." : "Opening your space…"}<span>{ready ? "Start with something that made you smile." : "Your moments will be right here."}</span></p><ArrowDown size={19} className="empty-arrow" /></div>}
        </div>
      </section>

      <section className="hero" aria-labelledby="hero-title"><div className="hero-copy"><span className="eyebrow"><span className="eyebrow-line" />LIFE HAPPENS IN LITTLE MOMENTS</span><h2 id="hero-title">A moment.<br />A story.<br /><span>A little daylight.</span><svg viewBox="0 0 290 14" aria-hidden="true"><path d="M3 10Q130-3 285 7M30 12Q168 1 265 10" /></svg></h2><p>The morning coffee. The way home. That one sunset.<br className="desktop-break" /> A space for the little things, just for a day.</p><div className="hero-actions"><button className="button button-primary" onClick={() => setComposer({})} disabled={!ready}><Plus size={19} />Create your story<ArrowUpRight size={18} /></button><button className="text-button" onClick={() => setHelp(true)}>Make yourself at home <ArrowRight size={16} /></button></div><div className="hero-note"><ShieldCheck size={14} /><span>Yours alone. No account needed.</span></div></div>
        <div className="hero-art" aria-label="A collection of everyday moments"><div className="art-orbit" /><span className="art-spark spark-one">✳</span><span className="art-spark spark-two">✦</span><div className="floating-label"><span className="status-dot" />A little less forever.</div><button className="polaroid polaroid-back" onClick={() => void trySample(1)} disabled={sampleBusy !== null} aria-label="Try the slow mornings sample"><img src="/images/slow-morning.jpg" alt="A warm cup of coffee on a wooden table" /><span>slow mornings <span>☕</span></span></button><button className="polaroid polaroid-front" onClick={() => void trySample(0)} disabled={sampleBusy !== null} aria-label="Try the lakeside sample"><div className="polaroid-image"><img src="/images/lakeside.jpg" alt="A quiet lake surrounded by mountains" /><span className="photo-time"><Clock3 size={11} />24h</span></div><span>more of this, please. <Leaf size={15} /></span></button><div className="art-caption"><svg viewBox="0 0 70 50" aria-hidden="true"><path d="M4 44Q65 46 59 8m-8 7 9-9 7 10" /></svg><span>here today,<br />a memory tomorrow.</span></div></div>
      </section>

      <div className="benefits-strip"><span><Clock3 size={17} />24 hours. Then a fresh start.</span><span><ShieldCheck size={17} />Your device. Your moments.</span><span><Sparkles size={17} />Less perfect. More you.</span></div>

      <section className="moments-section" ref={momentRef} aria-labelledby="moments-title"><div className="section-top moments-top"><div><span className="eyebrow">THE EVERYDAY COLLECTION</span><h2 id="moments-title">{stories.length ? "Little moments, lately." : "Big stories start small."}</h2><p>{stories.length ? `${stories.length} ${stories.length === 1 ? "moment" : "moments"} worth keeping. For a little while, anyway.` : "A bit of inspiration for your first little story."}</p></div>{stories.length > 0 ? <button className="text-button" onClick={() => setSelectedId(stories[0].id)}><Play size={14} />Play all<ArrowRight size={17} /></button> : <span className="inspiration-tag"><Leaf size={13} />Find your everyday</span>}</div>
        {stories.length > 0 ? <div className="moment-grid">{stories.map((story, index) => <button key={story.id} className="moment-card" onClick={() => setSelectedId(story.id)} aria-label={`Open story ${index + 1}${story.caption ? `: ${story.caption}` : ""}`}><img src={story.dataUrl} alt={story.caption || `Your story ${index + 1}`} /><span className="moment-card-shade" /><span className="moment-time"><Clock3 size={12} />{timeLeft(story.expiresAt)}</span><span className="moment-play"><Play size={15} fill="currentColor" /></span><span className="moment-card-content"><small>{story.viewed ? "A MOMENT REVISITED" : "A FRESH LITTLE MOMENT"}</small><strong>{story.caption || "A little moment."}</strong><span>Your story <span>·</span> {timeAgo(story.createdAt)}</span></span></button>)}<button className="add-moment-card" onClick={() => setComposer({})}><span><Plus size={25} /></span><strong>There’s always another story.</strong><small>Make a little room for today.</small></button></div> : <div className="sample-grid">{samples.map((sample, index) => <button key={sample.src} className={`sample-card ${sample.className}`} disabled={sampleBusy !== null} onClick={() => void trySample(index)} aria-label={`Use sample: ${sample.title}`}><img src={sample.src} alt={sample.title} /><span className="sample-shade" /><span className="sample-pill">A LITTLE INSPIRATION</span><span className="sample-card-content"><small>{sample.tag}</small><strong>{sample.title}</strong><span>{sample.subtitle}</span></span><span className="sample-arrow">{sampleBusy === index ? <LoaderCircle size={19} className="spin" /> : <ArrowUpRight size={20} />}</span></button>)}</div>}
        <div className="collection-footer"><span><span className="status-dot" />{stories.length ? `${unseen} unseen ${unseen === 1 ? "story" : "stories"} · ${storagePercent}% of your story space used` : "Inspiration only. Tap a card to try it as your own story."}</span><span>Good moments don’t need a filter.</span></div>
      </section>

      <section className="closing-note"><span className="closing-sun"><Sun size={24} strokeWidth={1.4} /></span><p>Some things are better when they don’t last forever.</p><span>MAKE TODAY A LITTLE STORY.</span></section>
    </main>

    <footer className="site-footer shell"><a className="brand footer-brand" href="/" aria-label="Daylight home"><Sun size={19} /><span>daylight.</span></a><span>A little space for your everyday.</span><button onClick={() => setHelp(true)}>Made for the moment <ArrowUpRight size={13} /></button></footer>

    {(toast || error) && <div className="toast" role={error ? "alert" : "status"}>{error ? <ShieldCheck size={18} /> : <Check size={18} />}<span>{error || toast}</span><button className="icon-button" aria-label="Dismiss message" onClick={() => { setToast(""); clearError(); }}><X size={16} /></button></div>}
    {composer && <StoryComposer initialImage={composer.image} onClose={() => setComposer(null)} onPublish={(image, caption) => { addStory(image, caption); setComposer(null); setToast("A little moment, saved for the next 24 hours."); }} />}
    {selectedId && <StoryViewer stories={stories} selectedId={selectedId} onSelect={setSelectedId} onClose={() => setSelectedId(null)} onView={markViewed} onDelete={deleteStory} />}
    {help && <Modal onClose={() => setHelp(false)} labelId="help-title" className="help-modal"><button className="help-close icon-button" onClick={() => setHelp(false)} aria-label="Close help"><X size={22} /></button><span className="help-sun"><Sun size={35} strokeWidth={1.5} /></span><span className="eyebrow">WELCOME TO YOUR LITTLE CORNER</span><h2 id="help-title">Here for a good time.<br />Just not a long time.</h2><div className="help-steps"><div><span><ImagePlus size={21} /></span><p><strong>Pick your moment.</strong>Choose an image, add a few words, and post your story. We resize it to fit within 1080 × 1920.</p></div><div><span><Play size={20} /></span><p><strong>Take a look around.</strong>Tap or swipe to move between stories. Hold to pause, use the pause button, or navigate with arrow keys.</p></div><div><span><Clock3 size={21} /></span><p><strong>Let it go, after a day.</strong>Each story expires 24 hours after posting. Closed the page? Expired moments are cleared when you return.</p></div><div><span><ShieldCheck size={21} /></span><p><strong>A space that’s only yours.</strong>Images stay in this browser’s local storage. They aren’t shared or uploaded. Clearing browser data clears your stories.</p></div></div><button className="button button-primary" onClick={() => { setHelp(false); setComposer({}); }}>Let’s make a story <Plus size={18} /></button></Modal>}
  </>;
}
