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

/**
 * Get a cookie table
 */
export function getCookieTable(value: string): HTMLTableElement {
  const table = document.createElement('table');
  const cookieLines = value.split('; ');
  
  table.className = 'cookieTable';
  cookieLines.forEach(function (line) {
    const key = line.substring(0, line.indexOf('='));
    const value = line.substring(line.indexOf('=') + 1);
    table.appendChild(getTableRow(key, value));
  });
  
  return table;
}

/**
 * Create panel section
 */
export function getPanelSection(
  title: string, 
  isOpen: boolean, 
  content: HTMLElement, 
  cookies?: HTMLElement, 
  query?: HTMLElement, 
  formData?: HTMLElement
): HTMLDivElement {
  const section = document.createElement('div');
  const summary = document.createElement('summary');
  const details = document.createElement('details');
  const sectionTitleText = document.createTextNode(title);
  
  summary.classList.add('sectionTitle', 'noSelect');
  summary.appendChild(sectionTitleText);
  details.open = Boolean(isOpen);
  details.appendChild(summary);
  details.appendChild(content);
  
  if (isDefined(query) && query) {
    const querySummary = document.createElement('summary');
    const queryDetails = document.createElement('details');
    const sectionQueryTitleText = document.createTextNode(browser.i18n.getMessage('contentMessagesPanelTitleQuery') || 'Query');
    
    querySummary.appendChild(sectionQueryTitleText);
    querySummary.classList.add('sectionTitle', 'noSelect');
    queryDetails.appendChild(querySummary);
    queryDetails.appendChild(query);
    details.appendChild(queryDetails);
  }
  
  if (isDefined(cookies) && cookies) {
    const cookieSummary = document.createElement('summary');
    const cookieDetails = document.createElement('details');
    const sectionCookieTitleText = document.createTextNode(title + ' ' + (browser.i18n.getMessage('contentMessagesPanelTitleCookies') || 'Cookies'));
    
    cookieSummary.appendChild(sectionCookieTitleText);
    cookieSummary.classList.add('sectionTitle', 'noSelect');
    cookieDetails.appendChild(cookieSummary);
    cookieDetails.appendChild(cookies);
    details.appendChild(cookieDetails);
  }
  
  if (isDefined(formData) && formData) {
    const formDataSummary = document.createElement('summary');
    const formDataDetails = document.createElement('details');
    const sectionFormDataTitleText = document.createTextNode(browser.i18n.getMessage('contentMessagesPanelTitleFormData') || 'Form Data');
    
    formDataSummary.appendChild(sectionFormDataTitleText);
    formDataSummary.classList.add('sectionTitle', 'noSelect');
    formDataDetails.appendChild(formDataSummary);
    formDataDetails.appendChild(formData);
    details.appendChild(formDataDetails);
  }
  
  section.appendChild(details);
  return section;
}

/**
 * Get time to first byte
 */
export function getTimeToFirstByte(headers: any, i: number): number {
  if (!isDefined(headers.timeToFirstByte[i]) || headers.timeToFirstByte[i] === null) {
    return 0;
  }
  
  const time = new Date(headers.timeToFirstByte[i].timeStamp - headers.request[i].timeStamp);
  const milliseconds = time.getMilliseconds();
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  
  return milliseconds + seconds * 1000 + minutes * 60 * 1000;
}

/**
 * Get time to completion
 */
export function getTimeToComplete(headers: any, i: number): number {
  if (!isDefined(headers.timeToComplete[i]) || headers.timeToComplete[i] === null) {
    return 0;
  }
  
  const time = new Date(headers.timeToComplete[i].timeStamp - headers.request[i].timeStamp);
  const milliseconds = time.getMilliseconds();
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  
  return milliseconds + seconds * 1000 + minutes * 60 * 1000;
}

/**
 * Get time to first header
 */
export function getTimeToFirstHeader(headers: any, i: number): number {
  if (!isDefined(headers.timeToHeadersReceived[i]) || headers.timeToHeadersReceived[i] === null) {
    return 0;
  }
  
  const time = new Date(headers.timeToHeadersReceived[i].timeStamp - headers.request[i].timeStamp);
  const milliseconds = time.getMilliseconds();
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  
  return milliseconds + seconds * 1000 + minutes * 60 * 1000;
}

/**
 * Get a request panel
 */
export function getPanel(headers: any, requestId: string, options: ExtensionOptions): HTMLDivElement {
  const content = document.createElement('div');
  
  content.className = 'normalMode';
  content.dataset.requestId = requestId;
  
  for (let i = 0, len = Object.keys(headers.request).length; i < len; ++i) {
    const panel = document.createElement('div');
    const request = headers.request[i];
    const response = headers.response[i];
    
    if (!isDefined(response)) {
      continue;
    }
    
    content.classList.add(options.activeRequestTypes.includes(request.type) ? 'visible' : 'hidden');
    content.dataset.requestType = request.type;
    
    const urlDiv = document.createElement('div');
    const method = document.createTextNode(request.method);
    const statusSpan = document.createElement('span');
    const urlLink = document.createElement('a');
    const urlText = document.createTextNode(request.url);
    const statusLine = document.createElement('p');
    const statusLineText = document.createTextNode(response.statusLine);
    const statusLineCacheSpan = document.createElement('span');
    const statusLineCacheText = document.createTextNode(response.fromCache ? 
      ' (' + (browser.i18n.getMessage('contentMessagesFromDiskCache') || 'from disk cache') + ')' : '');
    
    urlDiv.classList.add('url', 'key');
    urlLink.className = 'location';
    urlLink.href = request.url;
    urlLink.title = request.url;
    urlLink.appendChild(urlText);
    statusSpan.classList.add('status', getStatusStyle(String(response.statusCode)));
    statusSpan.appendChild(method);
    urlDiv.appendChild(statusSpan);
    urlDiv.appendChild(urlLink);
    panel.appendChild(urlDiv);
    
    statusLine.className = 'value';
    statusLine.title = 'tabId\t\t' + request.tabId +
      '\nframeId\t' + request.frameId +
      '\nrequestId\t' + request.requestId +
      '\ntype\t\t' + request.type;
    statusLine.appendChild(statusLineText);
    statusLineCacheSpan.appendChild(statusLineCacheText);
    statusLineCacheSpan.className = 'key';
    statusLine.appendChild(statusLineCacheSpan);
    panel.appendChild(statusLine);
    
    const sectionContentTable = document.createElement('table');
    const sectionCookieTables = document.createElement('div');
    sectionCookieTables.className = 'cookieTables';
    
    request.requestHeaders.forEach(function (header: any) {
      const lowercaseName = header.name.toLowerCase();
      if (lowercaseName === 'cookie') {
        sectionCookieTables.appendChild(getCookieTable(header.value));
      } else {
        if (!isValueInList(options.hiddenRequestHeaders, lowercaseName)) {
          sectionContentTable.appendChild(getTableRow(header.name, header.value));
        }
      }
    });
    
    let queryContentTable: HTMLTableElement | undefined;
    if (isDefined(request.getData) && request.getData && request.getData.length) {
      queryContentTable = document.createElement('table');
      request.getData.forEach(function (parameter: any) {
        if (queryContentTable) {
          queryContentTable.appendChild(getTableRow(parameter.key, parameter.value));
        }
      });
    }
    
    let formDataContentTable: HTMLTableElement | undefined;
    if (isDefined(request.requestBody) && request.requestBody && request.requestBody.formData) {
      formDataContentTable = document.createElement('table');
      for (let parameterKey in request.requestBody.formData) {
        let value: string | any[] = '';
        if (request.requestBody.formData.hasOwnProperty(parameterKey)) {
          value = request.requestBody.formData[parameterKey];
          if (typeof value === 'object' && value !== null && Array.isArray(value)) {
            switch (value.length) {
              case 0:
                value = '';
                break;
              case 1:
                value = value[0];
                break;
              default:
                value = JSON.stringify(value);
            }
          }
        }
        formDataContentTable.appendChild(getTableRow(parameterKey, String(value)));
      }
    }
    
    panel.appendChild(getPanelSection(
      browser.i18n.getMessage('contentMessagesPanelTitleRequest') || 'Request',
      false,
      sectionContentTable,
      sectionCookieTables.hasChildNodes() ? sectionCookieTables : undefined,
      queryContentTable,
      formDataContentTable
    ));
    
    const responseContentTable = document.createElement('table');
    const responseCookieTables = document.createElement('div');
    responseCookieTables.className = 'cookieTables';
    
    response.responseHeaders.forEach(function (header: any) {
      const lowercaseName = header.name.toLowerCase();
      if (lowercaseName === 'set-cookie') {
        responseCookieTables.appendChild(getCookieTable(header.value));
      } else {
        if (!isValueInList(options.hiddenResponseHeaders, header.name.toLowerCase())) {
          responseContentTable.appendChild(getTableRow(header.name, header.value));
        }
      }
    });
    
    panel.appendChild(getPanelSection(
      browser.i18n.getMessage('contentMessagesPanelTitleResponse') || 'Response',
      i === (len - 1),
      responseContentTable,
      responseCookieTables.hasChildNodes() ? responseCookieTables : undefined
    ));
    
    content.appendChild(panel);
    if (i < (len - 1)) {
      content.appendChild(getSeparator());
    }
  }
  
  return content;
}

/**
 * Get request types
 */
export function getRequestTypeFiters(options: ExtensionOptions): HTMLDivElement {
  const requestTypes = document.createElement('div');
  const xhr = document.createElement('div');
  const mainFrame = document.createElement('div');
  const subFrame = document.createElement('div');
  
  requestTypes.className = 'requestTypes';
  
  xhr.className = 'type xmlhttprequest';
  xhr.textContent = 'XHR';
  xhr.title = 'XMLHttpRequest';
  xhr.classList.add(options.activeRequestTypes.includes('xmlhttprequest') ? 'active' : 'inactive');
  
  mainFrame.className = 'type main_frame';
  mainFrame.textContent = 'DOC';
  mainFrame.title = 'Document';
  mainFrame.classList.add(options.activeRequestTypes.includes('main_frame') ? 'active' : 'inactive');
  
  subFrame.className = 'type sub_frame';
  subFrame.textContent = 'FRM';
  subFrame.title = 'Frame';
  subFrame.classList.add(options.activeRequestTypes.includes('sub_frame') ? 'active' : 'inactive');
  
  requestTypes.appendChild(xhr);
  requestTypes.appendChild(mainFrame);
  requestTypes.appendChild(subFrame);
  
  return requestTypes;
}

/**
 * Get toolbar
 */
export function getToolbar(options: ExtensionOptions): HTMLDivElement {
  const toolBarContainer = document.createElement('div');
  toolBarContainer.className = options.renderMode;
  toolBarContainer.id = 'toolBar';
  
  const requestTypes = getRequestTypeFiters(options);
  toolBarContainer.appendChild(requestTypes);
  
  const filterContainer = document.createElement('div');
  filterContainer.className = 'filter';
  
  const filterInput = document.createElement('input');
  filterInput.type = 'text';
  filterInput.id = 'inlineFilterInput';
  filterInput.placeholder = browser.i18n.getMessage('contentMessagesFilterHeaders') || 'Filter headers';
  
  const filterAllowRegex = document.createElement('input');
  filterAllowRegex.type = 'checkbox';
  filterAllowRegex.id = 'inlineFilterAllowRegex';
  filterAllowRegex.title = browser.i18n.getMessage('contentMessagesAllowRegex') || 'Allow regex';
  
  filterContainer.appendChild(filterInput);
  filterContainer.appendChild(filterAllowRegex);
  toolBarContainer.appendChild(filterContainer);
  
  return toolBarContainer;
}
