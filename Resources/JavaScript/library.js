/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*global chrome, document, localStorage, tabId, changeInfo, tab, openTab, localize */

'use strict';

var isChrome = true,
    googleAnalyticsId = 'UA-3541346-13',
    containerId = 'httpSpyContainer_sq27T8VFex4CtQ623afyMoiYA89kG6UZ',
    options;

if (typeof InstallTrigger !== 'undefined') {
    isChrome = false;
}

/**
 * Check if the object is defined
 * @return {Boolean}
 */
function isDefined(object) {
    return typeof object !== 'undefined';
}

/**
 * Check if the user has access to pro features
 * @return {Boolean}
 */
function isProVersion() {
    return true;
}


/**
 * Get pro version teaser
 *
 * @param {object} options
 * @return {Node}
 */


/**
 * Format bytes in human readable form
 * @param {Number} bytes
 * @return {string}
 */
function formatBytes(bytes) {
    if (bytes >= 1000000000) {
        bytes = (bytes / 1000000000).toFixed(2) + ' GB';
    }
    else if (bytes >= 1000000) {
        bytes = (bytes / 1000000).toFixed(2) + ' MB';
    }
    else if (bytes >= 1000) {
        bytes = (bytes / 1000).toFixed(2) + ' KB';
    }
    else if (bytes > 1) {
        bytes = bytes + ' bytes';
    }
    else if (bytes == 1) {
        bytes = bytes + ' byte';
    }
    else {
        bytes = '0 byte';
    }
    return bytes;
}

/**
 * Filter the headers
 */
function filterHeaders() {
    let container = document.getElementById(containerId),
        query = container.querySelector('#inlineFilterInput').value.toLowerCase(),
        isRegex = container.querySelector('#inlineFilterAllowRegex').checked;
    localStorage.inlineFilterAllowRegex = isRegex;
    if (isRegex) {
        let regex = new RegExp(query, 'ig');
        [].slice.call(container.getElementsByTagName('tr')).forEach(function (element) {
            if (element.textContent.match(regex) !== null) {
                element.style.display = 'table-row';
            } else {
                element.style.display = 'none';
            }
        });
        let magicMarker = new Mark(container),
            regexp = new RegExp(query, 'gmi');
        magicMarker.unmark();
        magicMarker.markRegExp(regexp);
    } else {
        [].slice.call(container.getElementsByTagName('tr')).forEach(function (element) {
            if (element.textContent.toLowerCase().includes(query)) {
                element.style.display = 'table-row';
            } else {
                element.style.display = 'none';
            }
        });
        let magicMarker = new Mark(container);
        magicMarker.unmark();
        magicMarker.mark(query);
    }
}

/**
 * Format bytes in human readable form
 * @param {Number} ms
 * @return {string}
 */
function formatMilliseconds(ms) {
    var zeroDate = new Date(),
        date,
        hours,
        minutes,
        seconds,
        milliseconds,
        duration = [];
    zeroDate.setHours(0);
    zeroDate.setMinutes(0);
    zeroDate.setSeconds(0);
    zeroDate.setMilliseconds(0);
    date = new Date(zeroDate.getTime() + parseInt(ms, 10));
    hours = date.getHours();
    minutes = date.getMinutes();
    seconds = date.getSeconds();
    milliseconds = date.getMilliseconds();
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
 * Create panel section
 *
 * @param {string} title  The title
 * @param {boolean} isOpen  Is the section collapsed?
 * @param {Node} content  The section content
 * @param {Node} cookies
 * @param {Node} query
 * @param {Node} formData
 * @return {Node}
 */
function getPanelSection(title, isOpen, content, cookies, query, formData) {
    let section = document.createElement('div'),
        summary = document.createElement('summary'),
        details = document.createElement('details'),
        sectionTitleText = document.createTextNode(title);
    summary.classList.add('sectionTitle', 'noSelect');
    summary.appendChild(sectionTitleText);
    details.open = Boolean(isOpen);
    details.appendChild(summary);
    details.appendChild(content);
    if (isDefined(query)) {
        let querySummary = document.createElement('summary'),
            queryDetails = document.createElement('details'),
            sectionQueryTitleText = document.createTextNode(chrome.i18n.getMessage('contentMessagesPanelTitleQuery'));
        querySummary.appendChild(sectionQueryTitleText);
        querySummary.classList.add('sectionTitle', 'noSelect');
        queryDetails.appendChild(querySummary);
        queryDetails.appendChild(query);
        details.appendChild(queryDetails);
    }
    if (isDefined(cookies)) {
        let cookieSummary = document.createElement('summary'),
            cookieDetails = document.createElement('details'),
            sectionCookieTitleText = document.createTextNode(title + ' ' + chrome.i18n.getMessage('contentMessagesPanelTitleCookies'));
        cookieSummary.appendChild(sectionCookieTitleText);
        cookieSummary.classList.add('sectionTitle', 'noSelect');
        cookieDetails.appendChild(cookieSummary);
        cookieDetails.appendChild(cookies);
        details.appendChild(cookieDetails);
    }
    if (isDefined(formData)) {
        let formDataSummary = document.createElement('summary'),
            formDataDetails = document.createElement('details'),
            sectionFormDataTitleText = document.createTextNode(chrome.i18n.getMessage('contentMessagesPanelTitleFormData'));
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
 *
 * @param {object} headers
 * @param {Number} i
 * @return {Number}
 */
function getTimeToFirstByte(headers, i) {
    if (!isDefined(headers.timeToFirstByte[i]) || headers.timeToFirstByte[i] === null) {
        return 0;
    }
    let time = new Date(headers.timeToFirstByte[i].timeStamp - headers.request[i].timeStamp),
        milliseconds = time.getMilliseconds(),
        seconds = time.getSeconds(),
        minutes = time.getMinutes();
    return milliseconds + seconds * 1000 + minutes * 60 * 1000;
}

/**
 * Get time to completion
 *
 * @param {object} headers
 * @param {Number} i
 * @return {Number}
 */
function getTimeToComplete(headers, i) {
    if (!isDefined(headers.timeToComplete[i]) || headers.timeToComplete[i] === null) {
        return 0;
    }
    let time = new Date(headers.timeToComplete[i].timeStamp - headers.request[i].timeStamp),
        milliseconds = time.getMilliseconds(),
        seconds = time.getSeconds(),
        minutes = time.getMinutes();
    return milliseconds + seconds * 1000 + minutes * 60 * 1000;
}

/**
 * Get time to first header
 *
 * @param {object} headers
 * @param {Number} i
 * @return {Number}
 */
function getTimeToFirstHeader(headers, i) {
    if (!isDefined(headers.timeToHeadersReceived[i]) || headers.timeToHeadersReceived[i] === null) {
        return 0;
    }
    let time = new Date(headers.timeToHeadersReceived[i].timeStamp - headers.request[i].timeStamp),
        milliseconds = time.getMilliseconds(),
        seconds = time.getSeconds(),
        minutes = time.getMinutes();
    return milliseconds + seconds * 1000 + minutes * 60 * 1000;
}

/**
 * Get a cookie table
 *
 * @param {string} value
 * @return {Node}
 */
function getCookieTable(value) {
    let table = document.createElement('table'),
        cookieLines = value.split('; ');
    table.className = 'cookieTable';
    cookieLines.forEach(function (line) {
        let key = line.substring(0, line.indexOf('=')),
            value = line.substring(line.indexOf('=') + 1);
        table.appendChild(getTableRow(key, value));
    });
    return table;
}

/**
 * Get a table row
 *
 * @param {string} key
 * @param {string} value
 * @return {Node}
 */
function getTableRow(key, value) {
    let row = document.createElement('tr'),
        keyCell = document.createElement('td'),
        keyText = document.createTextNode(key),
        valueCell = document.createElement('td'),
        valueText = document.createTextNode(value),
        cutoffKeySpan = document.createElement('span'),
        cutoffValueSpan = document.createElement('span');
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
 * Get a request panel
 *
 * @param {object} headers
 * @param {string} requestId
 * @param {object} options
 * @param {boolean} hasCloseButton
 * @return {Node}
 */
function getPanel(headers, requestId, options, hasCloseButton = false) {
    let content = document.createElement('div');

    // ✖ Close button
    if (hasCloseButton) {
        let closeButton = document.createElement('div');
        closeButton.classList.add('closeButton', 'noSelect');
        closeButton.appendChild(document.createTextNode('\u2716'));
        content.appendChild(closeButton);
    }

    content.className = 'normalMode';
    content.dataset.requestId = requestId;
    for (let i = 0, len = Object.keys(headers.request).length; i < len; ++i) {
        let panel = document.createElement('div'),
            request = headers.request[i],
            response = headers.response[i];
        if (!isDefined(response)) {
            continue;
        }

        content.classList.add(options.activeRequestTypes.includes(request.type) ? 'visible' : 'hidden');
        content.dataset.requestType = request.type;
        // request.requestHeaders.sort(sortObjectArrayByName);
        // response.responseHeaders.sort(sortObjectArrayByName);
        let urlDiv = document.createElement('div'),
            method = document.createTextNode(request.method),
            statusSpan = document.createElement('span'),
            urlLink = document.createElement('a'),
            urlText = document.createTextNode(request.url),
            statusLine = document.createElement('p'),
            statusLineText = document.createTextNode(response.statusLine),
            statusLineCacheSpan = document.createElement('span'),
            statusLineCacheText = document.createTextNode(response.fromCache ? ' (' + chrome.i18n.getMessage('contentMessagesFromDiskCache') + ')' : '');

        // URL
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

        // Method and status
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

        // Response times
        if (isProVersion()) {
            let ttc = getTimeToComplete(headers, i),
                ttfb = getTimeToFirstByte(headers, i),
                ttfh = getTimeToFirstHeader(headers, i),
                responseTime = ttc === 0 ? ttfh : ttc,
                responseTimeLine = document.createElement('p'),
                responseTimeLineText = document.createTextNode(formatMilliseconds(responseTime));
            responseTimeLine.classList.add('value', getTimeToCompleteStyle(responseTime));

            // Redirects don't have ttfb and ttc values because they are just headers
            if (ttfb === 0) {
                responseTimeLine.title = chrome.i18n.getMessage('contentMessagesHeadersReceived') + '\t' + formatMilliseconds(ttfh);
            } else {
                responseTimeLine.title = chrome.i18n.getMessage('contentMessagesHeadersReceived') + '\t' + formatMilliseconds(ttfh) +
                    '\n' + chrome.i18n.getMessage('contentMessagesTimeToFirstByte') + '\t\t' + formatMilliseconds(ttfb) +
                    '\n' + chrome.i18n.getMessage('contentMessagesRequestComplete') + '\t\t' + formatMilliseconds(ttc);
            }
            responseTimeLine.appendChild(responseTimeLineText);
            panel.appendChild(responseTimeLine);
        }

        // Server IP
        if (isDefined(response.ip) && isProVersion()) {
            let ipLine = document.createElement('p');
            ipLine.title = response.ip;
            ipLine.classList.add('key');
            ipLine.appendChild(document.createTextNode(response.ip));
            panel.appendChild(ipLine);
        }

        // GET parameters
        let queryContentTable = document.createElement('table');
        if (isDefined(request.getData) && request.getData.length) {
            request.getData.forEach(function (parameter) {
                queryContentTable.appendChild(getTableRow(parameter.key, parameter.value));
            });
        }

        // Form data
        let formDataContentTable = document.createElement('table');
        if (isDefined(request.requestBody)) {
            for (let parameterKey in request.requestBody.formData) {
                let value = '';
                if (request.requestBody.formData.hasOwnProperty(parameterKey)) {
                    value = request.requestBody.formData[parameterKey];
                    if (typeof value === 'object') {
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
                formDataContentTable.appendChild(getTableRow(parameterKey, value));
            }
        }

        // Request
        let sectionContentTable = document.createElement('table'),
            sectionCookieTables = document.createElement('div');
        sectionCookieTables.className = 'cookieTables';
        request.requestHeaders.forEach(function (header) {
            let lowercaseName = header.name.toLowerCase();
            if (lowercaseName === 'cookie') {
                sectionCookieTables.appendChild(getCookieTable(header.value));
            } else {
                if (!isValueInList(options.hiddenRequestHeaders, lowercaseName)) {
                    sectionContentTable.appendChild(getTableRow(header.name, header.value));
                }
            }
        });
        panel.appendChild(getPanelSection(
            chrome.i18n.getMessage('contentMessagesPanelTitleRequest'),
            false,
            sectionContentTable,
            sectionCookieTables.hasChildNodes() ? sectionCookieTables : undefined,
            queryContentTable.hasChildNodes() ? queryContentTable : undefined,
            formDataContentTable.hasChildNodes() ? formDataContentTable : undefined
        ));

        // Response
        sectionContentTable = document.createElement('table');
        sectionCookieTables = document.createElement('div');
        response.responseHeaders.forEach(function (header) {
            let lowercaseName = header.name.toLowerCase();
            if (lowercaseName === 'set-cookie') {
                sectionCookieTables.appendChild(getCookieTable(header.value));
            } else {
                if (!isValueInList(options.hiddenResponseHeaders, header.name.toLowerCase())) {
                    sectionContentTable.appendChild(getTableRow(header.name, header.value));
                }
            }
        });
        panel.appendChild(getPanelSection(
            chrome.i18n.getMessage('contentMessagesPanelTitleResponse'),
            i === (len - 1),
            sectionContentTable,
            sectionCookieTables.hasChildNodes() ? sectionCookieTables : undefined
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
 *
 * @param {object} options
 *
 * @return {Node}
 */
function getRequestTypeFiters(options) {
    let requestTypes = document.createElement('div'),
        xhr = document.createElement('div'),
        mainFrame = document.createElement('div'),
        subFrame = document.createElement('div');
    xhr.classList.add('type', 'noSelect', options.activeRequestTypes.includes('xmlhttprequest') ? 'active' : 'inactive');
    xhr.dataset.type = 'xmlhttprequest';
    xhr.appendChild(document.createTextNode(chrome.i18n.getMessage('contentMessagesRequestTypeXhr')));
    xhr.title = chrome.i18n.getMessage('contentMessagesRequestTypeXhr');
    mainFrame.classList.add('type', 'noSelect', options.activeRequestTypes.includes('main_frame') ? 'active' : 'inactive');
    mainFrame.dataset.type = 'main_frame';
    mainFrame.appendChild(document.createTextNode(chrome.i18n.getMessage('contentMessagesRequestTypeDoc')));
    mainFrame.title = chrome.i18n.getMessage('contentMessagesRequestTypeDoc');
    subFrame.classList.add('type', 'noSelect', options.activeRequestTypes.includes('sub_frame') ? 'active' : 'inactive');
    subFrame.dataset.type = 'sub_frame';
    subFrame.appendChild(document.createTextNode(chrome.i18n.getMessage('contentMessagesRequestTypeFrame')));
    subFrame.title = chrome.i18n.getMessage('contentMessagesRequestTypeFrame');
    requestTypes.classList.add('requestTypes');
    requestTypes.appendChild(mainFrame);
    requestTypes.appendChild(subFrame);
    requestTypes.appendChild(xhr);
    return requestTypes;
}

/**
 * Get toolbar
 *
 * @param {object} options
 *
 * @return {Node}
 */
function getToolbar(options) {
    let toolBar = document.createElement('div'),
        toolBarContainer = document.createElement('div'),
        filter = document.createElement('div'),
        inlineFilterInput = document.createElement('input'),
        inlineFilterRegexCheck = document.createElement('input'),
        inlineFitlerRegexCheckLabel = document.createElement('label');

    filter.className = 'filter';
    toolBarContainer.id = 'toolBar';
    toolBarContainer.classList.add(options.renderMode);
    toolBar.classList.add('toolBar');
    inlineFilterInput.placeholder = chrome.i18n.getMessage('contentMessagesFilterBarFilter');
    inlineFilterInput.id = 'inlineFilterInput';
    filter.appendChild(inlineFilterInput);

    inlineFilterRegexCheck.type = 'checkbox';
    inlineFilterRegexCheck.id = 'inlineFilterAllowRegex';
    inlineFilterRegexCheck.checked = localStorage.inlineFilterAllowRegex;
    inlineFitlerRegexCheckLabel.appendChild(inlineFilterRegexCheck);
    inlineFitlerRegexCheckLabel.appendChild(document.createTextNode(chrome.i18n.getMessage('contentMessagesFilterBarRegex')));
    inlineFitlerRegexCheckLabel.for = 'inlineFilterAllowRegex';
    inlineFitlerRegexCheckLabel.classList.add('noSelect');
    filter.appendChild(inlineFitlerRegexCheckLabel);
    toolBar.appendChild(filter);
    toolBar.appendChild(getRequestTypeFiters(options));
    toolBarContainer.appendChild(toolBar);
    return toolBarContainer;
}

function saveOption(key, value) {
    // Firefox developer edition supports storage, but a config option needs to be enabled
    if (isChrome && isDefined(chrome.storage.sync)) {
        let option = {};
        option[key] = value;
        chrome.storage.sync.set(option);
    } else {
        let stringify = ['activeRequestTypes', 'hiddenRequestHeaders', 'hiddenResponseHeaders', 'shownResponseHeaders', 'markers'];
        if (stringify.indexOf(key) !== -1) {
            localStorage[key] = JSON.stringify(value);
        } else {
            localStorage[key] = value;
        }
        if (key === 'activeRequestTypes') {
            sendCurrentRequestTypesToTabs(value);
            options.activeRequestTypes = value;
        } else {
            options[key] = value;
        }
    }
}

/**
 * Get extension options and store them in the options object
 *
 */
function restoreOptions() {
    // Firefox developer edition supports storage, but a config option needs to be enabled
    if (isChrome && isDefined(chrome.storage.sync)) {
        chrome.storage.sync.get(null, function (result) {
            let activeRequestTypes;
            if (isProVersion()) {
                activeRequestTypes = result.activeRequestTypes ? result.activeRequestTypes : ['main_frame'];
            } else {
                activeRequestTypes = ['main_frame'];
            }
            options = {
                location: result.location ? result.location : 'bottomRight',
                theme: result.theme ? result.theme : 'light',
                tabRequestLimit: result.tabRequestLimit ? result.tabRequestLimit : 25,
                timeout: result.timeout ? result.timeout : 3,
                hidePanelAfterTimeout: isDefined(result.hidePanelAfterTimeout) ? result.hidePanelAfterTimeout : true,
                renderMode: result.renderMode ? result.renderMode : 'microMode',
                hiddenRequestHeaders: result.hiddenRequestHeaders ? result.hiddenRequestHeaders.map(item => item.toLowerCase()) : [],
                hiddenResponseHeaders: result.hiddenResponseHeaders ? result.hiddenResponseHeaders.map(item => item.toLowerCase()) : [],
                shownResponseHeaders: result.shownResponseHeaders ? result.shownResponseHeaders.map(item => item.toLowerCase()) : ['^server$'],
                markers: result.markers ? result.markers.map(item => item.toLowerCase()) : [],
                activeRequestTypes: activeRequestTypes
            };
        });
    } else {
        let activeRequestTypes;
        if (isProVersion()) {
            activeRequestTypes = localStorage.activeRequestTypes ? JSON.parse(localStorage.activeRequestTypes) : ['main_frame'];
        } else {
            activeRequestTypes = ['main_frame'];
        }
        options = {
            location: localStorage.location ? localStorage.location : 'bottomRight',
            theme: localStorage.theme ? localStorage.theme : 'light',
            tabRequestLimit: localStorage.tabRequestLimit ? localStorage.tabRequestLimit : 25,
            timeout: localStorage.timeout ? localStorage.timeout : 3,
            hidePanelAfterTimeout: isDefined(localStorage.hidePanelAfterTimeout) ? localStorage.hidePanelAfterTimeout : true,
            renderMode: localStorage.renderMode ? localStorage.renderMode : 'microMode',
            hiddenRequestHeaders: isDefined(localStorage.hiddenRequestHeaders) ? JSON.parse(localStorage.hiddenRequestHeaders).map(item => item.toLowerCase()) : [],
            hiddenResponseHeaders: isDefined(localStorage.hiddenResponseHeaders) ? JSON.parse(localStorage.hiddenResponseHeaders).map(item => item.toLowerCase()) : [],
            shownResponseHeaders: isDefined(localStorage.shownResponseHeaders) ? JSON.parse(localStorage.shownResponseHeaders).map(item => item.toLowerCase()) : ['^Server$'],
            markers: isDefined(localStorage.markers) ? JSON.parse(localStorage.markers).map(item => item.toLowerCase()) : [],
            activeRequestTypes: activeRequestTypes
        };
    }
}

/**
 * Store request type selection
 */
function storeActiveRequestTypes(types) {
    saveOption('activeRequestTypes', types ? types : []);
}

/**
 * Store the request Type Selection
 *
 * @param {Node} containerElement
 */
function storeRequestTypeSelection(containerElement) {
    let activeRequestTypes = [];
    containerElement.querySelectorAll('.requestTypes .type').forEach(function (element) {
        if (element.classList.contains('active')) {
            activeRequestTypes.push(element.dataset.type);
        }
    });
    chrome.runtime.sendMessage(
        {
            msg: 'storeRequestTypeSelection',
            activeRequestTypes: activeRequestTypes
        }
    );
}

/**
 * Check if URL is valid
 * - is not undefined
 * - starts with http
 * - does not contain our google analytics id
 *
 * @param {string} url The url to check.
 * @return {boolean} True or False.
 */
var isValidUrl = function (url) {
    return isDefined(url)
        && typeof url === 'string'
        && url.indexOf('http') === 0
        && url.indexOf(googleAnalyticsId) === -1
        && url.indexOf('sourceid=chrome-instant') === -1
        && url.indexOf('async/newtab?async=') === -1
        && url.indexOf('chrome/newtab?') === -1
        && url.indexOf('https://ogs.google.com') !== 0;
};

/**
 * Return true if field is in the list, false otherwise
 *
 * @param {object} itemList The Status line.
 * @param {string} value The value.
 * @return {boolean} Is it?
 */
function isValueInList(itemList, value) {
    if (itemList.length === 0) {
        return false;
    }
    let isDisabled = itemList.some(function (item) {
        return value === item;
    });
    if (isDisabled) {
        return true;
    }
    return itemList.some(function (item) {
        let regex = new RegExp(item);
        return (value.match(regex) !== null);
    });
}

/**
 * Return Time To Complete style
 *
 * @param {Number} responseTime The response time in ms
 * @return {string} style  The classname.
 */
function getTimeToCompleteStyle(responseTime) {
    let style = '';
    responseTime = parseInt(responseTime, 10);
    if (responseTime < 750) {
        style = 'ttcOk';
    } else if (responseTime >= 750 && responseTime < 1000) {
        style = 'ttcMeh';
    } else if (responseTime > 1000) {
        style = 'ttcOhOh';
    }
    return style;
}

/**
 * Get separator
 *
 * @return {Node}
 */
function getSeparator() {
    let separator = document.createElement('div');
    separator.classList.add('separator');
    return separator;
}

/**
 * Return HTTP status style
 *
 * @param {string} status The Status line.
 * @return {string} style  The classname.
 */
function getStatusStyle(status) {
    let style = '';
    if (status.match(/(200|201|202|203|204|205|206|207)/g) !== null) {
        style = 'status2xx';
    }
    if (status.match(/(300|301|302|303|304|305|306|307)/g) !== null) {
        style = 'status3xx';
    }
    if (status.match(/(400|401|402|403|404|405|406|407|408|409|410|411|412|413|414|415|416|417)/g) !== null) {
        style = 'status4xx';
    }
    if (status.match(/(500|501|502|503|504|505)/g) !== null) {
        style = 'status5xx';
    }
    return style;
}

/**
 * Toggle element visibility
 *
 * @param {object} element The element.
 * @return {*}  Not defined.
 */
function toggleElementVisibility(element) {
    if (element.classList.contains('visible')) {
        element.classList.add('hidden');
        element.classList.remove('visible');
    } else {
        element.classList.add('visible');
        element.classList.remove('hidden');
    }
}

/**
 * Hide element
 *
 * @param {object} element The element.
 * @return {*}  Not defined.
 */
function hideElement(element) {
    if (element.classList.contains('visible')) {
        element.classList.add('hidden');
        element.classList.remove('visible');
    }
}

/**
 * Show element
 *
 * @param {object} element The element.
 * @return {*}  Not defined.
 */
function showElement(element) {
    if (element.classList.contains('hidden')) {
        element.classList.add('visible');
        element.classList.remove('hidden');
    }
}

/**
 * Hide all panels
 *
 * @return {*}  Not defined.
 */
function hideAllPanels() {
    document.getElementById(containerId).childNodes.forEach(function (node) {
        hideElement(node);
    });
}

/**
 * Disable request type
 *
 * @param {object} element The element.
 * @return {*}  Not defined.
 */
function disableRequestType(element) {
    if (element.classList.contains('active')) {
        element.classList.add('inactive');
        element.classList.remove('active');
        document.getElementById(containerId).querySelectorAll("[data-request-type='" + element.getAttribute('data-type') + "']").forEach(function (element) {
            hideElement(element);
        });
    }
}

/**
 * Enable request type
 *
 * @param {object} element The element.
 * @return {*}  Not defined.
 */
function enableRequestType(element) {
    if (element.classList.contains('inactive')) {
        element.classList.add('active');
        element.classList.remove('inactive');
        document.getElementById(containerId).querySelectorAll("[data-request-type='" + element.getAttribute('data-type') + "']").forEach(function (element) {
            showElement(element);
        });
    }
}

/**
 * Toggle request type
 *
 * @param {object} element The element.
 * @return {*}  Not defined.
 */
function toggleRequestType(element) {
    (element.classList.contains('active')) ? disableRequestType(element) : enableRequestType(element);
}

/**
 * Select the text inside an element
 *
 * @param {object} event The click event.
 * @return {*}  Not defined.
 */
function selectElementText(event) {
    let selectionRange = document.createRange();
    selectionRange.selectNodeContents(event.target);
    window.getSelection().addRange(selectionRange);
}

/**
 * Sort function to sort objectArray by name and value.
 *
 * @param {object} a  Object a.
 * @param {object} b  Object b.
 * @return {*}  Not defined.
 */
function sortObjectArrayByName(a, b) {
    if (a.name < b.name) {
        return -1;
    }
    if (a.name > b.name) {
        return 1;
    }
    if (a.value < b.value) {
        return -1;
    }
    if (a.value > b.value) {
        return 1;
    }
    return 0;
}
