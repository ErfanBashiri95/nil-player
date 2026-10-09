# 🌌 Nil Player — Secure Video Platform for Helix Coaching Academy

**Nil Player** is a custom-built, secure, and elegant video-learning platform designed and developed entirely by **Erfan Bashiri and Ali Bashiri** for **Nil Coaching Academy**.  
It delivers smooth video playback, learner progress tracking, and advanced anti-piracy measures — all inside a clean, responsive, bilingual interface.

---

## ✨ Highlights

- 🎬 **Secure Video Streaming**
  - Supports both **HLS (.m3u8)** and **MP4** formats via `hls.js`
  - Smart resume — continue exactly where you left off  
  - Progress saved automatically in **Supabase**

- 🛡️ **Anti-Piracy Protection**
  - Dynamic watermark showing username + date + time  
  - Random position every 10 seconds, soft fade-in/out  
  - Blocks right-click, download, and PiP mode  
  - Detects screen-capture attempts and pauses playback

- 📈 **Learning Progress Tracking**
  - Updates every 5 seconds and on pause/finish  
  - Real-time progress reflected on session cards  
  - Synced through `nilplayer_progress` table in Supabase

- 💡 **Dynamic Course Management**
  - Add or reorder sessions directly in the database — no redeploy needed  
  - Each session card is automatically generated from data  
  - Used for **HELIX 01** and **HELIX 02** courses

- 🌐 **Fully Responsive + Bilingual**
  - RTL Persian + LTR English supported seamlessly  
  - Fonts: **Vazirmatn** (FA) & **Inter** (EN)  
  - Optimized for desktop, tablet, and mobile

---

## ⚙️ Tech Stack

| Layer | Technology |
|--------|-------------|
| 🎨 Front-end | React 18 + Vite |
| 🔋 Backend | Supabase (PostgreSQL + Auth API) |
| 🎬 Media Engine | HLS.js |
| 💾 State / Hooks | React Hooks (useState, useEffect, useRef) |
| ☁️ Hosting | Render (Static Site) |
| 🪶 Styling | Custom CSS + subtle gradients + shadows |
| 🔤 Fonts | Vazirmatn + Inter |

---

## 🧩 Project Structure

src/ ├── components/ │ ├── MediaModal.jsx # Core player with watermark & custom fullscreen │ ├── HeaderBar.jsx # Top navigation │ ├── StarOverlay.jsx # Animated star background │ └── PageLoader.jsx ├── context/ │ └── AuthContext.jsx # Global user state ├── pages/ │ ├── Helix01.jsx │ ├── Helix02.jsx │ └── Login.jsx ├── utils/ │ ├── progress.js # Save / get user progress │ └── tokenUtils.js # Secure URL validation └── i18n/ └── lang.js

---

## 🗃️ Database Overview (Supabase)

### `nilplayer_sessions`
| Field | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| course_code | TEXT | HELIX01 / HELIX02 |
| title | TEXT | Session title |
| desc | TEXT | Short description |
| video_url | TEXT | HLS or MP4 link |
| audio_url | TEXT | Optional podcast link |
| order_index | INT | Sort order |

### `nilplayer_progress`
| Field | Type | Description |
|--------|------|-------------|
| username | TEXT | Authenticated user |
| session_id | UUID | FK → `nilplayer_sessions` |
| last_position | NUMERIC | Last watched second |
| watched_seconds | NUMERIC | Total watched time |
| total_seconds | NUMERIC | Video length |
| completed | BOOLEAN | Completion flag |

---

## 🧠 Architecture Notes

- Uses a **custom fullscreen wrapper** that keeps controls + watermark visible  
- Auto-pause when focus is lost or capture detected  
- Dispatches a global event on progress updates (`nilplayer:progress-updated`)  
- Simple **Auth whitelist** (`allowedUsers.json`) for access control  
- Clean separation of UI / logic / data layers  

---

## 🚀 Deployment

1. **Build**
   ```bash
   npm install
   npm run build

2. Deploy on Render

Create a Static Site on Render

Connect your GitHub repo

Build command → npm run build

Publish directory → dist

Add your custom domain (e.g. player.nilpapd.com)

Render automatically issues SSL (Let’s Encrypt)





---

🎨 Design Principles

Minimalistic, galaxy-themed UI inspired by the Helix identity

Consistent color palette (deep navy #0A1022 + turquoise gradients)

Strong focus on readability, smooth motion, and immersive experience

Every pixel and animation hand-tuned by Erfan Bashiri



---

🧾 Project Philosophy

> “Security without friction — learning without distraction.”
— Erfan Bashiri



Nil Player is not just a video player — it’s an experience designed to reflect the Helix coaching journey: clarity, focus, and growth.
Every feature, from watermark motion to playback speed limits, serves the same purpose: protect value and enhance presence.


---

🧑‍💻 Developers

Erfan Bashiri/Ali Bashiri
Full-Stack Developer & Creative Engineer
🌐 Nil Coaching Academy
📍 Based in Tehran / Iran
💬 Passionate about AI, web architecture, and experiential learning


---

🏷️ Keywords

React · Vite · Supabase · HLS.js · Secure Streaming · Frontend Developer · UI/UX · JavaScript · Full Stack · Erfan Bashiri


---

📜 License

© 2025 Nil Coaching Academy — Developed by Erfan Bashiri/Ali Bashiri with 💙
All rights reserved.

⭐ If you enjoy this project, please star the repo!
