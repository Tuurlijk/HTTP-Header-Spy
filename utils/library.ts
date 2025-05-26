import { browser } from 'wxt/browser';

/**
 * Container ID for the HTTP Header Spy elements
 */
export const containerId = 'httpSpyContainer_sq27T8VFex4CtQ623afyMoiYA89kG6UZ';

/**
 * Extension options interface
 */
export interface ExtensionOptions {
  renderMode: string;
  location: string;
  theme: string;
  tabRequestLimit: number;
  hidePanelAfterTimeout: boolean;
  timeout: number;
  hideonhover: number | null;
  hiddenRequestHeaders: string[];
  hiddenResponseHeaders: string[];
  shownResponseHeaders: string[];
  activeRequestTypes: string[];
  markers: string[];
}

/**
 * Check if the object is defined
 */
export function isDefined(object: any): boolean {
  return typeof object !== 'undefined';
}

/**
 * Format bytes in human readable form
 */
export function formatBytes(bytes: number): string {
  if (bytes >= 1000000000) {
    return (bytes / 1000000000).toFixed(2) + ' GB';
  }
  else if (bytes >= 1000000) {
    return (bytes / 1000000).toFixed(2) + ' MB';
  }
  else if (bytes >= 1000) {
    return (bytes / 1000).toFixed(2) + ' KB';
  }
  else if (bytes > 1) {
    return bytes + ' bytes';
  }
  else if (bytes == 1) {
    return bytes + ' byte';
  }
  else {
    return '0 byte';
  }
}

/**
 * Filter the headers
 */
export function filterHeaders(container: HTMLElement, query: string, isRegex: boolean): void {
  if (isRegex) {
    try {
      const regex = new RegExp(query, 'ig');
      Array.from(container.getElementsByTagName('tr')).forEach((element) => {
        if (element.textContent && element.textContent.match(regex) !== null) {
          element.style.display = 'table-row';
        } else {
          element.style.display = 'none';
        }
      });
      
      import('mark.js').then(({ default: Mark }) => {
        const magicMarker = new Mark(container);
        const regexp = new RegExp(query, 'gmi');
        magicMarker.unmark();
        magicMarker.markRegExp(regexp);
      });
    } catch (e) {
      console.error('Invalid regex:', e);
    }
  } else {
    Array.from(container.getElementsByTagName('tr')).forEach((element) => {
      if (element.textContent && element.textContent.toLowerCase().includes(query.toLowerCase())) {
        element.style.display = 'table-row';
      } else {
        element.style.display = 'none';
      }
    });
    
    import('mark.js').then(({ default: Mark }) => {
      const magicMarker = new Mark(container);
      magicMarker.unmark();
      magicMarker.mark(query);
    });
  }
}

/**
 * Format milliseconds in human readable form
 */
export function formatMilliseconds(ms: number): string {
  const zeroDate = new Date();
  zeroDate.setHours(0);
  zeroDate.setMinutes(0);
  zeroDate.setSeconds(0);
  zeroDate.setMilliseconds(0);
  
  const date = new Date(zeroDate.getTime() + parseInt(ms.toString(), 10));
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const milliseconds = date.getMilliseconds();
  const duration: string[] = [];
  
  if (hours) {
    duration.push(hours + 'h');
  }
  if (minutes) {
    duration.push(minutes + 'm');
  }
  if (seconds) {
    duration.push(seconds + 's');
  }
  if (milliseconds) {
    duration.push(milliseconds + ' ms');
  }
  
  return duration.join(' ');
}

/**
 * Create a table row
 */
export function getTableRow(key: string, value: string): HTMLTableRowElement {
  const row = document.createElement('tr');
  const keyCell = document.createElement('td');
  const keyText = document.createTextNode(key);
  const valueCell = document.createElement('td');
  const valueText = document.createTextNode(value);
  const cutoffKeySpan = document.createElement('span');
  const cutoffValueSpan = document.createElement('span');
  
  cutoffKeySpan.className = 'cutoff';
  cutoffKeySpan.appendChild(keyText);
  cutoffValueSpan.className = 'cutoff';
  
  keyCell.className = 'key';
  keyCell.title = key;
  keyCell.appendChild(cutoffKeySpan);
  
  valueCell.className = 'value';
  cutoffValueSpan.appendChild(valueText);
  valueCell.title = value;
  valueCell.appendChild(cutoffValueSpan);
  
  row.appendChild(keyCell);
  row.appendChild(valueCell);
  
  return row;
}

/**
 * Check if a value is in a list
 */
export function isValueInList(list: string[], value: string): boolean {
  if (!list || !Array.isArray(list)) {
    return false;
  }
  
  return list.some(item => 
    item.toLowerCase() === value.toLowerCase()
  );
}

/**
 * Get time to complete style
 */
export function getTimeToCompleteStyle(time: number): string {
  if (time < 100) {
    return 'veryFast';
  } else if (time < 250) {
    return 'fast';
  } else if (time < 500) {
    return 'medium';
  } else if (time < 1000) {
    return 'slow';
  } else {
    return 'verySlow';
  }
}

/**
 * Get a separator
 */
export function getSeparator(): HTMLDivElement {
  const separator = document.createElement('div');
  separator.className = 'separator';
  return separator;
}

/**
 * Get status style
 */
export function getStatusStyle(statusCode: string): string {
  const code = parseInt(statusCode, 10);
  if (code >= 500) {
    return 'serverError';
  } else if (code >= 400) {
    return 'clientError';
  } else if (code >= 300) {
    return 'redirect';
  } else if (code >= 200) {
    return 'success';
  } else {
    return 'info';
  }
}

/**
 * Toggle element visibility
 */
export function toggleElementVisibility(element: HTMLElement): void {
  if (element.classList.contains('hidden')) {
    element.classList.remove('hidden');
    element.classList.add('visible');
  } else {
    element.classList.remove('visible');
    element.classList.add('hidden');
  }
}

/**
 * Hide element
 */
export function hideElement(element: HTMLElement): void {
  element.classList.remove('visible');
  element.classList.add('hidden');
}

/**
 * Show element
 */
export function showElement(element: HTMLElement): void {
  element.classList.remove('hidden');
  element.classList.add('visible');
}

/**
 * Restore options from storage
 */
export async function restoreOptions(): Promise<ExtensionOptions> {
  const defaultOptions: ExtensionOptions = {
    renderMode: 'microMode',
    location: 'bottomRight',
    theme: 'dark',
    tabRequestLimit: 15,
    hidePanelAfterTimeout: true,
    timeout: 5,
    hideonhover: null,
    hiddenRequestHeaders: [],
    hiddenResponseHeaders: [],
    shownResponseHeaders: ['content-type', 'content-length', 'cache-control'],
    activeRequestTypes: ['main_frame', 'sub_frame', 'xmlhttprequest'],
    markers: []
  };
  
  const result = await browser.storage.local.get(Object.keys(defaultOptions));
  return { ...defaultOptions, ...result };
}

/**
 * Save option to storage
 */
export async function saveOption(key: string, value: any): Promise<void> {
  const option: Record<string, any> = {};
  option[key] = value;
  await browser.storage.local.set(option);
}

/**
 * Check if URL is valid for the extension
 */
export function isValidUrl(url: string): boolean {
  return url !== undefined && 
         url !== 'about:blank' && 
         !url.startsWith('chrome://') && 
         !url.startsWith('chrome-extension://') && 
         !url.startsWith('moz-extension://') && 
         !url.startsWith('about:');
}
