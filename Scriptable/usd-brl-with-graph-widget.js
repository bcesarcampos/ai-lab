// USD → BRL Exchange Rate Widget
// Scriptable App | Medium size
// Data: AwesomeAPI (free, no key required)
// Shows: current rate + 30-day line chart as background

const API_URL = "https://economia.awesomeapi.com.br/json/daily/USD-BRL/30";

// Fetch the last 30 daily closing bid rates, oldest → newest
async function fetchRates() {
  try {
    const req = new Request(API_URL);
    const json = await req.loadJSON();
    // API returns newest-first; reverse to get chronological order
    return json.reverse().map(d => parseFloat(d.bid));
  } catch (_) {
    return null;
  }
}

// Render the dark background + chart line + gradient fill onto a DrawContext
function buildChartBackground(rates, accentHex) {
  const W = 690;
  const H = 300;
  const PAD_T = 24, PAD_B = 32, PAD_L = 20, PAD_R = 20;

  const ctx = new DrawContext();
  ctx.size = new Size(W, H);
  ctx.opaque = true;
  ctx.respectScreenScale = true;

  // Dark background
  ctx.setFillColor(new Color("#0D0D0D"));
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

async function run() {
  const rates = await fetchRates();

  const isUp = rates && rates.length >= 2
    ? rates[rates.length - 1] >= rates[0]
    : false;
  const accentHex = isUp ? "#00C853" : "#FF1744";

  const widget = new ListWidget();
  widget.setPadding(16, 18, 16, 18);
  widget.backgroundImage = buildChartBackground(rates, accentHex);

  // Error state
  if (!rates || rates.length < 2) {
    const err = widget.addText("Could not load USD → BRL data");
    err.font = Font.boldSystemFont(13);
    err.textColor = new Color("#FF1744");
    Script.setWidget(widget);
    Script.complete();
    return;
  }

  const current = rates[rates.length - 1];
  const oldest  = rates[0];
  const change  = ((current - oldest) / oldest) * 100;
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);

  // Horizontal row spanning the widget
  const row = widget.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  // ── Left column: pair label + current rate ──
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

  // ── Right column: % change + 30-day hi/lo ──
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

  Script.setWidget(widget);
  Script.complete();
  widget.presentMedium(); // preview when run inside Scriptable app
}

run();
