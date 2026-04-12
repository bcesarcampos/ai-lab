// Motivation Widget
// Built for Scriptable (https://scriptable.app)
//
// Displays a bold title, an icon image, and a subtitle — perfect for
// motivational reminders, daily intentions, or habit cues on your home screen.
//
// Setup:
//   1. Install Scriptable from the App Store (free)
//   2. Paste this script into a new Scriptable script named "motivation-widget"
//   3. Add a Scriptable widget to your home screen
//   4. Long-press the widget → Edit Widget → choose this script
//   5. In the "Parameter" field, paste a JSON config (see below)
//
// Widget Parameter (JSON) — all fields optional, defaults shown:
//   {
//     "title":    "MOTIVATION",          // top text (rendered ALL-CAPS)
//     "subtitle": "",                    // bottom text (rendered ALL-CAPS)
//     "iconUrl":  null,                  // https://… URL  OR  filename in
//                                        // iCloud Drive/Scriptable/ folder
//     "bgColor":  "#1C1C1E",             // background hex color
//     "textColor":"#FFFFFF",             // title & subtitle hex color
//     "iconSize": 60                     // base icon size in points
//   }
//
// Example:
//   {"title":"DISCIPLINE","subtitle":"STOP IMPULSE BUYING",
//    "iconUrl":"https://example.com/no-card.png",
//    "bgColor":"#1C1C1E","textColor":"#FFFFFF"}

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULTS = {
  title:     "MOTIVATION",
  subtitle:  "",
  iconUrl:   null,
  bgColor:   "#1C1C1E",
  textColor: "#FFFFFF",
  iconSize:  60,
};

// ─── Parse widget parameter ────────────────────────────────────────────────────
const settings = Object.assign({}, DEFAULTS);
const rawParam = args.widgetParameter;
if (rawParam) {
  try {
    Object.assign(settings, JSON.parse(rawParam));
  } catch (_) {
    // JSON parse error — fall back to defaults silently
  }
}

// ─── Icon loading ──────────────────────────────────────────────────────────────
async function loadIcon(source) {
  if (!source) return null;
  try {
    if (source.startsWith("http://") || source.startsWith("https://")) {
      const req = new Request(source);
      req.timeoutInterval = 10;
      return await req.loadImage();
    }
    // Local file in iCloud Drive/Scriptable/
    const fm = FileManager.iCloud();
    const path = fm.joinPath(fm.documentsDirectory(), source);
    if (fm.fileExists(path)) {
      await fm.downloadFileFromiCloud(path);
      return fm.readImage(path);
    }
  } catch (_) {
    // Icon failed to load — widget renders without it
  }
  return null;
}

// ─── Layout helpers ────────────────────────────────────────────────────────────

// Wraps an element in a horizontal row with spacers on both sides so it
// appears horizontally centered inside a vertical stack.
function addCentered(parent, fn) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.addSpacer();
  fn(row);
  row.addSpacer();
}

function addTitle(parent, text, fontSize, textColor) {
  addCentered(parent, (row) => {
    const el = row.addText(text.toUpperCase());
    el.font = Font.boldSystemFont(fontSize);
    el.textColor = new Color(textColor);
    el.minimumScaleFactor = 0.5;
    el.lineLimit = 2;
  });
}

function addIcon(parent, image, size) {
  addCentered(parent, (row) => {
    const el = row.addImage(image);
    el.imageSize = new Size(size, size);
  });
}

function addSubtitle(parent, text, fontSize, textColor) {
  addCentered(parent, (row) => {
    const el = row.addText(text.toUpperCase());
    el.font = Font.boldSystemFont(fontSize);
    el.textColor = new Color(textColor);
    el.minimumScaleFactor = 0.5;
    el.lineLimit = 2;
  });
}

// ─── Widget builders ───────────────────────────────────────────────────────────

function baseWidget() {
  const w = new ListWidget();
  w.backgroundColor = new Color(settings.bgColor);
  // Refresh every 30 minutes (widget is mostly static, but keeps OS happy)
  const next = new Date();
  next.setMinutes(next.getMinutes() + 30);
  w.refreshAfterDate = next;
  return w;
}

function buildSmallWidget(icon) {
  const w = baseWidget();
  w.setPadding(14, 14, 14, 14);

  const main = w.addStack();
  main.layoutVertically();

  main.addSpacer();
  addTitle(main, settings.title, 22, settings.textColor);

  if (icon) {
    main.addSpacer(8);
    addIcon(main, icon, Math.round(settings.iconSize * 0.83)); // ~50pt
  }

  if (settings.subtitle) {
    main.addSpacer(8);
    addSubtitle(main, settings.subtitle, 10, settings.textColor);
  }

  main.addSpacer();
  return w;
}

function buildMediumWidget(icon) {
  const w = baseWidget();
  w.setPadding(16, 16, 16, 16);

  const main = w.addStack();
  main.layoutVertically();

  main.addSpacer();
  addTitle(main, settings.title, 26, settings.textColor);

  if (icon) {
    main.addSpacer(10);
    addIcon(main, icon, settings.iconSize); // ~60pt
  }

  if (settings.subtitle) {
    main.addSpacer(10);
    addSubtitle(main, settings.subtitle, 12, settings.textColor);
  }

  main.addSpacer();
  return w;
}

function buildLargeWidget(icon) {
  const w = baseWidget();
  w.setPadding(20, 20, 20, 20);

  const main = w.addStack();
  main.layoutVertically();

  main.addSpacer();
  addTitle(main, settings.title, 36, settings.textColor);

  if (icon) {
    main.addSpacer(16);
    addIcon(main, icon, Math.round(settings.iconSize * 1.5)); // ~90pt
  }

  if (settings.subtitle) {
    main.addSpacer(16);
    addSubtitle(main, settings.subtitle, 16, settings.textColor);
  }

  main.addSpacer();
  return w;
}

function buildErrorWidget(message) {
  const w = new ListWidget();
  w.backgroundColor = new Color(settings.bgColor);
  w.setPadding(14, 14, 14, 14);

  const err = w.addText("⚠ " + message);
  err.font = Font.systemFont(13);
  err.textColor = new Color("#f87171");
  err.minimumScaleFactor = 0.7;

  return w;
}

// ─── Size dispatch ─────────────────────────────────────────────────────────────
function buildWidget(icon) {
  switch (config.widgetFamily) {
    case "large":  return buildLargeWidget(icon);
    case "medium": return buildMediumWidget(icon);
    default:       return buildSmallWidget(icon);  // "small" or interactive preview
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  let widget;
  try {
    const icon = await loadIcon(settings.iconUrl);
    widget = buildWidget(icon);
  } catch (e) {
    widget = buildErrorWidget("Widget error");
    console.error("motivation-widget:", e.message);
  }

  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    // Preview inside the Scriptable app
    await widget.presentSmall();
  }

  Script.complete();
}

run();
