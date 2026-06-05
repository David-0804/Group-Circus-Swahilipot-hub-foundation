import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from 'react-router-dom';


/* ─────────────────── DESIGN TOKENS ─────────────────── */
const T = {
  navy: "#0A1628",
  navyMid: "#12233E",
  navyLight: "#1A3A5C",
  gold: "#C9973A",
  goldLight: "#E8B84B",
  goldPale: "#FFF8E7",
  cream: "#FAFAF6",
  offWhite: "#F5F3EE",
  text: "#1A1A1A",
  textMuted: "#666",
  textLight: "#999",
  red: "#C0392B",
  green: "#1DB954",
  border: "rgba(0,0,0,0.08)",
  white: "#ffffff",
};

/* ─────────────────── DATA ─────────────────── */
const NAV_SECTIONS = ["Home","About","Programmes","Studios","News","FM Live","Admissions","Alumni","Contact"];

const STATS = [
  { value:"98.4", unit:"FM", label:"Licensed Broadcast Station" },
  { value:"24/7", unit:"", label:"On-Air Operations" },
  { value:"1,400+", unit:"", label:"Media Alumni" },
  { value:"Est.", unit:"2001", label:"Years of Excellence" },
];

const PROGRAMMES = [
  {
    code:"DRB", badge:"Flagship",
    title:"Diploma in Radio Broadcasting",
    duration:"2 Years", intake:"January & September",
    fee:"KES 95,000 / year",
    desc:"Master live presenting, production engineering, and full station management. Train on our licensed 98.4 FM facility from your first week — not in simulations.",
    modules:["Live Presenting & Voice","Production & Editing","Station Management","FM Technology","Media Law & Ethics","Digital Journalism"],
    icon:"🎙",
    color: T.navy,
  },
  {
    code:"DJN", badge:"High Demand",
    title:"Diploma in Journalism & News",
    duration:"2 Years", intake:"January & September",
    fee:"KES 90,000 / year",
    desc:"From field reporting and investigative journalism to editorial workflow and broadcast news production. Work with our fully equipped 30-seat digital newsroom.",
    modules:["Reporting & Interviewing","Multimedia Storytelling","Editorial Judgment","Photojournalism","Broadcast News Presenting","Data Journalism"],
    icon:"📰",
    color:"#1B4F72",
  },
  {
    code:"DVP", badge:"",
    title:"Diploma in Video Production",
    duration:"2 Years", intake:"January",
    fee:"KES 110,000 / year",
    desc:"Cinematography, editing, documentary production and broadcast television in our professional 4-camera HD studio and videography suites with full post-production capability.",
    modules:["Cinematography","Non-Linear Editing","Documentary Filmmaking","Lighting & Studio Ops","Motion Graphics","Distribution & Streaming"],
    icon:"🎬",
    color:"#4A235A",
  },
  {
    code:"DAE", badge:"Flexible Entry",
    title:"Diploma in Audio Engineering",
    duration:"18 Months", intake:"Any Month",
    fee:"KES 80,000 / year",
    desc:"Sound design, studio recording, live sound reinforcement and DAW mastery. Graduate with a professional portfolio recorded in our Neve-equipped studios.",
    modules:["Studio Recording","Mixing & Mastering","Live Sound","DAW Proficiency","Acoustics","Music Production"],
    icon:"🎚",
    color:"#1A5276",
  },
  {
    code:"DMM", badge:"New 2026",
    title:"Diploma in Digital Media & Marketing",
    duration:"18 Months", intake:"January & September",
    fee:"KES 85,000 / year",
    desc:"Social media strategy, content creation, audience analytics, and digital campaign management for the modern media landscape.",
    modules:["Social Media Strategy","Content Production","SEO & Analytics","Brand Communication","Podcast Production","Influencer & Creator Economy"],
    icon:"📱",
    color:"#0B5345",
  },
  {
    code:"SC", badge:"",
    title:"Short Courses & CPD",
    duration:"2 – 12 Weeks", intake:"Rolling",
    fee:"From KES 15,000",
    desc:"Industry-focused short courses for working professionals. Podcast production, drone videography, newsroom systems, and social media content.",
    modules:["Podcast Fundamentals","Drone Videography","Newsroom Tech","Live Streaming","Voice & Presentation","Social Content"],
    icon:"⚡",
    color:"#784212",
  },
];

const NEWS_ITEMS = [
  { id:1, cat:"Awards", date:"2 Jun 2026", title:"Our Students Sweep the 2026 Kenya Media Awards", excerpt:"Three second-year Radio Broadcasting students took home gold, silver and bronze in the Young Broadcaster category — a historic first for the institution. The wins were judged across 47 institutions nationally.", readTime:"3 min", featured:true },
  { id:2, cat:"FM Station", date:"28 May 2026", title:"New Digital Transmitter Expands FM Coverage to 120 km Radius", excerpt:"The upgraded transmitter brings our 98.4 FM signal to over 2.4 million potential listeners across the Coast region, from Kilifi to the Tanzania border.", readTime:"4 min", featured:true },
  { id:3, cat:"Admissions", date:"20 May 2026", title:"September 2026 Applications Now Open — Early Bird Waiver Available", excerpt:"We are accepting applications for all diploma programmes. Students who apply before 31 July receive a full registration fee waiver worth KES 1,000.", readTime:"2 min", featured:false },
  { id:4, cat:"Industry", date:"15 May 2026", title:"NTV Kenya Signs Internship MOU with the Institution", excerpt:"A new memorandum of understanding guarantees 12 paid internship placements annually for our Video Production and Journalism students at NTV Kenya's Nairobi newsroom.", readTime:"3 min", featured:false },
  { id:5, cat:"Events", date:"8 May 2026", title:"Annual Open Day — Saturday 14 June 2026", excerpt:"Prospective students and parents are invited to tour all studios, meet faculty, and attend live demonstrations on our FM station. Registration is free.", readTime:"2 min", featured:false },
  { id:6, cat:"Research", date:"1 May 2026", title:"Coast FM Audience Survey: Our Station Ranks #2 in 18–35 Demographic", excerpt:"An independent survey by Ipsos Kenya places 98.4 FM second among all Coast-region stations in the 18–35 age group, ahead of two commercial operators.", readTime:"5 min", featured:false },
];

const FACILITIES = [
  { name:"FM Broadcast Studio", desc:"Licensed 98.4 FM station, on-air 06:00–midnight daily. Calrec audio console, dual cart machine, ISDN codec.", icon:"📻", area:"Studio Block A" },
  { name:"4-Camera TV Studio", desc:"Full HD production studio with teleprompter, 6-point lighting grid, audio tie-lines, and green screen capability.", icon:"📺", area:"Studio Block B" },
  { name:"Audio Suite A & B", desc:"Acoustically treated recording booths with Neve 8078 console and Pro Tools HDX systems.", icon:"🎛", area:"Studio Block A" },
  { name:"Digital Newsroom", desc:"30-seat newsroom with Reuters wire feed, iNews system, broadcast desk, and live web-publishing capability.", icon:"🗞", area:"Main Building" },
  { name:"Videography Suite", desc:"DJI Inspire 3 drone, ARRI Amira cinema cameras, and Da Vinci Resolve colour grading stations.", icon:"🎥", area:"Studio Block B" },
  { name:"Post-Production Lab", desc:"12 Avid Media Composer workstations and 8 Pro Tools stations for audio post.", icon:"💻", area:"Lab Block" },
  { name:"Media Library & Archive", desc:"Digitised archive of 20+ years of student and professional productions — 40TB of searchable content.", icon:"📚", area:"Main Building" },
  { name:"Podcast & Creator Studio", desc:"Dedicated podcast suite with acoustic panelling, multitrack recording and live-streaming rig.", icon:"🎤", area:"Studio Block A" },
];

const ALUMNI = [
  { name:"Amina Hassan", role:"News Anchor, KBC", year:"2018", programme:"Journalism", quote:"The live newsroom experience during training was indistinguishable from a professional environment. I walked into my first job already knowing the workflow." },
  { name:"Brian Otieno", role:"Head of Production, Citizen TV", year:"2015", programme:"Video Production", quote:"I attribute my entire career to the hands-on discipline instilled here. The 4-camera studio training was better than what I found at my first three employers." },
  { name:"Zara Mohamed", role:"Founder, Sahel Podcast Network", year:"2020", programme:"Radio Broadcasting", quote:"The FM station experience is the single biggest differentiator. I launched my podcast company two years after graduating because I actually knew how broadcasting worked end to end." },
  { name:"David Kariuki", role:"Sound Engineer, Universal Music EA", year:"2019", programme:"Audio Engineering", quote:"Recording on the Neve console during my training — you simply can't replicate that learning. My portfolio from here got me the Universal Music interview." },
  { name:"Fatuma Abdi", role:"Digital Editor, Nation Media Group", year:"2021", programme:"Journalism", quote:"The digital newsroom and wire service integration made me job-ready. Nation Media Group hired me within three weeks of graduation." },
];

const SCHEDULE_ITEMS = [
  { time:"06:00", show:"Morning Drive", presenter:"Studio Team", type:"music", live:false },
  { time:"07:00", show:"Coast Breakfast Show", presenter:"Students — Live", type:"live", live:true },
  { time:"09:00", show:"Mid-Morning Magazine", presenter:"Students — Live", type:"live", live:true },
  { time:"11:00", show:"Music Block", presenter:"Automation", type:"music", live:false },
  { time:"13:00", show:"Lunchtime News", presenter:"Journalism Students", type:"news", live:true },
  { time:"14:00", show:"Afternoon Drive", presenter:"Students — Live", type:"live", live:true },
  { time:"16:00", show:"Coast Rush Hour", presenter:"Students — Live", type:"live", live:true },
  { time:"18:00", show:"Evening News & Analysis", presenter:"Journalism Students", type:"news", live:true },
  { time:"19:00", show:"Night Mix", presenter:"Students — Rotation", type:"music", live:true },
  { time:"22:00", show:"Late Night Music", presenter:"Automation", type:"music", live:false },
];

const TEAM = [
  { name:"Prof. Mwangi Kamau", role:"Principal", dept:"Leadership" },
  { name:"Dr. Aisha Salim", role:"Head of Broadcasting", dept:"Faculty" },
  { name:"Mr. James Odhiambo", role:"Head of Journalism", dept:"Faculty" },
  { name:"Ms. Fatima Noor", role:"Head of Video Production", dept:"Faculty" },
  { name:"Mr. Rashid Bakari", role:"Chief Engineer", dept:"Technical" },
  { name:"Ms. Priya Mehta", role:"Registrar & Admissions", dept:"Administration" },
];

/* ─────────────────── HOOKS ─────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function FadeIn({ children, delay = 0, y = 24, className = "", style = {} }) {
  const [ref, vis] = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : `translateY(${y}px)`,
      transition: `opacity 0.65s cubic-bezier(.4,0,.2,1) ${delay}s, transform 0.65s cubic-bezier(.4,0,.2,1) ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ─────────────────── GLOBAL STYLES ─────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'DM Sans', sans-serif; background: ${T.cream}; color: ${T.text}; }
  .display { font-family: 'Playfair Display', Georgia, serif; }
  .italic { font-style: italic; }

  .btn-primary {
    display: inline-block; background: ${T.gold}; color: ${T.navy}; padding: 13px 28px;
    border: none; cursor: pointer; font-size: 14px; font-family: 'DM Sans', sans-serif;
    font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
    transition: background 0.2s, transform 0.15s; text-decoration: none;
  }
  .btn-primary:hover { background: ${T.goldLight}; transform: translateY(-1px); }
  .btn-navy {
    display: inline-block; background: ${T.navy}; color: #fff; padding: 13px 28px;
    border: none; cursor: pointer; font-size: 14px; font-family: 'DM Sans', sans-serif;
    font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
    transition: background 0.2s, transform 0.15s; text-decoration: none;
  }
  .btn-navy:hover { background: ${T.navyLight}; transform: translateY(-1px); }
  .btn-outline {
    display: inline-block; background: transparent; color: ${T.navy}; padding: 12px 28px;
    border: 1.5px solid ${T.navy}; cursor: pointer; font-size: 14px;
    font-family: 'DM Sans', sans-serif; font-weight: 600; letter-spacing: 0.04em;
    text-transform: uppercase; transition: all 0.2s; text-decoration: none;
  }
  .btn-outline:hover { background: ${T.navy}; color: #fff; }
  .btn-outline-white {
    display: inline-block; background: transparent; color: #fff; padding: 12px 28px;
    border: 1.5px solid rgba(255,255,255,0.45); cursor: pointer; font-size: 14px;
    font-family: 'DM Sans', sans-serif; font-weight: 600; letter-spacing: 0.04em;
    text-transform: uppercase; transition: all 0.2s; text-decoration: none;
  }
  .btn-outline-white:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.7); }

  .section-eyebrow {
    display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: 0.18em;
    text-transform: uppercase; color: ${T.gold}; margin-bottom: 14px;
  }
  .section-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: clamp(30px, 3.5vw, 52px); font-weight: 700; color: ${T.navy};
    line-height: 1.15;
  }
  .section-title-white {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: clamp(30px, 3.5vw, 52px); font-weight: 700; color: #fff;
    line-height: 1.15;
  }
  .divider { width: 48px; height: 3px; background: ${T.gold}; margin: 20px 0 28px; }

  .input-field {
    width: 100%; padding: 13px 16px; border: 1.5px solid rgba(0,0,0,0.12);
    font-size: 15px; font-family: 'DM Sans', sans-serif; background: #fff;
    color: ${T.text}; outline: none; transition: border-color 0.2s;
    border-radius: 0;
  }
  .input-field:focus { border-color: ${T.navy}; }
  .input-field::placeholder { color: ${T.textLight}; }

  .nav-link {
    font-size: 13px; font-weight: 500; letter-spacing: 0.04em; color: rgba(255,255,255,0.75);
    cursor: pointer; transition: color 0.15s; text-decoration: none; padding: 4px 0;
    border-bottom: 1.5px solid transparent; transition: color 0.15s, border-color 0.15s;
  }
  .nav-link:hover, .nav-link.active { color: #fff; border-bottom-color: ${T.gold}; }

  .card-hover { transition: transform 0.25s, box-shadow 0.25s; }
  .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.1); }

  .tag {
    display: inline-block; padding: 3px 10px; font-size: 11px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
  }
  .tag-gold { background: ${T.goldPale}; color: ${T.gold}; }
  .tag-navy { background: rgba(10,22,40,0.08); color: ${T.navy}; }
  .tag-green { background: #E8F8EE; color: #1A7A40; }
  .tag-red { background: #FDE8E8; color: ${T.red}; }

  /* FM Live pulse */
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes ticker { 0%{transform:translateX(100%)} 100%{transform:translateX(-100%)} }
  @keyframes barGrow { from{transform:scaleY(0)} to{transform:scaleY(1)} }

  .on-air-pulse { animation: pulse 2s infinite; }
  .slide-down { animation: slideDown 0.35s cubic-bezier(.4,0,.2,1) forwards; }
  .fade-in-anim { animation: fadeIn 0.4s ease forwards; }

  /* Grid helpers */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
  .three-col { display: grid; grid-template-columns: repeat(3,1fr); gap: 32px; }
  .four-col { display: grid; grid-template-columns: repeat(4,1fr); gap: 24px; }
  @media (max-width: 900px) {
    .two-col { grid-template-columns: 1fr; gap: 32px; }
    .three-col { grid-template-columns: 1fr 1fr; }
    .four-col { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 600px) {
    .three-col, .four-col { grid-template-columns: 1fr; }
  }

  /* Ticker */
  .ticker-wrap { overflow: hidden; white-space: nowrap; }
  .ticker-text { display: inline-block; animation: ticker 40s linear infinite; }

  /* FM audio bars */
  .audio-bar {
    display: inline-block; width: 3px; background: ${T.green};
    transform-origin: bottom; border-radius: 2px;
    animation: barGrow 0.8s ease-in-out infinite alternate;
  }

  /* Image placeholders */
  .img-placeholder {
    background: linear-gradient(135deg, ${T.navyMid} 0%, ${T.navy} 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 3rem;
  }

  /* Mobile nav */
  .mobile-menu {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: ${T.navy}; z-index: 200; padding: 80px 32px 32px;
    display: flex; flex-direction: column; gap: 8px;
    animation: slideDown 0.3s ease;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: ${T.offWhite}; }
  ::-webkit-scrollbar-thumb { background: ${T.navyLight}; border-radius: 3px; }
`;

/* ─────────────────── FM LIVE WIDGET ─────────────────── */
function FMLiveWidget({ compact = false }) {
  const [onAir, setOnAir] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [listeners, setListeners] = useState(3840);
  const now = new Date();
  const hour = now.getHours();
  const currentShow = SCHEDULE_ITEMS.find(s => {
    const h = parseInt(s.time.split(":")[0]);
    return h <= hour;
  }) || SCHEDULE_ITEMS[0];

  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(e => e + 1);
      setListeners(l => l + Math.floor(Math.random() * 7) - 3);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s) => `${Math.floor(s/3600).toString().padStart(2,'0')}:${Math.floor((s%3600)/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  if (compact) return (
    <div style={{ background: onAir ? T.navy : "#1a0a0a", padding:"12px 20px", display:"flex", alignItems:"center", gap:14 }}>
      <div style={{ display:"flex", gap:3, alignItems:"flex-end", height:20 }}>
        {[1,0.6,1,0.4,0.8,0.5,0.9,0.3].map((h,i) => (
          <div key={i} className="audio-bar" style={{ height: onAir ? `${h*20}px` : "4px", animationDuration:`${0.5+i*0.15}s`, background: onAir ? T.green : "#555" }} />
        ))}
      </div>
      <span style={{ color: onAir ? T.green : "#888", fontSize:12, fontWeight:700, letterSpacing:"0.15em" }}>
        {onAir ? "LIVE · 98.4 FM" : "OFF AIR"}
      </span>
      <span style={{ color:"rgba(255,255,255,0.5)", fontSize:12, flex:1 }}>{currentShow.show}</span>
      <span style={{ color:"rgba(255,255,255,0.3)", fontSize:11 }}>{listeners.toLocaleString()} listeners</span>
    </div>
  );

  return (
    <div style={{ background: onAir ? T.navy : "#1a0a0a", borderRadius:0, overflow:"hidden" }}>
      <div style={{ background: onAir ? T.green : T.red, padding:"6px 20px", display:"flex", alignItems:"center", gap:10 }}>
        <div className={onAir ? "on-air-pulse" : ""} style={{ width:8, height:8, borderRadius:"50%", background:"#fff" }} />
        <span style={{ color:"#fff", fontSize:11, fontWeight:700, letterSpacing:"0.2em" }}>
          {onAir ? "ON AIR — 98.4 FM COAST" : "OFF AIR"}
        </span>
        <span style={{ marginLeft:"auto", color:"rgba(255,255,255,0.7)", fontSize:11 }}>{fmt(elapsed)}</span>
      </div>
      <div style={{ padding:"24px 28px" }}>
        <div style={{ display:"flex", gap:16, alignItems:"flex-end", marginBottom:20, height:40 }}>
          {[0.5,0.8,1,0.6,0.9,0.4,0.7,1,0.5,0.6,0.8,0.3].map((h,i) => (
            <div key={i} className="audio-bar" style={{
              height: onAir ? `${h*40}px` : "4px",
              animationDuration:`${0.4+i*0.1}s`,
              background: onAir ? T.green : "#333"
            }} />
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
          <div>
            <div style={{ color:"rgba(255,255,255,0.5)", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Now Playing</div>
            <div style={{ color:"#fff", fontSize:20, fontFamily:"'Playfair Display',serif", fontWeight:600 }}>{currentShow.show}</div>
            <div style={{ color:"rgba(255,255,255,0.5)", fontSize:13, marginTop:4 }}>{currentShow.presenter}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ color:"rgba(255,255,255,0.5)", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Listeners</div>
            <div style={{ color: T.gold, fontSize:24, fontWeight:700 }}>{listeners.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:16, flexWrap:"wrap" }}>
          <button className="btn-outline-white" style={{ padding:"8px 16px", fontSize:12 }}>
            ▶ Listen Live
          </button>
          <button onClick={() => setOnAir(a => !a)} style={{ background:"transparent", border:"1.5px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.5)", padding:"8px 16px", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase" }}>
            {onAir ? "Simulate Off Air" : "Restore Signal"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── HERO ─────────────────── */
function HeroSection({ onNav }) {
  const [tick, setTick] = useState(0);
  const TICKERS = ["September 2026 Intake — Applications Open Now","98.4 FM Coast — 3,800+ Daily Listeners","Kenya Media Awards 2026 — 3 Golds Won by Our Students","Open Day: Saturday 14 June 2026 — Free Entry","New Transmitter: FM Coverage Now 120km Radius"];
  useEffect(() => { const t = setInterval(() => setTick(x => (x+1)%TICKERS.length), 5000); return () => clearInterval(t); }, []);

  return (
    <section id="home" style={{ position:"relative", minHeight:"100vh", background:T.navy, overflow:"hidden" }}>
      {/* Background texture */}
      <div style={{ position:"absolute", inset:0, backgroundImage:`radial-gradient(ellipse at 60% 40%, rgba(201,151,58,0.07) 0%, transparent 65%), radial-gradient(ellipse at 10% 80%, rgba(29,185,84,0.04) 0%, transparent 50%)`, pointerEvents:"none" }} />
      {/* Grid overlay */}
      <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`, backgroundSize:"60px 60px", pointerEvents:"none" }} />

      {/* Ticker */}
      <div style={{ position:"absolute", top:72, left:0, right:0, background:"rgba(201,151,58,0.15)", borderTop:`1px solid rgba(201,151,58,0.2)`, borderBottom:`1px solid rgba(201,151,58,0.2)`, padding:"8px 0", overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", gap:24 }}>
          <div style={{ flexShrink:0, background:T.gold, padding:"2px 14px", fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:T.navy, textTransform:"uppercase", zIndex:1 }}>LATEST</div>
          <div className="ticker-wrap" style={{ flex:1 }}>
            <div className="ticker-text" style={{ color:T.gold, fontSize:12, fontWeight:500, letterSpacing:"0.05em" }}>
              {TICKERS.join("   ·   ")}   ·   {TICKERS.join("   ·   ")}
            </div>
          </div>
        </div>
      </div>

      {/* Main hero content */}
      <div style={{ maxWidth:1320, margin:"0 auto", padding:"0 5%", paddingTop:180, paddingBottom:120, display:"grid", gridTemplateColumns:"1.1fr 0.9fr", gap:80, alignItems:"center" }}>
        <div>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.05)", border:`1px solid rgba(201,151,58,0.25)`, padding:"6px 16px 6px 8px", marginBottom:32 }}>
            <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:14 }}>
              {[0.5,1,0.7,0.9,0.4].map((h,i) => (
                <div key={i} className="audio-bar" style={{ height:`${h*14}px`, animationDuration:`${0.5+i*0.15}s` }} />
              ))}
            </div>
            <span style={{ color:T.gold, fontSize:11, fontWeight:700, letterSpacing:"0.15em" }}>98.4 FM · LIVE NOW</span>
          </div>

          <h1 className="display" style={{ fontSize:"clamp(40px,5.5vw,80px)", fontWeight:900, color:"#fff", lineHeight:1.05, marginBottom:20 }}>
            Where Kenya's<br/>
            <span style={{ color:T.gold, fontStyle:"italic" }}>Media Leaders</span><br/>
            Are Made.
          </h1>
          <p style={{ color:"rgba(255,255,255,0.55)", fontSize:18, lineHeight:1.75, maxWidth:520, marginBottom:40, fontWeight:300 }}>
            Broadcast Media Institution is the Coast's only college with a fully licensed, student-operated FM station. Train in our professional studios. Graduate career-ready.
          </p>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
            <button className="btn-primary" onClick={() => onNav("admissions")} style={{ fontSize:14, padding:"15px 32px" }}>Apply for September 2026</button>
            <button className="btn-outline-white" onClick={() => onNav("programmes")} style={{ fontSize:14, padding:"15px 32px" }}>View Programmes</button>
          </div>
          <div style={{ display:"flex", gap:40, marginTop:52, paddingTop:40, borderTop:"1px solid rgba(255,255,255,0.08)", flexWrap:"wrap" }}>
            {STATS.map(s => (
              <div key={s.label}>
                <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                  <span className="display" style={{ fontSize:32, fontWeight:700, color:"#fff" }}>{s.value}</span>
                  {s.unit && <span style={{ color:T.gold, fontSize:20, fontWeight:700 }}>{s.unit}</span>}
                </div>
                <div style={{ color:"rgba(255,255,255,0.35)", fontSize:12, letterSpacing:"0.05em", marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div>
          <FMLiveWidget />
          <div style={{ marginTop:16, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)", padding:"20px 24px" }}>
            <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11, fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>Today's Schedule</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {SCHEDULE_ITEMS.slice(0,5).map((s,i) => {
                const h = parseInt(s.time.split(":")[0]);
                const isCurrent = h <= new Date().getHours() && h+2 > new Date().getHours();
                return (
                  <div key={i} style={{ display:"flex", gap:12, alignItems:"center", padding:"8px 0", borderBottom: i<4 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <span style={{ color:"rgba(255,255,255,0.3)", fontSize:12, minWidth:38, fontVariantNumeric:"tabular-nums" }}>{s.time}</span>
                    {s.live && <div style={{ width:6, height:6, borderRadius:"50%", background:T.green, flexShrink:0 }} />}
                    <span style={{ color: isCurrent ? "#fff" : "rgba(255,255,255,0.5)", fontSize:13, fontWeight: isCurrent ? 600 : 400, flex:1 }}>{s.show}</span>
                  </div>
                );
              })}
            </div>
            <button className="btn-outline-white" onClick={() => onNav("fm-live")} style={{ width:"100%", textAlign:"center", marginTop:16, fontSize:12, padding:"10px" }}>Full Schedule →</button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{ position:"absolute", bottom:32, left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
        <span style={{ color:"rgba(255,255,255,0.3)", fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase" }}>Scroll</span>
        <div style={{ width:1, height:40, background:"linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)" }} />
      </div>
    </section>
  );
}

/* ─────────────────── ABOUT ─────────────────── */
function AboutSection() {
  return (
    <section id="about" style={{ padding:"120px 5%", background:T.cream }}>
      <div style={{ maxWidth:1320, margin:"0 auto" }}>
        <div className="two-col" style={{ alignItems:"center" }}>
          <FadeIn>
            <div>
              <span className="section-eyebrow">About the Institution</span>
              <h2 className="section-title">East Africa's Premier<br/><span className="italic" style={{ color:T.gold }}>Broadcast Training</span><br/>College</h2>
              <div className="divider" />
              <p style={{ color:T.textMuted, fontSize:16, lineHeight:1.85, marginBottom:20 }}>
                Founded in 2001, Broadcast Media Institution is the only tertiary college on the Kenyan Coast that operates a fully licensed commercial FM station as a live teaching environment. Our students don't simulate broadcasting — they do it.
              </p>
              <p style={{ color:T.textMuted, fontSize:16, lineHeight:1.85, marginBottom:36 }}>
                Accredited by the Kenya National Qualifications Authority and registered with the Communications Authority of Kenya, we offer diploma programmes in Radio Broadcasting, Journalism, Video Production, Audio Engineering, and Digital Media. Our graduates work at Nation Media Group, KBC, Citizen TV, Universal Music, and every major media house in East Africa.
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                {[
                  ["🎓","KNQA Accredited","Kenya National Qualifications Authority"],
                  ["📡","CA Kenya Licensed","Communications Authority of Kenya"],
                  ["🏛","ISO 9001:2015","Quality Management Certified"],
                  ["🤝","HELB Listed","Higher Education Loans Board Partner"],
                ].map(([icon,title,sub]) => (
                  <div key={title} style={{ background:"#fff", padding:"20px 22px", border:`1px solid ${T.border}` }}>
                    <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>
                    <div style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:2 }}>{title}</div>
                    <div style={{ fontSize:12, color:T.textLight }}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div>
              <div className="img-placeholder" style={{ width:"100%", aspectRatio:"4/3", marginBottom:16, background:`linear-gradient(135deg, ${T.navyMid} 0%, ${T.navy} 100%)`, position:"relative", overflow:"hidden" }}>
                <span style={{ fontSize:72 }}>🎙</span>
                <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent, rgba(0,0,0,0.7))", padding:"32px 28px" }}>
                  <div style={{ color:"#fff", fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:600 }}>FM Broadcast Studio A</div>
                  <div style={{ color:"rgba(255,255,255,0.5)", fontSize:13, marginTop:4 }}>On air since 2001 · 98.4 MHz Coast</div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[["🏆","30+ Awards","Industry recognition"],["👩‍🏫","45 Faculty","Industry veterans"],["📍","Mombasa","Nyali Road Campus"],["📅","2026","25 Years Excellence"]].map(([icon,v,l]) => (
                  <div key={v} style={{ background:T.offWhite, padding:"16px 18px", display:"flex", gap:12, alignItems:"center" }}>
                    <span style={{ fontSize:20 }}>{icon}</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:15, color:T.navy }}>{v}</div>
                      <div style={{ fontSize:12, color:T.textLight }}>{l}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Team */}
        <FadeIn delay={0.1} style={{ marginTop:80 }}>
          <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:64 }}>
            <span className="section-eyebrow">Leadership & Faculty</span>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:24, marginTop:36 }}>
              {TEAM.map(m => (
                <div key={m.name} className="card-hover" style={{ background:"#fff", border:`1px solid ${T.border}`, padding:"24px 20px", textAlign:"center" }}>
                  <div style={{ width:64, height:64, borderRadius:"50%", background:T.navy, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:22, color:"#fff", fontFamily:"'Playfair Display',serif", fontWeight:700 }}>
                    {m.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                  </div>
                  <div style={{ fontWeight:600, fontSize:15, color:T.navy, marginBottom:4 }}>{m.name}</div>
                  <div style={{ fontSize:13, color:T.textMuted, marginBottom:4 }}>{m.role}</div>
                  <span className="tag tag-navy" style={{ fontSize:10 }}>{m.dept}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─────────────────── PROGRAMMES ─────────────────── */
function ProgrammesSection() {
  const [active, setActive] = useState(null);
  return (
    <section id="programmes" style={{ padding:"120px 5%", background:"#fff" }}>
      <div style={{ maxWidth:1320, margin:"0 auto" }}>
        <FadeIn>
          <div style={{ marginBottom:56 }}>
            <span className="section-eyebrow">Academic Programmes</span>
            <h2 className="section-title">Diplomas Built for<br/><span className="italic" style={{ color:T.gold }}>Real Industry</span></h2>
            <div className="divider" />
            <p style={{ color:T.textMuted, fontSize:16, maxWidth:520, lineHeight:1.75 }}>
              Every programme is co-designed with media industry employers. Students work in live production environments from week one.
            </p>
          </div>
        </FadeIn>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(340px,1fr))", gap:24 }}>
          {PROGRAMMES.map((p, i) => (
            <FadeIn key={p.code} delay={i*0.06}>
              <div
                className="card-hover"
                style={{ background:"#fff", border:`1px solid ${T.border}`, cursor:"pointer", transition:"all 0.25s", overflow:"hidden", borderTop: active===p.code ? `3px solid ${T.gold}` : `3px solid transparent` }}
                onClick={() => setActive(active===p.code ? null : p.code)}
              >
                <div style={{ padding:"28px 28px 0" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                    <div style={{ background:p.color, width:52, height:52, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>{p.icon}</div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <span className="tag tag-navy" style={{ fontSize:10 }}>{p.code}</span>
                      {p.badge && <span className="tag tag-gold" style={{ fontSize:10 }}>{p.badge}</span>}
                    </div>
                  </div>
                  <h3 className="display" style={{ fontSize:18, fontWeight:700, color:T.navy, lineHeight:1.3, marginBottom:10 }}>{p.title}</h3>
                  <p style={{ color:T.textMuted, fontSize:14, lineHeight:1.75, marginBottom:20 }}>{p.desc}</p>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", borderTop:`1px solid ${T.border}` }}>
                  {[["⏱",p.duration,"Duration"],["📅",p.intake,"Intake"],["💰",p.fee,"Tuition"]].slice(0,2).map(([icon,val,label]) => (
                    <div key={label} style={{ padding:"16px 20px", borderRight:`1px solid ${T.border}` }}>
                      <div style={{ fontSize:10, color:T.textLight, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>{label}</div>
                      <div style={{ fontSize:13, fontWeight:600, color:T.navy }}>{val}</div>
                    </div>
                  ))}
                </div>
                {active === p.code && (
                  <div className="slide-down" style={{ borderTop:`1px solid ${T.border}`, padding:"20px 28px", background:T.offWhite }}>
                    <div style={{ fontSize:12, fontWeight:600, color:T.textLight, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>Core Modules</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
                      {p.modules.map(m => (
                        <span key={m} style={{ background:"#fff", border:`1px solid ${T.border}`, padding:"5px 12px", fontSize:12, color:T.navy }}>{m}</span>
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginTop:4 }}>
                      <span style={{ fontSize:13, color:T.textMuted }}>💰 {p.fee}</span>
                    </div>
                    <button className="btn-navy" style={{ marginTop:16, padding:"10px 20px", fontSize:12, width:"100%", textAlign:"center" }}>
                      Request Prospectus →
                    </button>
                  </div>
                )}
                <div style={{ padding:"12px 20px", background: active===p.code ? T.gold : "transparent", textAlign:"center" }}>
                  <span style={{ fontSize:12, fontWeight:600, color: active===p.code ? T.navy : T.gold, letterSpacing:"0.06em" }}>
                    {active===p.code ? "▲ Close" : "▼ View Modules"}
                  </span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Call to action */}
        <FadeIn delay={0.1}>
          <div style={{ marginTop:64, background:T.navy, padding:"52px 48px", display:"grid", gridTemplateColumns:"1fr auto", gap:32, alignItems:"center" }}>
            <div>
              <div style={{ color:"rgba(255,255,255,0.5)", fontSize:12, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>Not sure which programme?</div>
              <div className="display" style={{ fontSize:24, fontWeight:700, color:"#fff" }}>Speak with our Academic Advisors</div>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:14, marginTop:8 }}>Book a free 30-minute session. We'll help you choose the right pathway for your career goals.</p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <button className="btn-primary" style={{ whiteSpace:"nowrap" }}>Book a Consultation</button>
              <button className="btn-outline-white" style={{ whiteSpace:"nowrap", fontSize:12 }}>Download Prospectus</button>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─────────────────── STUDIOS / FACILITIES ─────────────────── */
function StudiosSection() {
  const [active, setActive] = useState(0);
  return (
    <section id="studios" style={{ padding:"120px 5%", background:T.offWhite }}>
      <div style={{ maxWidth:1320, margin:"0 auto" }}>
        <FadeIn>
          <div style={{ marginBottom:56 }}>
            <span className="section-eyebrow">World-Class Facilities</span>
            <h2 className="section-title">Professional Studios &<br/><span className="italic" style={{ color:T.gold }}>Technical Labs</span></h2>
            <div className="divider" />
          </div>
        </FadeIn>
        <div className="two-col" style={{ alignItems:"start" }}>
          <div>
            {FACILITIES.map((f, i) => (
              <FadeIn key={f.name} delay={i*0.05}>
                <div
                  onClick={() => setActive(i)}
                  style={{ background: active===i ? T.navy : "#fff", border:`1px solid ${active===i ? "transparent" : T.border}`, padding:"20px 24px", marginBottom:8, cursor:"pointer", transition:"all 0.2s", display:"flex", gap:20, alignItems:"center" }}
                >
                  <div style={{ width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0, background: active===i ? "rgba(255,255,255,0.08)" : T.offWhite }}>{f.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:15, color: active===i ? "#fff" : T.navy, marginBottom:4 }}>{f.name}</div>
                    <div style={{ fontSize:12, color: active===i ? "rgba(255,255,255,0.5)" : T.textLight }}>{f.area}</div>
                  </div>
                  {active===i && <span style={{ color:T.gold, fontSize:18 }}>→</span>}
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.1}>
            <div style={{ position:"sticky", top:100 }}>
              <div className="img-placeholder" style={{ width:"100%", aspectRatio:"16/10", background:`linear-gradient(135deg, ${T.navyMid}, ${T.navy})`, position:"relative" }}>
                <span style={{ fontSize:80 }}>{FACILITIES[active].icon}</span>
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)" }} />
                <div style={{ position:"absolute", bottom:24, left:28, right:28 }}>
                  <div style={{ color:"rgba(255,255,255,0.5)", fontSize:10, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:6 }}>{FACILITIES[active].area}</div>
                  <div className="display" style={{ color:"#fff", fontSize:24, fontWeight:700 }}>{FACILITIES[active].name}</div>
                </div>
              </div>
              <div style={{ background:"#fff", border:`1px solid ${T.border}`, borderTop:"none", padding:"28px 32px" }}>
                <p style={{ color:T.textMuted, fontSize:15, lineHeight:1.8, marginBottom:24 }}>{FACILITIES[active].desc}</p>
                <div style={{ display:"flex", gap:12 }}>
                  <button className="btn-navy" style={{ fontSize:12, padding:"10px 20px" }}>Schedule a Tour</button>
                  <button className="btn-outline" style={{ fontSize:12, padding:"10px 20px" }}>View Gallery</button>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Open day CTA */}
        <FadeIn delay={0.1}>
          <div style={{ marginTop:64, background:T.gold, padding:"40px 48px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:24 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, letterSpacing:"0.15em", color:T.navy, textTransform:"uppercase", marginBottom:6 }}>Open Day — Saturday 14 June 2026</div>
              <div className="display" style={{ fontSize:26, fontWeight:700, color:T.navy }}>Tour Every Studio. Meet the Faculty. Watch a Live Broadcast.</div>
            </div>
            <button className="btn-navy" style={{ whiteSpace:"nowrap", padding:"15px 32px" }}>Register Free →</button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─────────────────── NEWS ─────────────────── */
function NewsSection() {
  const [filter, setFilter] = useState("All");
  const cats = ["All", ...Array.from(new Set(NEWS_ITEMS.map(n => n.cat)))];
  const filtered = filter==="All" ? NEWS_ITEMS : NEWS_ITEMS.filter(n => n.cat===filter);
  const featured = filtered.find(n => n.featured) || filtered[0];
  const rest = filtered.filter(n => n.id !== (featured?.id));

  return (
    <section id="news" style={{ padding:"120px 5%", background:"#fff" }}>
      <div style={{ maxWidth:1320, margin:"0 auto" }}>
        <FadeIn>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:40, flexWrap:"wrap", gap:16 }}>
            <div>
              <span className="section-eyebrow">Latest News</span>
              <h2 className="section-title" style={{ marginBottom:0 }}>From the Campus<br/><span className="italic" style={{ color:T.gold }}>&amp; the Airwaves</span></h2>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {cats.map(c => (
                <button key={c} onClick={() => setFilter(c)} style={{ background: filter===c ? T.navy : "transparent", color: filter===c ? "#fff" : T.navy, border:`1.5px solid ${filter===c ? T.navy : T.border}`, padding:"7px 16px", fontSize:12, fontWeight:600, cursor:"pointer", letterSpacing:"0.04em", textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s" }}>{c}</button>
              ))}
            </div>
          </div>
        </FadeIn>

        {featured && (
          <FadeIn>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0, background:T.navy, marginBottom:24, overflow:"hidden" }}>
              <div className="img-placeholder" style={{ aspectRatio:"4/3", background:`linear-gradient(135deg, ${T.navyMid}, ${T.navy})`, borderRight:`1px solid rgba(255,255,255,0.05)` }}>
                <span style={{ fontSize:64 }}>📰</span>
              </div>
              <div style={{ padding:"40px 44px", display:"flex", flexDirection:"column", justifyContent:"center" }}>
                <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16 }}>
                  <span className="tag" style={{ background:"rgba(201,151,58,0.15)", color:T.gold }}>{featured.cat}</span>
                  <span style={{ color:"rgba(255,255,255,0.3)", fontSize:12 }}>{featured.date}</span>
                  <span style={{ color:"rgba(255,255,255,0.3)", fontSize:12 }}>· {featured.readTime} read</span>
                </div>
                <h3 className="display" style={{ fontSize:"clamp(18px,2vw,26px)", fontWeight:700, color:"#fff", lineHeight:1.35, marginBottom:16 }}>{featured.title}</h3>
                <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14, lineHeight:1.8, marginBottom:28 }}>{featured.excerpt}</p>
                <button className="btn-primary" style={{ alignSelf:"flex-start", fontSize:12, padding:"10px 22px" }}>Read Full Story →</button>
              </div>
            </div>
          </FadeIn>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:20 }}>
          {rest.map((n, i) => (
            <FadeIn key={n.id} delay={i*0.07}>
              <div className="card-hover" style={{ background:"#fff", border:`1px solid ${T.border}`, overflow:"hidden", cursor:"pointer" }}>
                <div className="img-placeholder" style={{ height:160, background:T.offWhite, fontSize:36 }}>
                  {n.cat==="FM Station"?"📡":n.cat==="Admissions"?"📋":n.cat==="Industry"?"🤝":n.cat==="Events"?"📅":"📊"}
                </div>
                <div style={{ padding:"20px 22px" }}>
                  <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                    <span className="tag tag-navy" style={{ fontSize:10 }}>{n.cat}</span>
                    <span style={{ color:T.textLight, fontSize:11 }}>{n.date}</span>
                  </div>
                  <h4 style={{ fontWeight:600, fontSize:15, color:T.navy, lineHeight:1.4, marginBottom:8 }}>{n.title}</h4>
                  <p style={{ color:T.textMuted, fontSize:13, lineHeight:1.7, marginBottom:16 }}>{n.excerpt.slice(0,110)}…</p>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:`1px solid ${T.border}`, paddingTop:12 }}>
                    <span style={{ color:T.textLight, fontSize:11 }}>{n.readTime} read</span>
                    <span style={{ color:T.gold, fontSize:12, fontWeight:600 }}>Read More →</span>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn>
          <div style={{ textAlign:"center", marginTop:48 }}>
            <button className="btn-outline" style={{ padding:"13px 40px" }}>View All News →</button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─────────────────── FM LIVE PAGE ─────────────────── */
function FMLiveSection() {
  const [day, setDay] = useState(new Date().getDay());
  const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const TYPE_COLORS = { live:"#E8F8EE", music:"#EEF2FF", news:"#FFF8E1" };
  const TYPE_TEXT = { live:"#1A7A40", music:"#3B3B9A", news:"#8B6A00" };

  return (
    <section id="fm-live" style={{ padding:"120px 5%", background:T.navy }}>
      <div style={{ maxWidth:1320, margin:"0 auto" }}>
        <FadeIn>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:48, flexWrap:"wrap", gap:16 }}>
            <div>
              <span className="section-eyebrow">98.4 FM Coast</span>
              <h2 className="section-title-white">Live Broadcasting<br/><span className="italic" style={{ color:T.gold }}>& Programme Schedule</span></h2>
            </div>
            <FMLiveWidget compact />
          </div>
        </FadeIn>

        <div className="two-col" style={{ alignItems:"start" }}>
          <FadeIn>
            <div>
              <FMLiveWidget />
              <div style={{ marginTop:20, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)", padding:"24px" }}>
                <div style={{ color:"rgba(255,255,255,0.5)", fontSize:11, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:16 }}>About Our FM Station</div>
                <p style={{ color:"rgba(255,255,255,0.6)", fontSize:14, lineHeight:1.8, marginBottom:16 }}>
                  98.4 FM Coast is a licensed Category B FM station operated by students of the Broadcast Media Institution under supervision of professional faculty broadcasters. We broadcast 06:00–midnight daily, 365 days a year.
                </p>
                {[["Frequency","98.4 MHz"],["Coverage","120 km radius — Coast Region"],["Daily listeners","3,800+ (Ipsos Kenya audit)"],["Broadcast hours","18 hours per day"],["CA Licence","BC/FM/KE-2001-0048"],["Format","Top 40, News, Talk, Student Productions"]].map(([k,v]) => (
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ color:"rgba(255,255,255,0.4)", fontSize:13 }}>{k}</span>
                    <span style={{ color:"rgba(255,255,255,0.8)", fontSize:13, fontWeight:500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:20 }}>
                {DAYS.map((d, i) => (
                  <button key={d} onClick={() => setDay(i)} style={{ background: day===i ? T.gold : "rgba(255,255,255,0.06)", color: day===i ? T.navy : "rgba(255,255,255,0.5)", border: day===i ? "none" : "1px solid rgba(255,255,255,0.08)", padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.04em", transition:"all 0.15s" }}>
                    {d.slice(0,3).toUpperCase()}
                  </button>
                ))}
              </div>
              <div style={{ border:"1px solid rgba(255,255,255,0.08)" }}>
                {SCHEDULE_ITEMS.map((s, i) => {
                  const h = parseInt(s.time.split(":")[0]);
                  const isNow = h <= new Date().getHours() && h+2 > new Date().getHours() && day===new Date().getDay();
                  return (
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"60px 1fr auto", gap:16, padding:"16px 20px", background: isNow ? "rgba(201,151,58,0.1)" : "transparent", borderBottom: i<SCHEDULE_ITEMS.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none", alignItems:"center" }}>
                      <span style={{ color:"rgba(255,255,255,0.4)", fontSize:13, fontVariantNumeric:"tabular-nums" }}>{s.time}</span>
                      <div>
                        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:3 }}>
                          {isNow && <div style={{ width:6, height:6, borderRadius:"50%", background:T.green }} />}
                          <span style={{ color: isNow ? "#fff" : "rgba(255,255,255,0.75)", fontSize:14, fontWeight: isNow ? 600 : 400 }}>{s.show}</span>
                        </div>
                        <span style={{ color:"rgba(255,255,255,0.35)", fontSize:12 }}>{s.presenter}</span>
                      </div>
                      <span style={{ fontSize:11, fontWeight:600, padding:"3px 8px", background: isNow ? "rgba(29,185,84,0.15)" : s.type==="news" ? "rgba(255,200,50,0.1)" : "rgba(255,255,255,0.06)", color: isNow ? T.green : s.type==="news" ? "#FFCC00" : "rgba(255,255,255,0.3)", letterSpacing:"0.08em", textTransform:"uppercase" }}>
                        {isNow ? "LIVE" : s.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Presenter recruitment */}
        <FadeIn delay={0.1}>
          <div style={{ marginTop:60, background:"rgba(201,151,58,0.08)", border:"1px solid rgba(201,151,58,0.2)", padding:"40px 48px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:24 }}>
            <div>
              <div style={{ color:T.gold, fontSize:11, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:8 }}>Student Opportunities</div>
              <div className="display" style={{ color:"#fff", fontSize:22, fontWeight:700 }}>Join the On-Air Team</div>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:14, marginTop:8 }}>Current students can apply for presenting slots, news reading, and production roles. Applications reviewed termly.</p>
            </div>
            <button className="btn-primary" style={{ whiteSpace:"nowrap" }}>Apply to Present</button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─────────────────── ADMISSIONS ─────────────────── */
function AdmissionsSection() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name:"", email:"", phone:"", programme:"", intake:"", kcse:"", message:"" });
  const [submitted, setSubmitted] = useState(false);
  const upd = (k,v) => setForm(f => ({...f,[k]:v}));

  const STEPS = [
    { n:1, title:"Choose Your Programme", icon:"📚" },
    { n:2, title:"Check Requirements", icon:"✅" },
    { n:3, title:"Submit Application", icon:"📝" },
    { n:4, title:"Interview & Offer", icon:"🎓" },
    { n:5, title:"Enrolment", icon:"🏆" },
  ];

  return (
    <section id="admissions" style={{ padding:"120px 5%", background:T.offWhite }}>
      <div style={{ maxWidth:1320, margin:"0 auto" }}>
        <FadeIn>
          <div style={{ marginBottom:60 }}>
            <span className="section-eyebrow">Admissions 2026</span>
            <h2 className="section-title">Join Us.<br/><span className="italic" style={{ color:T.gold }}>Become a Broadcaster.</span></h2>
            <div className="divider" />
          </div>
        </FadeIn>

        {/* Process steps */}
        <FadeIn>
          <div style={{ display:"flex", gap:0, marginBottom:64, overflowX:"auto", paddingBottom:8 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} onClick={() => setStep(s.n)} style={{ flex:1, minWidth:160, cursor:"pointer" }}>
                <div style={{ height:4, background: s.n<=step ? T.gold : T.border, transition:"background 0.3s" }} />
                <div style={{ padding:"16px 20px", background: s.n===step ? "#fff" : "transparent", border: s.n===step ? `1px solid ${T.border}` : "1px solid transparent", transition:"all 0.2s" }}>
                  <div style={{ fontSize:22, marginBottom:8 }}>{s.icon}</div>
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color: s.n<=step ? T.navy : T.textLight, marginBottom:4 }}>Step {s.n}</div>
                  <div style={{ fontSize:13, fontWeight:600, color: s.n<=step ? T.navy : T.textLight, lineHeight:1.3 }}>{s.title}</div>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>

        <div className="two-col" style={{ alignItems:"start" }}>
          <FadeIn>
            <div>
              {/* Entry requirements */}
              <div style={{ background:"#fff", border:`1px solid ${T.border}`, padding:"36px 36px", marginBottom:24 }}>
                <div className="display" style={{ fontSize:20, fontWeight:700, color:T.navy, marginBottom:20 }}>Entry Requirements</div>
                {[
                  ["Minimum Academic Entry","KCSE Grade C- (minus) or equivalent qualification","✅"],
                  ["Age Requirement","Applicants must be 17 years or older at time of enrolment","✅"],
                  ["Documents Required","Original KCSE Certificate, National ID/Passport, 2 passport photos, birth certificate","📋"],
                  ["Application Fee","KES 1,000 (non-refundable) — waived for early applicants before 31 July","💳"],
                  ["HELB Loans","Eligible for Higher Education Loans Board bursaries and scholarships","🎓"],
                  ["Medical Requirements","Medical certificate confirming fitness for studio environments","🏥"],
                ].map(([label, val, icon]) => (
                  <div key={label} style={{ display:"flex", gap:16, padding:"16px 0", borderBottom:`1px solid ${T.border}`, alignItems:"flex-start" }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>{icon}</span>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13, color:T.navy, marginBottom:4 }}>{label}</div>
                      <div style={{ fontSize:13, color:T.textMuted, lineHeight:1.65 }}>{val}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fees */}
              <div style={{ background:T.navy, padding:"28px 36px" }}>
                <div className="display" style={{ fontSize:18, fontWeight:700, color:"#fff", marginBottom:20 }}>Tuition Fees 2026</div>
                {PROGRAMMES.slice(0,4).map(p => (
                  <div key={p.code} style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ color:"rgba(255,255,255,0.5)", fontSize:13 }}>{p.title.replace("Diploma in ","")}</span>
                    <span style={{ color:T.gold, fontSize:13, fontWeight:600 }}>{p.fee}</span>
                  </div>
                ))}
                <p style={{ color:"rgba(255,255,255,0.3)", fontSize:12, marginTop:16, lineHeight:1.7 }}>
                  Fees inclusive of studio time, equipment access, and industry visits. Payment in two or three instalments available. HELB bursary deductions processed directly.
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div style={{ background:"#fff", border:`1px solid ${T.border}`, padding:"36px 36px" }}>
              {submitted ? (
                <div className="fade-in-anim" style={{ textAlign:"center", padding:"32px 0" }}>
                  <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
                  <div className="display" style={{ fontSize:24, fontWeight:700, color:T.navy, marginBottom:12 }}>Application Received!</div>
                  <p style={{ color:T.textMuted, fontSize:14, lineHeight:1.75, marginBottom:24 }}>
                    Thank you, {form.name}. We've received your application for {form.programme}. Our admissions team will contact you at {form.email} within 3 working days.
                  </p>
                  <div style={{ background:T.offWhite, padding:"20px 24px", textAlign:"left", marginBottom:24 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:T.navy, marginBottom:12 }}>Reference: BMI/2026/{Math.floor(Math.random()*9000+1000)}</div>
                    <div style={{ color:T.textMuted, fontSize:13 }}>Keep this reference for your records. Next step: We will call you for a brief 15-minute admissions interview.</div>
                  </div>
                  <button className="btn-outline" onClick={() => { setSubmitted(false); setForm({ name:"",email:"",phone:"",programme:"",intake:"",kcse:"",message:"" }); }}>Submit Another Application</button>
                </div>
              ) : (
                <>
                  <div className="display" style={{ fontSize:20, fontWeight:700, color:T.navy, marginBottom:6 }}>Apply Online</div>
                  <p style={{ color:T.textMuted, fontSize:13, marginBottom:28 }}>Takes under 5 minutes. Applications for September 2026 are open.</p>
                  {[
                    ["Full Name *","name","text","e.g. Amina Hassan"],
                    ["Email Address *","email","email","your@email.com"],
                    ["Phone Number *","phone","tel","+254 700 000 000"],
                  ].map(([label, key, type, ph]) => (
                    <div key={key} style={{ marginBottom:16 }}>
                      <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:T.textLight, marginBottom:6 }}>{label}</label>
                      <input className="input-field" type={type} placeholder={ph} value={form[key]} onChange={e => upd(key, e.target.value)} />
                    </div>
                  ))}
                  <div style={{ marginBottom:16 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:T.textLight, marginBottom:6 }}>Programme of Interest *</label>
                    <select className="input-field" style={{ appearance:"none", cursor:"pointer" }} value={form.programme} onChange={e => upd("programme", e.target.value)}>
                      <option value="">Select a programme…</option>
                      {PROGRAMMES.map(p => <option key={p.code} value={p.title}>{p.title}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:T.textLight, marginBottom:6 }}>Preferred Intake</label>
                    <select className="input-field" style={{ appearance:"none", cursor:"pointer" }} value={form.intake} onChange={e => upd("intake", e.target.value)}>
                      <option value="">Select intake…</option>
                      <option>September 2026</option>
                      <option>January 2027</option>
                    </select>
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:T.textLight, marginBottom:6 }}>KCSE Grade or Highest Qualification</label>
                    <input className="input-field" type="text" placeholder="e.g. C+ or Diploma in Communication" value={form.kcse} onChange={e => upd("kcse", e.target.value)} />
                  </div>
                  <div style={{ marginBottom:24 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:T.textLight, marginBottom:6 }}>Why do you want to study here? (Optional)</label>
                    <textarea className="input-field" rows={3} placeholder="Tell us about your media interests…" style={{ resize:"vertical" }} value={form.message} onChange={e => upd("message", e.target.value)} />
                  </div>
                  <button
                    className="btn-primary"
                    style={{ width:"100%", textAlign:"center", padding:"15px", fontSize:14 }}
                    onClick={() => { if (form.name && form.email && form.phone && form.programme) setSubmitted(true); }}
                  >
                    Submit Application →
                  </button>
                  <p style={{ color:T.textLight, fontSize:11, textAlign:"center", marginTop:12, lineHeight:1.7 }}>
                    By submitting you agree to our Privacy Policy. We will contact you within 3 working days.
                  </p>
                </>
              )}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── ALUMNI ─────────────────── */
function AlumniSection() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a+1) % ALUMNI.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="alumni" style={{ padding:"120px 5%", background:T.navy }}>
      <div style={{ maxWidth:1320, margin:"0 auto" }}>
        <FadeIn>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:56, flexWrap:"wrap", gap:16 }}>
            <div>
              <span className="section-eyebrow">Alumni Stories</span>
              <h2 className="section-title-white">1,400+ Graduates.<br/><span className="italic" style={{ color:T.gold }}>Across Every Media House.</span></h2>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              {ALUMNI.map((_,i) => (
                <div key={i} onClick={() => setActive(i)} style={{ width: active===i ? 32 : 8, height:8, background: active===i ? T.gold : "rgba(255,255,255,0.2)", cursor:"pointer", transition:"all 0.3s", borderRadius:4 }} />
              ))}
            </div>
          </div>
        </FadeIn>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
          {/* Featured testimonial */}
          <FadeIn>
            <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", padding:"44px 48px", gridRow:"span 1" }}>
              <div style={{ fontSize:48, color:T.gold, fontFamily:"'Playfair Display',serif", lineHeight:1, marginBottom:24, opacity:0.4 }}>"</div>
              <blockquote className="display" style={{ fontSize:"clamp(17px,1.8vw,22px)", fontWeight:400, fontStyle:"italic", color:"rgba(255,255,255,0.85)", lineHeight:1.7, marginBottom:32 }}>
                {ALUMNI[active].quote}
              </blockquote>
              <div style={{ display:"flex", gap:16, alignItems:"center", borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:24 }}>
                <div style={{ width:52, height:52, borderRadius:"50%", background:T.gold, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontFamily:"'Playfair Display',serif", fontWeight:700, color:T.navy, flexShrink:0 }}>
                  {ALUMNI[active].name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                </div>
                <div>
                  <div style={{ color:"#fff", fontWeight:600, fontSize:15 }}>{ALUMNI[active].name}</div>
                  <div style={{ color:"rgba(255,255,255,0.4)", fontSize:13 }}>{ALUMNI[active].role}</div>
                  <div style={{ color:T.gold, fontSize:11, marginTop:3 }}>Class of {ALUMNI[active].year} · {ALUMNI[active].programme}</div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Other alumni */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {ALUMNI.filter((_,i) => i!==active).slice(0,3).map((a, i) => (
              <FadeIn key={a.name} delay={i*0.07}>
                <div onClick={() => setActive(ALUMNI.indexOf(a))} className="card-hover" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", padding:"20px 24px", cursor:"pointer", display:"flex", gap:16, alignItems:"center" }}>
                  <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontFamily:"'Playfair Display',serif", fontWeight:700, color:"rgba(255,255,255,0.6)", flexShrink:0 }}>
                    {a.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ color:"rgba(255,255,255,0.8)", fontWeight:600, fontSize:14 }}>{a.name}</div>
                    <div style={{ color:"rgba(255,255,255,0.35)", fontSize:12 }}>{a.role}</div>
                  </div>
                  <span style={{ color:T.gold, fontSize:11, flexShrink:0 }}>Class of {a.year}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>

        {/* Employers */}
        <FadeIn delay={0.1}>
          <div style={{ marginTop:64, borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:48 }}>
            <div style={{ color:"rgba(255,255,255,0.3)", fontSize:11, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", textAlign:"center", marginBottom:28 }}>Our Graduates Work At</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:16, justifyContent:"center" }}>
              {["Nation Media Group","KBC","Citizen TV","Universal Music EA","NTV Kenya","Radio Africa Group","BBC Africa","AFP","Kenya Airways Media","Standard Group"].map(e => (
                <div key={e} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.06)", padding:"10px 20px", fontSize:13, color:"rgba(255,255,255,0.5)" }}>{e}</div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─────────────────── CONTACT ─────────────────── */
function ContactSection() {
  const [sent, setSent] = useState(false);
  return (
    <section id="contact" style={{ padding:"120px 5%", background:"#fff" }}>
      <div style={{ maxWidth:1320, margin:"0 auto" }}>
        <FadeIn>
          <div style={{ marginBottom:60 }}>
            <span className="section-eyebrow">Get in Touch</span>
            <h2 className="section-title">We're Here.<br/><span className="italic" style={{ color:T.gold }}>Let's Talk.</span></h2>
            <div className="divider" />
          </div>
        </FadeIn>
        <div className="two-col" style={{ alignItems:"start" }}>
          <FadeIn>
            <div>
              <div style={{ display:"flex", flexDirection:"column", gap:20, marginBottom:40 }}>
                {[
                  { icon:"📍", label:"Address", val:"Broadcast House, Nyali Road, Mombasa, Kenya", sub:"P.O. Box 12345-80100, Mombasa" },
                  { icon:"📞", label:"Phone", val:"+254 41 000 0000", sub:"Mon–Fri 08:00–17:00" },
                  { icon:"✉", label:"Email", val:"admissions@broadcastmedia.ac.ke", sub:"Also: info@broadcastmedia.ac.ke" },
                  { icon:"📻", label:"FM Station", val:"98.4 FM Coast", sub:"On air 06:00–midnight daily" },
                  { icon:"🌐", label:"Website", val:"www.broadcastmedia.ac.ke", sub:"Student portal: my.broadcastmedia.ac.ke" },
                ].map(item => (
                  <div key={item.label} style={{ display:"flex", gap:20, alignItems:"flex-start", padding:"20px 24px", background:T.offWhite }}>
                    <div style={{ width:44, height:44, background:T.navy, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize:10, color:T.textLight, letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:700, marginBottom:4 }}>{item.label}</div>
                      <div style={{ fontSize:15, color:T.navy, fontWeight:600, marginBottom:2 }}>{item.val}</div>
                      <div style={{ fontSize:12, color:T.textLight }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Map placeholder */}
              <div style={{ background:T.navy, height:220, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`, backgroundSize:"30px 30px" }} />
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📍</div>
                  <div style={{ color:"rgba(255,255,255,0.5)", fontSize:14 }}>Nyali Road, Mombasa</div>
                  <button className="btn-outline-white" style={{ marginTop:16, fontSize:11, padding:"8px 20px" }}>Open in Google Maps</button>
                </div>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.15}>
            {sent ? (
              <div style={{ background:"#fff", border:`1px solid ${T.border}`, padding:"48px 40px", textAlign:"center" }} className="fade-in-anim">
                <div style={{ fontSize:48, marginBottom:16 }}>✉</div>
                <div className="display" style={{ fontSize:22, fontWeight:700, color:T.navy, marginBottom:12 }}>Message Sent!</div>
                <p style={{ color:T.textMuted, fontSize:14, lineHeight:1.75, marginBottom:24 }}>We'll respond within 1 working day. For urgent enquiries call +254 41 000 0000.</p>
                <button className="btn-outline" onClick={() => setSent(false)}>Send Another</button>
              </div>
            ) : (
              <div style={{ background:"#fff", border:`1px solid ${T.border}`, padding:"40px 40px" }}>
                <div className="display" style={{ fontSize:20, fontWeight:700, color:T.navy, marginBottom:24 }}>Send Us a Message</div>
                {[["Full Name","text","e.g. Amina Hassan"],["Email Address","email","your@email.com"],["Phone Number","tel","+254 700 000 000"]].map(([label, type, ph]) => (
                  <div key={label} style={{ marginBottom:16 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:T.textLight, marginBottom:6 }}>{label}</label>
                    <input className="input-field" type={type} placeholder={ph} />
                  </div>
                ))}
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:T.textLight, marginBottom:6 }}>Enquiry Type</label>
                  <select className="input-field" style={{ appearance:"none", cursor:"pointer" }}>
                    <option>Admissions Enquiry</option>
                    <option>Programme Information</option>
                    <option>Facilities & Studio Tours</option>
                    <option>Partnerships & Industry</option>
                    <option>Media & Press</option>
                    <option>Alumni Affairs</option>
                    <option>Complaint or Feedback</option>
                    <option>Other</option>
                  </select>
                </div>
                <div style={{ marginBottom:24 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:T.textLight, marginBottom:6 }}>Message</label>
                  <textarea className="input-field" rows={5} placeholder="How can we help you?" style={{ resize:"vertical" }} />
                </div>
                <button className="btn-primary" style={{ width:"100%", textAlign:"center", fontSize:14, padding:"15px" }} onClick={() => setSent(true)}>
                  Send Message →
                </button>
                <div style={{ display:"flex", gap:24, marginTop:24, paddingTop:20, borderTop:`1px solid ${T.border}` }}>
                  <div style={{ flex:1, textAlign:"center" }}>
                    <div style={{ fontSize:11, color:T.textLight, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>Response Time</div>
                    <div style={{ fontWeight:700, fontSize:15, color:T.navy }}>Within 24 hrs</div>
                  </div>
                  <div style={{ width:1, background:T.border }} />
                  <div style={{ flex:1, textAlign:"center" }}>
                    <div style={{ fontSize:11, color:T.textLight, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>Office Hours</div>
                    <div style={{ fontWeight:700, fontSize:15, color:T.navy }}>Mon–Fri 8–5pm</div>
                  </div>
                </div>
              </div>
            )}
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── FOOTER ─────────────────── */
function Footer({ onNav }) {
  return (
    <footer style={{ background:T.navy, padding:"72px 5% 32px" }}>
      <div style={{ maxWidth:1320, margin:"0 auto" }}>
        {/* Top CTA strip */}
        <div style={{ background:T.gold, padding:"28px 40px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16, marginBottom:56 }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:T.navy }}>September 2026 Applications Are Open</div>
            <div style={{ color:"rgba(10,22,40,0.6)", fontSize:14, marginTop:4 }}>Early applicants receive a registration fee waiver. Apply before 31 July.</div>
          </div>
          <button className="btn-navy" onClick={() => onNav("admissions")} style={{ whiteSpace:"nowrap" }}>Apply Now →</button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:48, marginBottom:48 }}>
          <div>
            <div className="display" style={{ fontSize:20, fontWeight:700, color:"#fff", marginBottom:4 }}>Broadcast Media Institution</div>
            <div style={{ fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:20 }}>Mombasa, Kenya · Est. 2001</div>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:13, lineHeight:1.8, maxWidth:280 }}>
              Training the next generation of East African media professionals through world-class facilities, real broadcasting, and industry-immersive education.
            </p>
            <div style={{ marginTop:24 }}>
              <div style={{ fontSize:11, color:T.gold, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>Tune In</div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:14 }}>
                  {[0.5,1,0.7,0.9,0.4].map((h,i) => (
                    <div key={i} className="audio-bar" style={{ height:`${h*14}px`, animationDuration:`${0.5+i*0.15}s` }} />
                  ))}
                </div>
                <span style={{ color:"rgba(255,255,255,0.5)", fontSize:13 }}>98.4 FM · Live Now</span>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              {["f","𝕏","in","▶"].map((s, i) => (
                <div key={i} style={{ width:34, height:34, background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:13, color:"rgba(255,255,255,0.5)", transition:"background 0.2s" }}
                  onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                  onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}>
                  {s}
                </div>
              ))}
            </div>
          </div>
          {[
            { title:"Programmes", links:["Diploma in Radio Broadcasting","Diploma in Journalism","Diploma in Video Production","Diploma in Audio Engineering","Diploma in Digital Media","Short Courses & CPD"] },
            { title:"Institution", links:["About Us","Leadership & Faculty","Facilities & Studios","Accreditation","News & Events","Alumni Network"] },
            { title:"Admissions", links:["How to Apply","Entry Requirements","Tuition Fees","HELB Loans & Bursaries","Campus Tours","Contact Admissions"] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ color:"rgba(255,255,255,0.8)", fontSize:12, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:18 }}>{col.title}</div>
              {col.links.map(l => (
                <div key={l} style={{ marginBottom:10 }}>
                  <a href="#" style={{ color:"rgba(255,255,255,0.35)", fontSize:13, textDecoration:"none", transition:"color 0.15s", lineHeight:1.6 }}
                    onMouseOver={e => e.target.style.color = "rgba(255,255,255,0.7)"}
                    onMouseOut={e => e.target.style.color = "rgba(255,255,255,0.35)"}>
                    {l}
                  </a>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr auto", borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:24, gap:24, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ color:"rgba(255,255,255,0.2)", fontSize:12 }}>
            © 2026 Broadcast Media Institution. Registered under the Kenyan Universities Act. Accredited by KNQA. CA Licence No. BC/FM/KE-2001-0048.
          </div>
          <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
            {["Privacy Policy","Terms of Use","Accreditation","Cookie Policy","Accessibility"].map(l => (
              <a key={l} href="#" style={{ color:"rgba(255,255,255,0.2)", fontSize:12, textDecoration:"none" }}
                onMouseOver={e => e.target.style.color = "rgba(255,255,255,0.4)"}
                onMouseOut={e => e.target.style.color = "rgba(255,255,255,0.2)"}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────── BACK TO TOP / FLOATING FM ─────────────────── */
function FloatingElements({ onNav }) {
  const [show, setShow] = useState(false);
  const [showFM, setShowFM] = useState(false);
  useEffect(() => {
    const h = () => { setShow(window.scrollY > 600); };
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <>
      {show && (
        <button onClick={() => window.scrollTo({top:0,behavior:"smooth"})} style={{ position:"fixed", bottom:96, right:24, width:44, height:44, background:T.navy, color:"#fff", border:"none", fontSize:18, cursor:"pointer", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 20px rgba(0,0,0,0.3)" }}>↑</button>
      )}
      {/* Floating FM badge */}
      <div style={{ position:"fixed", bottom:24, right:show ? 76 : 24, zIndex:100, transition:"right 0.3s" }}>
        <div onClick={() => setShowFM(s => !s)} style={{ background:T.green, padding:"8px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:8, boxShadow:"0 4px 20px rgba(0,0,0,0.3)" }}>
          <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:12 }}>
            {[0.5,1,0.6].map((h,i) => (
              <div key={i} className="audio-bar" style={{ height:`${h*12}px`, animationDuration:`${0.5+i*0.2}s` }} />
            ))}
          </div>
          <span style={{ color:"#fff", fontSize:11, fontWeight:700, letterSpacing:"0.1em" }}>98.4 LIVE</span>
        </div>
        {showFM && (
          <div className="slide-down" style={{ position:"absolute", bottom:"100%", right:0, width:280, marginBottom:8 }}>
            <FMLiveWidget />
          </div>
        )}
      </div>
    </>
  );
}

/* ─────────────────── NAVBAR ─────────────────── */
function Navbar({ onNav, currentSection, navigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
		<>
			<nav
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					right: 0,
					zIndex: 150,
					background: scrolled ? "rgba(10,22,40,0.97)" : "rgba(10,22,40,0.85)",
					backdropFilter: "blur(12px)",
					borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
					transition: "all 0.3s",
					height: 72,
					display: "flex",
					alignItems: "center",
					padding: "0 5%",
				}}>
				<div
					style={{
						maxWidth: 1320,
						width: "100%",
						margin: "0 auto",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}>
					<div onClick={() => onNav("home")} style={{ cursor: "pointer" }}>
						<div
							className="display"
							style={{
								fontSize: 18,
								fontWeight: 700,
								color: "#fff",
								lineHeight: 1.1,
							}}>
							Broadcast Media
						</div>
						<div
							style={{
								fontSize: 9,
								letterSpacing: "0.22em",
								textTransform: "uppercase",
								color: T.gold,
							}}>
							Institution · Mombasa
						</div>
					</div>
					<div style={{ display: "flex", gap: 28, alignItems: "center" }}>
						{NAV_SECTIONS.filter((n) => n !== "Home").map((n) => (
							<a
								key={n}
								className={`nav-link${currentSection === n.toLowerCase().replace(" ", "-") ? " active" : ""}`}
								onClick={() => {
									onNav(n.toLowerCase().replace(" ", "-"));
									setMobileOpen(false);
								}}
								style={{ fontSize: 12 }}>
								{n}
							</a>
						))}
					</div>
					<div style={{ display: "flex", gap: 10, alignItems: "center" }}>
						<a
							onClick={() => navigate("/login")}
							style={{
								color: "rgba(255,255,255,0.5)",
								fontSize: 12,
								textDecoration: "none",
								padding: "8px 14px",
								border: "1px solid rgba(255,255,255,0.1)",
							}}>
							Login
						</a>
						<button
							className="btn-primary"
							onClick={() => navigate("/login")}
							style={{ padding: "9px 18px", fontSize: 12 }}>
							Apply Now
						</button>
					</div>
				</div>
			</nav>
			{mobileOpen && (
				<div className="mobile-menu">
					<div
						onClick={() => setMobileOpen(false)}
						style={{
							position: "absolute",
							top: 20,
							right: 20,
							color: "rgba(255,255,255,0.5)",
							fontSize: 24,
							cursor: "pointer",
						}}>
						✕
					</div>
					{NAV_SECTIONS.map((n) => (
						<a
							key={n}
							onClick={() => {
								onNav(n.toLowerCase().replace(" ", "-"));
								setMobileOpen(false);
							}}
							style={{
								color: "rgba(255,255,255,0.7)",
								fontSize: 20,
								fontFamily: "'Playfair Display',serif",
								padding: "12px 0",
								borderBottom: "1px solid rgba(255,255,255,0.06)",
								cursor: "pointer",
								textDecoration: "none",
							}}>
							{n}
						</a>
					))}
					<button
						className="btn-primary"
						style={{ marginTop: 16, padding: "15px" }}
						onClick={() => {
							onNav("admissions");
							setMobileOpen(false);
						}}>
						Apply Now
					</button>
				</div>
			)}
		</>
	);
}

/* ─────────────────── COOKIE BANNER ─────────────────── */
function CookieBanner() {
  const [shown, setShown] = useState(true);
  if (!shown) return null;
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(10,22,40,0.97)", borderTop:`2px solid ${T.gold}`, padding:"16px 5%", zIndex:180, display:"flex", gap:24, alignItems:"center", flexWrap:"wrap" }}>
      <p style={{ color:"rgba(255,255,255,0.5)", fontSize:12, lineHeight:1.7, flex:1 }}>
        We use cookies to improve your experience, personalise content, and analyse our traffic in accordance with the Kenya Data Protection Act 2019. 
        <a href="#" style={{ color:T.gold, marginLeft:4 }}>Learn more</a>
      </p>
      <div style={{ display:"flex", gap:10 }}>
        <button className="btn-outline-white" style={{ fontSize:11, padding:"8px 18px" }} onClick={() => setShown(false)}>Decline</button>
        <button className="btn-primary" style={{ fontSize:11, padding:"8px 18px" }} onClick={() => setShown(false)}>Accept All</button>
      </div>
    </div>
  );
}

/* ─────────────────── ROOT ─────────────────── */
export default function BroadcastInstitutionSite() {
  const [ section, setSection ] = useState("home");
  const navigate = useNavigate();

  const navTo = useCallback((id) => {
    setSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior:"smooth", block:"start" });
    else window.scrollTo({ top:0, behavior:"smooth" });
  }, []);

  // Intersection observer to track active section
  useEffect(() => {
    const ids = ["home","about","programmes","studios","news","fm-live","admissions","alumni","contact"];
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setSection(e.target.id); });
    }, { threshold:0.3 });
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
		<div
			style={{
				fontFamily: "'DM Sans', sans-serif",
				background: T.cream,
				color: T.text,
				overflowX: "hidden",
			}}>
			<style>{GLOBAL_CSS}</style>
			<Navbar onNav={navTo} currentSection={section} navigate={navigate} />
			<HeroSection onNav={navTo} />
			<AboutSection />
			<ProgrammesSection />
			<StudiosSection />
			<NewsSection />
			<FMLiveSection />
			<AdmissionsSection />
			<AlumniSection />
			<ContactSection />
			<Footer onNav={navTo} />
			<FloatingElements onNav={navTo} />
			<CookieBanner />
		</div>
	);
}
