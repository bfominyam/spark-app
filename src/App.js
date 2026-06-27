import { useState, useRef, useEffect } from "react";

// ─────────────────────────────────────────────────────────────
// CLOUDINARY CONFIG
// Sign up free at cloudinary.com → copy your Cloud Name below
// Then go to Settings → Upload → Add upload preset (unsigned mode)
// ─────────────────────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME = "YOUR_CLOUD_NAME";   // ← replace this
const CLOUDINARY_UPLOAD_PRESET = "spark_uploads";  // ← match your preset name

const PROFILES = [
  { id: 1, name: "Aria", age: 26, bio: "Avid hiker, terrible cook, great dancer. Looking for someone to share adventures with 🏔️", interests: ["Hiking", "Music", "Travel"], photo: "https://randomuser.me/api/portraits/women/44.jpg", distance: "3 miles away", job: "Graphic Designer", location: { city: "Austin", country: "United States" }, race: "Hispanic / Latino", media: [] },
  { id: 2, name: "Marcus", age: 29, bio: "Coffee snob, dog dad, weekend chef. Let's get tacos and talk about life 🌮", interests: ["Cooking", "Fitness", "Dogs"], photo: "https://randomuser.me/api/portraits/men/32.jpg", distance: "5 miles away", job: "Software Engineer", location: { city: "Atlanta", country: "United States" }, race: "Black / African American", media: [] },
  { id: 3, name: "Zoe", age: 24, bio: "Art museum regular, bookworm, aspiring world traveler. Swipe right if you can keep up 📚", interests: ["Art", "Books", "Travel"], photo: "https://randomuser.me/api/portraits/women/68.jpg", distance: "8 miles away", job: "Art Curator", location: { city: "New York", country: "United States" }, race: "White / Caucasian", media: [] },
  { id: 4, name: "Devon", age: 31, bio: "Entrepreneur by day, jazz lover by night. 50% serious, 50% spontaneous 🎷", interests: ["Jazz", "Entrepreneurship", "Fitness"], photo: "https://randomuser.me/api/portraits/men/75.jpg", distance: "2 miles away", job: "Startup Founder", location: { city: "Miami", country: "United States" }, race: "Black / African American", media: [] },
  { id: 5, name: "Lena", age: 27, bio: "Yoga teacher, smoothie enthusiast, fluent in sarcasm. Rescue dog mom 🐾", interests: ["Yoga", "Wellness", "Animals"], photo: "https://randomuser.me/api/portraits/women/90.jpg", distance: "6 miles away", job: "Yoga Instructor", location: { city: "Los Angeles", country: "United States" }, race: "Asian / Pacific Islander", media: [] },
  { id: 6, name: "Jordan", age: 28, bio: "Night owl, vinyl collector, and perpetual overthinker. Let's do something spontaneous 🎵", interests: ["Music", "Art", "Food"], photo: "https://randomuser.me/api/portraits/men/11.jpg", distance: "4 miles away", job: "Music Producer", location: { city: "Chicago", country: "United States" }, race: "Mixed / Multiracial", media: [] },
];

const RACES = [
  "Black / African American",
  "White / Caucasian",
  "Hispanic / Latino",
  "Asian / Pacific Islander",
  "Middle Eastern / North African",
  "Native American / Indigenous",
  "Mixed / Multiracial",
  "Prefer not to say",
];

const C = {
  fire: "#FF3B5C", fireGlow: "#ff6b35", dark: "#0d0d0d",
  card: "#1a1a2e", cardLight: "#16213e",
  muted: "#8888aa", match: "#00d2a0",
};
const grad = { background: `linear-gradient(135deg, ${C.fire}, ${C.fireGlow})` };

function Avatar({ src, name, size = 48 }) {
  const [err, setErr] = useState(false);
  const initials = name ? name[0].toUpperCase() : "?";
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", background: `linear-gradient(135deg,${C.fire},${C.fireGlow})`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontWeight: 900, color: "#fff" }}>
      {src && !err
        ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setErr(true)} />
        : initials}
    </div>
  );
}
function Badge({ children, color }) {
  return <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{children}</span>;
}
function Inp({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ color: C.muted, fontSize: 12, marginBottom: 5 }}>{label}</div>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", background: "#1e1e30", border: "1px solid #333", borderRadius: 12, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

// ─── CLOUDINARY UPLOAD ───────────────────────────────────────
async function uploadToCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(url, { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return { url: data.secure_url, type: data.resource_type === "video" ? "video" : "image" };
}

// ─── SEAMLESS MEDIA UPLOADER ────────────────────────────────
// Converts files to base64 immediately — works in all browsers,
// all devices, no blob URL expiry, no Cloudinary needed for preview.
function PhotoStep({ media, setMedia }) {
  const [items, setItems] = useState(
    media.map((m, i) => ({ ...m, status: "done", uid: `init-${i}` }))
  );
  const [dragging, setDragging] = useState(false);
  const isConfigured = CLOUDINARY_CLOUD_NAME !== "YOUR_CLOUD_NAME";

  // Always sync all items to parent — use src for display
  useEffect(() => {
    const all = items.map(x => ({ type: x.type, src: x.src })).filter(x => x.src);
    setMedia(all);
  }, [items]);

  // Convert file to base64 — guaranteed to work everywhere
  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const processFiles = async (files) => {
    const accepted = Array.from(files).slice(0, 9 - items.length);
    if (!accepted.length) return;

    // Process each file: convert to base64 instantly, then optionally upload to Cloudinary
    for (const file of accepted) {
      const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const type = file.type.startsWith("video") ? "video" : "image";

      try {
        // Convert to base64 first — gives us a permanent, reliable src immediately
        const base64 = await toBase64(file);

        // Add to grid instantly with base64 src
        setItems(prev => [...prev, {
          src: base64,
          type,
          status: isConfigured ? "uploading" : "done",
          file,
          uid,
        }]);

        // Optionally upgrade to Cloudinary URL in background
        if (isConfigured) {
          try {
            const result = await uploadToCloudinary(file);
            setItems(prev => prev.map(x =>
              x.uid === uid ? { ...x, src: result.url, type: result.type, status: "done", file: null } : x
            ));
          } catch {
            // Cloudinary failed — base64 still works perfectly, mark as done
            setItems(prev => prev.map(x =>
              x.uid === uid ? { ...x, status: "done", file: null } : x
            ));
          }
        }
      } catch {
        // FileReader failed
        setItems(prev => prev.map(x => x.uid === uid ? { ...x, status: "error" } : x));
      }
    }
  };

  const removeItem = (uid) => setItems(prev => prev.filter(x => x.uid !== uid));

  const onDrop = (e) => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files); };
  const uploading = items.some(x => x.status === "uploading");
  const canAdd = items.length < 9;

  return (
    <div>
      <input id="media-upload" type="file" accept="image/*,video/*" multiple
        onChange={e => { processFiles(e.target.files); e.target.value = ""; }}
        style={{ position: "fixed", opacity: 0, pointerEvents: "none", width: 1, height: 1 }} />

      {/* Big one-tap upload zone */}
      {canAdd && (
        <label htmlFor="media-upload"
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            background: dragging ? C.fire + "33" : items.length === 0 ? `linear-gradient(135deg,${C.fire},${C.fireGlow})` : "#1a1a2e",
            border: dragging ? `2px solid ${C.fire}` : items.length === 0 ? "none" : `2px dashed ${C.fire}66`,
            borderRadius: 18, padding: items.length === 0 ? "26px 16px" : "14px 16px",
            cursor: "pointer", marginBottom: 14, transition: "all 0.2s",
            flexDirection: items.length === 0 ? "column" : "row",
          }}>
          <div style={{ fontSize: items.length === 0 ? 48 : 26, lineHeight: 1 }}>
            {dragging ? "🎯" : items.length === 0 ? "📸" : "➕"}
          </div>
          <div style={{ textAlign: items.length === 0 ? "center" : "left" }}>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: items.length === 0 ? 18 : 14 }}>
              {dragging ? "Drop to upload!" : items.length === 0 ? "Tap to add photos & videos" : "Add more"}
            </div>
            {items.length === 0 && (
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 6 }}>
                Photos & videos · up to 9 · shows instantly
              </div>
            )}
          </div>
        </label>
      )}

      {/* Status */}
      {items.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ color: C.muted, fontSize: 12 }}>{items.length} file{items.length > 1 ? "s" : ""} · first = profile pic</div>
          {uploading
            ? <div style={{ color: C.fire, fontSize: 11, fontWeight: 700 }}>⚡ Syncing to cloud</div>
            : <div style={{ color: C.match, fontSize: 11, fontWeight: 700 }}>✓ Ready</div>}
        </div>
      )}

      {/* Grid */}
      {items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {items.map((item, i) => (
            <div key={item.uid} style={{ position: "relative", paddingBottom: "100%", borderRadius: 14, overflow: "hidden", background: C.card, border: i === 0 ? `2px solid ${C.fire}` : "2px solid #333" }}>
              {item.type === "video"
                ? <video src={item.src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} muted playsInline />
                : <img src={item.src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}

              {/* Uploading to cloud spinner (non-blocking) */}
              {item.status === "uploading" && (
                <div style={{ position: "absolute", top: 4, left: "50%", transform: "translateX(-50%)" }}>
                  <div style={{ width: 18, height: 18, border: `2px solid ${C.fire}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                </div>
              )}

              {i === 0 && <div style={{ position: "absolute", bottom: 4, left: 4, background: C.fire, borderRadius: 6, padding: "1px 7px", color: "#fff", fontSize: 10, fontWeight: 700 }}>MAIN</div>}
              {item.status === "done" && <div style={{ position: "absolute", bottom: 4, right: 4, width: 16, height: 16, background: C.match, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff" }}>✓</div>}
              {item.type === "video" && <div style={{ position: "absolute", top: 4, left: 4, background: "#000a", borderRadius: 6, padding: "2px 6px", color: "#fff", fontSize: 10 }}>🎬</div>}
              <button onClick={() => removeItem(item.uid)}
                style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.65)", border: "none", borderRadius: "50%", width: 22, height: 22, color: "#fff", cursor: "pointer", fontSize: 12, lineHeight: "22px", textAlign: "center" }}>✕</button>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── SETUP SCREEN ───────────────────────────────────────────
function SetupScreen({ onDone }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [contact, setContact] = useState({ type: "phone", value: "" });
  const [location, setLocation] = useState({ country: "", city: "" });
  const [bio, setBio] = useState("");
  const [race, setRace] = useState("");
  const [media, setMedia] = useState([]);
  const [err, setErr] = useState("");

  const next = () => {
    setErr("");
    if (step === 0) {
      if (!name.trim() || !age || !contact.value.trim()) { setErr("Please fill in all fields"); return; }
      if (contact.type === "email" && !/\S+@\S+\.\S+/.test(contact.value)) { setErr("Invalid email"); return; }
      if (contact.type === "phone" && !/^\+?[\d\s\-()]{7,}$/.test(contact.value)) { setErr("Invalid phone"); return; }
      if (!location.country.trim() || !location.city.trim()) { setErr("Please enter your country and city"); return; }
    }
    if (step === 1 && media.length === 0) { setErr("Add at least one photo or video"); return; }
    if (step === 2) {
      if (!bio.trim()) { setErr("Add a short bio"); return; }
      onDone({ name: name.trim(), age: parseInt(age), contact, location, bio: bio.trim(), race, media, photo: media[0]?.src || "" });
      return;
    }
    setStep(s => s + 1);
  };

  const labels = ["Contact", "Photos & Video", "About You"];
  const ff = "'Helvetica Neue',Arial,sans-serif";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.dark, padding: 24, overflowY: "auto", fontFamily: ff }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 900, background: `linear-gradient(135deg,${C.fire},${C.fireGlow})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🔥 Spark</div>
      </div>

      {/* Progress */}
      <div style={{ display: "flex", gap: 8, marginBottom: 26 }}>
        {labels.map((l, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: 4, borderRadius: 2, background: i <= step ? C.fire : "#333", marginBottom: 6 }} />
            <div style={{ color: i === step ? "#fff" : C.muted, fontSize: 11, fontWeight: i === step ? 700 : 400 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ color: "#fff", fontWeight: 900, fontSize: 22, marginBottom: 4 }}>
        {["Let's get started 👋", "Add your photos 📸", "Tell your story ✍️"][step]}
      </div>
      <div style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>
        {["Your contact info so matches can reach you.", "Upload photos and videos straight from your phone.", "Write a short bio that shows your personality."][step]}
      </div>

      {step === 0 && (
        <>
          <Inp label="First Name" value={name} onChange={setName} placeholder="Your name" />
          <Inp label="Age" value={age} onChange={setAge} type="number" placeholder="Your age" />
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>Contact Method</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {["phone", "email"].map(t => (
                <button key={t} onClick={() => setContact(c => ({ ...c, type: t }))}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 12, border: `2px solid ${contact.type === t ? C.fire : "#333"}`, background: contact.type === t ? C.fire + "22" : "transparent", color: contact.type === t ? "#fff" : C.muted, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                  {t === "phone" ? "📱 Phone" : "✉️ Email"}
                </button>
              ))}
            </div>
            <Inp value={contact.value} onChange={v => setContact(c => ({ ...c, value: v }))}
              type={contact.type === "email" ? "email" : "tel"}
              placeholder={contact.type === "email" ? "you@example.com" : "+1 (555) 000-0000"} />
          </div>

          {/* Location */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>📍 Location</div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>Country</div>
                <input
                  value={location.country}
                  onChange={e => setLocation(l => ({ ...l, country: e.target.value }))}
                  placeholder="e.g. United States"
                  style={{ width: "100%", background: "#1e1e30", border: "1px solid #333", borderRadius: 12, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>City</div>
                <input
                  value={location.city}
                  onChange={e => setLocation(l => ({ ...l, city: e.target.value }))}
                  placeholder="e.g. Atlanta"
                  style={{ width: "100%", background: "#1e1e30", border: "1px solid #333", borderRadius: 12, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {step === 1 && <PhotoStep media={media} setMedia={setMedia} />}

      {step === 2 && (
        <>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 5 }}>Bio</div>
            <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 200))} placeholder="What makes you, you? 😊"
              style={{ width: "100%", background: "#1e1e30", border: "1px solid #333", borderRadius: 12, padding: "12px 14px", color: "#fff", fontSize: 14, outline: "none", resize: "none", minHeight: 90, boxSizing: "border-box" }} />
            <div style={{ color: C.muted, fontSize: 11, textAlign: "right" }}>{bio.length}/200</div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>Ethnicity / Race <span style={{ color: "#555" }}>(optional)</span></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {RACES.map(r => (
                <button key={r} onClick={() => setRace(race === r ? "" : r)}
                  style={{ padding: "7px 13px", borderRadius: 20, border: `2px solid ${race === r ? C.fire : "#333"}`, background: race === r ? C.fire + "22" : "transparent", color: race === r ? "#fff" : C.muted, cursor: "pointer", fontSize: 12, fontWeight: race === r ? 700 : 400, transition: "all 0.15s" }}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {err && <div style={{ color: C.fire, fontSize: 13, marginBottom: 10 }}>⚠ {err}</div>}

      <div style={{ display: "flex", gap: 10, marginTop: "auto", paddingTop: 14 }}>
        {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ flex: 0.4, padding: "12px 0", borderRadius: 24, border: "1px solid #444", background: "transparent", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Back</button>}
        <button onClick={next} style={{ flex: 1, padding: "14px 0", borderRadius: 24, ...grad, border: "none", color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
          {step === 2 ? "Create Profile 🔥" : "Continue →"}
        </button>
      </div>
    </div>
  );
}

// ─── SWIPE CARD ─────────────────────────────────────────────
function SwipeCard({ profile, onLike, onPass }) {
  const [drag, setDrag] = useState({ x: 0, active: false });
  const [mediaIdx, setMediaIdx] = useState(0);
  const startX = useRef(0);
  const allMedia = profile.media?.length > 0 ? profile.media : [{ type: "image", src: profile.photo }];
  const cur = allMedia[mediaIdx];

  const onMD = e => { startX.current = e.clientX; setDrag({ x: 0, active: true }); };
  const onMM = e => { if (!drag.active) return; setDrag({ x: e.clientX - startX.current, active: true }); };
  const onMU = () => { if (drag.x > 80) onLike(); else if (drag.x < -80) onPass(); setDrag({ x: 0, active: false }); };

  return (
    <div onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}
      style={{ position: "relative", width: 340, height: 480, borderRadius: 24, overflow: "hidden", cursor: "grab",
        transform: `translateX(${drag.x}px) rotate(${drag.x * 0.07}deg)`,
        transition: drag.active ? "none" : "transform 0.35s cubic-bezier(.25,.46,.45,.94)",
        userSelect: "none", boxShadow: "0 20px 60px rgba(0,0,0,0.55)", flexShrink: 0 }}>
      <div style={{ width: "100%", height: "100%", background: C.card }}>
        {cur?.type === "video"
          ? <video src={cur.src} autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <img src={cur?.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.opacity = 0} />}
      </div>
      {allMedia.length > 1 && (
        <>
          <div style={{ position: "absolute", top: 12, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>
            {allMedia.map((_, i) => <div key={i} onClick={e => { e.stopPropagation(); setMediaIdx(i); }} style={{ width: i === mediaIdx ? 22 : 8, height: 6, borderRadius: 3, background: i === mediaIdx ? C.fire : "#fff8", cursor: "pointer", transition: "all 0.2s" }} />)}
          </div>
          <div onClick={e => { e.stopPropagation(); setMediaIdx(i => Math.max(0, i - 1)); }} style={{ position: "absolute", top: 0, left: 0, width: "40%", height: "100%", cursor: "pointer" }} />
          <div onClick={e => { e.stopPropagation(); setMediaIdx(i => Math.min(allMedia.length - 1, i + 1)); }} style={{ position: "absolute", top: 0, right: 0, width: "40%", height: "100%", cursor: "pointer" }} />
        </>
      )}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top,#000000f0,transparent)", padding: "28px 18px 18px" }}>
        <div style={{ color: "#fff", fontSize: 26, fontWeight: 800 }}>{profile.name}, {profile.age}</div>
        <div style={{ color: "#aaa", fontSize: 13, marginBottom: 2 }}>{profile.job} · {profile.distance}</div>
        {profile.location && (
          <div style={{ color: "#aaa", fontSize: 13, marginBottom: 4 }}>📍 {profile.location.city}, {profile.location.country}</div>
        )}
        {profile.race && profile.race !== "Prefer not to say" && (
          <div style={{ color: "#aaa", fontSize: 12, marginBottom: 6 }}>🧬 {profile.race}</div>
        )}
        <div style={{ color: "#ddd", fontSize: 13, marginBottom: 8, lineHeight: 1.4 }}>{profile.bio}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {profile.interests?.map(i => <Badge key={i} color={C.fire}>{i}</Badge>)}
        </div>
      </div>
      <div style={{ position: "absolute", top: 32, left: 16, opacity: Math.min(1, Math.max(0, drag.x / 100)), border: `3px solid ${C.fire}`, borderRadius: 8, padding: "4px 12px", color: C.fire, fontWeight: 900, fontSize: 26, transform: "rotate(-12deg)", pointerEvents: "none" }}>LIKE ❤️</div>
      <div style={{ position: "absolute", top: 32, right: 16, opacity: Math.min(1, Math.max(0, -drag.x / 100)), border: "3px solid #aaa", borderRadius: 8, padding: "4px 12px", color: "#aaa", fontWeight: 900, fontSize: 26, transform: "rotate(12deg)", pointerEvents: "none" }}>NOPE ✗</div>
    </div>
  );
}

// ─── CHAT SCREEN ────────────────────────────────────────────
function ChatScreen({ match, myContact, onBack }) {
  const [messages, setMessages] = useState([{ role: "assistant", content: { type: "text", text: `Hey! I'm ${match.name} 😊 So happy we matched! What's up?` } }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null);
  const bottomRef = useRef();
  const fileRef = useRef();
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendText = async (text) => {
    if (!text.trim() || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: { type: "text", text } }]);
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content.text || "[media]" }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000,
          system: `You are ${match.name}, ${match.age}, ${match.job}. Bio: "${match.bio}". On a dating app, just matched. Be flirty, warm, witty. Short replies (1-3 sentences). Stay in character.`,
          messages: [...history, { role: "user", content: text }] }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: { type: "text", text: data.content?.map(b => b.text).join("") || "Hey 😄" } }]);
    } catch { setMessages(prev => [...prev, { role: "assistant", content: { type: "text", text: "Lost signal 😅" } }]); }
    setLoading(false);
  };

  const sendMediaMsg = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    e.target.value = "";
    const localSrc = URL.createObjectURL(file);
    const type = file.type.startsWith("video") ? "video" : "image";
    // Show instant local preview immediately
    const msgId = Date.now();
    setMessages(prev => [...prev, { role: "user", content: { type, src: localSrc, uploading: true, id: msgId } }]);
    const isConfigured = CLOUDINARY_CLOUD_NAME !== "YOUR_CLOUD_NAME";
    if (isConfigured) {
      try {
        const result = await uploadToCloudinary(file);
        setMessages(prev => prev.map(m =>
          m.content?.id === msgId ? { ...m, content: { type: result.type, src: result.url } } : m
        ));
      } catch {
        setMessages(prev => prev.map(m =>
          m.content?.id === msgId ? { ...m, content: { type, src: localSrc } } : m
        ));
      }
    } else {
      setMessages(prev => prev.map(m =>
        m.content?.id === msgId ? { ...m, content: { type, src: localSrc } } : m
      ));
    }
    setTimeout(() => {
      const r = ["Wow 😍", "Love this! 😂", "Okay this is cute 🥺", "You're adorable 😊"][Math.floor(Math.random() * 4)];
      setMessages(prev => [...prev, { role: "assistant", content: { type: "text", text: r } }]);
    }, 800);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.dark }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid #222", background: C.card }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, fontSize: 20, cursor: "pointer" }}>←</button>
        <Avatar src={match.media?.[0]?.src || match.photo} name={match.name} size={40} />
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{match.name}</div>
          <div style={{ color: C.match, fontSize: 11 }}>● Active now</div>
        </div>
        <button onClick={() => setShowContact(s => !s)}
          style={{ background: showContact ? C.fire + "33" : "#222", border: `1px solid ${showContact ? C.fire : "#444"}`, borderRadius: 20, padding: "5px 11px", color: showContact ? C.fire : "#fff", fontSize: 12, cursor: "pointer" }}>
          📋 Contact
        </button>
      </div>

      {showContact && (
        <div style={{ background: C.cardLight, borderBottom: "1px solid #2a2a40", padding: "14px 18px" }}>
          <div style={{ color: C.muted, fontSize: 11, marginBottom: 8 }}>YOUR CONTACT INFO</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 20 }}>{myContact?.type === "email" ? "✉️" : "📱"}</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{myContact?.value}</div>
              <div style={{ color: C.muted, fontSize: 12 }}>{myContact?.type === "email" ? "Email" : "Phone"}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
            {m.role === "assistant" && <Avatar src={match.media?.[0]?.src || match.photo} name={match.name} size={28} />}
            {m.content.type === "text"
              ? <div style={{ maxWidth: "72%", background: m.role === "user" ? `linear-gradient(135deg,${C.fire},${C.fireGlow})` : C.cardLight, color: "#fff", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 14px", fontSize: 14, lineHeight: 1.5 }}>{m.content.text}</div>
              : <div onClick={() => !m.content.uploading && setMediaPreview(m.content)} style={{ maxWidth: "60%", borderRadius: 16, overflow: "hidden", cursor: m.content.uploading ? "default" : "pointer", position: "relative" }}>
                  {m.content.type === "video" ? <video src={m.content.src} style={{ width: "100%", display: "block" }} /> : <img src={m.content.src} alt="" style={{ width: "100%", display: "block" }} />}
                  {m.content.uploading && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 24, height: 24, border: `3px solid ${C.fire}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    </div>
                  )}
                  {m.content.type === "video" && !m.content.uploading && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0005", color: "#fff", fontSize: 28 }}>▶</div>}
                </div>}
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <Avatar src={match.media?.[0]?.src || match.photo} name={match.name} size={28} />
            <div style={{ background: C.cardLight, borderRadius: "18px 18px 18px 4px", padding: "12px 18px", color: C.muted, fontSize: 20, letterSpacing: 2 }}>···</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8, padding: "10px 14px", borderTop: "1px solid #222", background: C.card, alignItems: "center" }}>
        <input ref={fileRef} type="file" accept="image/*,video/*" onChange={sendMediaMsg} style={{ display: "none" }} />
        <button onClick={() => fileRef.current.click()} style={{ background: "#222", border: "none", borderRadius: "50%", width: 38, height: 38, color: "#fff", fontSize: 18, cursor: "pointer" }}>📎</button>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendText(input)} placeholder="Message..."
          style={{ flex: 1, background: "#2a2a40", border: "none", borderRadius: 22, padding: "9px 14px", color: "#fff", fontSize: 14, outline: "none" }} />
        <button onClick={() => sendText(input)} disabled={loading || !input.trim()}
          style={{ ...grad, border: "none", borderRadius: "50%", width: 40, height: 40, color: "#fff", fontSize: 18, cursor: "pointer", opacity: input.trim() ? 1 : 0.4 }}>→</button>
      </div>

      {mediaPreview && (
        <div onClick={() => setMediaPreview(null)} style={{ position: "absolute", inset: 0, background: "#000d", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {mediaPreview.type === "video" ? <video src={mediaPreview.src} controls autoPlay style={{ maxWidth: "95%", maxHeight: "90%", borderRadius: 12 }} onClick={e => e.stopPropagation()} /> : <img src={mediaPreview.src} alt="" style={{ maxWidth: "95%", maxHeight: "90%", borderRadius: 12, objectFit: "contain" }} />}
        </div>
      )}
    </div>
  );
}

// ─── PROFILE TAB ────────────────────────────────────────────
function ProfileTab({ profile, liked, matches, onEdit }) {
  const [mediaPreview, setMediaPreview] = useState(null);
  return (
    <div style={{ padding: "10px 18px 20px", overflowY: "auto" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingBottom: 16 }}>
        <div style={{ width: 90, height: 90, borderRadius: "50%", overflow: "hidden", border: `3px solid ${C.fire}` }}>
          {profile.media?.[0]
            ? (profile.media[0].type === "video"
                ? <video src={profile.media[0].src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <img src={profile.media[0].src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />)
            : <div style={{ width: "100%", height: "100%", ...grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 900, color: "#fff" }}>{profile.name?.[0]}</div>}
        </div>
        <div style={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>{profile.name}, {profile.age}</div>
        <div style={{ background: C.fire + "22", border: `1px solid ${C.fire}44`, borderRadius: 18, padding: "3px 14px", color: C.fire, fontWeight: 700, fontSize: 12 }}>🔥 Free Member</div>
        <button onClick={onEdit} style={{ background: "#222", border: "1px solid #444", borderRadius: 20, padding: "5px 18px", color: "#fff", fontSize: 13, cursor: "pointer" }}>✏ Edit Profile</button>
      </div>
      <div style={{ background: C.card, borderRadius: 14, padding: 14, marginBottom: 10 }}>
        <div style={{ color: C.muted, fontSize: 11, marginBottom: 8 }}>CONTACT</div>
        <div style={{ color: "#fff", fontSize: 14 }}>{profile.contact?.type === "email" ? "✉️" : "📱"} {profile.contact?.value}</div>
        <div style={{ color: C.match, fontSize: 11, marginTop: 6 }}>✓ Visible to all your matches</div>
      </div>
      {profile.location && (
        <div style={{ background: C.card, borderRadius: 14, padding: 14, marginBottom: 10 }}>
          <div style={{ color: C.muted, fontSize: 11, marginBottom: 8 }}>LOCATION</div>
          <div style={{ color: "#fff", fontSize: 14 }}>📍 {profile.location.city}, {profile.location.country}</div>
        </div>
      )}
      {profile.race && profile.race !== "Prefer not to say" && (
        <div style={{ background: C.card, borderRadius: 14, padding: 14, marginBottom: 10 }}>
          <div style={{ color: C.muted, fontSize: 11, marginBottom: 8 }}>ETHNICITY / RACE</div>
          <div style={{ color: "#fff", fontSize: 14 }}>🌍 {profile.race}</div>
        </div>
      )}
      <div style={{ background: C.card, borderRadius: 14, padding: 14, marginBottom: 10 }}>
        <div style={{ color: C.muted, fontSize: 11, marginBottom: 6 }}>BIO</div>
        <div style={{ color: "#fff", fontSize: 14, lineHeight: 1.5 }}>{profile.bio}</div>
      </div>
      {profile.media?.length > 0 && (
        <div style={{ background: C.card, borderRadius: 14, padding: 14, marginBottom: 10 }}>
          <div style={{ color: C.muted, fontSize: 11, marginBottom: 10 }}>MY PHOTOS & VIDEOS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
            {profile.media.map((m, i) => (
              <div key={i} onClick={() => setMediaPreview(m)} style={{ paddingBottom: "100%", position: "relative", borderRadius: 10, overflow: "hidden", cursor: "pointer" }}>
                {m.type === "video" ? <video src={m.src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : <img src={m.src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
                {m.type === "video" && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0004", color: "#fff", fontSize: 20 }}>▶</div>}
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ background: C.card, borderRadius: 14, padding: 14 }}>
        <div style={{ color: C.muted, fontSize: 11, marginBottom: 10 }}>STATS</div>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {[{ val: liked, color: C.fire, label: "Liked" }, { val: matches, color: C.match, label: "Matched" }].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ color: s.color, fontWeight: 900, fontSize: 26 }}>{s.val}</div>
              <div style={{ color: C.muted, fontSize: 12 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      {mediaPreview && (
        <div onClick={() => setMediaPreview(null)} style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {mediaPreview.type === "video" ? <video src={mediaPreview.src} controls autoPlay style={{ maxWidth: "95vw", maxHeight: "90vh", borderRadius: 12 }} onClick={e => e.stopPropagation()} /> : <img src={mediaPreview.src} alt="" style={{ maxWidth: "95vw", maxHeight: "90vh", borderRadius: 12, objectFit: "contain" }} />}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────
export default function App() {
  const [myProfile, setMyProfile] = useState(null);
  const [tab, setTab] = useState("swipe");
  const [queue, setQueue] = useState(PROFILES);
  const [likedIds, setLikedIds] = useState([]);
  const [matchList, setMatchList] = useState([]);
  const [chat, setChat] = useState(null);
  const [newMatch, setNewMatch] = useState(null);
  const [filters, setFilters] = useState({ minAge: 18, maxAge: 60, interests: [], country: "", city: "", races: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState({ country: "", city: "", minAge: "", maxAge: "", races: [] });

  const allInterests = ["Hiking", "Music", "Travel", "Cooking", "Fitness", "Dogs", "Art", "Books", "Yoga", "Wellness", "Animals", "Jazz", "Entrepreneurship", "Food"];

  const applyFilters = (p) => {
    if (p.age < filters.minAge || p.age > filters.maxAge) return false;
    if (filters.interests.length > 0 && !p.interests?.some(i => filters.interests.includes(i))) return false;
    if (filters.country && !p.location?.country?.toLowerCase().includes(filters.country.toLowerCase())) return false;
    if (filters.city && !p.location?.city?.toLowerCase().includes(filters.city.toLowerCase())) return false;
    if (filters.races.length > 0 && !filters.races.includes(p.race)) return false;
    return true;
  };

  const filtered = queue.filter(applyFilters);
  const current = filtered[0];

  const searchResults = PROFILES.filter(p => {
    const q = searchQuery;
    const hasQuery = q.country || q.city || q.minAge || q.maxAge || q.races.length > 0;
    if (!hasQuery) return false;
    if (q.country && !p.location?.country?.toLowerCase().includes(q.country.toLowerCase())) return false;
    if (q.city && !p.location?.city?.toLowerCase().includes(q.city.toLowerCase())) return false;
    if (q.minAge && p.age < parseInt(q.minAge)) return false;
    if (q.maxAge && p.age > parseInt(q.maxAge)) return false;
    if (q.races.length > 0 && !q.races.includes(p.race)) return false;
    return true;
  });

  const handleLike = () => {
    if (!current) return;
    setLikedIds(prev => [...prev, current.id]);
    if (Math.random() > 0.4) { setMatchList(prev => [...prev, current]); setNewMatch(current); setTimeout(() => setNewMatch(null), 3000); }
    setQueue(prev => prev.filter(p => p.id !== current.id));
  };
  const handlePass = () => { if (current) setQueue(prev => prev.filter(p => p.id !== current.id)); };

  const ff = "'Helvetica Neue',Arial,sans-serif";

  if (!myProfile) return (
    <div style={{ width: "100%", maxWidth: 420, height: 680, margin: "0 auto", borderRadius: 28, overflow: "hidden", fontFamily: ff, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
      <SetupScreen onDone={p => setMyProfile(p)} />
    </div>
  );

  if (chat) return (
    <div style={{ width: "100%", maxWidth: 420, height: 680, margin: "0 auto", borderRadius: 28, overflow: "hidden", fontFamily: ff, background: C.dark, boxShadow: "0 30px 80px rgba(0,0,0,0.6)", position: "relative" }}>
      <ChatScreen match={chat} myContact={myProfile.contact} onBack={() => setChat(null)} />
    </div>
  );

  return (
    <div style={{ width: "100%", maxWidth: 420, height: 680, margin: "0 auto", borderRadius: 28, overflow: "hidden", fontFamily: ff, background: C.dark, display: "flex", flexDirection: "column", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", position: "relative" }}>
      {newMatch && (
        <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", zIndex: 100, ...grad, borderRadius: 20, padding: "14px 22px", textAlign: "center", boxShadow: `0 8px 32px ${C.fire}55`, whiteSpace: "nowrap" }}>
          <div style={{ fontSize: 24 }}>🎉</div>
          <div style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>It's a Match!</div>
          <div style={{ color: "#ffdddd", fontSize: 12 }}>You & {newMatch.name} liked each other</div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 8px", background: C.dark }}>
        <div style={{ fontSize: 20, fontWeight: 900, background: `linear-gradient(135deg,${C.fire},${C.fireGlow})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🔥 Spark</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ background: C.match + "22", border: `1px solid ${C.match}44`, borderRadius: 18, padding: "3px 11px", color: C.match, fontSize: 11, fontWeight: 700 }}>✓ Free</div>
          {tab === "swipe" && <button onClick={() => setShowFilters(f => !f)} style={{ background: showFilters ? C.fire : "#222", border: "none", borderRadius: 18, padding: "5px 11px", color: "#fff", fontSize: 11, cursor: "pointer" }}>⚙</button>}
          <div style={{ background: C.fire, color: "#fff", borderRadius: 18, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>{matchList.length} 💬</div>
        </div>
      </div>

      {showFilters && tab === "swipe" && (
        <div style={{ background: C.card, margin: "0 14px 10px", borderRadius: 14, padding: 14, border: "1px solid #333", maxHeight: 320, overflowY: "auto" }}>

          {/* Age range */}
          <div style={{ color: "#fff", fontWeight: 700, marginBottom: 8, fontSize: 13 }}>🎂 Age Range</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.muted, fontSize: 10, marginBottom: 4 }}>Min</div>
              <input type="number" min={18} max={80} value={filters.minAge} onChange={e => setFilters(f => ({ ...f, minAge: +e.target.value }))}
                style={{ width: "100%", background: "#0d0d0d", border: "1px solid #444", borderRadius: 10, padding: "7px 10px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.muted, fontSize: 10, marginBottom: 4 }}>Max</div>
              <input type="number" min={18} max={80} value={filters.maxAge} onChange={e => setFilters(f => ({ ...f, maxAge: +e.target.value }))}
                style={{ width: "100%", background: "#0d0d0d", border: "1px solid #444", borderRadius: 10, padding: "7px 10px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>

          {/* Location */}
          <div style={{ color: "#fff", fontWeight: 700, marginBottom: 8, fontSize: 13 }}>📍 Location</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input value={filters.country} onChange={e => setFilters(f => ({ ...f, country: e.target.value }))} placeholder="Country"
              style={{ flex: 1, background: "#0d0d0d", border: `1px solid ${filters.country ? C.fire : "#444"}`, borderRadius: 10, padding: "7px 10px", color: "#fff", fontSize: 12, outline: "none" }} />
            <input value={filters.city} onChange={e => setFilters(f => ({ ...f, city: e.target.value }))} placeholder="City"
              style={{ flex: 1, background: "#0d0d0d", border: `1px solid ${filters.city ? C.fire : "#444"}`, borderRadius: 10, padding: "7px 10px", color: "#fff", fontSize: 12, outline: "none" }} />
          </div>

          {/* Race */}
          <div style={{ color: "#fff", fontWeight: 700, marginBottom: 8, fontSize: 13 }}>🌍 Ethnicity / Race</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {RACES.filter(r => r !== "Prefer not to say").map(r => (
              <button key={r} onClick={() => setFilters(f => ({ ...f, races: f.races.includes(r) ? f.races.filter(x => x !== r) : [...f.races, r] }))}
                style={{ background: filters.races.includes(r) ? C.fire : "#333", border: "none", borderRadius: 18, padding: "4px 10px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: filters.races.includes(r) ? 700 : 400 }}>
                {r}
              </button>
            ))}
          </div>

          {/* Interests */}
          <div style={{ color: "#fff", fontWeight: 700, marginBottom: 8, fontSize: 13 }}>✨ Interests</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {allInterests.map(i => <button key={i} onClick={() => setFilters(f => ({ ...f, interests: f.interests.includes(i) ? f.interests.filter(x => x !== i) : [...f.interests, i] }))} style={{ background: filters.interests.includes(i) ? C.fire : "#333", border: "none", borderRadius: 18, padding: "4px 10px", color: "#fff", fontSize: 11, cursor: "pointer" }}>{i}</button>)}
          </div>

          {/* Reset */}
          <button onClick={() => setFilters({ minAge: 18, maxAge: 60, interests: [], country: "", city: "", races: [] })}
            style={{ width: "100%", padding: "8px 0", borderRadius: 12, border: "1px solid #444", background: "transparent", color: C.muted, fontSize: 12, cursor: "pointer", marginTop: 4 }}>
            Reset all filters
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto" }}>
        {tab === "swipe" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8 }}>
            {current ? (
              <>
                <SwipeCard profile={current} onLike={handleLike} onPass={handlePass} />
                <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
                  <button onClick={handlePass} style={{ width: 56, height: 56, borderRadius: "50%", background: "#222", border: "2px solid #555", color: "#aaa", fontSize: 22, cursor: "pointer" }}>✗</button>
                  <button onClick={handleLike} style={{ width: 60, height: 60, borderRadius: "50%", ...grad, border: "none", color: "#fff", fontSize: 24, cursor: "pointer", boxShadow: `0 4px 20px ${C.fire}55` }}>❤</button>
                </div>
                <div style={{ color: C.muted, fontSize: 11, marginTop: 10 }}>Drag or tap buttons · tap sides to browse</div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 48 }}>🌟</div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 20, marginTop: 10 }}>You've seen everyone!</div>
                <div style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>Check matches or adjust filters</div>
                <button onClick={() => { setQueue(PROFILES); setFilters({ maxAge: 50, interests: [] }); }} style={{ ...grad, border: "none", borderRadius: 22, padding: "10px 22px", color: "#fff", fontWeight: 700, cursor: "pointer", marginTop: 18 }}>Start Over</button>
              </div>
            )}
          </div>
        )}

        {tab === "matches" && (
          <div style={{ padding: "0 14px 14px" }}>
            {matchList.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 48 }}>💔</div>
                <div style={{ color: "#fff", fontWeight: 700, marginTop: 10 }}>No matches yet</div>
                <div style={{ color: C.muted, fontSize: 13 }}>Keep swiping!</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8 }}>
                <div style={{ color: C.muted, fontSize: 12 }}>{matchList.length} match{matchList.length > 1 ? "es" : ""}</div>
                {matchList.map(m => (
                  <div key={m.id} onClick={() => setChat(m)} style={{ display: "flex", alignItems: "center", gap: 12, background: C.card, borderRadius: 14, padding: 12, cursor: "pointer", border: "1px solid #2a2a40" }}>
                    <div style={{ position: "relative" }}>
                      <Avatar src={m.media?.[0]?.src || m.photo} name={m.name} size={52} />
                      <div style={{ position: "absolute", bottom: 2, right: 2, width: 11, height: 11, background: C.match, borderRadius: "50%", border: "2px solid #1a1a2e" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#fff", fontWeight: 700 }}>{m.name}, {m.age}</div>
                      <div style={{ color: C.muted, fontSize: 12 }}>{m.job}</div>
                      {m.location && <div style={{ color: C.muted, fontSize: 11 }}>📍 {m.location.city}, {m.location.country}</div>}
                      <div style={{ color: C.fire, fontSize: 11, marginTop: 2 }}>Tap to chat & view contact →</div>
                    </div>
                    <div style={{ ...grad, borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 15 }}>💬</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "search" && (
          <div style={{ padding: "10px 14px 14px" }}>
            <div style={{ background: C.card, borderRadius: 14, padding: 14, marginBottom: 14, border: "1px solid #333" }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, marginBottom: 14 }}>🔍 Search Members</div>

              {/* Location */}
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 6, fontWeight: 700 }}>📍 LOCATION</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input value={searchQuery.country} onChange={e => setSearchQuery(q => ({ ...q, country: e.target.value }))} placeholder="Country"
                  style={{ flex: 1, background: "#0d0d0d", border: `1px solid ${searchQuery.country ? C.fire : "#444"}`, borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
                <input value={searchQuery.city} onChange={e => setSearchQuery(q => ({ ...q, city: e.target.value }))} placeholder="City"
                  style={{ flex: 1, background: "#0d0d0d", border: `1px solid ${searchQuery.city ? C.fire : "#444"}`, borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
              </div>

              {/* Age range */}
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 6, fontWeight: 700 }}>🎂 AGE RANGE</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input type="number" min={18} max={80} value={searchQuery.minAge} onChange={e => setSearchQuery(q => ({ ...q, minAge: e.target.value }))} placeholder="Min age"
                  style={{ flex: 1, background: "#0d0d0d", border: `1px solid ${searchQuery.minAge ? C.fire : "#444"}`, borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
                <input type="number" min={18} max={80} value={searchQuery.maxAge} onChange={e => setSearchQuery(q => ({ ...q, maxAge: e.target.value }))} placeholder="Max age"
                  style={{ flex: 1, background: "#0d0d0d", border: `1px solid ${searchQuery.maxAge ? C.fire : "#444"}`, borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
              </div>

              {/* Race */}
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 8, fontWeight: 700 }}>🌍 ETHNICITY / RACE</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {RACES.filter(r => r !== "Prefer not to say").map(r => (
                  <button key={r} onClick={() => setSearchQuery(q => ({ ...q, races: q.races.includes(r) ? q.races.filter(x => x !== r) : [...q.races, r] }))}
                    style={{ background: searchQuery.races.includes(r) ? C.fire : "#222", border: `1px solid ${searchQuery.races.includes(r) ? C.fire : "#444"}`, borderRadius: 18, padding: "5px 11px", color: searchQuery.races.includes(r) ? "#fff" : C.muted, fontSize: 11, cursor: "pointer", fontWeight: searchQuery.races.includes(r) ? 700 : 400 }}>
                    {r}
                  </button>
                ))}
              </div>

              {/* Clear */}
              {(searchQuery.country || searchQuery.city || searchQuery.minAge || searchQuery.maxAge || searchQuery.races.length > 0) && (
                <button onClick={() => setSearchQuery({ country: "", city: "", minAge: "", maxAge: "", races: [] })}
                  style={{ background: "#333", border: "none", borderRadius: 10, padding: "6px 14px", color: C.muted, fontSize: 12, cursor: "pointer" }}>✕ Clear all</button>
              )}
            </div>

            {/* Results */}
            {!searchQuery.country && !searchQuery.city && !searchQuery.minAge && !searchQuery.maxAge && searchQuery.races.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🌍</div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Search for members</div>
                <div style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>Filter by location, age, or ethnicity above</div>
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>😔</div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>No members found</div>
                <div style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>Try broadening your search</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ color: C.muted, fontSize: 12 }}>{searchResults.length} member{searchResults.length > 1 ? "s" : ""} found</div>
                {searchResults.map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, background: C.card, borderRadius: 14, padding: 12, border: "1px solid #2a2a40" }}>
                    <Avatar src={p.media?.[0]?.src || p.photo} name={p.name} size={54} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{p.name}, {p.age}</div>
                      <div style={{ color: C.muted, fontSize: 12 }}>{p.job}</div>
                      {p.location && <div style={{ color: C.muted, fontSize: 11 }}>📍 {p.location.city}, {p.location.country}</div>}
                      {p.race && p.race !== "Prefer not to say" && <div style={{ color: C.muted, fontSize: 11 }}>🌍 {p.race}</div>}
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 5 }}>
                        {p.interests?.slice(0, 2).map(i => <Badge key={i} color={C.fire}>{i}</Badge>)}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => { setQueue(prev => prev.filter(x => x.id !== p.id)); setLikedIds(prev => [...prev, p.id]); if (Math.random() > 0.4) { setMatchList(prev => prev.find(x => x.id === p.id) ? prev : [...prev, p]); setNewMatch(p); setTimeout(() => setNewMatch(null), 3000); } }}
                        style={{ ...grad, border: "none", borderRadius: "50%", width: 38, height: 38, color: "#fff", fontSize: 16, cursor: "pointer" }}>❤</button>
                      <button onClick={() => setQueue(prev => prev.filter(x => x.id !== p.id))}
                        style={{ background: "#222", border: "1px solid #444", borderRadius: "50%", width: 38, height: 38, color: "#aaa", fontSize: 16, cursor: "pointer" }}>✗</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "profile" && (
          <ProfileTab profile={myProfile} liked={likedIds.length} matches={matchList.length} onEdit={() => setMyProfile(null)} />
        )}
      </div>

      <div style={{ display: "flex", borderTop: "1px solid #222", background: C.card }}>
        {[{ id: "swipe", icon: "🔥", label: "Discover" }, { id: "search", icon: "🔍", label: "Search" }, { id: "matches", icon: "💬", label: "Matches" }, { id: "profile", icon: "👤", label: "Profile" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: "none", border: "none", padding: "11px 0", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontSize: 10, color: tab === t.id ? C.fire : C.muted, fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

