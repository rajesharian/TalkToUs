"use strict";
(() => {
  const API = "https://script.google.com/macros/s/AKfycbxiXCpahNCMiQtjJL05poegcBwoa0SUWyc9AqW_ZOhsJuLtO6kufzSBMy0SkATgLrTU/exec";
  const nameEl = document.getElementById("member-name");
  const roleEl = document.getElementById("member-role");
  const bodyEl = document.getElementById("member-biography");
  const photoEl = document.getElementById("member-photo");
  const avatarEl = document.getElementById("member-avatar");
  const normalized = value => String(value || "").trim().toLocaleLowerCase();
  const params = new URLSearchParams(location.search);
  const requestedName = params.get("name");
  const paragraph = text => {
    const p = document.createElement("p");
    p.textContent = text;
    bodyEl.appendChild(p);
  };
  const showError = message => {
    nameEl.textContent = "Team profile unavailable";
    roleEl.textContent = "";
    bodyEl.replaceChildren();
    paragraph(message);
  };
  if (!requestedName) {
    showError("No team member was specified. Please return to Our Team and select a profile.");
    return;
  }
  fetch(API, { redirect: "follow" })
    .then(response => {
      if (!response.ok) throw new Error("API request failed");
      return response.json();
    })
    .then(data => {
      if (!data.success || !Array.isArray(data.members)) throw new Error("Invalid team data");
      const member = data.members.find(item => normalized(item.name) === normalized(requestedName));
      if (!member) {
        showError("This member's profile is not currently published.");
        return;
      }
      const name = String(member.name || "").trim();
      nameEl.textContent = name;
      document.title = `${name} — Talk2Us`;
      roleEl.textContent = [member.designation, member.qualifications].filter(Boolean).join(" · ");
      bodyEl.replaceChildren();
      const bio = String(member.biography || "").trim();
      if (bio) bio.split(/\n\s*\n/).filter(Boolean).forEach(paragraph);
      else paragraph("Biography will be available soon.");
      const photo = String(member.photograph || "").trim();
      if (/^https:\/\/talktous\.co\.in\//i.test(photo)) {
        photoEl.alt = name;
        photoEl.onload = () => { avatarEl.hidden = false; };
        photoEl.onerror = () => { avatarEl.hidden = true; };
        photoEl.src = photo;
      }
    })
    .catch(() => showError("We could not load this profile right now. Please try again later."));
})();
