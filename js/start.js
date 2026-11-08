// Startpagina: kies een open dienst, open hem, en vraag na afloop hoe het ging.
// De markup staat in _includes/organisms/start-session.html; zie docs/ARCHITECTURE.md.
import { ServicesManager, sameService } from './ServicesManager.mjs';
import { HistoryManager } from './HistoryManager.mjs';

const root = document.querySelector('.start-session');
const category = root.dataset.categorie;
const servicesManager = new ServicesManager();
const historyManager = new HistoryManager();

// A profile (?profiel=codefornl): choose from the services that organisation picked
const profileSlug = new URLSearchParams(location.search).get('profiel');
let profile = null; // { naam, url, diensten }

function profileIds() {
  return profile && profile.diensten ? profile.diensten[category] || null : null;
}

async function loadProfile() {
  if (!profileSlug) return;
  try {
    const profiles = await (await fetch('/profielen.json')).json();
    profile = profiles[profileSlug] || null;
  } catch (e) {
    console.warn('Kon profielen niet laden:', e);
  }
}

let session = null; // { id, service, url, fresh }
// fresh: made on this page and not opened yet; only then may "Kies een andere dienst" remove it

// Show the blocks for one step: kiezen, klaar, geopend, beoordeeld or fout
function setState(state) {
  root.dataset.state = state;
  root.querySelectorAll('[data-show]').forEach(el => {
    el.hidden = !el.dataset.show.split(' ').includes(state);
  });
}

function fill(name, value) {
  root.querySelectorAll(`[data-fill="${name}"]`).forEach(el => { el.textContent = value; });
}

// Find the full service in the data; history entries only keep a few fields
function findService(stored) {
  return servicesManager.liveServices.find(service => sameService(service, stored)) || stored;
}

function render() {
  const { service, url } = session;

  const card = servicesManager.createServiceCard(service);
  card.querySelector('.card-link').href = url;
  root.querySelector('[data-card]').replaceChildren(card);

  fill('naam', service.naam);
  fill('aanbieder', service.aanbieder);
  fill('url', url);
  const candidateCount = servicesManager.candidatesFor(category, profileIds()).length;
  fill('aantal', candidateCount);
  // Only one service to choose from (e.g. a profile with one choice): nothing else to pick
  root.querySelector('.start-other').hidden = candidateCount < 2;
  if (profile && profileIds()) showProfileReason(service);
  fill('herkomst', service.eu_hosting ? 'een Europese aanbieder' : 'een niet-Europese aanbieder');
  root.querySelectorAll('[data-href="url"]').forEach(el => { el.href = url; });
}

// Choose a service, store the session and try to open it.
// Called on load (the browser may block the new tab) and on "Kies een andere dienst" (a click: not blocked).
function startNewSession(exclude = null) {
  const service = servicesManager.selectRandomService(category, exclude, profileIds());
  const url = servicesManager.generateUniqueUrl(service);
  const id = historyManager.generateSessionId();

  // Only stored if the user keeps a history (off by default)
  const stored = historyManager.storeGeneratedUrl(id, service, category, url);
  session = { id, service, url, fresh: true };

  // With a history, a reload shows this session again instead of choosing a new one
  if (stored) {
    const profileQuery = profileSlug ? `&profiel=${encodeURIComponent(profileSlug)}` : '';
    history.replaceState(null, '', `${location.pathname}?sessie=${encodeURIComponent(id)}${profileQuery}`);
  }
  render();
  resetStars();

  // Without 'noopener': with it, window.open always returns null and we can't tell if it was blocked
  const opened = window.open(url, '_blank');
  if (opened) {
    try { opened.opener = null; } catch (e) { /* other origin */ }
    session.fresh = false;
    setState('geopend');
  } else {
    setState('klaar');
  }
}

// "Gekozen door Code for NL", instead of "Gekozen uit 6 open diensten"
function showProfileReason(service) {
  const reason = root.querySelector('.start-reason');
  const count = servicesManager.candidatesFor(category, profileIds()).length;
  const link = document.createElement('a');
  link.href = profile.url;
  link.textContent = profile.naam;
  reason.replaceChildren(
    'Gekozen door ', link,
    count > 1 ? `, uit ${count} diensten op basis van beoordelingen. ` : '. ',
    `${service.aanbieder} is ${service.eu_hosting ? 'een Europese' : 'een niet-Europese'} aanbieder.`
  );
}

// Keep the profile in links to a new start
function keepProfileInLinks() {
  if (!profile) return;
  root.querySelectorAll(`a[href="${location.pathname}"]`).forEach(a => {
    a.href = `${location.pathname}?profiel=${encodeURIComponent(profileSlug)}`;
  });
}

// Show an existing session, e.g. after a reload or from the history
function resumeSession(id) {
  const entry = historyManager.getEntryBySessionId(id);
  if (!entry) return false;

  session = { id, service: findService(entry.service), url: entry.url, fresh: false };
  render();

  if (entry.rating) {
    showStars(entry.rating, 'filled');
    setState('beoordeeld');
  } else {
    setState('geopend');
  }
  return true;
}

// ----- Beoordelen -----

const stars = root.querySelectorAll('.star');

function showStars(rating, className) {
  stars.forEach((star, index) => {
    star.classList.remove('filled', 'hover');
    if (index < rating) star.classList.add(className);
    star.textContent = index < rating ? '★' : '☆';
  });
}

function resetStars() {
  const entry = session && historyManager.getEntryBySessionId(session.id);
  const rating = (session && session.rating) || (entry && entry.rating) || 0;
  showStars(rating, 'filled');
}

stars.forEach(star => {
  const rating = parseInt(star.dataset.rating, 10);
  star.addEventListener('mouseenter', () => showStars(rating, 'hover'));
  star.addEventListener('focus', () => showStars(rating, 'hover'));
  star.addEventListener('click', () => {
    if (!session) return;
    if (session.rating) return; // one rating per session
    session.rating = rating;
    historyManager.rate(session.id, session.service, rating);
    showStars(rating, 'filled');
    setState('beoordeeld');
  });
});
root.querySelector('.star-rating').addEventListener('mouseleave', resetStars);

// ----- Knoppen -----

root.querySelector('[data-open]').addEventListener('click', () => {
  // The link opens the new tab itself; only the step changes here
  if (session) session.fresh = false;
  if (root.dataset.state === 'klaar') setState('geopend');
});

root.querySelector('.start-other').addEventListener('click', () => {
  if (!session) return;
  const previous = session.service;
  if (session.fresh) historyManager.deleteEntry(session.id);
  startNewSession(previous);
});

root.querySelector('.share-copy').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  try {
    await navigator.clipboard.writeText(session.url);
    button.textContent = 'Gekopieerd';
  } catch (e) {
    // No clipboard access: select the link so it can be copied by hand
    const range = document.createRange();
    range.selectNodeContents(root.querySelector('.share-link code'));
    getSelection().removeAllRanges();
    getSelection().addRange(range);
    button.textContent = 'Kopieer met Ctrl+C';
  }
  setTimeout(() => { button.textContent = 'Kopieer'; }, 2500);
});

// Back from the other tab: bring the rating into view
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && root.dataset.state === 'geopend') {
    root.querySelector('.start-rating').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

// ----- Start -----

await Promise.all([servicesManager.loadServices(), loadProfile()]);
keepProfileInLinks();

const requested = new URLSearchParams(location.search).get('sessie');
try {
  if (!(requested && resumeSession(requested))) {
    startNewSession();
  }
} catch (error) {
  console.error('Kon geen open dienst kiezen:', error);
  setState('fout');
}
