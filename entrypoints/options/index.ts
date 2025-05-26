import { browser } from 'wxt/browser';
import { restoreOptions, saveOption } from '@/utils/library';
import '@/assets/css/options.css';

document.addEventListener('DOMContentLoaded', async () => {
  localizeHtml();
  
  const options = await restoreOptions();
  updateUIWithOptions(options);
  
  setupEventListeners();
});

/**
 * Localize HTML content using i18n
 */
function localizeHtml() {
  document.querySelectorAll('[i18n-content]').forEach((element) => {
    const i18nKey = element.getAttribute('i18n-content');
    if (i18nKey) {
      const message = browser.i18n.getMessage(i18nKey) || i18nKey;
      if (message) {
        element.textContent = message;
      }
    }
  });
}

/**
 * Update UI elements with current options
 */
function updateUIWithOptions(options: any) {
  setSelectValue('renderMode', options.renderMode);
  setSelectValue('location', options.location);
  setSelectValue('theme', options.theme);
  setSelectValue('tabRequestLimit', options.tabRequestLimit.toString());
  setSelectValue('hidePanelAfterTimeout', options.hidePanelAfterTimeout ? '1' : '0');
  setSelectValue('timeout', options.timeout.toString());
  
  const hideOnHoverInput = document.getElementById('hideonhover') as HTMLInputElement;
  if (hideOnHoverInput) {
    hideOnHoverInput.value = options.hideonhover !== null ? options.hideonhover.toString() : '';
  }
  
  populateHeadersList('hiddenRequestHeaders', options.hiddenRequestHeaders);
  populateHeadersList('hiddenResponseHeaders', options.hiddenResponseHeaders);
}

/**
 * Populate headers list with tags
 */
function populateHeadersList(elementId: string, headers: string[]) {
  const container = document.getElementById(elementId);
  if (!container) return;
  
  container.innerHTML = '';
  
  headers.forEach(header => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = header;
    
    const removeButton = document.createElement('span');
    removeButton.className = 'remove';
    removeButton.textContent = '×';
    removeButton.addEventListener('click', () => {
      removeHeaderFromList(elementId, header);
    });
    
    tag.appendChild(removeButton);
    container.appendChild(tag);
  });
}

/**
 * Remove header from list
 */
async function removeHeaderFromList(listId: string, header: string) {
  const options = await restoreOptions();
  const optionKey = listId as keyof typeof options;
  
  if (Array.isArray(options[optionKey])) {
    const updatedList = (options[optionKey] as string[]).filter(h => h !== header);
    await saveOption(listId, updatedList);
    
    populateHeadersList(listId, updatedList);
  }
}

/**
 * Add header to list
 */
async function addHeaderToList(listId: string, inputId: string) {
  const input = document.getElementById(inputId) as HTMLInputElement;
  if (!input || !input.value.trim()) return;
  
  const header = input.value.trim().toLowerCase();
  const options = await restoreOptions();
  const optionKey = listId as keyof typeof options;
  
  if (Array.isArray(options[optionKey])) {
    const currentList = options[optionKey] as string[];
    
    if (!currentList.includes(header)) {
      const updatedList = [...currentList, header];
      await saveOption(listId, updatedList);
      
      populateHeadersList(listId, updatedList);
      
      input.value = '';
    }
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  const saveButton = document.getElementById('save');
  if (saveButton) {
    saveButton.addEventListener('click', saveOptions);
  }
  
  const resetButton = document.getElementById('reset');
  if (resetButton) {
    resetButton.addEventListener('click', resetOptions);
  }
  
  const addRequestHeaderButton = document.getElementById('addHiddenRequestHeader');
  if (addRequestHeaderButton) {
    addRequestHeaderButton.addEventListener('click', () => {
      addHeaderToList('hiddenRequestHeaders', 'hiddenRequestHeadersInput');
    });
  }
  
  const addResponseHeaderButton = document.getElementById('addHiddenResponseHeader');
  if (addResponseHeaderButton) {
    addResponseHeaderButton.addEventListener('click', () => {
      addHeaderToList('hiddenResponseHeaders', 'hiddenResponseHeadersInput');
    });
  }
  
  ['renderMode', 'location', 'theme', 'tabRequestLimit', 'hidePanelAfterTimeout', 'timeout'].forEach(id => {
    const element = document.getElementById(id) as HTMLSelectElement;
    if (element) {
      element.addEventListener('change', () => {
        const value = element.value;
        if (id === 'tabRequestLimit' || id === 'timeout') {
          saveOption(id, parseInt(value, 10));
        } else if (id === 'hidePanelAfterTimeout') {
          saveOption(id, value === '1');
        } else {
          saveOption(id, value);
        }
      });
    }
  });
  
  const hideOnHoverInput = document.getElementById('hideonhover') as HTMLInputElement;
  if (hideOnHoverInput) {
    hideOnHoverInput.addEventListener('change', () => {
      const value = hideOnHoverInput.value ? parseInt(hideOnHoverInput.value, 10) : null;
      saveOption('hideonhover', value);
    });
  }
}

/**
 * Save all options
 */
async function saveOptions() {
  const options = {
    renderMode: getSelectValue('renderMode'),
    location: getSelectValue('location'),
    theme: getSelectValue('theme'),
    tabRequestLimit: parseInt(getSelectValue('tabRequestLimit'), 10),
    hidePanelAfterTimeout: getSelectValue('hidePanelAfterTimeout') === '1',
    timeout: parseInt(getSelectValue('timeout'), 10),
    hideonhover: getInputNumberValue('hideonhover')
  };
  
  for (const [key, value] of Object.entries(options)) {
    await saveOption(key, value);
  }
  
  const status = document.getElementById('status');
  if (status) {
    status.textContent = browser.i18n.getMessage('optionsPageSaved') || 'Options saved.';
    setTimeout(() => {
      status.textContent = '';
    }, 1500);
  }
}

/**
 * Reset options to defaults
 */
async function resetOptions() {
  await browser.storage.local.clear();
  
  const options = await restoreOptions();
  
  updateUIWithOptions(options);
  
  const status = document.getElementById('status');
  if (status) {
    status.textContent = browser.i18n.getMessage('optionsPageReset') || 'Options reset to defaults.';
    setTimeout(() => {
      status.textContent = '';
    }, 1500);
  }
}

/**
 * Helper to get select element value
 */
function getSelectValue(id: string): string {
  const element = document.getElementById(id) as HTMLSelectElement;
  return element ? element.value : '';
}

/**
 * Helper to set select element value
 */
function setSelectValue(id: string, value: string) {
  const element = document.getElementById(id) as HTMLSelectElement;
  if (element) {
    element.value = value;
  }
}

/**
 * Helper to get input number value
 */
function getInputNumberValue(id: string): number | null {
  const element = document.getElementById(id) as HTMLInputElement;
  return element && element.value ? parseInt(element.value, 10) : null;
}
