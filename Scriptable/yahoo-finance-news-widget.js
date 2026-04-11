// Financial News Widget
// Built for Scriptable (https://scriptable.app)
// Data: Yahoo Finance RSS feed — no API key required
//
// Sizes: small (2 headlines), medium (4 headlines), large (5 headlines)
// Tap behavior: tapping a headline opens the article via Yahoo Finance universal link
//               (opens in Yahoo Finance app if installed, Safari otherwise);
//               tapping the header area opens the Yahoo Finance app directly.
// Note: iOS may refresh the widget less often in Low Power Mode.
//
// Setup:
//   1. Install Scriptable from the App Store (free)
//   2. Paste this script into a new Scriptable script
//   3. Add a Scriptable widget to your home screen
//   4. Long-press the widget → Edit Widget → choose this script

const RSS_URL           = "https://finance.yahoo.com/news/rssindex";
const YAHOO_FINANCE_URL = "yahoo-finance://";  // fallback tap: opens Yahoo Finance app

const BACKGROUND_COLOR = new Color("#242529");
const TEXT_COLOR       = new Color("#e2e8f0");
const MUTED_COLOR      = new Color("#64748b");
const ACCENT_COLOR     = new Color("#22d3a0");
const ERROR_COLOR      = new Color("#f87171");

const ITEMS_SMALL  = 2;
const ITEMS_MEDIUM = 4;
const ITEMS_LARGE  = 5;

// --- Helpers ---

function decodeHTMLEntities(str) {
  return str
    .replace(/&amp;/g,   "&")
    .replace(/&quot;/g,  '"')
    .replace(/&#39;/g,   "'")
    .replace(/&apos;/g,  "'")
    .replace(/&lt;/g,    "<")
    .replace(/&gt;/g,    ">")
    .replace(/&nbsp;/g,  " ")
    .replace(/&#(\d+);/g,           (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex)  => String.fromCharCode(parseInt(hex, 16)));
}

function timeAgo(date) {
  if (!date || isNaN(date.getTime())) return "";
  const diffMs  = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)    return "just now";
  if (diffMin < 60)   return diffMin + "m ago";
  if (diffMin < 1440) return Math.floor(diffMin / 60) + "h ago";
  return Math.floor(diffMin / 1440) + "d ago";
}

function formatUpdatedTime(date) {
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
  return "Updated " + timeStr;
}

// --- RSS Parsing ---

function parseRSS(xmlString) {
  const items  = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRe.exec(xmlString)) !== null && items.length < ITEMS_LARGE) {
    const block = match[1];

    // Title: try CDATA first, then plain text
    let title = "";
    const cdataTitle = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/);
    if (cdataTitle) {
      title = cdataTitle[1];
    } else {
      const plainTitle = block.match(/<title>([^<]*)<\/title>/);
      title = plainTitle ? plainTitle[1] : "";
    }
    title = decodeHTMLEntities(title).replace(/\s+/g, " ").trim();
    if (!title) continue;  // skip items with no parseable title

    // Link (plain text URL, no CDATA in Yahoo Finance RSS)
    const linkMatch = block.match(/<link>\s*(https?:\/\/[^\s<]+)\s*<\/link>/);
    const link = linkMatch
      ? decodeHTMLEntities(linkMatch[1].trim())
      : YAHOO_FINANCE_URL;

    // pubDate — RFC 2822 format; JS Date constructor handles this natively
    const pubMatch = block.match(/<pubDate>([^<]+)<\/pubDate>/);
    const pubDate  = pubMatch
      ? (() => { const d = new Date(pubMatch[1].trim()); return isNaN(d.getTime()) ? null : d; })()
      : null;

    // Source (publisher name); not always present
    const srcMatch = block.match(/<source[^>]*>([^<]+)<\/source>/);
    const source   = srcMatch ? srcMatch[1].trim() : "Yahoo Finance";

    items.push({ title, link, pubDate, source });
  }

  return items;
}

// --- Data Fetch ---

async function fetchNews() {
  const req = new Request(RSS_URL);
  req.timeoutInterval = 10;
  const xmlString = await req.loadString();
  const items     = parseRSS(xmlString);
  return { items, fetchedAt: new Date() };
}

// --- Widget Components ---

// Adds a single news item (headline + source · time) to `container`.
// Sets the stack URL so tapping the item opens the article directly.
function addNewsItem(container, item, isLast, headlineFontSize, metaFontSize, spacingAfter) {
  const row = container.addStack();
  row.layoutVertically();
  row.url = (item.link && item.link.startsWith("http")) ? item.link : YAHOO_FINANCE_URL;

  const headline = row.addText(item.title);
  headline.font               = Font.semiboldSystemFont(headlineFontSize);
  headline.textColor          = TEXT_COLOR;
  headline.lineLimit          = 2;
  headline.minimumScaleFactor = 0.85;

  row.addSpacer(3);

  const meta = row.addStack();
  meta.layoutHorizontally();

  const srcText = meta.addText(item.source);
  srcText.font      = Font.systemFont(metaFontSize);
  srcText.textColor = MUTED_COLOR;

  const ago = timeAgo(item.pubDate);
  if (ago) {
    const dot = meta.addText(" · ");
    dot.font      = Font.systemFont(metaFontSize);
    dot.textColor = MUTED_COLOR;

    const timeText = meta.addText(ago);
    timeText.font      = Font.systemFont(metaFontSize);
    timeText.textColor = MUTED_COLOR;
  }

  if (!isLast) container.addSpacer(spacingAfter);
}

// --- Widget Builders ---

function buildSmallWidget(data) {
  const w = new ListWidget();
  w.backgroundColor = BACKGROUND_COLOR;
  w.setPadding(12, 14, 12, 14);
  w.url = YAHOO_FINANCE_URL;

  const nextRefresh = new Date();
  nextRefresh.setMinutes(nextRefresh.getMinutes() + 30);
  w.refreshAfterDate = nextRefresh;

  // Two-line header (stacked vertically to fit the narrow square)
  const titleText = w.addText("FINANCE NEWS");
  titleText.font      = Font.boldSystemFont(10);
  titleText.textColor = ACCENT_COLOR;

  w.addSpacer(2);

  const updText = w.addText(formatUpdatedTime(data.fetchedAt));
  updText.font      = Font.systemFont(9);
  updText.textColor = MUTED_COLOR;

  w.addSpacer(8);

  const slice = data.items.slice(0, ITEMS_SMALL);
  slice.forEach((item, i) => addNewsItem(w, item, i === slice.length - 1, 11, 9, 6));

  w.addSpacer();  // push content to the top

  return w;
}

function buildMediumWidget(data) {
  const w = new ListWidget();
  w.backgroundColor = BACKGROUND_COLOR;
  w.setPadding(14, 16, 14, 16);
  w.url = YAHOO_FINANCE_URL;

  const nextRefresh = new Date();
  nextRefresh.setMinutes(nextRefresh.getMinutes() + 30);
  w.refreshAfterDate = nextRefresh;

  // Single-row header: title left, updated time right
  const header = w.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();

  const titleText = header.addText("FINANCE NEWS");
  titleText.font      = Font.boldSystemFont(12);
  titleText.textColor = ACCENT_COLOR;

  header.addSpacer();

  const updText = header.addText(formatUpdatedTime(data.fetchedAt));
  updText.font      = Font.systemFont(10);
  updText.textColor = MUTED_COLOR;

  w.addSpacer(8);

  const slice = data.items.slice(0, ITEMS_MEDIUM);
  slice.forEach((item, i) => addNewsItem(w, item, i === slice.length - 1, 13, 10, 8));

  return w;
}

function buildLargeWidget(data) {
  const w = new ListWidget();
  w.backgroundColor = BACKGROUND_COLOR;
  w.setPadding(16, 18, 16, 18);
  w.url = YAHOO_FINANCE_URL;

  const nextRefresh = new Date();
  nextRefresh.setMinutes(nextRefresh.getMinutes() + 30);
  w.refreshAfterDate = nextRefresh;

  // Single-row header: title left, updated time right
  const header = w.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();

  const titleText = header.addText("FINANCE NEWS");
  titleText.font      = Font.boldSystemFont(13);
  titleText.textColor = ACCENT_COLOR;

  header.addSpacer();

  const updText = header.addText(formatUpdatedTime(data.fetchedAt));
  updText.font      = Font.systemFont(11);
  updText.textColor = MUTED_COLOR;

  w.addSpacer(6);

  // Subtle 1pt separator line below the header
  const sep = w.addStack();
  sep.size            = new Size(0, 1);
  sep.backgroundColor = new Color("#64748b", 0.3);

  w.addSpacer(8);

  const slice = data.items.slice(0, ITEMS_LARGE);
  slice.forEach((item, i) => addNewsItem(w, item, i === slice.length - 1, 13, 10, 10));

  return w;
}

function buildErrorWidget(message) {
  const w = new ListWidget();
  w.backgroundColor = BACKGROUND_COLOR;
  w.setPadding(14, 16, 14, 16);
  w.url = YAHOO_FINANCE_URL;

  const title = w.addText("FINANCE NEWS");
  title.font      = Font.boldSystemFont(12);
  title.textColor = ACCENT_COLOR;

  w.addSpacer(8);

  const err = w.addText("⚠ " + message);
  err.font               = Font.systemFont(13);
  err.textColor          = ERROR_COLOR;
  err.minimumScaleFactor = 0.7;

  return w;
}

// --- Main ---

let widget;
try {
  const data = await fetchNews();
  if (!data.items.length) throw new Error("No news available");

  const family = config.widgetFamily;
  if (family === "small")      widget = buildSmallWidget(data);
  else if (family === "large") widget = buildLargeWidget(data);
  else                         widget = buildMediumWidget(data);
} catch (e) {
  widget = buildErrorWidget(e.message || "Could not load news");
  console.error(e);
}

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentMedium();
}

Script.complete();
