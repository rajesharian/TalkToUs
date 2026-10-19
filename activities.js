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

  // Scoped gallery CSS; does not change existing timeline photographs.
  const galleryStyle = document.createElement("style");
  galleryStyle.textContent = `
    .talk2us-activity-gallery {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      width: 100%;
      margin: 16px 0 12px;
    }
    .talk2us-gallery-frame {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 0;
      min-height: 0;
      aspect-ratio: 4 / 3;
      overflow: hidden;
      border: 1px solid #e6d7ca;
      border-radius: 12px;
      background: #f5e4da;
    }
    .talk2us-gallery-frame img {
      display: block !important;
      width: 100% !important;
      height: 100% !important;
      max-width: 100% !important;
      max-height: 100% !important;
      object-fit: contain !important;
      object-position: center !important;
      border-radius: 0 !important;
    }
    @media (max-width: 800px) {
      .talk2us-activity-gallery { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 520px) {
      .talk2us-activity-gallery { grid-template-columns: minmax(0, 1fr); }
    }
  `;
  document.head.appendChild(galleryStyle);

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
        // Display public Google Drive photographs using the existing timeline photo style.
        const photoUrls = String(activity.photographs || "").split(/,\s*|\n/).map(safeLink).filter(Boolean);
        if (photoUrls.length) {
          const gallery = document.createElement("div");
          gallery.className = "talk2us-activity-gallery";
          photoUrls.forEach((url, index) => {
            let imageUrl = url;
            try {
              const parsed = new URL(url);
              if (parsed.hostname === "drive.google.com") {
                const id = parsed.searchParams.get("id") ||
                  (parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || [])[1];
                if (id && /^[a-zA-Z0-9_-]+$/.test(id)) {
                  imageUrl = "https://drive.google.com/thumbnail?id=" + encodeURIComponent(id) + "&sz=w1200";
                }
              }
            } catch (_) {}
            const frame = document.createElement("div");
            frame.className = "talk2us-gallery-frame";
            const img = document.createElement("img");
            img.src = imageUrl;
            img.alt = "Photograph " + (index + 1) + " of " + String(activity.title);
            img.loading = "lazy";
            img.referrerPolicy = "no-referrer";
            img.onerror = () => {
              frame.replaceChildren();
              const link = document.createElement("a");
              link.href = url;
              link.target = "_blank";
              link.rel = "noopener noreferrer";
              link.textContent = "View activity photograph " + (index + 1);
              frame.appendChild(link);
            };
            frame.appendChild(img);
            gallery.appendChild(frame);
          });
          item.appendChild(gallery);
        }
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
