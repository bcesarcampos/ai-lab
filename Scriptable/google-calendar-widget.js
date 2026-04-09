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

const BACKGROUND_COLOR = new Color("#242529");
const TEXT_COLOR       = new Color("#ffffff");
const MUTED_COLOR      = new Color("#8e8e93");
const MAX_EVENTS       = 8;  // maximum events to display

// --- Fetch events for today and tomorrow ---
async function getEvents() {
  const now      = new Date();
  const todayStart    = new Date(now.getFullYear(), now.getMonth(), now.getDate(),  0,  0,  0);
  const todayEnd      = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1,  0,  0,  0);
  const tomorrowEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59);

  let calendars = await Calendar.forEvents();
  if (CALENDARS.length > 0) {
    calendars = calendars.filter(c => CALENDARS.includes(c.title));
  }

  const todayEvents    = await CalendarEvent.between(todayStart,    todayEnd,    calendars);
  const tomorrowEvents = await CalendarEvent.between(tomorrowStart, tomorrowEnd, calendars);

  todayEvents.sort(   (a, b) => a.startDate - b.startDate);
  tomorrowEvents.sort((a, b) => a.startDate - b.startDate);

  return { todayEvents, tomorrowEvents };
}

// --- Format event time ---
function formatTime(event) {
  if (event.isAllDay) return "All day";
  const opts = { hour: "numeric", minute: "2-digit", hour12: true };
  return event.startDate.toLocaleTimeString("en-US", opts);
}

// --- Render a section label (Today / Tomorrow) ---
function addSectionLabel(w, label, isFirst) {
  if (!isFirst) w.addSpacer(10);
  const t = w.addText(label);
  t.font = Font.semiboldRoundedSystemFont(12);
  t.textColor = MUTED_COLOR;
  w.addSpacer(5);
}

// --- Render a list of events into the widget ---
function addEventRows(w, events) {
  for (let i = 0; i < events.length; i++) {
    const event = events[i];

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

    if (i < events.length - 1) w.addSpacer(7);
  }
}

// --- Build widget ---
async function buildWidget() {
  const { todayEvents, tomorrowEvents } = await getEvents();

  const w = new ListWidget();
  w.backgroundColor = BACKGROUND_COLOR;
  w.setPadding(14, 16, 14, 16);

  // Refresh every 15 minutes
  const refresh = new Date();
  refresh.setMinutes(refresh.getMinutes() + 15);
  w.refreshAfterDate = refresh;

  const hasToday    = todayEvents.length > 0;
  const hasTomorrow = tomorrowEvents.length > 0;

  if (!hasToday && !hasTomorrow) {
    w.addSpacer();
    const msg = w.addText("No Events Today\nor Tomorrow");
    msg.font = Font.semiboldRoundedSystemFont(15);
    msg.textColor = TEXT_COLOR;
    w.addSpacer();
    return w;
  }

  // Budget MAX_EVENTS across both days
  const todayShown    = todayEvents.slice(0, MAX_EVENTS);
  const remaining     = MAX_EVENTS - todayShown.length;
  const tomorrowShown = tomorrowEvents.slice(0, remaining);

  if (hasToday) {
    addSectionLabel(w, "Today", true);
    addEventRows(w, todayShown);
    if (todayEvents.length > todayShown.length) {
      w.addSpacer(4);
      const more = w.addText(`+${todayEvents.length - todayShown.length} more`);
      more.font = Font.systemFont(11);
      more.textColor = MUTED_COLOR;
    }
  }

  if (hasTomorrow && tomorrowShown.length > 0) {
    addSectionLabel(w, "Tomorrow", !hasToday);
    addEventRows(w, tomorrowShown);
    if (tomorrowEvents.length > tomorrowShown.length) {
      w.addSpacer(4);
      const more = w.addText(`+${tomorrowEvents.length - tomorrowShown.length} more`);
      more.font = Font.systemFont(11);
      more.textColor = MUTED_COLOR;
    }
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
