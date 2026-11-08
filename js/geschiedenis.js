// Geschiedenis: de diensten die je zelf gestart hebt, uit localStorage.
// Alleen als "Geschiedenis bijhouden" aan staat (standaard uit); anders een uitleg met een knop.
import { HistoryManager } from './HistoryManager.mjs';

const historyManager = new HistoryManager();
const off = document.querySelector('[data-history-off]');
const on = document.querySelector('[data-history-on]');

function render(enabled) {
  off.hidden = enabled;
  on.hidden = !enabled;
  if (enabled) historyManager.loadStoredServices();
}

// The button uses the switch in the sidebar, so both stay the same (js/nav.js)
document.querySelector('.history-enable').addEventListener('click', () => {
  const toggle = document.querySelector('[data-history-toggle]');
  if (toggle && !toggle.checked) toggle.click();
});
document.addEventListener('geschiedenis', event => render(event.detail.enabled));

historyManager.setupClearHistoryHandler();
historyManager.setupExportImportHandlers();
render(historyManager.isEnabled());
