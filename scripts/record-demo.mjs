// ---------------------------------------------------------------------------
// Records a narrated demo video of the Order Explorer by driving a real Chrome.
//
//   npm run demo:record                                   (live Vercel site)
//   BASE_URL=http://localhost:5173 npm run demo:record    (local dev server)
//
// Steps:
//  1. Generate a voice clip for every narration line (edge-tts, en-IN voice).
//  2. Drive the app step by step; each step waits for its narration to finish,
//     so voice and screen stay in sync. A caption bar shows the step + URL, and
//     a "Network log" shows every API request (including cancelled ones).
//  3. Mix the voice clips onto the screen recording → demo-video/order-explorer-demo.mp4
//
// Needs: Google Chrome, Python `edge-tts` (pip install --user edge-tts), npm deps.
// ---------------------------------------------------------------------------
import { chromium } from 'playwright';
import ffmpegPath from 'ffmpeg-static';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NARRATION } from './demo-narration.mjs';

const BASE_URL = process.env.BASE_URL || 'https://dareaisearch-data-explorer.vercel.app';
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const VOICE = process.env.VOICE || 'en-IN-NeerjaNeural';
const OUT_DIR = 'demo-video';
const AUDIO_DIR = join(OUT_DIR, 'audio');
const SIZE = { width: 1280, height: 720 };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- 1. Voice clips ------------------------------------------------------------
function audioDuration(file) {
  // ffmpeg prints "Duration: 00:00:07.15" to stderr when given only an input
  let text = '';
  try {
    execFileSync(ffmpegPath, ['-i', file], { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (err) {
    text = String(err.stderr);
  }
  const [, h, m, s] = text.match(/Duration: (\d+):(\d+):([\d.]+)/);
  return (Number(h) * 3600 + Number(m) * 60 + Number(s)) * 1000;
}

function generateVoice() {
  mkdirSync(AUDIO_DIR, { recursive: true });
  const durations = {};
  for (const [id, { say }] of Object.entries(NARRATION)) {
    const file = join(AUDIO_DIR, `${id}.mp3`);
    if (!existsSync(file)) {
      execFileSync('python3', ['-m', 'edge_tts', '--voice', VOICE, '--rate', '+4%', '--text', say, '--write-media', file], {
        stdio: 'ignore',
      });
    }
    durations[id] = audioDuration(file);
  }
  const total = Object.values(durations).reduce((a, b) => a + b, 0) / 1000;
  console.log(`Voice: ${Object.keys(durations).length} clips, ${total.toFixed(0)} s of narration`);
  return durations;
}

// ---------- Overlays injected into every page ----------------------------------------
const OVERLAYS = () => {
  // Network log: wrap fetch() so every /api request is listed with its outcome.
  const entries = [];
  const render = () => {
    const box = document.getElementById('__demo-net');
    if (box) box.innerHTML = '<b style="opacity:.8">Network log</b>' + entries.slice(-5).map((e) => `<div>${e.html}</div>`).join('');
  };
  const realFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(href, location.href);
    if (!url.pathname.startsWith('/api/')) return realFetch(input, init);
    const p = url.searchParams;
    const parts = ['q', 'status', 'category', 'sort'].filter((k) => p.get(k)).map((k) => `${k}=${p.getAll(k).join(',')}`);
    if (p.get('offset') && p.get('offset') !== '0') parts.push(`offset=${p.get('offset')}`);
    const label = `GET ${url.pathname.replace('/api', '')}${parts.length ? ' ' + parts.join(' ') : ''}`.slice(0, 48);
    const entry = { html: `⏳ ${label} <span style="opacity:.7">loading…</span>` };
    entries.push(entry);
    render();
    const start = performance.now();
    return realFetch(input, init).then(
      (res) => {
        const secs = ((performance.now() - start) / 1000).toFixed(1);
        entry.html = res.ok
          ? `<span style="color:#69db7c">✓ ${res.status}</span> ${label} <span style="opacity:.7">${secs}s</span>`
          : `<span style="color:#ff8787">✕ ${res.status}</span> ${label}`;
        render();
        return res;
      },
      (err) => {
        entry.html = err && err.name === 'AbortError'
          ? `<span style="color:#ffc078;font-weight:700">⊘ CANCELLED</span> ${label}`
          : `<span style="color:#ff8787">✕ failed</span> ${label}`;
        render();
        throw err;
      },
    );
  };

  const install = () => {
    if (document.getElementById('__demo-caption')) return;
    const bar = document.createElement('div');
    bar.id = '__demo-caption';
    bar.style.cssText =
      'position:fixed;left:0;right:0;bottom:0;z-index:99999;background:rgba(17,20,30,.93);color:#fff;' +
      'font:15px/1.35 system-ui,sans-serif;padding:9px 18px;pointer-events:none';
    bar.innerHTML = '<div id="__demo-step" style="font-weight:700;font-size:16px"></div>' +
      '<div id="__demo-url" style="opacity:.75;font-family:ui-monospace,monospace;font-size:12.5px;margin-top:2px"></div>';
    const net = document.createElement('div');
    net.id = '__demo-net';
    net.style.cssText =
      'position:fixed;right:12px;bottom:66px;z-index:99999;width:400px;background:rgba(17,20,30,.9);color:#e6e8ef;' +
      'font:12px/1.55 ui-monospace,monospace;padding:8px 10px;border-radius:8px;pointer-events:none;white-space:nowrap;overflow:hidden';
    document.body.append(bar, net);
    document.body.style.paddingBottom = '170px'; // so the bottom of the page can scroll above the overlays
    render();
    const showUrl = () => {
      const el = document.getElementById('__demo-url');
      if (el) el.textContent = 'URL: ' + location.pathname + decodeURIComponent(location.search);
    };
    showUrl();
    setInterval(showUrl, 200);
    const saved = sessionStorage.getItem('__demo-step');
    if (saved) document.getElementById('__demo-step').textContent = saved;
  };
  if (document.body) install();
  else document.addEventListener('DOMContentLoaded', install);
};

// ---------- 2. Record ----------------------------------------------------------------
async function record(durations) {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    slowMo: 30,
    args: [`--window-size=${SIZE.width},${SIZE.height}`],
  });
  const context = await browser.newContext({ viewport: SIZE, recordVideo: { dir: OUT_DIR, size: SIZE } });
  await context.addInitScript(OVERLAYS);
  const page = await context.newPage();
  const t0 = Date.now(); // the video starts when the page is created
  const timeline = [];

  /** Shows the caption, logs when the voice line starts, returns a function that waits until it has finished. */
  async function say(id) {
    const { caption } = NARRATION[id];
    timeline.push({ id, atMs: Date.now() - t0 });
    await page.evaluate((t) => {
      sessionStorage.setItem('__demo-step', t);
      const el = document.getElementById('__demo-step');
      if (el) el.textContent = t;
    }, caption);
    const endsAt = Date.now() + durations[id] + 350;
    return () => pause(Math.max(0, endsAt - Date.now()));
  }
  const rows = () => page.locator('tbody tr');
  const waitForRows = () => rows().first().waitFor({ timeout: 25000 });
  const search = page.getByRole('searchbox', { name: /search orders/i });
  const chip = (name) => page.locator('label.chip', { hasText: name });
  const settled = () => page.getByText('Updating results…', { exact: true }).first().waitFor({ state: 'hidden', timeout: 25000 });

  async function setChaos(failRate, delay) {
    const panel = page.locator('details.chaos');
    if (!(await panel.evaluate((d) => d.open))) await panel.locator('summary').click();
    if (failRate !== undefined) await panel.locator('select').nth(0).selectOption(String(failRate));
    if (delay !== undefined) await panel.locator('select').nth(1).selectOption(delay);
    await pause(700);
    await panel.locator('summary').click();
  }

  // ---- Setup (before narration): reliable, reasonably fast API so random failures don't derail the demo
  await page.goto(BASE_URL);
  await page.evaluate(() => {
    localStorage.setItem('chaos', JSON.stringify({ minDelay: 200, maxDelay: 800, failRate: 0 }));
    localStorage.setItem('explorer.theme', 'light');
  });
  await page.reload();
  await waitForRows();

  let done = await say('intro');
  await done();
  done = await say('tools');
  await page.locator('details.chaos summary').click();
  await pause(2500);
  await page.locator('details.chaos summary').click();
  await done();

  // ---- 1. Never stale
  done = await say('stale1');
  await setChaos(undefined, '2000-6000');
  await done();
  done = await say('stale2');
  await search.click();
  await search.pressSequentially('ear', { delay: 130 });
  await pause(900); // debounce passes → the "ear" request starts
  await search.pressSequentially('buds', { delay: 130 });
  await done();
  done = await say('stale3');
  await done();
  await settled();
  done = await say('stale4');
  await setChaos(undefined, '200-3000');
  await done();

  // ---- 2. Filters + sort
  done = await say('filters');
  await chip('Shipped').click();
  await pause(1800);
  await page.getByRole('combobox', { name: /category/i }).selectOption('Electronics');
  await pause(1800);
  await page.getByRole('combobox', { name: /sort by/i }).selectOption('amount:desc');
  await settled();
  await done();

  // ---- 3. Refresh + Back/Forward
  done = await say('refresh');
  await page.reload();
  await waitForRows();
  await done();
  done = await say('backfwd');
  await page.goBack();
  await pause(2200);
  await page.goForward();
  await waitForRows();
  await done();

  // ---- 4. Error + Retry
  done = await say('error1');
  await setChaos(1);
  await chip('Delivered').click();
  await page.getByRole('alert').waitFor({ timeout: 25000 });
  await done();
  done = await say('error2');
  await done();
  done = await say('error3');
  await setChaos(0);
  await page.getByRole('alert').getByRole('button', { name: /retry/i }).click();
  await waitForRows();
  await done();

  // ---- 5. Infinite loading + scroll restore
  done = await say('scroll1');
  await page.getByRole('button', { name: /^clear all$/i }).click();
  await settled();
  await waitForRows();
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, 1800);
    await pause(1700);
  }
  await done();
  done = await say('scroll2');
  // Wait until no "load more" request is in flight, then let the URL save pages + scroll position.
  await page.getByText('Loading more orders…').waitFor({ state: 'hidden', timeout: 25000 });
  await pause(1500);
  await page.reload();
  await waitForRows();
  await pause(1500);
  await done();

  // ---- 6. Detail view at a scrolled position
  done = await say('detail1');
  const orderLinkId = await page.evaluate(() => {
    const link = [...document.querySelectorAll('tbody a')].find((a) => {
      const r = a.getBoundingClientRect();
      return r.top > 200 && r.top < 420;
    });
    return link && link.id;
  });
  await page.locator(`[id="${orderLinkId}"]`).click();
  await page.getByRole('dialog').getByText('Customer').waitFor({ timeout: 25000 });
  await done();
  done = await say('detail2');
  await pause(800);
  await page.keyboard.press('Escape');
  await done();

  // ---- 7. Partial failure
  done = await say('partial1');
  await setChaos(1);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const partial = page.getByRole('alert').filter({ hasText: /couldn’t load more/i });
  await partial.waitFor({ timeout: 25000 });
  await partial.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await done();
  done = await say('partial2');
  await pause(2500);
  await setChaos(0);
  await partial.getByRole('button', { name: /retry/i }).click();
  await done();
  await page.evaluate(() => window.scrollTo(0, 0));

  // ---- 8. Empty state
  done = await say('empty');
  await search.fill('xyz123');
  await page.getByText(/no orders match/i).waitFor({ timeout: 25000 });
  await pause(1500);
  await page.getByRole('button', { name: /clear all filters/i }).click();
  await waitForRows();
  await done();

  // ---- 9. Keyboard only
  done = await say('kb1');
  await search.focus();
  await pause(600);
  await page.keyboard.press('Tab'); // → "Pending" chip
  await pause(900);
  await page.keyboard.press('Space'); // select Pending
  await pause(1800);
  await page.keyboard.press('Tab'); // → "Processing"
  await pause(900);
  await page.keyboard.press('Shift+Tab'); // back to "Pending"
  await pause(700);
  await page.keyboard.press('Space'); // deselect Pending
  await waitForRows();
  await done();
  done = await say('kb2');
  await page.locator('th button', { hasText: 'Amount' }).focus();
  await pause(900);
  await page.keyboard.press('Enter'); // sort by amount
  await settled();
  await rows().first().getByRole('link').focus();
  await pause(900);
  await page.keyboard.press('Enter'); // open details
  await page.getByRole('dialog').getByText('Customer').waitFor({ timeout: 25000 });
  await done();
  done = await say('kb3');
  await pause(1800);
  await page.keyboard.press('Escape');
  await done();

  // ---- 10. Deep link + dark mode
  done = await say('deeplink');
  await page.goto(`${BASE_URL}/orders/ORD-100042?status=shipped`);
  await page.getByRole('dialog').getByText('Customer').waitFor({ timeout: 25000 });
  await done();
  await page.keyboard.press('Escape');
  done = await say('dark');
  await page.getByRole('button', { name: /dark mode/i }).click();
  await pause(2200);
  await page.getByRole('button', { name: /dark mode/i }).click();
  await done();

  done = await say('outro');
  await page.evaluate(() => localStorage.setItem('chaos', JSON.stringify({ minDelay: 200, maxDelay: 3000, failRate: 0.1 })));
  await done();
  await pause(800);

  await context.close(); // finishes writing the video
  await browser.close();
  const webm = readdirSync(OUT_DIR).find((f) => f.endsWith('.webm'));
  const videoPath = join(OUT_DIR, 'screen.webm');
  renameSync(join(OUT_DIR, webm), videoPath);
  writeFileSync(join(OUT_DIR, 'timeline.json'), JSON.stringify(timeline, null, 2));
  return { videoPath, timeline };
}

// ---------- 3. Mix voice onto the video -------------------------------------------------
function mix(videoPath, timeline) {
  const out = join(OUT_DIR, 'order-explorer-demo.mp4');
  const inputs = ['-y', '-i', videoPath];
  const filters = [];
  timeline.forEach(({ id, atMs }, i) => {
    inputs.push('-i', join(AUDIO_DIR, `${id}.mp3`));
    filters.push(`[${i + 1}:a]adelay=${atMs}|${atMs}[a${i}]`);
  });
  const mixInputs = timeline.map((_, i) => `[a${i}]`).join('');
  filters.push(`${mixInputs}amix=inputs=${timeline.length}:normalize=0:dropout_transition=0[aout]`);
  execFileSync(
    ffmpegPath,
    [...inputs, '-filter_complex', filters.join(';'), '-map', '0:v', '-map', '[aout]',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k',
      '-movflags', '+faststart', out],
    { stdio: 'ignore' },
  );
  return out;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const f of readdirSync(OUT_DIR)) if (f.endsWith('.webm')) rmSync(join(OUT_DIR, f));

  const durations = generateVoice();
  console.log('Recording… (a few minutes)');
  const { videoPath, timeline } = await record(durations);
  console.log('Mixing voice into the video…');
  const out = mix(videoPath, timeline);
  console.log(`\n✔ Narrated demo video saved: ${out}`);
}

main().catch((err) => {
  console.error('Demo recording failed:', err);
  process.exit(1);
});
