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
        // Display public Google Drive photographs using the existing timeline photo style.
        const photoUrls = String(activity.photographs || "").split(/,\s*|\n/).map(safeLink).filter(Boolean);
        photoUrls.forEach((url, index) => {
          let imageUrl = url;
          try {
            const parsed = new URL(url);
            if (parsed.hostname === "drive.google.com") {
              const id = parsed.searchParams.get("id") || (parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || [])[1];
              if (id && /^[a-zA-Z0-9_-]+$/.test(id)) {
                imageUrl = "https://drive.google.com/thumbnail?id=" + encodeURIComponent(id) + "&sz=w1200";
              }
            }
          } catch (_) {}
          const frame = document.createElement("div");
          frame.className = "tl-photo";
          const img = document.createElement("img");
          img.src = imageUrl;
          img.alt = "Photograph of " + String(activity.title);
          img.loading = "lazy";
          img.referrerPolicy = "no-referrer";
          img.onerror = () => {
            frame.replaceChildren();
            const link = document.createElement("a");
            link.href = url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = "View activity photograph" + (photoUrls.length > 1 ? " " + (index + 1) : "");
            frame.appendChild(link);
          };
          frame.appendChild(img);
          item.appendChild(frame);
        });
        let video = safeLink(activity.videoUrl);
        if (!video && /^www\./i.test(String(activity.videoUrl || "").trim())) {
          video = safeLink("https://" + String(activity.videoUrl).trim());
        }
        if (video) {
          const p = document.createElement("p");
          const a = document.createElement("a");
          a.href = video;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = "Watch video / visit website";
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
