import { browser } from 'wxt/browser';
import { saveOption, restoreOptions as getOptions } from '@/utils/library';
import type { ExtensionOptions } from '@/utils/library';
import '@/assets/css/content.css';
import '@/assets/css/contentLight.css';
import '@/assets/css/popup.css';

document.addEventListener('DOMContentLoaded', async () => {
  localizeHtml();
  
  const options = await loadOptions();
  
  const settingsIcon = document.getElementById('settingsIcon');
  const settingsPanel = document.getElementById('settings');
  
  if (settingsIcon && settingsPanel) {
    settingsIcon.addEventListener('click', () => {
      settingsPanel.classList.toggle('hidden');
    });
    
    const closeButton = settingsPanel.querySelector('.closeButton');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        settingsPanel.classList.add('hidden');
      });
    }
  }
  
  setupOptionsChangeHandlers();
  
  loadHeaderData();
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
 * Set up event handlers for option changes
 */
function setupOptionsChangeHandlers() {
  const themeSelector = document.getElementById('theme') as HTMLSelectElement;
  if (themeSelector) {
    themeSelector.addEventListener('change', async () => {
      await browser.storage.local.set({ theme: themeSelector.value });
      document.body.classList.toggle('light', themeSelector.value === 'light');
    });
  }
  
  const renderModeSelector = document.getElementById('renderMode') as HTMLSelectElement;
  if (renderModeSelector) {
    renderModeSelector.addEventListener('change', async () => {
      await browser.storage.local.set({ renderMode: renderModeSelector.value });
    });
  }
  
  const locationSelector = document.getElementById('location') as HTMLSelectElement;
  if (locationSelector) {
    locationSelector.addEventListener('change', async () => {
      await browser.storage.local.set({ location: locationSelector.value });
    });
  }
  
  const tabRequestLimitSelector = document.getElementById('tabRequestLimit') as HTMLSelectElement;
  if (tabRequestLimitSelector) {
    tabRequestLimitSelector.addEventListener('change', async () => {
      await browser.storage.local.set({ tabRequestLimit: parseInt(tabRequestLimitSelector.value, 10) });
    });
  }
  
  const hidePanelSelector = document.getElementById('hidePanelAfterTimeout') as HTMLSelectElement;
  if (hidePanelSelector) {
    hidePanelSelector.addEventListener('change', async () => {
      await browser.storage.local.set({ 
        hidePanelAfterTimeout: hidePanelSelector.value === '1'
      });
    });
  }
  
  const timeoutSelector = document.getElementById('timeout') as HTMLSelectElement;
  if (timeoutSelector) {
    timeoutSelector.addEventListener('change', async () => {
      await browser.storage.local.set({ timeout: parseInt(timeoutSelector.value, 10) });
    });
  }
  
  const hideOnHoverInput = document.getElementById('hideonhover') as HTMLInputElement;
  if (hideOnHoverInput) {
    hideOnHoverInput.addEventListener('change', async () => {
      const value = hideOnHoverInput.value ? parseInt(hideOnHoverInput.value, 10) : null;
      await browser.storage.local.set({ hideonhover: value });
    });
  }
  
  const optionsButton = document.getElementById('goToOptions');
  if (optionsButton) {
    optionsButton.addEventListener('click', () => {
      browser.runtime.openOptionsPage();
    });
  }
}

/**
 * Load header data for the current tab
 */
async function loadHeaderData() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) {
    const currentTab = tabs[0];
    browser.runtime.sendMessage({ 
      msg: 'getHeadersForTab', 
      tabId: currentTab.id 
    }, (response) => {
      if (response && response.headers) {
        displayHeaders(response.headers);
      }
    });
  }
}

/**
 * Display headers in the popup
 */
function displayHeaders(headers: any) {
  const resultContainer = document.getElementById('result');
  if (!resultContainer || !headers) return;
  
  resultContainer.innerHTML = '';
  
}

/**
 * Load options and update UI
 */
async function loadOptions() {
  const options = await getOptions();
  updateUIWithOptions(options);
  return options;
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
  
  document.body.classList.toggle('light', options.theme === 'light');
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
