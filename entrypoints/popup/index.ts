import { browser } from 'wxt/browser';
import { 
  saveOption, 
  restoreOptions as getOptions, 
  getPanel, 
  getToolbar, 
  isValidUrl,
  containerId
} from '@/utils/library';
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
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) return;
    
    const tab = tabs[0];
    if (!tab.id || !isValidUrl(tab.url || '')) return;

    const response = await browser.runtime.sendMessage({
      msg: 'getHeadersForTab',
      tabId: tab.id
    });

    if (response && response.headerStore) {
      const options = await getOptions();
      displayHeaders(response.headerStore, options);
    }
  } catch (error) {
    console.error('Failed to load header data:', error);
  }
}

/**
 * Display headers in the popup
 */
function displayHeaders(headerStore: any, options: ExtensionOptions) {
  const container = document.getElementById(containerId);
  const resultContainer = container ? container.querySelector('#result') : null;
  if (!resultContainer || !headerStore) {
    console.error('Container or headerStore not found', { container, resultContainer, headerStore });
    return;
  }
  
  while (resultContainer.firstChild) {
    resultContainer.removeChild(resultContainer.firstChild);
  }
  
  const requestIds = Object.keys(headerStore);
  if (requestIds.length === 0) {
    const defaultMessage = document.createElement('p');
    defaultMessage.className = 'defaultMessage';
    defaultMessage.textContent = browser.i18n.getMessage('popupDefaultMessage') || 'No headers were captured yet.';
    
    const optionsButtonDiv = document.createElement('div');
    optionsButtonDiv.className = 'optionsButtonInDefaultMessage';
    
    const optionsButton = document.createElement('button');
    optionsButton.id = 'goToOptions';
    optionsButton.textContent = browser.i18n.getMessage('buttonOptions') || 'Options';
    optionsButton.addEventListener('click', () => {
      browser.runtime.openOptionsPage();
    });
    
    optionsButtonDiv.appendChild(optionsButton);
    resultContainer.appendChild(defaultMessage);
    resultContainer.appendChild(optionsButtonDiv);
    return;
  }
  
  requestIds.forEach(requestId => {
    if (requestId === 'isContentReady') return;
    
    const panel = getPanel(headerStore[requestId], requestId, options);
    if (panel && panel.children.length) {
      resultContainer.appendChild(panel);
    }
  });
  
  if (!resultContainer.querySelector('#toolBar')) {
    const toolbar = getToolbar(options);
    if (toolbar) {
      resultContainer.appendChild(toolbar);
      
      const typeElements = resultContainer.querySelectorAll('.requestTypes .type');
      typeElements.forEach(element => {
        element.addEventListener('click', (event) => {
          const target = event.target as HTMLElement;
          target.classList.toggle('active');
          target.classList.toggle('inactive');
          
          const activeTypes: string[] = [];
          resultContainer.querySelectorAll('.requestTypes .type.active').forEach(el => {
            const type = el.classList[1];
            if (type) activeTypes.push(type);
          });
          
          browser.runtime.sendMessage({
            msg: 'storeRequestTypeSelection',
            activeRequestTypes: activeTypes
          });
        });
      });
      
      const filterInput = resultContainer.querySelector('#inlineFilterInput') as HTMLInputElement;
      const filterAllowRegex = resultContainer.querySelector('#inlineFilterAllowRegex') as HTMLInputElement;
      
      if (filterInput && filterAllowRegex) {
        filterInput.addEventListener('keyup', () => {
          const container = document.getElementById('result');
          if (container) {
            const query = filterInput.value;
            const isRegex = filterAllowRegex.checked;
            
            if (query) {
              try {
                if (isRegex) {
                  const regex = new RegExp(query, 'ig');
                  Array.from(container.getElementsByTagName('tr')).forEach((element) => {
                    if (element.textContent && element.textContent.match(regex) !== null) {
                      element.style.display = 'table-row';
                    } else {
                      element.style.display = 'none';
                    }
                  });
                } else {
                  Array.from(container.getElementsByTagName('tr')).forEach((element) => {
                    if (element.textContent && element.textContent.toLowerCase().includes(query.toLowerCase())) {
                      element.style.display = 'table-row';
                    } else {
                      element.style.display = 'none';
                    }
                  });
                }
              } catch (e) {
                console.error('Invalid regex:', e);
              }
            } else {
              Array.from(container.getElementsByTagName('tr')).forEach((element) => {
                element.style.display = 'table-row';
              });
            }
          }
        });
        
        filterAllowRegex.addEventListener('click', () => {
          const container = document.getElementById('result');
          if (container && filterInput.value) {
            const query = filterInput.value;
            const isRegex = filterAllowRegex.checked;
            
            try {
              if (isRegex) {
                const regex = new RegExp(query, 'ig');
                Array.from(container.getElementsByTagName('tr')).forEach((element) => {
                  if (element.textContent && element.textContent.match(regex) !== null) {
                    element.style.display = 'table-row';
                  } else {
                    element.style.display = 'none';
                  }
                });
              } else {
                Array.from(container.getElementsByTagName('tr')).forEach((element) => {
                  if (element.textContent && element.textContent.toLowerCase().includes(query.toLowerCase())) {
                    element.style.display = 'table-row';
                  } else {
                    element.style.display = 'none';
                  }
                });
              }
            } catch (e) {
              console.error('Invalid regex:', e);
            }
          }
        });
      }
    }
  }
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
