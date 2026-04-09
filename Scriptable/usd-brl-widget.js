// USD → BRL Exchange Rate Widget
// Built for Scriptable (https://scriptable.app)
// Uses Frankfurter API — no API key required
//
// Setup:
//   1. Install Scriptable from the App Store (free)
//   2. Paste this script into a new Scriptable script
//   3. Add a Scriptable widget to your home screen
//   4. Long-press the widget → Edit Widget → choose this script

const API_URL = "https://api.frankfurter.app/latest?from=USD&to=BRL";

// --- Config ---
const BACKGROUND_COLOR = new Color("#0f172a");  // dark navy
const ACCENT_COLOR     = new Color("#22d3a0");  // teal green
const TEXT_COLOR       = new Color("#e2e8f0");  // light gray
const MUTED_COLOR      = new Color("#64748b");  // slate gray

// --- Fetch ---
async function fetchRate() {
  const req = new Request(API_URL);
  req.timeoutInterval = 10;
  const json = await req.loadJSON();
  return {
    rate: json.rates.BRL,
    date: json.date,       // "YYYY-MM-DD"
    base: json.base,       // "USD"
  };
}

// --- Build widget ---
function buildWidget(data) {
  const w = new ListWidget();
  w.backgroundColor = BACKGROUND_COLOR;
  w.setPadding(14, 16, 14, 16);

  // Refresh every 30 minutes
  const nextRefresh = new Date();
  nextRefresh.setMinutes(nextRefresh.getMinutes() + 30);
  w.refreshAfterDate = nextRefresh;

  // Header
  const header = w.addText("USD  →  BRL");
  header.font = Font.semiboldRoundedSystemFont(13);
  header.textColor = MUTED_COLOR;

  w.addSpacer(6);

  // Rate — main number
  const rateStack = w.addStack();
  rateStack.layoutHorizontally();
  rateStack.bottomAlignContent();

  const symbol = rateStack.addText("R$");
  symbol.font = Font.boldSystemFont(18);
  symbol.textColor = ACCENT_COLOR;

  rateStack.addSpacer(4);

  const rateText = rateStack.addText(data.rate.toFixed(3));
  rateText.font = Font.boldSystemFont(34);
  rateText.textColor = ACCENT_COLOR;
  rateText.minimumScaleFactor = 0.6;

  w.addSpacer(6);

  // Subtext: "per 1 US Dollar"
  const sub = w.addText("per 1 US Dollar");
  sub.font = Font.systemFont(11);
  sub.textColor = TEXT_COLOR;

  w.addSpacer(8);

  // Updated date
  const updated = w.addText(`Updated ${formatDate(data.date)}`);
  updated.font = Font.systemFont(10);
  updated.textColor = MUTED_COLOR;

  return w;
}

// --- Error widget ---
function buildErrorWidget(message) {
  const w = new ListWidget();
  w.backgroundColor = BACKGROUND_COLOR;
  w.setPadding(14, 16, 14, 16);

  const title = w.addText("USD → BRL");
  title.font = Font.semiboldRoundedSystemFont(13);
  title.textColor = MUTED_COLOR;

  w.addSpacer(8);

  const err = w.addText("⚠ " + message);
  err.font = Font.systemFont(13);
  err.textColor = new Color("#f87171"); // red
  err.minimumScaleFactor = 0.7;

  return w;
}

// --- Helpers ---
function formatDate(isoDate) {
  // "2025-04-09" → "Apr 9, 2025"
  const [year, month, day] = isoDate.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// --- Main ---
let widget;
try {
  const data = await fetchRate();
  widget = buildWidget(data);
} catch (e) {
  widget = buildErrorWidget("Could not load rate");
  console.error(e.message);
}

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  // Preview when run inside the Scriptable app
  await widget.presentSmall();
}

Script.complete();
