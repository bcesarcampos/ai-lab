// USD → BRL Converter Widget
// Built for Scriptable (https://scriptable.app)
// Data: AwesomeAPI — free, no API key required
//
// Setup:
//   1. Install Scriptable from the App Store (free)
//   2. Paste this script into a new Scriptable script named "usd-brl-converter-widget"
//   3. Add a Scriptable widget to your home screen
//   4. Long-press the widget → Edit Widget → choose this script
//   5. Tap the widget anytime to set the USD amount you want converted

const API_URL      = "https://economia.awesomeapi.com.br/json/last/USD-BRL";
const KEYCHAIN_KEY = "usd_brl_conv_amount";
const DEFAULT_AMT  = 1;

// --- Colors (original dark navy + teal palette) ---
const BG_COLOR     = new Color("#0f172a");  // dark navy
const ACCENT_COLOR = new Color("#22d3a0");  // teal green  (positive change)
const TEXT_COLOR   = new Color("#e2e8f0");  // light gray
const MUTED_COLOR  = new Color("#64748b");  // slate gray
const RED_COLOR    = new Color("#f87171");  // red         (negative change)

// --- API ---
async function fetchRate() {
  const req = new Request(API_URL);
  req.timeoutInterval = 10;
  const json = await req.loadJSON();
  const d = json.USDBRL;
  return {
    bid:       parseFloat(d.bid),
    high:      parseFloat(d.high),
    low:       parseFloat(d.low),
    pctChange: parseFloat(d.pctChange),
    timestamp: d.create_date,  // "YYYY-MM-DD HH:MM:SS"
  };
}

// --- Persistent amount (Keychain) ---
function getAmount() {
  if (Keychain.contains(KEYCHAIN_KEY)) {
    const v = parseFloat(Keychain.get(KEYCHAIN_KEY));
    return isNaN(v) || v <= 0 ? DEFAULT_AMT : v;
  }
  return DEFAULT_AMT;
}

function setAmount(value) {
  Keychain.set(KEYCHAIN_KEY, String(value));
}

// --- Interactive prompt (shown when widget is tapped) ---
async function promptForAmount() {
  const current = getAmount();
  const alert = new Alert();
  alert.title = "Dollar Today";
  alert.message = "Enter the USD amount to convert to BRL:";
  alert.addTextField("USD amount", String(current));
  alert.addAction("Save");
  alert.addCancelAction("Cancel");
  const idx = await alert.presentAlert();
  if (idx === 0) {
    const val = parseFloat(alert.textFieldValue(0));
    if (!isNaN(val) && val > 0) setAmount(val);
  }
}

// --- Helpers ---
function accentFor(pctChange) {
  return pctChange >= 0 ? ACCENT_COLOR : RED_COLOR;
}

function arrowSymbolFor(pctChange) {
  return SFSymbol.named(pctChange >= 0 ? "arrow.up.right" : "arrow.down.right");
}

// Format number as "5,15" (Brazilian locale, 2 decimal places)
function toBRL(value) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// "YYYY-MM-DD HH:MM:SS" → "HH:MM"
function formatTime(timestamp) {
  const [, time] = timestamp.split(" ");
  return time.slice(0, 5);
}

// Format USD amount for display: "1" → "1", "1.5" → "1.50"
function fmtUSD(amount) {
  return amount % 1 === 0
    ? String(amount)
    : amount.toFixed(2);
}

// --- Shared widget base ---
function baseWidget() {
  const w = new ListWidget();
  w.backgroundColor = BG_COLOR;
  const next = new Date();
  next.setMinutes(next.getMinutes() + 30);
  w.refreshAfterDate = next;
  // Tapping opens this script to prompt for a new amount
  w.url = `scriptable:///run/${encodeURIComponent(Script.name())}`;
  return w;
}

// --- Shared layout helpers ---

// Header row: teal "$" icon + "Dollar Today"
function addHeader(parent) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const icon = row.addText("$");
  icon.font = Font.boldSystemFont(14);
  icon.textColor = ACCENT_COLOR;

  row.addSpacer(6);

  const title = row.addText("Dollar Today");
  title.font = Font.semiboldRoundedSystemFont(14);
  title.textColor = TEXT_COLOR;
}

// Large rate text + directional arrow + pct change on the next line
function addRateBlock(parent, rate, rateFontSize) {
  const accent = accentFor(rate.pctChange);

  // "R$ X,XX"
  const rateStack = parent.addStack();
  rateStack.layoutHorizontally();
  rateStack.bottomAlignContent();

  const sym = rateStack.addText("R$");
  sym.font = Font.boldSystemFont(rateFontSize * 0.55);
  sym.textColor = ACCENT_COLOR;
  rateStack.addSpacer(4);

  const rateText = rateStack.addText(toBRL(rate.bid));
  rateText.font = Font.boldSystemFont(rateFontSize);
  rateText.textColor = TEXT_COLOR;
  rateText.minimumScaleFactor = 0.6;

  // Arrow + "X.XX%"
  const changeRow = parent.addStack();
  changeRow.layoutHorizontally();
  changeRow.centerAlignContent();

  const sfSym = arrowSymbolFor(rate.pctChange);
  sfSym.applyFont(Font.systemFont(13));
  const arrowImg = changeRow.addImage(sfSym.image);
  arrowImg.tintColor = accent;
  arrowImg.imageSize = new Size(15, 15);
  changeRow.addSpacer(3);

  const pctText = changeRow.addText(`${Math.abs(rate.pctChange).toFixed(2)}%`);
  pctText.font = Font.boldSystemFont(14);
  pctText.textColor = accent;
}

// "USD X → R$ Y,YY" conversion line
function addConversionLine(parent, rate, amount, small = false) {
  const converted = amount * rate.bid;
  const label = small
    ? `$${fmtUSD(amount)} → R$ ${toBRL(converted)}`
    : `USD ${fmtUSD(amount)} = R$ ${toBRL(converted)}`;
  const text = parent.addText(label);
  text.font = Font.systemFont(small ? 11 : 13);
  text.textColor = MUTED_COLOR;
  text.minimumScaleFactor = 0.7;
}

// "Updated at HH:MM"
function addUpdatedAt(parent, timestamp) {
  const updated = parent.addText(`Updated at ${formatTime(timestamp)}`);
  updated.font = Font.systemFont(10);
  updated.textColor = MUTED_COLOR;
}

// --- Small widget ---
function buildSmallWidget(rate, amount) {
  const w = baseWidget();
  w.setPadding(14, 16, 14, 16);

  addHeader(w);
  w.addSpacer();
  addRateBlock(w, rate, 30);
  w.addSpacer(6);
  addConversionLine(w, rate, amount, true);
  w.addSpacer(4);
  addUpdatedAt(w, rate.timestamp);

  return w;
}

// --- Medium widget ---
function buildMediumWidget(rate, amount) {
  const w = baseWidget();
  w.setPadding(16, 18, 16, 18);

  addHeader(w);
  w.addSpacer(8);

  const mainRow = w.addStack();
  mainRow.layoutHorizontally();
  mainRow.centerAlignContent();

  // Left: large rate + change
  const left = mainRow.addStack();
  left.layoutVertically();
  addRateBlock(left, rate, 32);

  mainRow.addSpacer();

  // Right: hi/lo + conversion
  const right = mainRow.addStack();
  right.layoutVertically();

  const hi = right.addText(`↑ R$ ${toBRL(rate.high)}`);
  hi.font = Font.systemFont(11);
  hi.textColor = MUTED_COLOR;
  right.addSpacer(3);

  const lo = right.addText(`↓ R$ ${toBRL(rate.low)}`);
  lo.font = Font.systemFont(11);
  lo.textColor = MUTED_COLOR;
  right.addSpacer(8);

  addConversionLine(right, rate, amount, false);

  w.addSpacer();
  addUpdatedAt(w, rate.timestamp);

  return w;
}

// --- Large widget ---
function buildLargeWidget(rate, amount) {
  const w = baseWidget();
  w.setPadding(18, 20, 18, 20);

  addHeader(w);
  w.addSpacer(12);

  addRateBlock(w, rate, 42);
  w.addSpacer(14);

  // High / Low row
  const hlRow = w.addStack();
  hlRow.layoutHorizontally();

  const hiText = hlRow.addText(`High  R$ ${toBRL(rate.high)}`);
  hiText.font = Font.systemFont(13);
  hiText.textColor = MUTED_COLOR;

  hlRow.addSpacer();

  const loText = hlRow.addText(`Low  R$ ${toBRL(rate.low)}`);
  loText.font = Font.systemFont(13);
  loText.textColor = MUTED_COLOR;

  w.addSpacer(16);

  // Visual separator
  const sep = w.addText("── ── ── ── ── ── ── ──");
  sep.font = Font.systemFont(9);
  sep.textColor = new Color("#1e3a52");

  w.addSpacer(14);

  // Conversion section header
  const convLabel = w.addText("Conversion");
  convLabel.font = Font.semiboldRoundedSystemFont(13);
  convLabel.textColor = TEXT_COLOR;

  w.addSpacer(6);

  // USD input line
  const usdLine = w.addText(`USD ${fmtUSD(amount)}`);
  usdLine.font = Font.boldSystemFont(18);
  usdLine.textColor = TEXT_COLOR;

  w.addSpacer(4);

  // BRL result line
  const converted = amount * rate.bid;
  const brlLine = w.addText(`= R$ ${toBRL(converted)}`);
  brlLine.font = Font.boldSystemFont(22);
  brlLine.textColor = ACCENT_COLOR;

  w.addSpacer(10);

  // Tap hint
  const hint = w.addText("Tap to change amount");
  hint.font = Font.systemFont(11);
  hint.textColor = new Color("#334155");

  w.addSpacer();
  addUpdatedAt(w, rate.timestamp);

  return w;
}

// --- Error widget ---
function buildErrorWidget() {
  const w = new ListWidget();
  w.backgroundColor = BG_COLOR;
  w.setPadding(14, 16, 14, 16);
  w.url = `scriptable:///run/${encodeURIComponent(Script.name())}`;

  addHeader(w);
  w.addSpacer(8);

  const err = w.addText("⚠ Could not load rate");
  err.font = Font.systemFont(13);
  err.textColor = RED_COLOR;
  err.minimumScaleFactor = 0.7;

  w.addSpacer(6);

  const hint = w.addText("Tap to retry");
  hint.font = Font.systemFont(10);
  hint.textColor = MUTED_COLOR;

  return w;
}

// --- Dispatch by size ---
function buildWidget(rate, amount) {
  switch (config.widgetFamily) {
    case "large":  return buildLargeWidget(rate, amount);
    case "medium": return buildMediumWidget(rate, amount);
    default:       return buildSmallWidget(rate, amount);  // "small" or preview
  }
}

// --- Main ---
async function run() {
  // Running interactively (tap from home screen or opened in Scriptable app):
  // Show the amount prompt, then present a small preview.
  if (!config.runsInWidget) {
    await promptForAmount();
    try {
      const rate   = await fetchRate();
      const amount = getAmount();
      const preview = buildSmallWidget(rate, amount);
      await preview.presentSmall();
    } catch (_) {
      // If fetch fails during interactive run, just complete silently
    }
    Script.complete();
    return;
  }

  // Running as a widget on the home screen:
  let widget;
  try {
    const rate   = await fetchRate();
    const amount = getAmount();
    widget = buildWidget(rate, amount);
  } catch (e) {
    widget = buildErrorWidget();
    console.error("usd-brl-converter-widget:", e.message);
  }

  Script.setWidget(widget);
  Script.complete();
}

run();
