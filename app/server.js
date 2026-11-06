/**
 * Gymtime Attendance Portal — backend proxy
 * -----------------------------------------
 * A tiny, zero-dependency Node server that:
 *   1. Serves the static front-end in ./public
 *   2. Proxies the documented Gymtime AndroidApi calls (the browser can't call
 *      the gym host directly because of CORS + the HTTP bootstrap host).
 *
 * It only ever performs READ operations from the documented catalog:
 *   - show_domain_url_list   (resolve the gym server from a Unique Id)
 *   - login_member           (member sign-in lookup)
 *   - show_branch_details    (branch / gym name)
 *   - show_biometric_attendance (attendance dates)
 *
 * No write actions (make_attendence, CB_BookClass, add_member_feedback, ...)
 * are ever sent. All outbound hosts are constrained to *.gymtime.in.
 *
 * Run:  node server.js   (optionally PORT=4000 node server.js)
 */

import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const ACCOUNT_FILE = path.join(__dirname, '..', 'account.json');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Bootstrap (gym-server discovery) host. Overridable for staging / testing.
const BOOTSTRAP_URL =
  process.env.GYMTIME_BOOTSTRAP_URL || 'http://demo.gymtime.in/AndroidApi/sql_server_api.php';
// Extra outbound hosts to permit beyond *.gymtime.in (comma separated).
const EXTRA_HOSTS = (process.env.GYMTIME_ALLOWED_HOSTS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const API_PATH = '/AndroidApi/sql_server_api.php';
const REQUEST_TIMEOUT_MS = 25_000; // mirrors the app's HttpURLConnection timeouts
const LOOPBACK = new Set(['localhost', '127.0.0.1', '::1']);

// ---------------------------------------------------------------------------
// Outbound HTTP(S) with optional proxy support (so it also works behind the
// sandbox's HTTPS_PROXY; a no-op for normal end users on a direct connection).
// ---------------------------------------------------------------------------

/** Open a CONNECT tunnel through an http proxy to host:port. Resolves a raw socket. */
function connectViaProxy(proxyUrl, host, port) {
  return new Promise((resolve, reject) => {
    const p = new URL(proxyUrl);
    const socket = net.connect(Number(p.port) || 80, p.hostname, () => {
      let msg = `CONNECT ${host}:${port} HTTP/1.1\r\nHost: ${host}:${port}\r\n`;
      if (p.username) {
        const auth = Buffer.from(
          `${decodeURIComponent(p.username)}:${decodeURIComponent(p.password)}`,
        ).toString('base64');
        msg += `Proxy-Authorization: Basic ${auth}\r\n`;
      }
      socket.write(msg + '\r\n'); // blank line terminates the CONNECT header block
    });
    let buf = '';
    const onData = (d) => {
      buf += d.toString('binary');
      const idx = buf.indexOf('\r\n\r\n');
      if (idx === -1) return;
      socket.removeListener('data', onData);
      const statusLine = buf.slice(0, buf.indexOf('\r\n'));
      if (!/\s2\d\d\s/.test(statusLine)) {
        socket.destroy();
        return reject(new Error('Proxy CONNECT failed: ' + statusLine.trim()));
      }
      resolve(socket);
    };
    socket.on('data', onData);
    socket.on('error', reject);
    socket.setTimeout(REQUEST_TIMEOUT_MS, () => socket.destroy(new Error('Proxy connect timed out')));
  });
}

/**
 * Perform an HTTP(S) request. Direct by default (the normal end-user path).
 * When an *_PROXY env var is set, tunnel through it with CONNECT (works for the
 * sandbox's CONNECT-only egress proxy); loopback targets always go direct.
 */
async function outboundRequest(targetUrl, { method = 'GET', headers = {}, body = '' } = {}) {
  const u = new URL(targetUrl);
  const isHttps = u.protocol === 'https:';
  const port = Number(u.port) || (isHttps ? 443 : 80);
  const proxy = LOOPBACK.has(u.hostname)
    ? null
    : process.env.HTTPS_PROXY ||
      process.env.https_proxy ||
      process.env.HTTP_PROXY ||
      process.env.http_proxy ||
      null;

  // Establish the underlying socket (direct or tunneled).
  let createConnection;
  if (proxy) {
    let socket = await connectViaProxy(proxy, u.hostname, port);
    if (isHttps) {
      const tlsSocket = tls.connect({ socket, servername: u.hostname });
      await once(tlsSocket, 'secureConnect');
      socket = tlsSocket;
    }
    createConnection = () => socket;
  }

  return new Promise((resolve, reject) => {
    const collect = (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () =>
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        }),
      );
    };
    const mod = isHttps ? https : http;
    const opts = createConnection
      ? { method, path: u.pathname + u.search, headers, createConnection }
      : { hostname: u.hostname, port, method, path: u.pathname + u.search, headers };
    const req = mod.request(opts, collect);
    req.on('error', reject);
    req.setTimeout(REQUEST_TIMEOUT_MS, () => req.destroy(new Error('Upstream request timed out')));
    if (body) req.write(body);
    req.end();
  });
}

async function postForm(targetUrl, form) {
  const body = new URLSearchParams(form).toString();
  const res = await outboundRequest(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Content-Length': Buffer.byteLength(body),
      Accept: 'application/json, text/plain, */*',
      'User-Agent': 'GymtimeAttendancePortal/1.0',
    },
    body,
  });
  return res;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isAllowedHost(hostname) {
  const h = String(hostname).toLowerCase();
  if (h === 'gymtime.in' || h.endsWith('.gymtime.in')) return true;
  return EXTRA_HOSTS.includes(h);
}

/** Parse JSON even when a PHP notice/warning is printed before the body. */
function parseLooseJSON(text) {
  if (text == null || text === '') throw new Error('Empty response from server');
  try {
    return JSON.parse(text);
  } catch {
    /* fall through */
  }
  const firstObj = text.indexOf('{');
  const firstArr = text.indexOf('[');
  let start = -1;
  if (firstObj === -1) start = firstArr;
  else if (firstArr === -1) start = firstObj;
  else start = Math.min(firstObj, firstArr);
  if (start === -1) throw new Error('Server did not return JSON');
  const close = text[start] === '{' ? '}' : ']';
  let end = text.lastIndexOf(close);
  while (end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      end = text.lastIndexOf(close, end - 1);
    }
  }
  throw new Error('Could not parse JSON from server response');
}

const isSuccess = (data) => String(data?.success ?? '').trim() === '2';

function resultArray(data) {
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.data)) return data.data;
  if (data?.result && typeof data.result === 'object') return [data.result];
  return [];
}

function pick(obj, keys) {
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') out[k] = v;
  }
  return out;
}

/** Full app company code (e.g. GT000518) -> API comp_id (518) via substring(5). */
function deriveCompId(companyCode) {
  const c = String(companyCode || '').trim();
  if (/^[A-Za-z]{2}\d{3,}$/.test(c)) return c.slice(5); // GT000518 -> 518
  return c; // already a numeric branch/company id
}

function apiUrlFor(server) {
  const u = new URL(server);
  return `${u.protocol}//${u.host}${API_PATH}`;
}

// ---------------------------------------------------------------------------
// API route handlers
// ---------------------------------------------------------------------------

async function resolveServer({ server, uniqueId }) {
  if (server) {
    const u = new URL(server);
    if (!isAllowedHost(u.hostname)) throw httpError(400, 'Server host is not a gymtime.in address.');
    return `${u.protocol}//${u.host}/`;
  }
  if (!uniqueId) throw httpError(400, 'Enter your gym Unique Id so the server can be resolved.');
  const res = await postForm(BOOTSTRAP_URL, { action: 'show_domain_url_list', auto_id: uniqueId });
  const data = parseLooseJSON(res.body);
  if (!isSuccess(data)) {
    throw httpError(404, data?.error || 'No gym found for that Unique Id.');
  }
  const row = resultArray(data).find((r) => r?.Domain_Url) || {};
  const domain = String(row.Domain_Url || '').trim();
  if (!domain) throw httpError(502, 'Server lookup succeeded but returned no Domain_Url.');
  const u = new URL(domain);
  if (!isAllowedHost(u.hostname)) throw httpError(400, 'Resolved server is not a gymtime.in address.');
  return domain.endsWith('/') ? domain : domain + '/';
}

async function handleSession(body) {
  const uniqueId = String(body.uniqueId || '').trim();
  const companyCode = String(body.companyCode || '').trim();
  const mobile = String(body.mobile || '').trim();
  const explicitServer = String(body.server || '').trim();

  if (!companyCode) throw httpError(400, 'Company code is required.');
  if (!mobile) throw httpError(400, 'Mobile number is required.');

  const compId = deriveCompId(companyCode);
  if (!compId) throw httpError(400, 'Could not derive a company id from that company code.');

  const server = await resolveServer({ server: explicitServer, uniqueId });
  const apiUrl = apiUrlFor(server);

  // --- login lookup ---
  const loginRes = await postForm(apiUrl, {
    action: 'login_member',
    username: mobile,
    comp_id: compId,
  });
  const loginData = parseLooseJSON(loginRes.body);
  if (!isSuccess(loginData)) {
    throw httpError(401, loginData?.error || 'Login failed. Check your mobile number and company code.');
  }
  const memberRow = resultArray(loginData)[0] || loginData;
  const member = pick(memberRow, [
    'MemberID',
    'Member_ID',
    'Name',
    'Email',
    'Occupation',
    'Company_Id',
    'Address',
    'DOB',
  ]);
  const memberId = member.MemberID || member.Member_ID;
  if (!memberId) throw httpError(502, 'Login succeeded but no MemberID was returned.');

  // --- branch details (best effort) ---
  let branch = {};
  try {
    const branchRes = await postForm(apiUrl, { action: 'show_branch_details', Company_Id: compId });
    const branchData = parseLooseJSON(branchRes.body);
    if (isSuccess(branchData)) {
      branch = pick(resultArray(branchData)[0] || {}, [
        'Name',
        'Branch',
        'Contact',
        'Branch_id',
        'Status',
        'Address',
        'GST_No',
        'OwnerEmail',
      ]);
    }
  } catch {
    /* non-fatal: branch is decorative */
  }

  return {
    ok: true,
    server,
    compId,
    memberId: String(memberId),
    member,
    branch,
  };
}

async function handleAttendance(body) {
  const server = String(body.server || '').trim();
  const compId = String(body.compId || '').trim();
  const memberId = String(body.memberId || '').trim();
  if (!server || !compId || !memberId) throw httpError(400, 'Missing session details for attendance.');
  const u = new URL(server);
  if (!isAllowedHost(u.hostname)) throw httpError(400, 'Server host is not a gymtime.in address.');

  const res = await postForm(apiUrlFor(server), {
    action: 'show_biometric_attendance',
    comp_id: compId,
    member_id: memberId,
  });
  const data = parseLooseJSON(res.body);
  // success:0 with "No records found" is a valid empty history, not an error.
  const rows = resultArray(data);
  const dates = [
    ...new Set(
      rows
        .map((r) => String(r?.AttendanceDate || r?.Attendance_Date || '').trim().slice(0, 10))
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)),
    ),
  ].sort();

  return { ok: true, dates, count: dates.length, success: data?.success ?? null };
}

async function handleDefaults() {
  // Pre-fill the sign-in form from the repo's account.json when present.
  // Only non-secret identifiers are ever exposed (never password/otp/token).
  try {
    const raw = await fsp.readFile(ACCOUNT_FILE, 'utf8');
    const acc = JSON.parse(raw);
    return {
      uniqueId: acc.unique_id ?? '',
      companyCode: acc.company_code ?? '',
      mobile: acc.username ?? '',
      gym: acc.gym ?? '',
      branch: acc.branch ?? '',
    };
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Minimal HTTP plumbing
// ---------------------------------------------------------------------------

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function sendJSON(res, status, obj) {
  const payload = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(payload);
}

function readBody(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(httpError(413, 'Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      if (!text) return resolve({});
      try {
        resolve(JSON.parse(text));
      } catch {
        reject(httpError(400, 'Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
};

async function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const filePath = path.join(PUBLIC_DIR, path.normalize(rel));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const data = await fsp.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=300',
    });
    res.end(data);
  } catch {
    // SPA fallback -> index.html
    try {
      const data = await fsp.readFile(path.join(PUBLIC_DIR, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(data);
    } catch {
      res.writeHead(404).end('Not found');
    }
  }
}

const ROUTES = {
  'POST /api/session': handleSession,
  'POST /api/attendance': handleAttendance,
};

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && pathname === '/api/defaults') {
    return sendJSON(res, 200, await handleDefaults());
  }
  if (req.method === 'GET' && pathname === '/api/health') {
    return sendJSON(res, 200, { ok: true, uptime: process.uptime() });
  }

  const route = ROUTES[`${req.method} ${pathname}`];
  if (route) {
    try {
      const body = await readBody(req);
      const result = await route(body);
      return sendJSON(res, 200, result);
    } catch (err) {
      const status = err.status || 502;
      if (!err.status) console.error('[api]', pathname, err.message);
      return sendJSON(res, status, { ok: false, error: err.message || 'Upstream error' });
    }
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    return serveStatic(req, res, pathname);
  }

  sendJSON(res, 405, { ok: false, error: 'Method not allowed' });
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Gymtime Attendance Portal`);
  console.log(`  ▸ http://localhost:${PORT}\n`);
});
