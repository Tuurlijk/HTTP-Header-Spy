import { browser } from 'wxt/browser';

export default defineBackground(() => {
  const headerStore: Record<string, any> = {};

  /**
   * Is defined helper function
   */
  function isDefined(variable: any): boolean {
    return typeof variable !== 'undefined';
  }

  /**
   * Is the tab content ready
   */
  function isTabContentReady(tabId: string | number): boolean {
    return !isDefined(headerStore[tabId]) || !isDefined(headerStore[tabId].isContentReady);
  }

  /**
   * Is valid URL
   */
  function isValidUrl(url: string): boolean {
    return Boolean(url && (url.indexOf('http://') === 0 || url.indexOf('https://') === 0));
  }

  /**
   * Is the request loggable
   */
  function isRequestLoggable(info: any): boolean {
    return parseInt(String(info.tabId), 10) > 0 && isValidUrl(info.url) &&
      (info.type === 'main_frame' || info.type === 'sub_frame' || info.type === 'xmlhttprequest');
  }

  /**
   * Initialize header storage
   */
  function initializeHeaderStore(tabId: string | number, requestId: string): void {
    tabId = String(tabId);
    if (!isDefined(headerStore[tabId])) {
      headerStore[tabId] = { isContentReady: false };
    }
    if (!isDefined(headerStore[tabId][requestId])) {
      headerStore[tabId][requestId] = {};
      headerStore[tabId][requestId].request = {};
      headerStore[tabId][requestId].response = {};
      headerStore[tabId][requestId].timeToFirstByte = {};
      headerStore[tabId][requestId].timeToHeadersReceived = {};
      headerStore[tabId][requestId].timeToComplete = {};
    }
  }

  /**
   * Prune store
   */
  function pruneHeaderStore(tabId: string): void {
    const tabRequestLimit = localStorage.tabRequestLimit ? localStorage.tabRequestLimit : 25;
    const requestIds = Object.keys(headerStore[tabId]);
    if (requestIds.length > tabRequestLimit) {
      delete headerStore[tabId][requestIds.splice(1, 1)[0]];
    }
  }

  /**
   * Reset store for each main_frame (frameId 0) request.
   */
  function resetHeaderStore(tabId: string | number, frameId: number, type: string, requestId: string): void {
    tabId = String(tabId);
    if (type === 'main_frame' &&
      parseInt(String(frameId), 10) === 0 &&
      isDefined(headerStore[tabId]) &&
      Object.keys(headerStore[tabId]).shift() !== requestId
    ) {
      delete headerStore[tabId];
    }
    initializeHeaderStore(tabId, requestId);
  }

  /**
   * Enable HTTP Header Spy on tabs with valid urls
   */
  function enablePopup(tab: chrome.tabs.Tab): void {
    if (tab.id && isValidUrl(tab.url || '')) {
      browser.action.enable(tab.id);
    } else if (tab.id) {
      browser.action.disable(tab.id);
    }
  }

  /**
   * Inject styles into content
   */
  function injectStyleSheetsIntoContent(tab: chrome.tabs.Tab): void {
    if (!tab.id || !isValidUrl(tab.url || '')) {
      return;
    }
    
    browser.tabs.sendMessage(
      tab.id,
      { msg: 'isStyleSheetInjected' }
    ).then((response: any) => {
      if (isDefined(response) && !response.isStyleSheetInjected) {
        browser.scripting.insertCSS({
          target: { tabId: tab.id as number },
          files: ['/assets/css/content.css']
        }).then(() => {
          browser.storage.local.get('theme').then((result: { theme?: string }) => {
            const theme = result.theme || 'dark';
            
            browser.scripting.insertCSS({
              target: { tabId: tab.id as number },
              files: [theme === 'light' ? '/assets/css/contentLight.css' : '/assets/css/contentDark.css']
            }).then(() => {
              browser.tabs.sendMessage(
                tab.id as number,
                { msg: 'styleSheetIsInjected' }
              );
            });
          });
        });
      }
    }).catch(() => {
    });
  }

  /**
   * Send headers to content script
   */
  function sendHeadersToContent(tabId: number, url: string, headers: any, message: string): void {
    if (!isValidUrl(url) || !isTabContentReady(tabId)) {
      return;
    }
    
    browser.storage.local.get('renderMode').then((result: { renderMode?: string }) => {
      const renderMode = result.renderMode || 'microMode';
      
      if (parseInt(String(tabId), 10) <= 0 || renderMode === 'none') {
        return;
      }
      
      browser.tabs.sendMessage(tabId, {
        msg: message,
        headers: headers,
        options: result
      }).catch(() => {
      });
    });
  }

  browser.webRequest.onBeforeRequest.addListener(
    (info) => {
      if (!isRequestLoggable(info)) {
        return;
      }
      
      if (info.type === 'main_frame') {
        info.frameId = 0;
      }
      
      resetHeaderStore(info.tabId, info.frameId || 0, info.type, info.requestId);
      pruneHeaderStore(String(info.tabId));
      
      const requestId = String(info.requestId);
      const tabId = String(info.tabId);
      let requestIndex = headerStore[tabId][requestId].request.requestIndex;
      
      if (!isDefined(requestIndex)) {
        requestIndex = 0;
      } else {
        requestIndex++;
      }
      
      headerStore[tabId][requestId].request.requestIndex = requestIndex;
      headerStore[tabId][requestId].request[requestIndex] = info;
    },
    { urls: ['http://*/*', 'https://*/*'], types: ['main_frame', 'sub_frame', 'xmlhttprequest'] },
    ['requestBody']
  );

  browser.webRequest.onBeforeRedirect.addListener(
    (info) => {
      if (!isRequestLoggable(info)) {
        return;
      }
      
      const requestId = String(info.requestId);
      const tabId = String(info.tabId);
      
      if (!isDefined(headerStore[tabId]) || !isDefined(headerStore[tabId][requestId])) {
        return;
      }
      
      const requestIndex = headerStore[tabId][requestId].request.requestIndex;

      if (typeof headerStore[tabId][requestId].response[requestIndex] === 'object') {
        headerStore[tabId][requestId].response[requestIndex] = Object.assign(
          headerStore[tabId][requestId].response[requestIndex], 
          info
        );
      } else {
        headerStore[tabId][requestId].response[requestIndex] = info;
      }
    },
    { urls: ['http://*/*', 'https://*/*'], types: ['main_frame', 'sub_frame', 'xmlhttprequest'] },
    ['responseHeaders']
  );

  browser.webRequest.onCompleted.addListener(
    (info) => {
      if (!isRequestLoggable(info)) {
        return;
      }
      
      const requestId = String(info.requestId);
      const tabId = String(info.tabId);
      
      if (!isDefined(headerStore[tabId]) || !isDefined(headerStore[tabId][requestId])) {
        return;
      }
      
      const requestIndex = headerStore[tabId][requestId].request.requestIndex;
      
      headerStore[tabId][requestId].timeToComplete[requestIndex] = { timeStamp: info.timeStamp };
      
      if (typeof headerStore[tabId][requestId].response[requestIndex] === 'object') {
        headerStore[tabId][requestId].response[requestIndex] = Object.assign(
          headerStore[tabId][requestId].response[requestIndex], 
          info
        );
      } else {
        headerStore[tabId][requestId].response[requestIndex] = info;
      }
      
      if (!isDefined(headerStore[tabId][requestId].response[requestIndex].responseHeaders)) {
        headerStore[tabId][requestId].response[requestIndex].responseHeaders = [];
      }
      
      delete headerStore[tabId][requestId].request.requestIndex;
      
      let headers: Record<string, any> = {};
      headers[requestId] = headerStore[tabId][requestId];
      sendHeadersToContent(info.tabId, info.url, headers, 'responseCompleted');
    },
    { urls: ['http://*/*', 'https://*/*'], types: ['main_frame', 'sub_frame', 'xmlhttprequest'] }
  );

  browser.webRequest.onHeadersReceived.addListener(
    (info) => {
      if (!isRequestLoggable(info)) {
        return;
      }
      
      const requestId = String(info.requestId);
      const tabId = String(info.tabId);
      
      if (!isDefined(headerStore[tabId]) || !isDefined(headerStore[tabId][requestId])) {
        return;
      }
      
      const requestIndex = headerStore[tabId][requestId].request.requestIndex;
      
      headerStore[tabId][requestId].timeToHeadersReceived[requestIndex] = { timeStamp: info.timeStamp };
      
      headerStore[tabId][requestId].response[requestIndex] = info;
    },
    { urls: ['http://*/*', 'https://*/*'], types: ['main_frame', 'sub_frame', 'xmlhttprequest'] },
    ['responseHeaders']
  );

  browser.webRequest.onResponseStarted.addListener(
    (info) => {
      if (!isRequestLoggable(info)) {
        return;
      }
      
      const requestId = String(info.requestId);
      const tabId = String(info.tabId);
      
      if (!isDefined(headerStore[tabId]) || !isDefined(headerStore[tabId][requestId])) {
        return;
      }
      
      const requestIndex = headerStore[tabId][requestId].request.requestIndex;
      
      headerStore[tabId][requestId].timeToFirstByte[requestIndex] = { timeStamp: info.timeStamp };
    },
    { urls: ['http://*/*', 'https://*/*'], types: ['main_frame', 'sub_frame', 'xmlhttprequest'] }
  );

  browser.webRequest.onSendHeaders.addListener(
    (info) => {
      if (!isRequestLoggable(info)) {
        return;
      }
      
      if (info.type === 'main_frame') {
        info.frameId = 0;
      }
      
      const requestId = String(info.requestId);
      const tabId = String(info.tabId);
      const urlParser = document.createElement('a');
      
      if (!isDefined(headerStore[tabId]) || !isDefined(headerStore[tabId][requestId])) {
        return;
      }
      
      const requestIndex = headerStore[tabId][requestId].request.requestIndex;
      
      urlParser.href = info.url;
      if (urlParser.search.length) {
        const get = new URLSearchParams(urlParser.search);
        const parameters: Array<{key: string, value: string}> = [];
        
        get.forEach((value, key) => {
          parameters.push({ key, value });
        });
        
        (info as any).getData = parameters;
      }
      
      if (typeof headerStore[tabId][requestId].request[requestIndex] === 'object') {
        headerStore[tabId][requestId].request[requestIndex] = Object.assign(
          headerStore[tabId][requestId].request[requestIndex], 
          info
        );
      } else {
        headerStore[tabId][requestId].request[requestIndex] = info;
      }
    },
    { urls: ['http://*/*', 'https://*/*'], types: ['main_frame', 'sub_frame', 'xmlhttprequest'] },
    ['requestHeaders']
  );

  browser.tabs.onActivated.addListener(() => {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const tab = tabs[0];
      if (tab) {
        injectStyleSheetsIntoContent(tab);
        sendHeadersToContent(tab.id as number, tab.url || '', headerStore[String(tab.id)], 'tabActivated');
        enablePopup(tab);
      }
    });
  });

  browser.tabs.onCreated.addListener((tab) => {
    if (tab.id) {
      sendHeadersToContent(tab.id, tab.url || '', headerStore[String(tab.id)], 'tabCreated');
      enablePopup(tab);
    }
  });

  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete' || !isValidUrl(tab.url || '')) {
      return;
    }
    
    if (isDefined(headerStore[tabId]) && isDefined(headerStore[tabId].isContentReady)) {
      delete headerStore[tabId].isContentReady;
    }

    browser.storage.local.get('renderMode').then((result) => {
      const renderMode = result.renderMode || 'microMode';
      
      if (parseInt(String(tabId), 10) <= 0 || renderMode === 'none') {
        return;
      }
      
      injectStyleSheetsIntoContent(tab);
      sendHeadersToContent(tabId, tab.url || '', headerStore[String(tabId)], 'tabUpdated');
      enablePopup(tab);
    });
  });

  browser.tabs.onRemoved.addListener((tabId) => {
    delete headerStore[String(tabId)];
  });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.msg === 'storeRequestTypeSelection') {
      browser.storage.local.set({ activeRequestTypes: message.activeRequestTypes });
      return false;
    } else if (message.msg === 'getHeadersForTab') {
      sendResponse({ headerStore: headerStore[String(message.tabId)] || {} });
      return true;
    }
    return false;
  });

  browser.storage.onChanged.addListener((changes, namespace) => {
    let activeRequestTypes: string[] = [];
    let activeRequestTypesDidChange = false;
    
    for (const key in changes) {
      if (changes.hasOwnProperty(key)) {
        if (key === 'activeRequestTypes') {
          activeRequestTypesDidChange = true;
          activeRequestTypes = changes[key].newValue;
        }
      }
    }

    if (activeRequestTypesDidChange) {
      browser.tabs.query({}).then((tabs) => {
        tabs.forEach((tab) => {
          if (tab.id && isValidUrl(tab.url || '')) {
            browser.tabs.sendMessage(tab.id, {
              msg: 'requestTypeSelectionDidChange',
              activeRequestTypes: activeRequestTypes
            }).catch(() => {
            });
          }
        });
      });
    }
  });
});
