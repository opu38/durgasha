// Zero-dependency Node server. No npm install needed.
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=process.env.PORT||3000;
const DATA=process.env.DATA_DIR||path.join(__dirname,'data');
const PW=process.env.ADMIN_PASSWORD||'pujo2026';
const SECRET=process.env.SESSION_SECRET||'pujo-'+PW;
const UP=path.join(DATA,'uploads'),DBF=path.join(DATA,'db.json'),PUB=path.join(__dirname,'public');
fs.mkdirSync(UP,{recursive:true});
let db=fs.existsSync(DBF)?JSON.parse(fs.readFileSync(DBF,"utf8")):require("./seed.js")();
if(!fs.existsSync(DBF))fs.writeFileSync(DBF,JSON.stringify(db));
const save=()=>{fs.writeFileSync(DBF+'.tmp',JSON.stringify(db));fs.renameSync(DBF+'.tmp',DBF)};
const sign=()=>crypto.createHmac('sha256',SECRET).update('admin').digest('hex');
const eq=(a,b)=>{a=Buffer.from(a);b=Buffer.from(b);return a.length===b.length&&crypto.timingSafeEqual(a,b)};
const sha=s=>crypto.createHash('sha256').update(String(s)).digest('hex');
const isAdmin=r=>{const m=(r.headers.cookie||'').match(/(?:^|; )pujo_admin=([^;]+)/);return !!m&&eq(m[1],sign())};
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.m4a':'audio/mp4','.aac':'audio/aac'};
const UPEXT={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif','audio/mpeg':'.mp3','audio/mp3':'.mp3','audio/wav':'.wav','audio/x-wav':'.wav','audio/ogg':'.ogg','audio/mp4':'.m4a','audio/x-m4a':'.m4a','audio/aac':'.aac'};
const FIELDS={songs:['title','artist','duration','audioUrl','youtubeUrl','coverUrl','playlist'],creators:['name','photoUrl','linkedin','instagram']};
const SET=['bengaliTitle','pujoDate','heroImage','contactEmail','youtubeUrl','spotifyUrl','coffeeUrl','dhakLabel'];
const PLS=['durga_puja','mahalaya','mahalaya_songs'];
const json=(res,c,o,h={})=>{res.writeHead(c,{'Content-Type':'application/json',...h});res.end(JSON.stringify(o))};
const body=(req,max)=>new Promise((ok,no)=>{const c=[];let n=0;req.on('data',d=>{n+=d.length;if(n>max){no(new Error('File onek boro (max 25 MB)'));req.destroy()}else c.push(d)});req.on('end',()=>ok(Buffer.concat(c)));req.on('error',no)});
const byPos=(a,b)=>a.position-b.position;
const fails={};

function file(req,res,f){
  fs.stat(f,(e,s)=>{
    if(e||!s.isFile()){res.writeHead(404);return res.end('Not found')}
    let a=0,b=s.size-1,c=200;const r=/bytes=(\d*)-(\d*)/.exec(req.headers.range||'');
    if(r){
      if(r[1]!=='')a=+r[1]; if(r[2]!=='')b=Math.min(+r[2],s.size-1);
      if(r[1]===''&&r[2]!==''){a=Math.max(0,s.size-+r[2]);b=s.size-1}
      if(a>b||a>=s.size){res.writeHead(416,{'Content-Range':'bytes */'+s.size});return res.end()}
      c=206;
    }
    const h={'Content-Type':MIME[path.extname(f).toLowerCase()]||'application/octet-stream','Content-Length':b-a+1,'Accept-Ranges':'bytes'};
    if(c===206)h['Content-Range']=`bytes ${a}-${b}/${s.size}`;
    res.writeHead(c,h);fs.createReadStream(f,{start:a,end:b}).pipe(res);
  });
}

async function api(req,res,p,m){
  const j=async()=>{try{return JSON.parse((await body(req,1e6)).toString()||'{}')}catch{return {}}};
  const ok=()=>json(res,200,{ok:true});
  if(p==='/api/health')return ok();
  if(p==='/api/data'&&m==='GET')return json(res,200,{settings:db.settings,creators:db.creators.slice().sort(byPos),songs:db.songs.slice().sort(byPos)});
  if(p==='/api/admin'){
    if(m==='GET')return json(res,200,{admin:isAdmin(req)});
    if(m==='DELETE')return json(res,200,{admin:false},{'Set-Cookie':'pujo_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'});
    if(m==='POST'){
      const ip=(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim();
      let f=fails[ip]||{n:0,t:0};if(Date.now()-f.t>6e5)f={n:0,t:0};
      if(f.n>=5)return json(res,429,{error:'Onek bar vul password. 10 minute pore abar try koro.'});
      const b=await j();
      if(!b.password||!eq(sha(b.password),sha(PW))){fails[ip]={n:f.n+1,t:Date.now()};return json(res,401,{error:'Password bhul'})}
      delete fails[ip];
      const sec=req.headers['x-forwarded-proto']==='https'?'; Secure':'';
      return json(res,200,{admin:true},{'Set-Cookie':`pujo_admin=${sign()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${sec}`});
    }
  }
  if(m!=='GET'&&!isAdmin(req))return json(res,401,{error:'Admin password lagbe'});
  if(p==='/api/upload'&&m==='POST'){
    const ext=UPEXT[(req.headers['content-type']||'').split(';')[0]];
    if(!ext)return json(res,400,{error:'Shudhu image ba audio file deya jabe'});
    const n=Date.now()+'-'+crypto.randomBytes(4).toString('hex')+ext;
    fs.writeFileSync(path.join(UP,n),await body(req,25*1024*1024));
    return json(res,201,{url:'/uploads/'+n});
  }
  if(p==='/api/settings'&&m==='PUT'){
    const b=await j();for(const k of SET)if(b[k]!==undefined)db.settings[k]=String(b[k]);
    if(b.onlineCount!==undefined)db.settings.onlineCount=Math.max(0,parseInt(b.onlineCount,10)||0);
    save();return json(res,200,{settings:db.settings});
  }
  const c=/^\/api\/(songs|creators)(?:\/(reorder|\d+))?$/.exec(p);
  if(c){
    const k=c[1],list=db[k],id=c[2];
    if(m==='POST'&&id==='reorder'){const b=await j();if(!Array.isArray(b.ids))return json(res,400,{error:'ids lagbe'});b.ids.forEach((i,n)=>{const x=list.find(s=>s.id===i);if(x)x.position=n+1});save();return ok()}
    if(m==='POST'&&!id){
      const b=await j();if(!String(b[k==='songs'?'title':'name']||'').trim())return json(res,400,{error:'Naam/title lagbe'});
      const x={id:db.nextId++};
      for(const f of FIELDS[k])x[f]=b[f]!=null&&b[f]!==''?String(b[f]).trim():(f==='duration'?'0:00':'');
      if(k==='songs'&&!PLS.includes(x.playlist))x.playlist='durga_puja';
      x.position=Math.max(0,...list.filter(s=>k==='creators'||s.playlist===x.playlist).map(s=>s.position))+1;
      list.push(x);save();return json(res,201,{item:x});
    }
    if(m==='PATCH'&&id){
      const x=list.find(s=>s.id==id);if(!x)return json(res,404,{error:'Pawa jayni'});
      const b=await j();for(const f of FIELDS[k])if(b[f]!==undefined)x[f]=String(b[f]).trim();
      if(k==='songs'&&!PLS.includes(x.playlist))x.playlist='durga_puja';
      save();return json(res,200,{item:x});
    }
    if(m==='DELETE'&&id){db[k]=list.filter(s=>s.id!=id);save();return ok()}
  }
  json(res,404,{error:'Pawa jayni'});
}

http.createServer(async(req,res)=>{
  try{
    const p=decodeURIComponent(new URL(req.url,'http://x').pathname);
    if(p.startsWith('/api/'))return await api(req,res,p,req.method);
    if(p.startsWith('/uploads/'))return file(req,res,path.join(UP,path.basename(p)));
    const f=path.join(PUB,p==='/'?'index.html':p);
    if(f!==PUB&&!f.startsWith(PUB+path.sep)){res.writeHead(403);return res.end()}
    file(req,res,f);
  }catch(e){if(!res.headersSent)json(res,500,{error:e.message})}
}).listen(PORT,()=>console.log('Running on http://localhost:'+PORT));
