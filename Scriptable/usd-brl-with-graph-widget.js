// USD → BRL Exchange Rate Widget
// Scriptable App | Small & Medium sizes
// Data: AwesomeAPI (free, no key required)
// Shows: current rate + % change + 30-day hi/lo + last updated + line chart background

const API_URL = "https://economia.awesomeapi.com.br/json/daily/USD-BRL/30";

// Fetch the last 30 daily closing bid rates (oldest → newest) + last updated timestamp
async function fetchRates() {
  try {
    const req = new Request(API_URL);
    const json = await req.loadJSON();
    const lastUpdated = json[0].create_date;          // newest entry before reversing
    const rates = json.reverse().map(d => parseFloat(d.bid));
    return { rates, lastUpdated };
  } catch (_) {
    return null;
  }
}

// Format a create_date string ("YYYY-MM-DD HH:MM:SS") into a human-readable string.
// short=true  → "Apr 10"          (for small widget)
// short=false → "Apr 10, 2:30 PM" (for medium widget)
function formatLastUpdated(createDate, short = false) {
  const [datePart, timePart] = createDate.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const d = new Date(year, month - 1, day, hour, minute);
  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (short) return dateStr;
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return dateStr + ", " + timeStr;
}

// Render the dark background + chart line + gradient fill onto a DrawContext.
// isSmall=true uses a square canvas (320×320); false uses a wide canvas (690×300).
function buildChartBackground(rates, accentHex, isSmall = false) {
  const W = isSmall ? 320 : 690;
  const H = isSmall ? 320 : 300;
  const PAD_T = isSmall ? 16 : 24;
  const PAD_B = isSmall ? 24 : 32;
  const PAD_L = isSmall ? 14 : 20;
  const PAD_R = isSmall ? 14 : 20;

  const ctx = new DrawContext();
  ctx.size = new Size(W, H);
  ctx.opaque = true;
  ctx.respectScreenScale = true;

  // Background
  ctx.setFillColor(new Color("#242529"));
  ctx.fillRect(new Rect(0, 0, W, H));

  if (!rates || rates.length < 2) return ctx.getImage();

  const cW = W - PAD_L - PAD_R;
  const cH = H - PAD_T - PAD_B;
  const minV = Math.min(...rates);
  const maxV = Math.max(...rates);
  const range = maxV - minV || 0.01;
  const xStep = cW / (rates.length - 1);

  const toPoint = i => new Point(
    PAD_L + i * xStep,
    PAD_T + cH * (1 - (rates[i] - minV) / range)
  );

  // Gradient fill under the line
  const fillPath = new Path();
  fillPath.move(toPoint(0));
  for (let i = 1; i < rates.length; i++) fillPath.addLine(toPoint(i));
  fillPath.addLine(new Point(PAD_L + (rates.length - 1) * xStep, H - PAD_B));
  fillPath.addLine(new Point(PAD_L, H - PAD_B));
  fillPath.closeSubpath();
  ctx.setFillColor(new Color(accentHex, 0.18));
  ctx.addPath(fillPath);
  ctx.fillPath();

  // Chart line
  const linePath = new Path();
  linePath.move(toPoint(0));
  for (let i = 1; i < rates.length; i++) linePath.addLine(toPoint(i));
  ctx.setStrokeColor(new Color(accentHex));
  ctx.setLineWidth(2.5);
  ctx.addPath(linePath);
  ctx.strokePath();

  return ctx.getImage();
}

// Minimal error widget — works for both sizes
function buildErrorWidget(isSmall = false) {
  const widget = new ListWidget();
  widget.setPadding(16, 18, 16, 18);
  widget.backgroundImage = buildChartBackground(null, "#FF1744", isSmall);
  const err = widget.addText("Could not load USD → BRL data");
  err.font = Font.boldSystemFont(13);
  err.textColor = new Color("#FF1744");
  return widget;
}

// Small widget: single-column stacked layout with square chart background
function buildSmallWidget(data, accentHex) {
  const { rates, lastUpdated } = data;

  const widget = new ListWidget();
  widget.setPadding(12, 14, 12, 14);
  widget.backgroundImage = buildChartBackground(rates, accentHex, true);

  // "USD → BRL" header
  const header = widget.addText("USD → BRL");
  header.font = Font.boldSystemFont(11);
  header.textColor = new Color("#AAAAAA");

  widget.addSpacer(); // push rate toward vertical center

  // Current rate
  const current = rates[rates.length - 1];
  const rateText = widget.addText("R$ " + current.toFixed(4));
  rateText.font = Font.boldSystemFont(26);
  rateText.textColor = Color.white();
  rateText.minimumScaleFactor = 0.7;

  widget.addSpacer(4);

  // % change
  const isUp = current >= rates[0];
  const arrow = isUp ? "▲" : "▼";
  const sign  = isUp ? "+" : "";
  const change = ((current - rates[0]) / rates[0]) * 100;
  const chg = widget.addText(`${arrow} ${sign}${change.toFixed(2)}%`);
  chg.font = Font.boldSystemFont(15);
  chg.textColor = new Color(accentHex);

  widget.addSpacer(6);

  // Last updated (short form: "Apr 10")
  const upd = widget.addText(formatLastUpdated(lastUpdated, true));
  upd.font = Font.systemFont(10);
  upd.textColor = new Color("#777777");

  return widget;
}

// Medium widget: two-column layout with wide chart background
function buildMediumWidget(data, accentHex) {
  const { rates, lastUpdated } = data;

  const current = rates[rates.length - 1];
  const oldest  = rates[0];
  const isUp    = current >= oldest;
  const change  = ((current - oldest) / oldest) * 100;
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);

  const widget = new ListWidget();
  widget.setPadding(16, 18, 16, 18);
  widget.backgroundImage = buildChartBackground(rates, accentHex, false);

  // Horizontal row spanning the widget
  const row = widget.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  // ── Left column: pair label + current rate + footer ──
  const left = row.addStack();
  left.layoutVertically();

  const pair = left.addText("USD → BRL");
  pair.font = Font.boldSystemFont(12);
  pair.textColor = new Color("#AAAAAA");

  left.addSpacer(6);

  const rateText = left.addText("R$ " + current.toFixed(4));
  rateText.font = Font.boldSystemFont(32);
  rateText.textColor = Color.white();

  left.addSpacer(5);

  const foot = left.addText("1 US Dollar · last 30 days");
  foot.font = Font.systemFont(11);
  foot.textColor = new Color("#555555");

  row.addSpacer();

  // ── Right column: % change + 30-day hi/lo + last updated ──
  const right = row.addStack();
  right.layoutVertically();

  const arrow = isUp ? "▲" : "▼";
  const sign  = isUp ? "+" : "";
  const chg = right.addText(`${arrow} ${sign}${change.toFixed(2)}%`);
  chg.font = Font.boldSystemFont(20);
  chg.textColor = new Color(accentHex);

  right.addSpacer(8);

  const hi = right.addText(`↑ R$ ${maxRate.toFixed(4)}`);
  hi.font = Font.systemFont(10);
  hi.textColor = new Color("#777777");

  right.addSpacer(2);

  const lo = right.addText(`↓ R$ ${minRate.toFixed(4)}`);
  lo.font = Font.systemFont(10);
  lo.textColor = new Color("#777777");

  right.addSpacer(6);

  // Last updated (long form: "Apr 10, 2:30 PM")
  const upd = right.addText("Updated " + formatLastUpdated(lastUpdated, false));
  upd.font = Font.systemFont(9);
  upd.textColor = new Color("#555555");

  return widget;
}

async function run() {
  const result = await fetchRates();
  const isSmall = config.widgetFamily === "small";

  let widget;
  if (!result || result.rates.length < 2) {
    widget = buildErrorWidget(isSmall);
  } else {
    const { rates, lastUpdated } = result;
    const isUp = rates[rates.length - 1] >= rates[0];
    const accentHex = isUp ? "#00C853" : "#FF1744";
    widget = isSmall
      ? buildSmallWidget({ rates, lastUpdated }, accentHex)
      : buildMediumWidget({ rates, lastUpdated }, accentHex);
  }

  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    // Preview inside Scriptable app — use size-appropriate presentation
    if (isSmall) {
      await widget.presentSmall();
    } else {
      await widget.presentMedium();
    }
  }

  Script.complete();
}

run();
