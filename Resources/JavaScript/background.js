/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*global chrome, options, isChrome, document, getSettings, isValidUrl, localStorage, tabId, changeInfo, tab, openTab, localize */

'use strict';

// Background script loaded

var headerStore = {};

/**
 * Enable HTTP Header Spy on tabs with valid urls
 *
 * @param {object} tab A tab object.
 * @return {*} Not defined.
 */
function enablePopup(tab) {
    if (isValidUrl(tab.url)) {
        chrome.action.enable(tab.id);
    } else {
        chrome.action.disable(tab.id);
    }
}

/**
 *  Inject styles into content
 *
 * @param {object} tab A tab object.
 * @return {*} Not defined.
 */
function injectStyleSheetsIntoContent(tab) {
    if (!isValidUrl(tab.url)) {
        return;
    }
    chrome.tabs.sendMessage(
        tab.id,
        {msg: 'isStyleSheetInjected'},
        function(response) {
            if (isDefined(response) && !response.isStyleSheetInjected) {
                chrome.tabs.insertCSS(tab.id, {
                    file: '/Resources/CSS/content.css'
                });
                if (options.theme === 'light') {
                    chrome.tabs.insertCSS(tab.id, {
                        file: '/Resources/CSS/contentLight.css'
                    });
                } else {
                    chrome.tabs.insertCSS(tab.id, {
                        file: '/Resources/CSS/contentDark.css'
                    });
                }
                chrome.tabs.sendMessage(
                    tab.id,
                    {msg: 'styleSheetIsInjected'}
                );
                // Mark content as ready to receive headers
                if (isDefined(headerStore[String(tab.id)])) {
                    delete headerStore[String(tab.id)].isContentReady;
                }
            }
        }
    );
}

/**
 * Initialize header storage
 *
 * @param {Number} tabId
 * @param {Number} requestId
 */
function initializeHeaderStore(tabId, requestId) {
    tabId = String(tabId);
    if (!isDefined(headerStore[tabId])) {
        headerStore[tabId] = {isContentReady: false};
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
 * Is the tab content ready
 *
 * @param {Number} tabId
 * @return {boolean}
 */
function isTabContentReady(tabId) {
    return !isDefined(headerStore[tabId]) || !isDefined(headerStore[tabId].isContentReady);
}

/**
 * Is the request loggable
 *
 * @param {object} info
 * @return {boolean}
 */
function isRequestLoggable(info) {
    return parseInt(info.tabId, 10) > 0 && isValidUrl(info.url) &&
        (info.type === 'main_frame' || isProVersion());
}

/**
 * Prune store
 */
function pruneHeaderStore(tabId) {
    let tabRequestLimit = localStorage.tabRequestLimit ? localStorage.tabRequestLimit : 25,
        requestIds = Object.keys(headerStore[tabId]);
    if (requestIds.length > tabRequestLimit) {
        delete headerStore[tabId][requestIds.splice(1, 1)];
    }
}

/**
 * Reset store for each main_frame (frameId 0) request.
 */
function resetHeaderStore(tabId, frameId, type, requestId) {
    tabId = String(tabId);
    if (type === 'main_frame' &&
        parseInt(frameId, 10) === 0 &&
        isDefined(headerStore[tabId]) &&
        Object.keys(headerStore[tabId]).shift() !== requestId
    ) {
        // console.log('-----------------------------------');
        // console.log('RESETTING HEADER STORE FOR TAB ' + tabId);
        // console.log('-----------------------------------');
        delete headerStore[tabId];
    }
    initializeHeaderStore(tabId, requestId);
}

/**
 * Store the formData before a main_frame (Document) request will be sent.
 * This is the first trigger, so we initialize the object here.
 * https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest
 *
 * Seems to only work on Chrome at the moment: https://bugzilla.mozilla.org/show_bug.cgi?id=1305162
 */
chrome.webRequest.onBeforeRequest.addListener(
    function(info) {
        if (!isRequestLoggable(info)) {
            return;
        }
        // Firefox sets originUrl when 'cmd + click'-ing links.
        // It also sets the frameId to the frame of the click. Here we reset it to 0.
        if (!isChrome && info.type === 'main_frame' && isDefined(info.originUrl)) {
            info.frameId = 0;
        }
        resetHeaderStore(info.tabId, info.frameId, info.type, info.requestId);
        pruneHeaderStore(info.tabId);
        let requestId = String(info.requestId),
            tabId = String(info.tabId),
            requestIndex = headerStore[tabId][requestId].request.requestIndex;
        if (!isDefined(requestIndex)) {
            requestIndex = 0;
        } else {
            requestIndex++;
        }
        headerStore[tabId][requestId].request.requestIndex = requestIndex;

        // Prevent error when HSTS occurs
        if (!isDefined(info.requestHeaders)) {
            info.requestHeaders = [];
        }
        headerStore[tabId][requestId].request[requestIndex] = info;
    },
    {
        urls: ['http://*/*', 'https://*/*'],
        types: ['main_frame', 'sub_frame', 'xmlhttprequest']
    },
    isChrome ? ['requestBody'] : []
);

/**
 * store response headers before redirecting
 */
chrome.webRequest.onBeforeRedirect.addListener(
    function(info) {
        if (!isRequestLoggable(info)) {
            return;
        }
        let requestId = String(info.requestId),
            tabId = String(info.tabId),
            requestIndex;
        // Maybe the request was already removed from the queue
        if (!isDefined(headerStore[tabId]) || !isDefined(headerStore[tabId][requestId])) {
            return;
        }
        requestIndex = headerStore[tabId][requestId].request.requestIndex;

        // In case of redirects, there may already be data for this request, extend it.
        if (typeof headerStore[tabId][requestId].response[requestIndex] === 'object') {
            headerStore[tabId][requestId].response[requestIndex] = Object.assign(headerStore[tabId][requestId].response[requestIndex], info);
        } else {
            headerStore[tabId][requestId].response[requestIndex] = info;
        }
    },
    {
        urls: ['http://*/*', 'https://*/*'],
        types: ['main_frame', 'sub_frame', 'xmlhttprequest']
    },
    ['responseHeaders']
);

/**
 * Store the timestamp when the request completes
 */
chrome.webRequest.onCompleted.addListener(
    function(info) {
        console.log('webRequest onCompleted for', info.url);
        if (!isRequestLoggable(info)) {
            return;
        }
        let requestId = String(info.requestId),
            tabId = String(info.tabId),
            requestIndex;
        // Maybe the request was already removed from the queue
        if (!isDefined(headerStore[tabId]) || !isDefined(headerStore[tabId][requestId])) {
            return;
        }
        requestIndex = headerStore[tabId][requestId].request.requestIndex;

        // Log time to complete the request
        headerStore[tabId][requestId].timeToComplete[requestIndex] = {timeStamp: info.timeStamp};

        // Extend the existing object with any new fields.
        if (typeof headerStore[tabId][requestId].response[requestIndex] === 'object') {
            headerStore[tabId][requestId].response[requestIndex] = Object.assign(headerStore[tabId][requestId].response[requestIndex], info);
        } else {
            headerStore[tabId][requestId].response[requestIndex] = info;
        }

        // Results from cache don't have responseHeaders
        if (!isDefined(headerStore[tabId][requestId].response[requestIndex].responseHeaders)) {
            headerStore[tabId][requestId].response[requestIndex].responseHeaders = [];
        }

        // Clean the requestIndex, so any Object.keys().length calls will return a valid count
        delete headerStore[tabId][requestId].request.requestIndex;

        if (isProVersion()) {
            let headers = {};
            headers[requestId] = headerStore[tabId][requestId];
            sendHeadersToContent(info.tabId, info.url, headers, 'responseCompleted');
        }
    },
    {
        urls: ['http://*/*', 'https://*/*'],
        types: ['main_frame', 'sub_frame', 'xmlhttprequest']
    }
);

/**
 * Store the response headers when a main_frame (Document) response comes in.
 */
chrome.webRequest.onHeadersReceived.addListener(
    function(info) {
        if (!isRequestLoggable(info)) {
            return;
        }
        let requestId = String(info.requestId),
            tabId = String(info.tabId),
            requestIndex;
        // Maybe the request was already removed from the queue
        if (!isDefined(headerStore[tabId]) || !isDefined(headerStore[tabId][requestId])) {
            return;
        }
        requestIndex = headerStore[tabId][requestId].request.requestIndex;

        // Log timeToHeadersReceived
        headerStore[tabId][requestId].timeToHeadersReceived[requestIndex] = {timeStamp: info.timeStamp};

        headerStore[tabId][requestId].response[requestIndex] = info;
    },
    {
        urls: ['http://*/*', 'https://*/*'],
        types: ['main_frame', 'sub_frame', 'xmlhttprequest']
    },
    ['responseHeaders']
);

/**
 * Store the timestamp when the first byte comes in.
 */
chrome.webRequest.onResponseStarted.addListener(
    function(info) {
        if (!isRequestLoggable(info)) {
            return;
        }
        let requestId = String(info.requestId),
            tabId = String(info.tabId),
            requestIndex;
        // Maybe the request was already removed from the queue
        if (!isDefined(headerStore[tabId]) || !isDefined(headerStore[tabId][requestId])) {
            return;
        }
        requestIndex = headerStore[tabId][requestId].request.requestIndex;

        // Log timeToFirstByte
        headerStore[tabId][requestId].timeToFirstByte[requestIndex] = {timeStamp: info.timeStamp};
    },
    {
        urls: ['http://*/*', 'https://*/*'],
        types: ['main_frame', 'sub_frame', 'xmlhttprequest']
    }
);

/**
 * Store the request headers when a main_frame (Document) request will be sent.
 */
chrome.webRequest.onSendHeaders.addListener(
    function(info) {
        if (!isRequestLoggable(info)) {
            return;
        }
        // Firefox sets originUrl when 'cmd + click'-ing links.
        // It also sets the frameId to the frame of the click. Here we reset it to 0.
        if (!isChrome && info.type === 'main_frame' && isDefined(info.originUrl)) {
            info.frameId = 0;
        }
        let requestId = String(info.requestId),
            tabId = String(info.tabId),
            urlParser = document.createElement('a'),
            requestIndex;
        // Maybe the request was already removed from the queue
        if (!isDefined(headerStore[tabId]) || !isDefined(headerStore[tabId][requestId])) {
            return;
        }
        requestIndex = headerStore[tabId][requestId].request.requestIndex;

        // Get parameters
        urlParser.href = info.url;
        if (urlParser.search.length) {
            let get = new URLSearchParams(urlParser.search),
                parameters = [];
            for (let [key, value] of get.entries()) {
                parameters.push({'key': key, 'value': value});
            }
            info.getData = parameters;
        }
        // In case of post data, there may already be data for this request, extend it.
        if (typeof headerStore[tabId][requestId].request[requestIndex] === 'object') {
            headerStore[tabId][requestId].request[requestIndex] = Object.assign(headerStore[tabId][requestId].request[requestIndex], info);
        } else {
            headerStore[tabId][requestId].request[requestIndex] = info;
        }
    },
    {
        urls: ['http://*/*', 'https://*/*'],
        types: ['main_frame', 'sub_frame', 'xmlhttprequest']
    },
    ['requestHeaders']
);

/**
 * Send headers to content script
 *
 * @param {Number} tabId
 * @param {string} url
 * @param {object} headers
 * @param {string} message
 */
function sendHeadersToContent(tabId, url, headers, message) {
    console.log('sendHeadersToContent called for tab', tabId, 'url', url, 'message', message);
    console.log('isValidUrl:', isValidUrl(url), 'isTabContentReady:', isTabContentReady(tabId));
    if (!isValidUrl(url) || !isTabContentReady(tabId)) {
        return;
    }
    if (parseInt(tabId, 10) <= 0 || options.renderMode === 'none') {
        return;
    }
    console.log('Sending message to content script');
    chrome.tabs.sendMessage(tabId, {
        msg: message,
        headers: headers,
        options: options
    });
}

/**
 * detect when a tab is activated (tab switch) or load a fresh tab from a 'new tab page'
 */
chrome.tabs.onActivated.addListener(function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        let tab = tabs.shift();
        injectStyleSheetsIntoContent(tab);
        sendHeadersToContent(tab.id, tab.url, headerStore[String(tab.id)], 'tabActivated');
        enablePopup(tab);
    });
});

/**
 * detect when a tab is created
 */
chrome.tabs.onCreated.addListener(function(tab) {
    sendHeadersToContent(tab.id, tab.url, headerStore[String(tab.id)], 'tabCreated');
    enablePopup(tab);
});

/**
 * Detect when the content of a tab is ready, inject the CSS and
 * pass the headers and the options to the content.
 */
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // We only react on a complete load of a http(s) page,
    // only then we're sure the content.js is loaded.
    if (changeInfo.status !== 'complete' || !isValidUrl(tab.url)) {
        return;
    }
    // Remove the isContentReady: false property so the isTabContentReady() method will return true
    if (isDefined(headerStore[tabId]) && isDefined(headerStore[tabId].isContentReady)) {
        delete headerStore[tabId].isContentReady;
    }

    if (!isChrome) {
        restoreOptions();
    }

    if (parseInt(tabId, 10) <= 0 || options.renderMode === 'none') {
        return;
    }
    injectStyleSheetsIntoContent(tab);
    sendHeadersToContent(tab.id, tab.url, headerStore[String(tab.id)], 'tabUpdated');
    enablePopup(tab);
});

/**
 * Cleanup headerStore when tab closes
 */
chrome.tabs.onRemoved.addListener(function(tabId) {
    delete headerStore[String(tabId)];
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    switch (message.msg) {
        case 'storeRequestTypeSelection':
            storeActiveRequestTypes(message.activeRequestTypes);
            break;
    }
    // Maybe check sender?
});

function sendCurrentRequestTypesToTabs(activeRequestTypes) {
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach(function(tab) {
            if (isValidUrl(tab.url)) {
                chrome.tabs.sendMessage(tab.id, {
                    msg: 'requestTypeSelectionDidChange',
                    activeRequestTypes: activeRequestTypes
                });
            }
        });
    });
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
    let activeRequestTypes = [],
        activeRequestTypesDidChange = false;
    for (let key in changes) {
        if (changes.hasOwnProperty(key)) {
            options[key] = changes[key].newValue;
            if (key === 'activeRequestTypes') {
                activeRequestTypesDidChange = true;
                activeRequestTypes = options[key];
            }
        }
    }

    if (activeRequestTypesDidChange) {
        sendCurrentRequestTypesToTabs(activeRequestTypes);
    }
});

restoreOptions();
