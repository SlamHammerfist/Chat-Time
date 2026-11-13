/**
 * Chat Time
 * Shows your local real-world time and date on every chat message.
 * Everything here is a personal (per-client) setting, so it never affects other players.
 */

const MODULE_ID = "chat-time";
const STAMP_CLASS = "chat-time-stamp";
const BODY_CLASS = "chat-time-enabled";

/* -------------------------------------------- */
/*  Settings                                    */
/* -------------------------------------------- */

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "enabled", {
    name: "Show Local Time",
    hint: "Replace Foundry's \"x minutes ago\" timestamp on chat messages with your local time and date. Only affects you.",
    scope: "user",
    config: true,
    type: Boolean,
    default: true,
    onChange: refreshAll
  });

  game.settings.register(MODULE_ID, "clockFormat", {
    name: "Clock Format",
    hint: "Show times as a 12-hour clock (3:45 PM) or a 24-hour clock (15:45).",
    scope: "user",
    config: true,
    type: String,
    choices: {
      "12": "12-hour (3:45 PM)",
      "24": "24-hour (15:45)"
    },
    default: "12",
    onChange: refreshAll
  });
});

Hooks.once("ready", () => updateBodyClass());

/* -------------------------------------------- */
/*  Chat messages                               */
/* -------------------------------------------- */

Hooks.on("renderChatMessageHTML", (message, html) => {
  if ( !message?.timestamp || !(html instanceof HTMLElement) ) return;
  html.querySelector(`.${STAMP_CLASS}`)?.remove();

  const stamp = document.createElement("time");
  stamp.classList.add(STAMP_CLASS);
  stamp.dataset.timestamp = String(message.timestamp);
  fillStamp(stamp);

  // Put ours right next to Foundry's own timestamp, which CSS hides while enabled.
  const original = html.querySelector(".message-timestamp");
  if ( original ) original.after(stamp);
  else (html.querySelector(".message-metadata") ?? html.querySelector(".message-header"))?.append(stamp);
});

/* -------------------------------------------- */
/*  Helpers                                     */
/* -------------------------------------------- */

/** Write the formatted local time and date into a stamp element. */
function fillStamp(stamp) {
  const date = new Date(Number(stamp.dataset.timestamp));
  if ( Number.isNaN(date.getTime()) ) return;
  const hour12 = game.settings.get(MODULE_ID, "clockFormat") !== "24";

  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12 });
  const day = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  stamp.textContent = `${day}, ${time}`;
  stamp.dateTime = date.toISOString();
  stamp.dataset.tooltip = date.toLocaleString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12
  });
}

/** Turn the feature on or off for this client. */
function updateBodyClass() {
  document.body.classList.toggle(BODY_CLASS, game.settings.get(MODULE_ID, "enabled"));
}

/** Re-apply settings to every message already on screen (chat log, pop-outs, notifications). */
function refreshAll() {
  updateBodyClass();
  for ( const stamp of document.querySelectorAll(`.${STAMP_CLASS}`) ) fillStamp(stamp);
}
