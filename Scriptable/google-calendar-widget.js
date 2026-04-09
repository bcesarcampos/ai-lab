// Today's Google Calendar Widget
// Built for Scriptable (https://scriptable.app)
//
// Prerequisites:
//   • On your iPhone go to Settings → Calendar → Accounts → Add Account → Google
//   • Sign in and enable Calendar sync
//   • Scriptable will then read events through the iOS Calendar framework
//
// Setup:
//   1. Paste this script into a new Scriptable script
//   2. Run it once inside the app to grant Calendar permission
//   3. Add a Scriptable widget (Medium size recommended) to your home screen
//   4. Long-press the widget → Edit Widget → choose this script

// --- Config ---
// Leave empty to show ALL calendars, or list calendar names to filter:
//   e.g. const CALENDARS = ["Work", "Personal"];
const CALENDARS = [];

const BACKGROUND_COLOR = new Color("#1c1c1e");
const TEXT_COLOR       = new Color("#ffffff");
const MUTED_COLOR      = new Color("#8e8e93");
const MAX_EVENTS       = 8;  // maximum events to display

// --- Fetch today's events ---
async function getTodayEvents() {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(),  0,  0,  0);
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  let calendars = await Calendar.forEvents();

  if (CALENDARS.length > 0) {
    calendars = calendars.filter(c => CALENDARS.includes(c.title));
  }

  const events = await CalendarEvent.between(start, end, calendars);
  events.sort((a, b) => a.startDate - b.startDate);
  return events;
}

// --- Format event time ---
function formatTime(event) {
  if (event.isAllDay) return "All day";
  const opts = { hour: "numeric", minute: "2-digit", hour12: true };
  return event.startDate.toLocaleTimeString("en-US", opts);
}

// --- Build widget ---
async function buildWidget() {
  const events = await getTodayEvents();

  const w = new ListWidget();
  w.backgroundColor = BACKGROUND_COLOR;
  w.setPadding(14, 16, 14, 16);

  // Refresh every 15 minutes
  const refresh = new Date();
  refresh.setMinutes(refresh.getMinutes() + 15);
  w.refreshAfterDate = refresh;

  if (events.length === 0) {
    w.addSpacer();
    const msg = w.addText("No Events Today");
    msg.font = Font.semiboldRoundedSystemFont(16);
    msg.textColor = TEXT_COLOR;
    w.addSpacer();
    return w;
  }

  const shown = events.slice(0, MAX_EVENTS);

  for (let i = 0; i < shown.length; i++) {
    const event = shown[i];

    const row = w.addStack();
    row.layoutHorizontally();
    row.centerAlignContent();

    // Calendar color bar
    const bar = row.addStack();
    bar.size = new Size(3, 34);
    bar.backgroundColor = event.calendar.color;
    bar.cornerRadius = 2;

    row.addSpacer(10);

    // Event details
    const details = row.addStack();
    details.layoutVertically();

    const time = details.addText(formatTime(event));
    time.font = Font.systemFont(11);
    time.textColor = MUTED_COLOR;

    const title = details.addText(event.title);
    title.font = Font.semiboldSystemFont(13);
    title.textColor = TEXT_COLOR;
    title.lineLimit = 1;

    if (i < shown.length - 1) {
      w.addSpacer(7);
    }
  }

  // Overflow indicator
  if (events.length > MAX_EVENTS) {
    w.addSpacer(6);
    const more = w.addText(`+${events.length - MAX_EVENTS} more`);
    more.font = Font.systemFont(11);
    more.textColor = MUTED_COLOR;
  }

  return w;
}

// --- Main ---
let widget;
try {
  widget = await buildWidget();
} catch (e) {
  widget = new ListWidget();
  widget.backgroundColor = BACKGROUND_COLOR;
  widget.setPadding(14, 16, 14, 16);
  const err = widget.addText("⚠ " + e.message);
  err.font = Font.systemFont(12);
  err.textColor = new Color("#f87171");
  console.error(e);
}

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentMedium();
}

Script.complete();
