const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const api=async(u,m='GET',b)=>{const r=await fetch(u,{method:m,headers:b?{'Content-Type':'application/json'}:{},body:b?JSON.stringify(b):undefined});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Kichu ekta vul hoyeche');return j};
const PLAYLISTS=[{key:'durga_puja',label:'Durga Puja',desc:'The main curated Durga Puja playlist.'},{key:'mahalaya',label:'Mahalaya',desc:'Mahalaya progoan, chants and ragas.'},{key:'mahalaya_songs',label:'Mahalaya Songs',desc:'Songs to mark Mahalaya day.'}];
const PL=Object.fromEntries(PLAYLISTS.map(p=>[p.key,p.label]));
const fmtTime=s=>{if(!isFinite(s)||s<0)s=0;return Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0')};
const parseDur=t=>{const [m,s]=(t||'0:00').split(':').map(x=>parseInt(x,10));return (isNaN(m)?0:m)*60+(isNaN(s)?0:s)};
const ytId=u=>((u||'').match(/(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/)||[])[1]||null;
function countdown(d){const n=d?Math.round((new Date(d+'T00:00:00')-new Date().setHours(0,0,0,0))/864e5):NaN;return isNaN(n)?'Days until Durga Pujo':n>1?n+' days until Durga Pujo':n===1?'1 day until Durga Pujo':n===0?'Durga Pujo is here!':'Durga Pujo bhola geche — shubhe shuru!'}

let D=null,active='durga_puja',currentId=null,M=null,copied=false;
const P={playing:false,time:0,dur:0,shuffle:false,repeat:'off',dhak:false,yt:false};
const audio=new Audio();
const queue=()=>(D?D.songs:[]).filter(s=>s.playlist===active).sort((a,b)=>a.position-b.position);
const song=()=>{const q=queue();return q.find(s=>s.id===currentId)||q[0]||null};

const cover=(src,cls,icon,inner='')=>!src
 ?`<div class="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#40301b] via-[#241a10] to-[#120d08] ${cls}"><div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(233,180,76,0.25),transparent_60%)]"></div>${I.Music('relative text-gold/50 '+(icon||'h-1/3 w-1/3'),1.6)}${inner}</div>`
 :`<div class="relative overflow-hidden bg-[#1a140d] ${cls}"><img src="${esc(src)}" alt="" loading="lazy" onload="this.style.opacity=1" onerror="this.parentNode.style.background='linear-gradient(135deg,#40301b,#241a10,#120d08)';this.remove()" class="absolute inset-0 h-full w-full object-cover transition-opacity duration-300" style="opacity:0">${inner}</div>`;

/* ---------- header + hero ---------- */
const TI=(label,inner,href,id,act)=>{const c='grid h-9 w-9 place-items-center text-white/75 transition hover:text-white active:scale-90'+(act?' rounded-full bg-gold/15 text-goldsoft ring-1 ring-gold/40':'');
 return href?`<a href="${esc(href)}" target="_blank" rel="noreferrer" aria-label="${label}" class="${c}">${inner}</a>`:`<button ${id?`id="${id}" `:''}aria-label="${label}" class="${c}">${inner}</button>`};
function renderHdr(){const s=D.settings,pill='flex items-center overflow-hidden rounded-full border border-white/10 bg-white/5 backdrop-blur',ic='h-4.5 w-4.5';
 $('#hdr').innerHTML=`<div class="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pr-4 pl-3 backdrop-blur"><span class="relative flex h-2 w-2"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"></span><span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span></span><span class="text-xs font-semibold text-white/85">${s.onlineCount} online</span></div>
<div class="flex items-center gap-2"><div class="${pill}">${TI('YouTube',I.Youtube(ic),s.youtubeUrl)}<span class="h-4 w-px bg-white/10"></span>${TI('Spotify',I.Spotify(ic),s.spotifyUrl)}</div>
<div class="${pill}">${TI('Made by',I.Users(ic),'','people')}<span class="h-4 w-px bg-white/10"></span>${TI('Support',I.Coffee(ic),s.coffeeUrl,'',1)}</div>
<button id="adm" class="grid h-9 w-9 place-items-center rounded-full border border-gold/40 bg-gold/10 text-goldsoft transition hover:bg-gold/20 active:scale-90" aria-label="Site manager" title="Site manager — add songs & photos">${I.Plus(ic,2.4)}</button></div>`}
function renderHero(){const s=D.settings;
 $('#hero').innerHTML=`${s.heroImage?`<img src="${esc(s.heroImage)}" alt="Durga Pujo pandal at night" onerror="this.remove()" class="absolute inset-0 h-full w-full object-cover object-center">`:''}
<div class="absolute inset-0 bg-gradient-to-b from-ink/90 via-ink/10 to-ink"></div><div class="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(233,180,76,0.14),transparent_55%)]"></div>
<div class="relative z-10 flex h-full flex-col items-center pt-7 text-center"><h1 class="font-bengali text-[44px] leading-tight font-bold text-gold drop-shadow-[0_2px_18px_rgba(0,0,0,0.75)]" style="text-shadow:0 0 40px rgba(233,180,76,0.35)">${esc(s.bengaliTitle)}</h1><p class="mt-2 text-[13px] font-medium tracking-wide text-white/65">${esc(countdown(s.pujoDate))}</p></div>
<div class="absolute inset-x-0 bottom-3 z-10 flex justify-center"><button data-act="pl" class="group flex items-center gap-2 rounded-full border border-white/12 bg-ink/60 px-4 py-2 backdrop-blur-md transition hover:border-gold/40">${I.List('h-3.5 w-3.5 text-goldsoft',2.2)}<span class="text-[11px] font-bold tracking-[0.22em] text-white/85 uppercase">${PL[active]}</span>${I.ChevronDown('h-3.5 w-3.5 text-white/50 transition group-hover:translate-y-0.5')}</button></div>`}

/* ---------- player ---------- */
function renderPlayer(){
 const s=song(),d=P.dhak,pct=P.dur>0?Math.min(100,P.time/P.dur*100):0,yid=s&&!s.audioUrl?ytId(s.youtubeUrl):null,dl=D.settings.dhakLabel||'Dhak';
 const sb=(act,on,inner)=>`<button data-act="${act}" class="${act==='repeat'?'relative ':''}flex items-center justify-center gap-2 py-2.5 text-[11px] font-semibold tracking-wide transition ${on?'text-goldsoft':'text-white/55 hover:text-white/85'}">${inner}</button>`;
 $('#player').innerHTML=`${P.yt&&yid?`<div class="mb-2 animate-pop overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl"><div class="flex items-center justify-between px-3 py-1.5"><span class="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-white/50">${I.Youtube('h-3.5 w-3.5 text-red-500')} NOW PLAYING ON YOUTUBE</span><button data-act="ytclose" class="grid h-6 w-6 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white" aria-label="Close video">${I.Close('h-3.5 w-3.5')}</button></div><div class="aspect-video w-full"><iframe src="https://www.youtube-nocookie.com/embed/${yid}?autoplay=1&playsinline=1&rel=0" title="${esc(s.title)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen class="h-full w-full"></iframe></div></div>`:''}
<div class="overflow-hidden rounded-2xl border bg-[#161310f2] shadow-[0_18px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-colors ${d?'border-gold/35':'border-white/10'}">
<div class="flex items-center gap-3 p-3 pr-2">${cover(s&&s.coverUrl,'h-[62px] w-[62px] shrink-0 rounded-xl ring-1 ring-white/10','',s?`<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-4"><span class="block truncate font-script text-[11px] leading-none text-amber-100/90">${esc(s.title)}</span></div>`:'')}
<div class="min-w-0 flex-1"><div class="flex items-baseline gap-2"><p class="truncate text-[15px] font-semibold text-white">${s?esc(s.title):'—'}</p>${s&&!s.audioUrl&&s.youtubeUrl?'<span class="shrink-0 rounded-full bg-gold/15 px-1.5 py-px text-[9px] font-bold tracking-wide text-goldsoft">YT</span>':''}</div>
<p class="truncate text-xs text-mute">${esc((s&&s.artist)||'Unknown artist')}</p>
<div id="bar" class="group mt-2 flex h-4 cursor-pointer touch-none items-center ${s&&s.audioUrl?'':'pointer-events-none opacity-50'}"><div class="relative h-[3.5px] w-full overflow-visible rounded-full bg-white/15"><div id="fill" class="absolute inset-y-0 left-0 rounded-full ${d?'bg-gold':'bg-white/85'}" style="width:${pct}%"></div><div id="knob" class="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover:opacity-100 ${d?'bg-goldsoft':''}" style="left:${pct}%"></div></div></div>
<p id="tm" class="mt-0.5 text-[10px] tabular-nums text-mute">${fmtTime(P.time)} / ${fmtTime(P.dur)}</p></div>
<div class="flex shrink-0 items-center gap-1"><button data-act="prev" class="grid h-9 w-9 place-items-center rounded-full text-white/60 transition hover:bg-white/5 hover:text-white active:scale-90" aria-label="Previous">${I.Prev('h-5 w-5')}</button>
<button data-act="toggle" aria-label="${P.playing?'Pause':'Play'}" class="relative grid h-[52px] w-[52px] place-items-center rounded-2xl bg-white text-ink shadow-[0_6px_20px_rgba(0,0,0,0.45)] transition active:scale-90 ${d?'bg-goldsoft':''}">${d&&P.playing?'<span class="pointer-events-none absolute inset-0 animate-dhak-ring rounded-2xl border-2 border-gold/80"></span>':''}${P.playing&&s&&s.audioUrl?I.Pause('h-6 w-6'):I.Play('h-6 w-6 translate-x-[2px]')}</button>
<button data-act="next" class="grid h-9 w-9 place-items-center rounded-full text-white/60 transition hover:bg-white/5 hover:text-white active:scale-90" aria-label="Next">${I.Next('h-5 w-5')}</button></div></div>
<div class="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10">${sb('shuffle',P.shuffle,I.Shuffle('h-4 w-4')+'Shuffle')}${sb('repeat',P.repeat!=='off',`<span class="relative">${I.Repeat('h-4 w-4')}${P.repeat==='one'?'<span class="absolute -right-1.5 -top-1 grid h-3 w-3 place-items-center rounded-full bg-gold text-[8px] font-bold text-ink">1</span>':''}</span>Repeat`)}${sb('dhak',d,I.Drum('h-4 w-4'+(d?' animate-blink':''))+esc(dl)+(d?'<span class="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_8px_rgba(233,180,76,0.9)]"></span>':''))}</div></div>`}
function upd(){const pct=P.dur>0?Math.min(100,P.time/P.dur*100):0,f=$('#fill'),k=$('#knob'),t=$('#tm');if(f)f.style.width=pct+'%';if(k)k.style.left=pct+'%';if(t)t.textContent=fmtTime(P.time)+' / '+fmtTime(P.dur)}

function syncSong(){
 const s=song();P.time=0;
 if(!s){audio.pause();P.playing=false}
 else{P.dur=parseDur(s.duration);
  if(s.audioUrl){if(audio.dataset.u!==s.audioUrl){audio.dataset.u=s.audioUrl;audio.src=s.audioUrl;audio.load()}if(P.playing)audio.play().catch(()=>{P.playing=false;renderPlayer()})}
  else{audio.pause();audio.removeAttribute('src');delete audio.dataset.u;P.playing=false}
  if(!s.youtubeUrl||s.audioUrl)P.yt=false}
 renderPlayer();
}
function setTrack(s){currentId=s.id;active=s.playlist;renderHero();syncSong();if(M==='pl')renderModal()}
function advance(dir,auto){
 const q=queue();if(!q.length)return;const idx=Math.max(0,q.findIndex(s=>s.id===currentId));let ni;
 if(P.shuffle&&dir===1){ni=idx;if(q.length>1)do{ni=Math.floor(Math.random()*q.length)}while(ni===idx)}else ni=(idx+dir+q.length)%q.length;
 if(!P.shuffle&&dir===1&&P.repeat==='off'&&auto&&idx===q.length-1){P.playing=false;audio.currentTime=0;P.time=0;renderPlayer();return}
 setTrack(q[ni]);
}
audio.onplay=()=>{P.playing=true;renderPlayer()};audio.onpause=()=>{P.playing=false;renderPlayer()};
audio.ontimeupdate=()=>{P.time=audio.currentTime;upd()};
audio.onloadedmetadata=()=>{if(isFinite(audio.duration)&&audio.duration>0){P.dur=audio.duration;upd()}};
audio.onended=()=>{if(P.repeat==='one'){audio.currentTime=0;audio.play().catch(()=>{P.playing=false;renderPlayer()});return}advance(1,true)};
function toggle(){
 const s=song();if(!s)return;
 if(!s.audioUrl){if(s.youtubeUrl){P.yt=!P.yt;renderPlayer()}return}
 if(!audio.src){audio.src=s.audioUrl;audio.load()}
 if(P.playing){audio.pause();P.playing=false;renderPlayer()}else audio.play().then(()=>{P.playing=true;renderPlayer()}).catch(()=>{P.playing=false;renderPlayer()});
}
let drag=false;
function seekX(x){const el=$('#bar'),s=song();if(!el||!s||!s.audioUrl)return;const tot=isFinite(audio.duration)&&audio.duration>0?audio.duration:P.dur;if(!tot)return;const r=el.getBoundingClientRect(),p=Math.min(1,Math.max(0,(x-r.left)/r.width));audio.currentTime=p*tot;P.time=p*tot;upd()}
document.addEventListener('pointerdown',e=>{const b=e.target.closest('#bar');if(b){drag=true;b.setPointerCapture(e.pointerId);seekX(e.clientX)}});
document.addEventListener('pointermove',e=>{if(drag)seekX(e.clientX)});
document.addEventListener('pointerup',()=>drag=false);

/* ---------- modals ---------- */
const closeBtn=`<button data-act="close" class="grid h-8 w-8 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white" aria-label="Close">${I.Close('h-4.5 w-4.5',2.2)}</button>`;
function plHTML(){
 const info=PLAYLISTS.find(p=>p.key===active),list=queue();
 return `<div class="fixed inset-0 z-50 flex justify-center"><div class="absolute inset-0 animate-fadein bg-black/75 backdrop-blur-[3px]" data-act="close"></div>
<div class="relative m-3 mt-14 flex w-full max-w-[520px] animate-rise flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#12100c] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
<header class="flex items-center justify-between px-5 pt-5 pb-3"><h2 class="text-[13px] font-bold tracking-[0.35em] text-white/80">PLAYLISTS</h2>${closeBtn}</header>
<div class="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-3">${PLAYLISTS.map(p=>`<button data-act="tab" data-k="${p.key}" class="shrink-0 rounded-full px-4 py-2 text-[11px] font-bold tracking-[0.14em] uppercase transition ${active===p.key?'bg-white/12 text-white shadow-inner':'text-white/45 hover:bg-white/5 hover:text-white/75'}">${p.label}</button>`).join('')}</div>
<p class="px-5 pb-3 text-xs text-white/40">${info.desc}</p>
<div class="thin-scroll min-h-0 flex-1 overflow-y-auto border-t border-white/8 px-3 pb-4">${list.length?'':'<div class="px-3 py-10 text-center text-sm text-white/35">No songs here yet — add some from the manager.</div>'}
${list.map((s,i)=>{const c=s.id===currentId;return `<button data-act="play" data-id="${s.id}" class="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition ${c?'bg-white/8 ring-1 ring-white/10':'hover:bg-white/4'}"><span class="w-7 shrink-0 text-center text-xs font-semibold tabular-nums ${c?'text-gold':'text-white/35'}">${String(i+1).padStart(2,'0')}</span>${cover(s.coverUrl,'h-12 w-12 shrink-0 rounded-lg ring-1 ring-white/10','h-4 w-4')}<div class="min-w-0 flex-1"><p class="truncate text-sm font-semibold ${c?'text-gold':'text-white'}">${esc(s.title)}</p><p class="truncate text-xs text-mute">${esc(s.artist||'Unknown')}</p></div>${s.youtubeUrl&&!s.audioUrl?'<span class="shrink-0 rounded-full bg-gold/15 px-1.5 py-px text-[9px] font-bold text-goldsoft">YT</span>':''}<span class="shrink-0 text-xs tabular-nums text-white/40">${esc(s.duration)}</span></button>`}).join('')}</div></div></div>`}
function peopleHTML(){
 const em=D.settings.contactEmail;
 return `<div class="fixed inset-0 z-50 flex items-center justify-center p-4"><div class="absolute inset-0 animate-fadein bg-black/75 backdrop-blur-[3px]" data-act="close"></div>
<div class="relative w-full max-w-[400px] animate-rise rounded-3xl border border-white/10 bg-gradient-to-b from-[#241a10] via-[#161210] to-[#100d0b] p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"><div class="absolute -left-16 top-10 h-48 w-48 rounded-full bg-gold/10 blur-3xl"></div>
<header class="relative flex items-start justify-between"><h2 class="mt-1 text-[12px] font-bold tracking-[0.32em] text-white/70">MADE WITH BHALOBASHA BY</h2>${closeBtn}</header>
<div class="relative mt-5 space-y-4">${D.creators.length?'':'<p class="py-6 text-center text-sm text-white/35">No people added yet.</p>'}
${D.creators.map(c=>`<div class="rounded-2xl border border-white/10 bg-gradient-to-br from-[#2c2013]/80 via-[#1c1712]/60 to-transparent px-6 py-7 text-center">${cover(c.photoUrl,'mx-auto h-20 w-20 rounded-full ring-2 ring-gold/30','h-6 w-6',c.photoUrl?'':`<span class="absolute inset-0 grid place-items-center font-bengali text-xl font-bold text-goldsoft">${esc(c.name.split(' ').slice(0,2).map(w=>w[0]).join(''))}</span>`)}
<p class="mt-4 text-[15px] font-bold text-white">${esc(c.name)}</p><div class="mt-3.5 flex items-center justify-center gap-3">
${c.linkedin?`<a href="${esc(c.linkedin)}" target="_blank" rel="noreferrer" class="grid h-9 w-9 place-items-center rounded-full bg-white/8 text-[11px] font-bold text-white/80 ring-1 ring-white/15 transition hover:bg-white/15 hover:text-white">in</a>`:''}
${c.instagram?`<a href="${esc(c.instagram)}" target="_blank" rel="noreferrer" class="grid h-9 w-9 place-items-center rounded-full bg-white/8 text-white/80 ring-1 ring-white/15 transition hover:bg-white/15 hover:text-white">${I.Instagram('h-4 w-4')}</a>`:''}</div></div>`).join('')}</div>
<div class="relative mt-6 border-t border-white/10 pt-5 text-center"><p class="text-xs text-white/45">Want to get in touch?</p><div class="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-white/12 bg-black/30 py-1.5 pl-4 pr-1.5"><span class="truncate text-xs text-white/75">${esc(em)}</span>
<button data-act="copy" class="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold tracking-wider text-white/85 transition hover:bg-white/20 active:scale-95">${copied?I.Check('h-3 w-3 text-goldsoft'):I.Copy('h-3 w-3',2.2)}${copied?'COPIED':'COPY'}</button></div></div></div></div>`}
function renderModal(){$('#modal').innerHTML=M==='pl'?plHTML():M==='people'?peopleHTML():''}
function closeModal(){M=null;$('#modal').innerHTML=''}
async function copyText(t){try{await navigator.clipboard.writeText(t);return true}catch{try{const a=document.createElement('textarea');a.value=t;a.style.cssText='position:fixed;opacity:0';document.body.appendChild(a);a.select();document.execCommand('copy');a.remove();return true}catch{return false}}}

document.addEventListener('click',async e=>{
 if(e.target.closest('#adm'))return window.openAdmin&&openAdmin();
 if(e.target.closest('#people')){M='people';return renderModal()}
 const b=e.target.closest('[data-act]');if(!b||!D)return;const d=b.dataset;
 switch(d.act){
  case 'pl':M='pl';renderModal();break;
  case 'close':closeModal();break;
  case 'tab':{active=d.k;const q=queue();if(q.length&&!q.some(s=>s.id===currentId))setTrack(q[0]);else renderHero();renderModal();break}
  case 'play':setTrack(D.songs.find(s=>s.id==d.id));break;
  case 'prev':if(audio.currentTime>3){audio.currentTime=0;P.time=0;upd()}else advance(-1);break;
  case 'next':advance(1);break;
  case 'toggle':toggle();break;
  case 'shuffle':P.shuffle=!P.shuffle;renderPlayer();break;
  case 'repeat':P.repeat=P.repeat==='off'?'all':P.repeat==='all'?'one':'off';renderPlayer();break;
  case 'dhak':P.dhak=!P.dhak;renderPlayer();break;
  case 'ytclose':P.yt=false;renderPlayer();break;
  case 'copy':if(await copyText(D.settings.contactEmail)){copied=true;renderModal();setTimeout(()=>{copied=false;if(M==='people')renderModal()},1600)}break;
 }
});

async function load(){
 try{
  const res=await fetch('/api/data',{cache:'no-store'});if(!res.ok)throw 0;D=await res.json();
  const q=D.songs.filter(s=>s.playlist==='durga_puja').sort((a,b)=>a.position-b.position);
  if(!(currentId&&D.songs.some(s=>s.id===currentId)))currentId=(q[0]||D.songs[0]||{}).id??null;
  renderHdr();renderHero();syncSong();if(M==='pl'||M==='people')renderModal();
 }catch{
  $('#hero').innerHTML=`<div class="flex h-full flex-col items-center justify-center gap-4 p-8 text-center"><p class="font-bengali text-3xl text-gold">দুঃখিত</p><p class="text-sm text-mute">Something went wrong loading the site.</p><button onclick="load()" class="rounded-full bg-gold px-5 py-2 text-sm font-bold text-ink transition hover:bg-goldsoft">Try again</button></div>`;
 }
}
$('#hero').innerHTML='<div class="flex h-full items-center justify-center"><p class="text-xs tracking-widest text-white/30">LOADING PUJO…</p></div>';
load();
