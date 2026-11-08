// Hoofdnavigatie:
// - "Geschiedenis bijhouden": de schakelaar, en Geschiedenis alleen in het menu als die aan staat (standaard uit);
// - bij Geschiedenis het aantal sessies dat nog beoordeeld moet worden;
// - in een submenu het actieve item markeren (bij de categorieën: welke kop nu in beeld is);
// - op mobiel, waar een submenu één rij is, het actieve item in beeld houden.
import { HistoryManager } from './HistoryManager.mjs';

const historyManager = new HistoryManager();

function showHistory(enabled) {
  document.querySelectorAll('[data-history-nav]').forEach(item => {
    // On the history page itself the item stays, so you can see where you are
    item.hidden = !enabled && !item.querySelector('.nav-link.active');
  });

  const badge = document.querySelector('[data-unrated-count]');
  if (badge) {
    const unrated = enabled ? historyManager.getStoredUrls().filter(entry => historyManager.canRate(entry)).length : 0;
    badge.textContent = unrated;
    badge.setAttribute('aria-label', `${unrated} nog te beoordelen`);
    badge.hidden = unrated === 0;
  }
  document.dispatchEvent(new CustomEvent('geschiedenis', { detail: { enabled } }));
}

const toggle = document.querySelector('[data-history-toggle]');
if (toggle) {
  toggle.checked = historyManager.isEnabled();
  // Only animate when the user flips it, not when the page sets the starting position
  const label = toggle.closest('.history-toggle');
  requestAnimationFrame(() => requestAnimationFrame(() => label.classList.remove('is-initializing')));
  toggle.addEventListener('change', () => {
    if (!toggle.checked && historyManager.getStoredUrls().length > 0 &&
        !confirm('Je geschiedenis op dit apparaat wordt gewist, ook de links. Je beoordelingen blijven meetellen, zonder links. Doorgaan?')) {
      toggle.checked = true;
      return;
    }
    historyManager.setEnabled(toggle.checked);
    showHistory(toggle.checked);
  });
}
showHistory(historyManager.isEnabled());

// Keep a link visible in a horizontally scrolling row (mobile); does nothing in a vertical list
function keepInRow(link) {
  const row = link.parentElement;
  if (row.scrollWidth <= row.clientWidth) return;
  row.scrollLeft += link.getBoundingClientRect().left - row.getBoundingClientRect().left - 24;
}

const activeSubLink = document.querySelector('.sub-links .sub-link.active');
if (activeSubLink) keepInRow(activeSubLink);

// Categories: anchors to the headings on the page. Mark the one in view.
const anchorLinks = [...document.querySelectorAll('.sub-link[data-anchor]')];
const sections = anchorLinks
  .map(link => document.getElementById(link.dataset.anchor))
  .filter(Boolean);

if (sections.length > 0) {
  const visible = new Set();

  const setActive = (id) => {
    anchorLinks.forEach(link => {
      const isActive = link.dataset.anchor === id;
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'location');
        keepInRow(link);
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  // A section counts as "in view" when its top part is in the upper third of the screen
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visible.add(entry.target.id);
      else visible.delete(entry.target.id);
    });
    const first = sections.find(section => visible.has(section.id) && !section.hidden);
    if (first) setActive(first.id);
  }, { rootMargin: '0px 0px -65% 0px' });

  sections.forEach(section => observer.observe(section));
}
