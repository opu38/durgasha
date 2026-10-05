let AS={tab:'songs'};const fmt=fmtTime;
const F={
 songs:[{k:'title',l:'Gaaner naam'},{k:'artist',l:'Shilpi'},{k:'playlist',l:'Playlist',t:'select',o:PL},{k:'audioUrl',l:'Audio file (mp3 / wav)',t:'file',a:'audio/*'},{k:'coverUrl',l:'Cover chhobi',t:'file',a:'image/*'},{k:'youtubeUrl',l:'YouTube link (optional)'},{k:'duration',l:'Duration (m:ss)'}],
 creators:[{k:'name',l:'Naam'},{k:'photoUrl',l:'Photo',t:'file',a:'image/*'},{k:'linkedin',l:'LinkedIn link'},{k:'instagram',l:'Instagram link'}],
 settings:[{k:'bengaliTitle',l:'Bengali title'},{k:'pujoDate',l:'Pujo-r tarikh',t:'date'},{k:'onlineCount',l:'Online count',t:'number'},{k:'heroImage',l:'Hero chhobi',t:'file',a:'image/*'},{k:'dhakLabel',l:'Dhak label'},{k:'contactEmail',l:'Contact email'},{k:'youtubeUrl',l:'YouTube link'},{k:'spotifyUrl',l:'Spotify link'},{k:'coffeeUrl',l:'Support / Coffee link'}]};
/* ---------- Admin ---------- */
window.openAdmin=async()=>{const r=await api('/api/admin').catch(()=>({}));r.admin?admin():login()};
const login=()=>show(`<h3>Admin login</h3><form id="fl"><label>Password<input type="password" name="password" autocomplete="current-password" required></label><p class="err" id="err"></p><button class="btn">Dhuko</button></form>`);
const ff=(fields,v)=>fields.map(f=>{const val=esc(v[f.k]??'');
 if(f.t==='select')return `<label>${f.l}<select name="${f.k}">${Object.entries(f.o).map(([a,b])=>`<option value="${a}"${a===v[f.k]?' selected':''}>${b}</option>`).join('')}</select></label>`;
 if(f.t==='file')return `<label>${f.l}<input type="file" accept="${f.a}" data-f="${f.k}"><input name="${f.k}" value="${val}" placeholder="ba URL paste koro"></label>`;
 return `<label>${f.l}<input name="${f.k}" type="${f.t||'text'}" value="${val}"></label>`}).join('');
function admin(){
 const t=AS.tab;
 let h=`<div class="tabs">${[['songs','Songs'],['settings','Site'],['creators','Made by']].map(([k,l])=>`<button data-a="tab" data-v="${k}" class="${k===t&&!AS.edit?'on':''}">${l}</button>`).join('')}<button data-a="logout">Logout</button></div>`;
 if(AS.edit){const {k,id}=AS.edit,v=id?D[k].find(x=>x.id===id)||{}:{playlist:active};
  h+=`<form id="fe">${ff(F[k],v)}<p class="err" id="err"></p><button class="btn">Save</button><button type="button" class="btn" style="background:#333;color:var(--cream)" data-a="cancel">Cancel</button></form>`}
 else if(t==='settings')h+=`<form id="fs">${ff(F.settings,D.settings)}<p class="err" id="err"></p><button class="btn">Save changes</button></form>`;
 else if(t==='songs')h+=Object.entries(PL).map(([k,l])=>`<h3>${l}</h3>`+(D.songs.filter(s=>s.playlist===k).map(s=>`<div class="row"><span>${esc(s.title)}<small>${esc(s.artist)}</small></span><button data-a="mv" data-id="${s.id}" data-v="-1" aria-label="Up">↑</button><button data-a="mv" data-id="${s.id}" data-v="1" aria-label="Down">↓</button><button data-a="ed" data-k="songs" data-id="${s.id}" aria-label="Edit">✎</button><button data-a="del" data-k="songs" data-id="${s.id}" aria-label="Delete">✕</button></div>`).join('')||'<p class="mute">Khali</p>')).join('')+'<button class="btn" data-a="ed" data-k="songs">+ Notun gaan</button>';
 else h+=D.creators.map(c=>`<div class="row"><span>${esc(c.name)}</span><button data-a="ed" data-k="creators" data-id="${c.id}">✎</button><button data-a="del" data-k="creators" data-id="${c.id}">✕</button></div>`).join('')+'<button class="btn" data-a="ed" data-k="creators">+ Notun naam</button>';
 show(h);
}
const fail=e=>{if(/password lagbe/.test(e.message)){login()}else{const p=$('#err');p?p.textContent=e.message:alert(e.message)}};
$('#modal').addEventListener('click',async e=>{
 const b=e.target.closest('[data-a]');if(!b)return;const d=b.dataset;
 try{
  if(d.a==='tab'){AS={tab:d.v};admin()}
  else if(d.a==='logout'){await api('/api/admin','DELETE');closeModal()}
  else if(d.a==='ed'){AS.edit={k:d.k,id:d.id?+d.id:null};if(d.k!=='settings')AS.tab=d.k;admin()}
  else if(d.a==='cancel'){AS.edit=null;admin()}
  else if(d.a==='del'&&confirm('Sotti delete korbe?')){await api(`/api/${d.k}/${d.id}`,'DELETE');await load();admin()}
  else if(d.a==='mv'){
   const s=D.songs.find(x=>x.id==d.id),ids=D.songs.filter(x=>x.playlist===s.playlist).map(x=>x.id),i=ids.indexOf(s.id),j=i+ +d.v;
   if(j>=0&&j<ids.length){[ids[i],ids[j]]=[ids[j],ids[i]];await api('/api/songs/reorder','POST',{ids});await load();admin()}}
 }catch(err){fail(err)}
});
$('#modal').addEventListener('submit',async e=>{
 e.preventDefault();const f=e.target,v=Object.fromEntries(new FormData(f));delete v.undefined;
 try{
  if(f.id==='fl'){await api('/api/admin','POST',v);admin()}
  else if(f.id==='fs'){await api('/api/settings','PUT',v);await load();$('#err').textContent='Save hoyeche ✓'}
  else if(f.id==='fe'){const {k,id}=AS.edit;await api(id?`/api/${k}/${id}`:`/api/${k}`,id?'PATCH':'POST',v);AS.edit=null;await load();admin()}
 }catch(err){fail(err)}
});
$('#modal').addEventListener('change',async e=>{
 const i=e.target;if(!i.dataset.f||!i.files[0])return;const file=i.files[0],tx=i.nextElementSibling;tx.value='Upload hocche…';
 try{
  const r=await fetch('/api/upload',{method:'POST',headers:{'Content-Type':file.type},body:file}),j=await r.json();if(!r.ok)throw new Error(j.error);tx.value=j.url;
  const du=i.form.elements.duration;
  if(du&&file.type.startsWith('audio/')){const a=new Audio(URL.createObjectURL(file));a.onloadedmetadata=()=>{du.value=fmt(a.duration)}}
 }catch(err){tx.value='';fail(err)}
});
function show(h){$('#modal').innerHTML=`<div class="fixed inset-0 z-50 flex justify-center"><div class="absolute inset-0 animate-fadein bg-black/75 backdrop-blur-[3px]" data-act="close"></div><div class="relative m-3 mt-14 flex w-full max-w-[520px] animate-rise flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#12100c] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"><button data-act="close" class="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white" aria-label="Close">${I.Close('h-4.5 w-4.5',2.2)}</button><div id="mbody" class="thin-scroll min-h-0 flex-1 overflow-y-auto p-5 pt-7">${h}</div></div></div>`}
