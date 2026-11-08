#!/usr/bin/env node
/**
 * Build password-gated pages for /job-talk from the private job-talk repo.
 *
 * Each slide deck (index.html, index-zh.html) is AES-256-GCM encrypted with a
 * random master key. The key is embedded in the page wrapped by:
 *   - the permanent password (always valid), and
 *   - one random temporary password per day, rotating at 00:00 Asia/Shanghai.
 * An admin page (permanent password only) lists every day's temp password.
 *
 * Nothing is remembered between visits: no key is ever written to
 * localStorage, so a temporary password cannot outlive the tab. Unlocking with
 * a daily password stamps the decrypted page with that date, so a screenshot
 * or recording shows which day's password was used.
 *
 * Usage:
 *   node scripts/build_job_talk.mjs --src /path/to/job-talk --password '<perm>'
 *   # or: JOBTALK_PASSWORD='<perm>' node scripts/build_job_talk.mjs --src ...
 * Options:
 *   --src <dir>     clone of the job-talk repo (required)
 *   --out <dir>     output directory (default: <repo>/job-talk)
 *   --days <n>      temp passwords to pre-generate, from today (default: 365)
 */
import { webcrypto as crypto } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const { subtle } = crypto;
const te = new TextEncoder();
const td = new TextDecoder();
const b64 = (buf) => Buffer.from(buf).toString("base64");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const SRC = arg("src", null);
const PASSWORD = arg("password", process.env.JOBTALK_PASSWORD || null);
const DAYS = parseInt(arg("days", "365"), 10);
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(arg("out", join(REPO, "job-talk")));

if (!SRC || !PASSWORD) {
  console.error("error: --src and --password (or JOBTALK_PASSWORD) are required");
  process.exit(1);
}

const PBKDF2_ITER = 600_000; // OWASP recommendation for SHA-256
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I/L

function shanghaiDate(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function randomPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const chars = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

async function pbkdf2Key(password, salt, iter) {
  const base = await subtle.importKey("raw", te.encode(password), "PBKDF2", false, [
    "deriveKey",
  ]);
  return subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function wrapKey(masterRaw, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const kek = await pbkdf2Key(password, salt, PBKDF2_ITER);
  const ct = await subtle.encrypt({ name: "AES-GCM", iv }, kek, masterRaw);
  return { salt: b64(salt), iter: PBKDF2_ITER, wrap: b64(new Uint8Array([...iv, ...new Uint8Array(ct)])) };
}

async function encryptPayload(masterRaw, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await subtle.importKey("raw", masterRaw, "AES-GCM", false, ["encrypt"]);
  const ct = await subtle.encrypt({ name: "AES-GCM", iv }, key, te.encode(plaintext));
  return { iv: b64(iv), ct: b64(ct) };
}

const GATE_CSS = `
*{box-sizing:border-box;margin:0}
body{min-height:100vh;display:flex;justify-content:center;
font-family:Georgia,"Times New Roman","Songti SC","SimSun",serif;
background:#fbfbfa;color:#1a1a1a;padding:0 20px}
.page{width:100%;max-width:460px;padding-top:16vh;text-align:center}
.eyebrow{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#8a8a8a;margin-bottom:18px}
h1{font-size:21px;font-weight:400;line-height:1.5}
.author{font-size:15px;color:#555;margin-top:14px;font-style:italic}
.affil{font-size:12.5px;color:#888;margin-top:5px;letter-spacing:.02em}
.rule{width:44px;border:0;border-top:1px solid #c9c9c9;margin:28px auto}
.field-label{display:block;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#9a9a9a;margin-bottom:10px}
input[type=password]{width:100%;padding:10px 4px;border:0;border-bottom:1px solid #c9c9c9;
background:transparent;font-size:17px;text-align:center;letter-spacing:.35em;outline:none;
font-family:inherit;transition:border-color .2s}
input[type=password]:focus{border-color:#1a1a1a}
button{margin-top:22px;padding:10px 34px;border:1px solid #1a1a1a;background:transparent;color:#1a1a1a;
font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
font-size:11px;letter-spacing:.22em;text-transform:uppercase;cursor:pointer;
transition:background .2s,color .2s}
button:hover{background:#1a1a1a;color:#fff}
button:disabled{opacity:.5;cursor:wait}
.err{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
font-size:12px;color:#a33;min-height:16px;margin-top:14px}
.note{margin-top:56px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
font-size:11px;color:#b0b0b0;letter-spacing:.04em}
`;

const GATE_JS = `
const b64d=(s)=>Uint8Array.from(atob(s),(c)=>c.charCodeAt(0));
const dec=new TextDecoder();
async function derive(pwd,salt,iter){
  const base=await crypto.subtle.importKey("raw",new TextEncoder().encode(pwd),"PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:iter,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["decrypt"]);
}
async function tryUnwrap(entry,pwd){
  try{
    const kek=await derive(pwd,b64d(entry.salt),entry.iter);
    const buf=b64d(entry.wrap);
    const raw=await crypto.subtle.decrypt({name:"AES-GCM",iv:buf.slice(0,12)},kek,buf.slice(12));
    return new Uint8Array(raw);
  }catch(e){return null;}
}
function shanghaiDate(d){
  return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit"}).format(d);
}
function stamp(date){
  const el=document.createElement("div");
  el.setAttribute("data-jt-temp","");
  el.textContent="Temporary access · "+date+" · do not redistribute  /  临时访问 · 请勿转发";
  el.style.cssText="position:fixed;left:12px;bottom:12px;z-index:2147483647;pointer-events:none;"+
    "user-select:none;font:11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.02em;"+
    "color:#3E4542;background:rgba(255,255,255,.88);border:1px solid rgba(31,33,31,.2);"+
    "border-radius:4px;padding:5px 9px;max-width:calc(100vw - 24px)";
  document.body.appendChild(el);
}
async function decryptWith(raw,meta){
  const key=await crypto.subtle.importKey("raw",raw,"AES-GCM",false,["decrypt"]);
  const html=dec.decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:b64d(PAYLOAD.iv)},key,b64d(PAYLOAD.ct)));
  document.open();document.write(html);document.close();
  if(meta&&meta.via==="daily")stamp(meta.date);
}
async function serverShanghaiDate(){
  try{
    const r=await fetch(location.origin+"/favicon.ico?ts="+Date.now(),{method:"HEAD",cache:"no-store"});
    const d=r.headers.get("date");
    if(d)return shanghaiDate(new Date(d));
  }catch(e){}
  return null;
}
async function unlock(pwd){
  let raw=await tryUnwrap(PAYLOAD.perm,pwd);
  if(raw)return{raw,via:"perm"};
  const today=await serverShanghaiDate();
  if(!today)return "offline";
  const e=PAYLOAD.daily[today];
  if(e){
    raw=await tryUnwrap(e,pwd);
    if(raw)return{raw,via:"daily",date:today};
  }
  return null;
}
window.addEventListener("DOMContentLoaded",()=>{
  const form=document.getElementById("gate"),input=document.getElementById("pwd"),
        btn=document.getElementById("go"),err=document.getElementById("err");
  form.addEventListener("submit",async(ev)=>{
    ev.preventDefault();
    btn.disabled=true;err.textContent="";
    const res=await unlock(input.value.trim());
    btn.disabled=false;
    if(res==="offline"){
      err.textContent=window.I18N_OFFLINE;
    }else if(res){
      try{await decryptWith(res.raw,res);}catch(e){err.textContent="Decrypt failed.";}
    }else{
      err.textContent=window.I18N_ERR;
      input.select();
    }
  });
});
`;

function gatePage(payload, t) {
  return `<!DOCTYPE html>
<html lang="${t.lang}"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${t.docTitle}</title>
<style>${GATE_CSS}</style>
</head><body>
<main class="page">
<p class="eyebrow">${t.eyebrow}</p>
<h1>${t.title}</h1>
<p class="author">${t.author}</p>
<p class="affil">${t.affil}</p>
<hr class="rule">
<form id="gate" autocomplete="off">
<label class="field-label" for="pwd">${t.label}</label>
<input type="password" id="pwd" autocomplete="off" autofocus>
<div><button type="submit" id="go">${t.button}</button></div>
<p class="err" id="err"></p>
</form>
<p class="note">${t.note}</p>
</main>
<noscript><p style="text-align:center;font-family:sans-serif;padding:40px">JavaScript is required to decrypt this page.</p></noscript>
<script>const PAYLOAD=${JSON.stringify(payload)};window.I18N_ERR=${JSON.stringify(t.err)};window.I18N_OFFLINE=${JSON.stringify(t.offline)};${GATE_JS}</script>
</body></html>
`;
}

function adminContent(daily) {
  const today = shanghaiDate(new Date());
  const rows = Object.entries(daily)
    .map(
      ([date, pwd]) =>
        `<tr class="${date === today ? "today" : ""}"><td>${date}</td>` +
        `<td><code>${pwd}</code></td>` +
        `<td><button onclick="navigator.clipboard.writeText('${pwd}');this.textContent='Copied!'">Copy</button></td></tr>`
    )
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Job Talk — Temp Passwords</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
background:#f7fafc;color:#2d3748;max-width:640px;margin:40px auto;padding:0 16px}
h1{font-size:20px;margin-bottom:4px}
.sub{color:#718096;font-size:13px;margin-bottom:20px}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;
box-shadow:0 1px 3px rgba(0,0,0,.1)}
td,th{padding:8px 14px;border-bottom:1px solid #edf2f7;font-size:14px;text-align:left}
th{background:#edf2f7}
tr.today{background:#fefcbf;font-weight:600}
code{font-family:ui-monospace,Menlo,monospace}
button{cursor:pointer;border:1px solid #cbd5e0;background:#fff;border-radius:6px;padding:2px 10px}
</style></head><body>
<h1>Job Talk — Temporary Passwords</h1>
<p class="sub">One password per day, valid 00:00–24:00 Asia/Shanghai. Today is <b>${today}</b>.</p>
<table><thead><tr><th>Date (Asia/Shanghai)</th><th>Password</th><th></th></tr></thead>
<tbody>
${rows}
</tbody></table>
</body></html>`;
}

async function main() {
  const decks = ["index.html", "index-zh.html"];
  const masterRaw = crypto.getRandomValues(new Uint8Array(32));

  console.log(`wrapping master key: 1 permanent + ${DAYS} daily passwords...`);
  const perm = await wrapKey(masterRaw, PASSWORD);
  const dailyWraps = {};
  const dailyPasswords = {};
  for (let i = 0; i < DAYS; i++) {
    const date = shanghaiDate(new Date(Date.now() + i * 864e5));
    const pwd = randomPassword();
    dailyPasswords[date] = pwd;
    dailyWraps[date] = await wrapKey(masterRaw, pwd);
    if ((i + 1) % 60 === 0) console.log(`  ${i + 1}/${DAYS}`);
  }

  mkdirSync(OUT, { recursive: true });
  const T = {
    "index.html": {
      lang: "en", docTitle: "Job Talk — Zhanli Li", eyebrow: "Job Talk · Private Slides",
      title: "Agentic Training, Document Intelligence,<br>Quantitative Finance",
      author: "Zhanli Li", affil: "LAMDA, Nanjing University",
      label: "Password", button: "Unlock",
      note: "Decrypted locally in your browser · AES-256-GCM",
      err: "Incorrect or expired password.",
      offline: "Temporary passwords require a network connection.",
    },
    "index-zh.html": {
      lang: "zh", docTitle: "求职报告 — 李展利", eyebrow: "求职报告 · 私密幻灯片",
      title: "智能体训练 · 文档智能 · 量化金融",
      author: "李展利", affil: "南京大学 LAMDA 组",
      label: "密码", button: "进 入",
      note: "在您的浏览器本地解密 · AES-256-GCM",
      err: "密码错误或已过期。",
      offline: "使用临时密码需要联网校验时间。",
    },
  };
  for (const deck of decks) {
    const html = readFileSync(join(SRC, deck), "utf8");
    const payload = { v: 1, perm, daily: dailyWraps, ...(await encryptPayload(masterRaw, html)) };
    const page = gatePage(payload, T[deck]);
    writeFileSync(join(OUT, deck), page);
    console.log(`wrote ${join(OUT, deck)} (${(page.length / 1e6).toFixed(1)} MB)`);
  }

  const adminKeyRaw = crypto.getRandomValues(new Uint8Array(32));
  const adminPayload = {
    v: 1,
    perm: await wrapKey(adminKeyRaw, PASSWORD),
    daily: {},
    ...(await encryptPayload(adminKeyRaw, adminContent(dailyPasswords))),
  };
  const adminPage = gatePage(adminPayload, {
    lang: "en", docTitle: "Temp Passwords — Job Talk", eyebrow: "Restricted",
    title: "Temp Passwords", author: "Zhanli Li", affil: "Job Talk · Private Slides",
    label: "Permanent password", button: "Unlock",
    note: "Generator page — permanent password only",
    err: "Incorrect password.",
    offline: "Temporary passwords require a network connection.",
  });
  writeFileSync(join(OUT, "admin.html"), adminPage);
  console.log(`wrote ${join(OUT, "admin.html")} (generator, permanent password only)`);
  console.log(`temp passwords cover ${Object.keys(dailyWraps).length} days starting ${shanghaiDate(new Date())}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
