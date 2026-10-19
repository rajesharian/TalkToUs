/* Talk2Us public activity feed: read-only. Existing timeline is never changed. */
(() => {
  "use strict";
  const ENDPOINT = "https://script.google.com/macros/s/AKfycbwym7MceOoMB4PMJo62PWxzh_KZiF_8ssd7XLaC50n64pyTW1DM1P43RTUKaBMOFvQ/exec";
  const target = document.getElementById("published-activities");
  if (!target) return;

  function safeLink(value) {
    try {
      const url = new URL(String(value).trim());
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
    } catch { return null; }
  }

  function addText(parent, tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = String(value || "");
    parent.appendChild(node);
    return node;
  }

  function readableDate(value) {
    const str = String(value || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const [year, month, day] = str.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return str;
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
  }

  async function load() {
    try {
      const response = await fetch(ENDPOINT, { redirect: "follow", cache: "no-store" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const result = await response.json();
      if (!result || result.success !== true || !Array.isArray(result.activities)) throw new Error("Invalid API response");
      const fragment = document.createDocumentFragment();
      const timeline = document.createElement("div");
      timeline.className = "timeline";
      for (const activity of result.activities) {
        if (!activity || !activity.title) continue;
        const item = document.createElement("div");
        item.className = "tl-item";
        const label = [readableDate(activity.date), activity.location].filter(Boolean).join(" — ");
        if (label) addText(item, "span", "tl-date", label);
        addText(item, "h3", "", activity.title);
        if (activity.description) addText(item, "p", "", activity.description);
        if (activity.category) addText(item, "p", "", "Category: " + activity.category);
        // Google Form upload URLs may be private; provide links rather than broken embedded images.
        const photoUrls = String(activity.photographs || "").split(/,\s*|\n/).map(safeLink).filter(Boolean);
        photoUrls.forEach((url, index) => {
          const p = document.createElement("p");
          const a = document.createElement("a");
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = "View activity photograph" + (photoUrls.length > 1 ? " " + (index + 1) : "");
          p.appendChild(a);
          item.appendChild(p);
        });
        const video = safeLink(activity.videoUrl);
        if (video) {
          const p = document.createElement("p");
          const a = document.createElement("a");
          a.href = video;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = "Watch video / read coverage";
          p.appendChild(a);
          item.appendChild(p);
        }
        timeline.appendChild(item);
      }
      if (timeline.childElementCount) {
        addText(target, "h2", "", "Latest activities");
        target.appendChild(timeline);
        addText(target, "h2", "", "Previous activities");
      }
    } catch (error) {
      // Keep the seven original activities visible even if API access fails.
      console.warn("Talk2Us activity feed unavailable:", error);
    }
  }
  load();
})();
