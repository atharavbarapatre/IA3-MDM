const express = require('express');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const VERSION = process.env.APP_VERSION || 'dev';
const STARTED = new Date();

function page() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Jenkins CI/CD Demo</title>
<style>
  :root { --bg1:#0f172a; --bg2:#1e1b4b; --card:rgba(255,255,255,.06); --line:rgba(255,255,255,.12);
          --text:#e2e8f0; --muted:#94a3b8; --accent:#38bdf8; --ok:#34d399; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; color:var(--text);
         min-height:100vh; background:linear-gradient(135deg,var(--bg1),var(--bg2)); padding:40px 20px; }
  .wrap { max-width:960px; margin:0 auto; }
  header { text-align:center; margin-bottom:36px; }
  .badge { display:inline-flex; align-items:center; gap:8px; padding:6px 14px; border-radius:999px;
           background:rgba(52,211,153,.12); border:1px solid rgba(52,211,153,.4); color:var(--ok);
           font-size:.85rem; font-weight:600; }
  .dot { width:9px; height:9px; border-radius:50%; background:var(--ok); animation:pulse 1.8s infinite; }
  @keyframes pulse { 0%{box-shadow:0 0 0 0 rgba(52,211,153,.7)} 70%{box-shadow:0 0 0 10px rgba(52,211,153,0)} 100%{box-shadow:0 0 0 0 rgba(52,211,153,0)} }
  h1 { font-size:clamp(2rem,5vw,3.2rem); margin:18px 0 10px; letter-spacing:-.02em;
       background:linear-gradient(90deg,#38bdf8,#a78bfa,#f472b6); -webkit-background-clip:text; background-clip:text; color:transparent; }
  .sub { color:var(--muted); font-size:1.05rem; }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:16px; margin-bottom:28px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:16px; padding:20px; backdrop-filter:blur(6px); }
  .card .k { color:var(--muted); font-size:.75rem; text-transform:uppercase; letter-spacing:.08em; }
  .card .v { font-size:1.5rem; font-weight:700; margin-top:6px; word-break:break-all; }
  h2 { font-size:1.15rem; margin:0 0 16px; }
  .pipeline { display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
  .stage { padding:10px 16px; border-radius:12px; background:rgba(56,189,248,.1); border:1px solid rgba(56,189,248,.35);
           font-weight:600; font-size:.9rem; }
  .stage::before { content:"\\2713  "; color:var(--ok); }
  .arrow { color:var(--muted); }
  .calc { display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
  input { width:90px; padding:10px 12px; border-radius:10px; border:1px solid var(--line);
          background:rgba(0,0,0,.25); color:var(--text); font-size:1rem; }
  button { padding:10px 18px; border:0; border-radius:10px; cursor:pointer; font-weight:700; font-size:1rem;
           color:#0f172a; background:linear-gradient(90deg,#38bdf8,#a78bfa); }
  button:hover { filter:brightness(1.1); }
  #res { font-size:1.2rem; font-weight:700; color:var(--accent); }
  footer { text-align:center; color:var(--muted); font-size:.85rem; margin-top:30px; }
  .card.wide { margin-bottom:20px; }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <span class="badge"><span class="dot"></span><span id="status">Checking health...</span></span>
    <h1>Jenkins CI/CD Pipeline</h1>
    <p class="sub">Automatically built, tested and deployed to AWS EC2 with Docker</p>
  </header>

  <section class="grid">
    <div class="card"><div class="k">Build number</div><div class="v">#${VERSION}</div></div>
    <div class="card"><div class="k">Container host</div><div class="v">${os.hostname()}</div></div>
    <div class="card"><div class="k">Node.js</div><div class="v">${process.version}</div></div>
    <div class="card"><div class="k">Uptime</div><div class="v" id="uptime">-</div></div>
  </section>

  <section class="card wide">
    <h2>Pipeline stages</h2>
    <div class="pipeline">
      <span class="stage">Checkout</span><span class="arrow">&rarr;</span>
      <span class="stage">Build</span><span class="arrow">&rarr;</span>
      <span class="stage">Test</span><span class="arrow">&rarr;</span>
      <span class="stage">Docker image</span><span class="arrow">&rarr;</span>
      <span class="stage">Terraform validate</span><span class="arrow">&rarr;</span>
      <span class="stage">Deploy</span><span class="arrow">&rarr;</span>
      <span class="stage">Verify</span>
    </div>
  </section>

  <section class="card wide">
    <h2>Try the API</h2>
    <div class="calc">
      <input id="a" type="number" value="12"> <strong>+</strong>
      <input id="b" type="number" value="30">
      <button onclick="add()">Calculate</button>
      <span id="res"></span>
    </div>
  </section>

  <footer>Endpoints: <code>/health</code> &middot; <code>/api/info</code> &middot; <code>/add/:a/:b</code></footer>
</div>

<script>
  function fmt(s){ var m=Math.floor(s/60); return m>0 ? m+"m "+(s%60)+"s" : s+"s"; }
  function refresh(){
    fetch('/api/info').then(function(r){return r.json();}).then(function(d){
      document.getElementById('uptime').textContent = fmt(d.uptimeSeconds);
    });
    fetch('/health').then(function(r){return r.json();}).then(function(d){
      document.getElementById('status').textContent = 'Deployment healthy: ' + d.status;
    }).catch(function(){
      document.getElementById('status').textContent = 'Unhealthy';
    });
  }
  function add(){
    var a=document.getElementById('a').value, b=document.getElementById('b').value;
    fetch('/add/'+a+'/'+b).then(function(r){return r.json();}).then(function(d){
      document.getElementById('res').textContent = d.error ? d.error : '= ' + d.result;
    });
  }
  refresh(); setInterval(refresh, 5000); add();
</script>
</body>
</html>`;
}

app.get('/', (req, res) => {
  res.type('html').send(page());
});

app.get('/api/info', (req, res) => {
  res.json({
    message: 'Hello from the Jenkins CI/CD pipeline!',
    version: VERSION,
    host: os.hostname(),
    node: process.version,
    uptimeSeconds: Math.floor((Date.now() - STARTED.getTime()) / 1000),
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

app.get('/add/:a/:b', (req, res) => {
  const a = Number(req.params.a);
  const b = Number(req.params.b);
  if (Number.isNaN(a) || Number.isNaN(b)) {
    return res.status(400).json({ error: 'a and b must be numbers' });
  }
  res.json({ result: a + b });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`App listening on port ${PORT}`));
}

module.exports = app;
