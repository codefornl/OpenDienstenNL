// Diensten (homepage): alles uit alle profielen per categorie, in twee kolommen (nog in gebruik, open);
// de open diensten binnen elke categorie gesorteerd op beoordeling.
// Met ?profiel=<id> een filter: alleen wat die organisatie gebruikt, in hun volgorde van voorkeur. Jekyll zet per profiel en categorie een verborgen blok klaar
// (organisms/services-by-category.html); dit zet de juiste blokken aan en de rest uit.
import { ServicesManager } from './ServicesManager.mjs';
import { HistoryManager } from './HistoryManager.mjs';

const servicesManager = new ServicesManager();
const historyManager = new HistoryManager();
const servicesLoaded = servicesManager.loadServices();

// A click on a service that can make a room or document of its own (random_url): make a unique link
// instead of going to the general one, and keep it in the history (if the user keeps one).
// The href is changed during the click, so the browser opens the new link itself: no pop-up blocker.
function openUnique(event) {
  // The card link (a.card-link) lies over the whole card; the software and provider links are not it
  const link = event.target.closest('a.card-link');
  const card = link && link.closest('.service-card[data-id]');
  if (!card || (event.type === 'auxclick' && event.button !== 1)) return;
  const service = servicesManager.liveServices.find(s => s.id === card.dataset.id);
  if (!service || !service.random_url) return;

  const url = servicesManager.generateUniqueUrl(service);
  link.href = url;
  historyManager.storeGeneratedUrl(historyManager.generateSessionId(), service, service.categorie, url);
}
document.addEventListener('click', openUnique);
document.addEventListener('auxclick', openUnique);

const profileId = new URLSearchParams(location.search).get('profiel');
const header = profileId
  ? document.querySelector(`.profile-filter-header[data-profiel="${CSS.escape(profileId)}"]`)
  : null;

if (header) {
  applyProfile(profileId, header);
} else {
  await servicesLoaded;
  servicesManager.renderCategoryGrids();
}

function applyProfile(id, header) {
  header.hidden = false;
  const naam = header.querySelector('h2');
  if (naam) document.title = `${naam.textContent} · OpenDiensten`;

  document.querySelectorAll('.service-category').forEach(section => {
    const block = section.querySelector(`.profile-services[data-profiel="${CSS.escape(id)}"]`);
    const catalog = section.querySelector(':scope > .catalog-services');
    if (catalog) catalog.hidden = true;

    section.hidden = !block;
    document.querySelectorAll(`.sub-link[data-anchor="${CSS.escape(section.id)}"]`).forEach(link => {
      link.hidden = !block;
      const count = link.querySelector('.filter-count');
      if (block && count) count.textContent = block.dataset.count;
    });
    if (!block) return;

    block.hidden = false;
    const status = section.querySelector('.view-status');
    if (status) status.textContent = block.dataset.status;
  });

  // The start buttons choose from this profile too
  document.querySelectorAll('.quick-actions a').forEach(link => {
    const url = new URL(link.href, location.href);
    url.searchParams.set('profiel', id);
    link.href = url.pathname + url.search;
  });
}
