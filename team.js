/* Talk2Us team member publisher — adds published members without altering existing cards. */
(() => {
  'use strict';
  const API_URL = 'team.json';
  const grid = document.getElementById('talk2us-team-grid');
  if (!grid) return;

  const normalize = value => String(value || '').trim().toLocaleLowerCase().replace(/\s+/g, ' ');
  const existing = new Set(Array.from(grid.querySelectorAll('.team-body h3')).map(el => normalize(el.textContent)));

  function safeUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const url = new URL(value.trim(), window.location.href);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
      return url.href;
    } catch { return ''; }
  }

  function categoryKey(value) {
    const category = normalize(value);
    if (category.includes('psychologist') || category.includes('counselor') || category.includes('counsellor')) return 'counsellors';
    if (category.includes('volunteer')) return 'volunteers';
    if (category.includes('partner')) return 'partners';
    return 'other';
  }

  function imageUrl(value) {
    const url = safeUrl(value);
    if (!url) return '';
    // A public Google Drive upload may render as a thumbnail; private files still require permission.
    if (/^https?:\/\/(?:drive|docs)\.google\.com\//i.test(url)) {
      const id = new URL(url).searchParams.get('id') || (url.match(/\/d\/([a-zA-Z0-9_-]+)/) || [])[1];
      return id ? 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w400' : '';
    }
    return url;
  }

  function addMember(member) {
    if (!member || typeof member.name !== 'string') return;
    const name = member.name.trim();
    const key = normalize(name);
    if (!key || existing.has(key)) return;
    existing.add(key);

    // Preserve an explicitly supplied profile URL; otherwise use the shared profile page.
    const href = safeUrl(member.profileUrl) || 'team-profile.html?name=' + encodeURIComponent(name);
    const card = document.createElement(href ? 'a' : 'div');
    card.className = 'team-card';
    if (href) card.href = href;

    const photo = document.createElement('div');
    photo.className = 'team-photo';
    const src = imageUrl(member.photograph);
    if (src) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = name;
      img.loading = 'lazy';
      img.onerror = () => { img.remove(); photo.textContent = 'Talk2Us'; };
      photo.appendChild(img);
    } else {
      photo.textContent = 'Talk2Us';
      photo.style.display = 'flex';
      photo.style.alignItems = 'center';
      photo.style.justifyContent = 'center';
      photo.style.color = '#657486';
      photo.style.fontWeight = '600';
    }
    card.appendChild(photo);

    const body = document.createElement('div');
    body.className = 'team-body';
    const heading = document.createElement('h3');
    heading.textContent = name;
    body.appendChild(heading);
    if (member.designation) {
      const role = document.createElement('span');
      role.className = 'team-role';
      role.textContent = String(member.designation);
      body.appendChild(role);
    }
    if (href) {
      const view = document.createElement('span');
      view.className = 'team-view';
      view.textContent = 'View profile →';
      body.appendChild(view);
    }
    card.appendChild(body);
    const category = categoryKey(member.category);
    let section = document.querySelector('[data-team-category="' + category + '"]');
    let target = document.querySelector('[data-team-grid="' + category + '"]');

    // Support older about.html versions without category containers.
    // Add category groups after the existing six-card grid, without altering it.
    if (!section || !target) {
      const labels = {
        counsellors: 'Counselors & Psychologists',
        volunteers: 'Volunteers',
        partners: 'Support Partners',
        other: 'Other Team Members'
      };
      section = document.createElement('div');
      section.dataset.teamCategory = category;
      section.style.marginTop = '32px';
      const heading = document.createElement('h3');
      heading.textContent = labels[category];
      heading.style.marginBottom = '18px';
      section.appendChild(heading);
      target = document.createElement('div');
      target.className = 'team-grid';
      target.dataset.teamGrid = category;
      section.appendChild(target);
      grid.insertAdjacentElement('afterend', section);
    }
    target.appendChild(card);
    section.hidden = false;
  }

  fetch(API_URL, { redirect: 'follow' })
    .then(response => { if (!response.ok) throw new Error('Team API unavailable'); return response.json(); })
    .then(data => {
      if (!data || data.success !== true || !Array.isArray(data.members)) throw new Error('Invalid team API response');
      data.members.forEach(addMember);
    })
    .catch(error => console.warn('Talk2Us: published team members could not be loaded.', error));
})();
