// Financial News Widget
// Built for Scriptable (https://scriptable.app)
// Data: Yahoo Finance RSS feed — no API key required
//
// Sizes: small (2 headlines, text-only), medium (3 headlines + thumbnails),
//        large (5 headlines + thumbnails)
// Tap: tapping a headline opens the article (Yahoo Finance app via universal link,
//      or Safari as fallback); tapping the header/footer opens the app directly.
// Note: iOS may refresh the widget less often in Low Power Mode.
//
// Setup:
//   1. Install Scriptable from the App Store (free)
//   2. Paste this script into a new Scriptable script
//   3. Add a Scriptable widget to your home screen
//   4. Long-press the widget → Edit Widget → choose this script

const RSS_URL           = "https://finance.yahoo.com/news/rssindex";
const YAHOO_FINANCE_URL = "yahoo-finance://";

const BACKGROUND_COLOR  = new Color("#242529");
const TEXT_COLOR        = new Color("#e2e8f0");
const MUTED_COLOR       = new Color("#64748b");
const ACCENT_COLOR      = new Color("#22d3a0");
const ERROR_COLOR       = new Color("#f87171");
const PLACEHOLDER_COLOR = new Color("#3a3a3c");  // image placeholder background

const ITEMS_SMALL  = 2;
const ITEMS_MEDIUM = 3;
const ITEMS_LARGE  = 4;

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
  return date.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
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
    if (!title) continue;

    // Link
    const linkMatch = block.match(/<link>\s*(https?:\/\/[^\s<]+)\s*<\/link>/);
    const link = linkMatch
      ? decodeHTMLEntities(linkMatch[1].trim())
      : YAHOO_FINANCE_URL;

    // pubDate — RFC 2822; JS Date handles this natively
    const pubMatch = block.match(/<pubDate>([^<]+)<\/pubDate>/);
    const pubDate  = pubMatch
      ? (() => { const d = new Date(pubMatch[1].trim()); return isNaN(d.getTime()) ? null : d; })()
      : null;

    // Source publisher name
    const srcMatch = block.match(/<source[^>]*>([^<]+)<\/source>/);
    const source   = srcMatch ? srcMatch[1].trim() : "Yahoo Finance";

    // Thumbnail image URL — try media:content, media:thumbnail, then enclosure
    let imageUrl = null;
    const mc = block.match(/<media:content[^>]*url="([^"]+)"[^>]*>/);
    if (mc) imageUrl = mc[1];
    if (!imageUrl) {
      const mt = block.match(/<media:thumbnail[^>]*url="([^"]+)"[^>]*>/);
      if (mt) imageUrl = mt[1];
    }
    if (!imageUrl) {
      const enc = block.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image[^"]*"[^>]*>/);
      if (enc) imageUrl = enc[1];
    }

    items.push({ title, link, pubDate, source, imageUrl, image: null });
  }

  return items;
}

// --- Data Fetch ---

async function fetchNews() {
  const req = new Request(RSS_URL);
  req.timeoutInterval = 10;
  const xmlString = await req.loadString();
  const items     = parseRSS(xmlString);

  // Load all thumbnails concurrently; silently ignore failures
  await Promise.all(items.map(async (item) => {
    if (!item.imageUrl) return;
    try {
      const imgReq = new Request(item.imageUrl);
      imgReq.timeoutInterval = 5;
      item.image = await imgReq.loadImage();
    } catch (_) {
      item.image = null;
    }
  }));

  return { items, fetchedAt: new Date() };
}

// --- Widget Components ---

// Adds a single-line header row: title on the left, updated time on the right.
// Used by medium widget where vertical space is very tight.
function addCompactHeader(container, data, titleFontSize, timeFontSize) {
  const row = container.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const title = row.addText("Top Financial News");
  title.font      = Font.boldSystemFont(titleFontSize);
  title.textColor = TEXT_COLOR;

  row.addSpacer();

  const upd = row.addText("Updated " + formatUpdatedTime(data.fetchedAt));
  upd.font      = Font.systemFont(timeFontSize);
  upd.textColor = MUTED_COLOR;
}

// Adds a two-line header: title on top, updated time below, chart icon on the right.
// Used by large widget where there is more vertical room.
function addFullHeader(container, data, titleFontSize, timeFontSize, iconSize) {
  const row = container.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const textCol = row.addStack();
  textCol.layoutVertically();

  const title = textCol.addText("Top Financial News");
  title.font      = Font.boldSystemFont(titleFontSize);
  title.textColor = TEXT_COLOR;

  textCol.addSpacer(2);

  const upd = textCol.addText("Last Updated: " + formatUpdatedTime(data.fetchedAt));
  upd.font      = Font.systemFont(timeFontSize);
  upd.textColor = MUTED_COLOR;

  row.addSpacer(12);

  const sym = SFSymbol.named("chart.line.uptrend.xyaxis");
  sym.applyMediumWeight();
  const icon = row.addImage(sym.image);
  icon.imageSize = new Size(iconSize, iconSize);
  icon.tintColor = ACCENT_COLOR;
}

// Adds the footer separator + "View More News →" row.
function addFooter(container, fontSize) {
  const sep = container.addStack();
  sep.size            = new Size(0, 1);
  sep.backgroundColor = new Color("#64748b", 0.3);

  container.addSpacer(6);

  const footer = container.addStack();
  footer.layoutHorizontally();
  footer.url = YAHOO_FINANCE_URL;

  const footerText = footer.addText("View More News  →");
  footerText.font      = Font.boldSystemFont(fontSize);
  footerText.textColor = TEXT_COLOR;
}

// Adds a news row with thumbnail image (left) and headline + meta (right).
// Used in medium and large widgets.
function addNewsRow(container, item, isLast, imgSize, headlineFontSize, metaFontSize, spacingAfter) {
  const row = container.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  row.url = (item.link && item.link.startsWith("http")) ? item.link : YAHOO_FINANCE_URL;

  // Thumbnail
  const thumb = row.addStack();
  thumb.size         = new Size(imgSize, imgSize);
  thumb.cornerRadius = 8;
  if (item.image) {
    thumb.backgroundImage = item.image;
  } else {
    thumb.backgroundColor = PLACEHOLDER_COLOR;
  }

  row.addSpacer(10);

  // Content: headline + source/time
  const content = row.addStack();
  content.layoutVertically();

  const headline = content.addText(item.title);
  headline.font               = Font.semiboldSystemFont(headlineFontSize);
  headline.textColor          = TEXT_COLOR;
  headline.lineLimit          = 2;
  headline.minimumScaleFactor = 0.85;

  content.addSpacer(3);

  const ago = timeAgo(item.pubDate);
  const metaStr = ago ? item.source + "  " + ago : item.source;
  const meta = content.addText(metaStr);
  meta.font      = Font.systemFont(metaFontSize);
  meta.textColor = MUTED_COLOR;

  if (!isLast) container.addSpacer(spacingAfter);
}

// Adds a text-only news item (no thumbnail). Used in the small widget.
function addSmallNewsItem(container, item, isLast) {
  const row = container.addStack();
  row.layoutVertically();
  row.url = (item.link && item.link.startsWith("http")) ? item.link : YAHOO_FINANCE_URL;

  const headline = row.addText(item.title);
  headline.font               = Font.semiboldSystemFont(11);
  headline.textColor          = TEXT_COLOR;
  headline.lineLimit          = 2;
  headline.minimumScaleFactor = 0.85;

  row.addSpacer(3);

  const ago = timeAgo(item.pubDate);
  const metaStr = ago ? item.source + "  " + ago : item.source;
  const meta = row.addText(metaStr);
  meta.font      = Font.systemFont(9);
  meta.textColor = MUTED_COLOR;

  if (!isLast) container.addSpacer(6);
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

  // Compact two-line header (no icon — narrow square)
  const titleText = w.addText("Top Financial News");
  titleText.font               = Font.boldSystemFont(11);
  titleText.textColor          = TEXT_COLOR;
  titleText.minimumScaleFactor = 0.8;

  w.addSpacer(2);

  const updText = w.addText("Last Updated: " + formatUpdatedTime(new Date()));
  updText.font      = Font.systemFont(9);
  updText.textColor = MUTED_COLOR;

  w.addSpacer(8);

  const slice = data.items.slice(0, ITEMS_SMALL);
  slice.forEach((item, i) => addSmallNewsItem(w, item, i === slice.length - 1));

  w.addSpacer();

  return w;
}

function buildMediumWidget(data) {
  const w = new ListWidget();
  w.backgroundColor = BACKGROUND_COLOR;
  w.setPadding(12, 16, 12, 16);
  w.url = YAHOO_FINANCE_URL;

  const nextRefresh = new Date();
  nextRefresh.setMinutes(nextRefresh.getMinutes() + 30);
  w.refreshAfterDate = nextRefresh;

  // Single-line header — keeps it compact so image rows have room
  addCompactHeader(w, data, 13, 10);
  w.addSpacer(6);

  // 48pt thumbnails leave enough vertical room for the header above
  const slice = data.items.slice(0, ITEMS_MEDIUM);
  slice.forEach((item, i) =>
    addNewsRow(w, item, i === slice.length - 1, 48, 12, 10, 6)
  );

  return w;
}

function buildLargeWidget(data) {
  const w = new ListWidget();
  w.backgroundColor = BACKGROUND_COLOR;
  w.setPadding(16, 18, 12, 18);
  w.url = YAHOO_FINANCE_URL;

  const nextRefresh = new Date();
  nextRefresh.setMinutes(nextRefresh.getMinutes() + 30);
  w.refreshAfterDate = nextRefresh;

  // Two-line header with chart icon — large widget has enough vertical room
  addFullHeader(w, data, 20, 11, 28);
  w.addSpacer(10);

  // 4 items at 62pt: fits comfortably in a large widget (~382pt tall)
  const slice = data.items.slice(0, ITEMS_LARGE);
  slice.forEach((item, i) =>
    addNewsRow(w, item, i === slice.length - 1, 62, 13, 10, 10)
  );

  w.addSpacer(8);
  addFooter(w, 13);

  return w;
}

function buildErrorWidget(message) {
  const w = new ListWidget();
  w.backgroundColor = BACKGROUND_COLOR;
  w.setPadding(14, 16, 14, 16);
  w.url = YAHOO_FINANCE_URL;

  const title = w.addText("Top Financial News");
  title.font      = Font.boldSystemFont(14);
  title.textColor = TEXT_COLOR;

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
