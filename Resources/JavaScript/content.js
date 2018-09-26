/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*global chrome, hasLicense, isChrome, options, containerId, document, localStorage, tabId, changeInfo, tab, openTab, localize, Mark */

'use strict';

let isStyleSheetInjected = false;

/**
 * Pauseable Timer
 *
 * @param  {object} callback  The callback object.
 * @param  {Number} delay  The delay.
 * @param  {Number} requestId
 * @this   {Timer}  A Timer.
 * @return {*}  Not defined.
 */
function Timer(callback, delay, requestId) {
    let timerId,
        start,
        remaining = delay,
        element = document.getElementById(containerId).querySelector("[data-request-id='" + requestId + "']");

    this.pause = function() {
        window.clearTimeout(timerId);
        remaining -= new Date() - start;
        if (element !== null) {
            element.classList.remove('fadeOutFast');
        }
    };

    this.reset = function(callback, delay) {
        window.clearTimeout(timerId);
        if (element !== null) {
            element.classList.remove('fadeOutFast');
        }
        timerId = window.setTimeout(callback, delay, requestId);
    };

    this.resume = function() {
        start = new Date();
        timerId = window.setTimeout(callback, remaining, requestId);
    };

    this.resume();
}

/**
 * Remove panel
 *
 * @param  {Number} requestId
 * @return {*}  Not defined.
 */
function removePanel(requestId) {
    let element = document.getElementById(containerId).querySelector("[data-request-id='" + requestId + "']");
    if (element !== null) {
        element.parentNode.removeChild(element);
    }
}

/**
 * Fade out panel
 *
 * @param  {Number} requestId
 * @return {*}  Not defined.
 */
function fadeOutPanel(requestId) {
    let element = document.getElementById(containerId).querySelector("[data-request-id='" + requestId + "']");
    if (element !== null) {
        element.classList.add('fadeOutFast');
        element.classList.remove('visible');
    }
    let containerTimer = new Timer(removePanel, 300, requestId);
}

/**
 * Append element to another element
 * Pass the child elements as one or more parameters after the parent
 *
 * @param {object} parent  The parent element.
 * @return {*}  Not defined.
 */
function appendChild(parent) {
    for (let i = 1; i < arguments.length; i++) {
        parent.appendChild(arguments[i]);
    }
}

/**
 * Remove element from container
 * @param {Node} element
 * @param {Boolean} animate
 */
function removeElementFromContainer(element, animate = false) {
    if (element === null) {
        return;
    }
    if (!animate) {
        element.remove();
        return;
    }
    element.classList.add('fadeOut');
    element.addEventListener('webkitAnimationEnd', function() {
        element.remove();
    });
}

/**
 * Create the infoBox
 *
 * @param {options} options  The infoBox options.
 * @return {*}  Not defined.
 */
function createContainer(options) {
    let containerElement = document.getElementById(containerId);
    if (containerElement !== null) {
        return containerElement;
    }
    containerElement = document.createElement(options.hidePanelAfterTimeout ? 'div' : 'details');
    containerElement.open = true;
    containerElement.id = containerId;
    containerElement.classList.add(options.location);
    if (options.renderMode === 'microMode') {
        containerElement.classList.add('noMargin');
    }

    if (options.hidePanelAfterTimeout) {
        containerElement.classList.add('noToolbar');
    }

    if (document.getElementsByTagName('body')[0]) {
        appendChild(document.body, containerElement);
    } else {
        appendChild(document.getElementsByTagName('html')[0], containerElement);
    }

    // Handle Escape key to close panels
    document.onkeyup = function(event) {
        if (!isDefined(document.getElementById(containerId))) {
            return;
        }

        event = event || window.event;
        var isEscape = false;
        if ('key' in event) {
            isEscape = (event.key === 'Escape' || event.key === 'Esc');
        } else {
            isEscape = (event.keyCode === 27);
        }
        if (isEscape) {
            document.getElementById(containerId).open = false;
        }
    };

    return containerElement;
}

/**
 * Render small infomation panel
 * @param {object} headers
 * @param {Number} requestId
 * @param {object} options  The request object with the options'
 *
 * @return {Node}
 */
function createMicroPanel(headers, requestId, options) {
    let content = document.createElement('div'),
        shownResponseHeaders = options.shownResponseHeaders.map(header => header.toLowerCase());

    for (let i = 0, len = Object.keys(headers.response).length; i < len; ++i) {
        let request = headers.request[i],
            response = headers.response[i];

        if (!isDefined(response)) {
            continue;
        }

        let panel = document.createElement('div'),
            // closeButton = document.createElement('div'),
            // thankYouLink = thankYouTeaser(options),
            panelTitle = [],
            methodSpan = document.createElement('span'),
            method = document.createTextNode(request.method),
            statusSpan = document.createElement('span'),
            statusText,
            separator = ' | ';

        // // ✖ Close button
        // closeButton.classList.add('closeButton', 'noSelect');
        // closeButton.appendChild(document.createTextNode('\u2716'));
        // content.appendChild(closeButton);

        content.classList.add('microMode');
        content.classList.add(options.activeRequestTypes.includes(request.type) ? 'visible' : 'hidden');
        content.dataset.requestType = request.type;
        content.dataset.requestId = requestId;

        // Method
        methodSpan.appendChild(method);
        methodSpan.classList.add('status', getStatusStyle(String(response.statusCode)));
        panelTitle.push(request.url +
            '\n' + response.statusLine +
            (response.fromCache ? ' (' + chrome.i18n.getMessage('contentMessagesCached') + ')' : '') +
            '\n');
        // panel.appendChild(thankYouLink);
        panel.appendChild(methodSpan);
        panel.appendChild(document.createTextNode(separator));

        // Status
        statusText = document.createTextNode(response.statusCode + (response.fromCache ? ' (' + chrome.i18n.getMessage('contentMessagesCache') + ')' : ''));
        statusSpan.appendChild(statusText);
        statusSpan.classList.add('status');
        panel.appendChild(statusSpan);
        panel.appendChild(document.createTextNode(separator));

        // Response times
        if (isProVersion()) {
            let ttc = getTimeToComplete(headers, i),
                ttfb = getTimeToFirstByte(headers, i),
                ttfh = getTimeToFirstHeader(headers, i),
                responseTime = ttc === 0 ? ttfh : ttc,
                responseTimeLine = document.createElement('span'),
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
            panelTitle.push(responseTimeLine.title);
            panelTitle.push('');
            responseTimeLine.appendChild(responseTimeLineText);
            panel.appendChild(responseTimeLine);
            panel.appendChild(document.createTextNode(separator));
        } else {
            panel.appendChild(getPlansTeaser('? ms'));
            panel.appendChild(document.createTextNode(separator));
        }

        // headers
        response.responseHeaders.forEach(function(header) {
            if (isValueInList(shownResponseHeaders, header.name.toLowerCase())) {
                let span = document.createElement('span');
                span.appendChild(document.createTextNode(header.value));
                span.title = header.name + ': ' + header.value;
                panelTitle.push(span.title);
                span.className = 'value';
                panel.appendChild(span);
                panel.appendChild(document.createTextNode(separator));
            }
        });
        // Remove the last separator
        panel.removeChild(panel.lastChild);

        panelTitle.push('\ntabId\t\t' + request.tabId +
            '\nframeId\t' + request.frameId +
            '\nrequestId\t' + request.requestId +
            '\ntype\t\t' + request.type);

        panel.title = panelTitle.join('\n');
        content.appendChild(panel);
    }
    return content;
}

/**
 * Listen for messages
 */
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    // switch (message.msg) {
    //     case 'responseCompleted':
    //         console.log('responseCompleted: ');
    //         break;
    //     case 'tabActivated':
    //         console.log('tabActivated: ');
    //         break;
    //     case 'tabCreated':
    //         console.log('tabCreated: ');
    //         break;
    //     case 'tabUpdated':
    //         console.log('tabUpdated: ');
    //         break;
    // }
    switch (message.msg) {
        case 'isStyleSheetInjected':
            sendResponse({isStyleSheetInjected: isStyleSheetInjected});
            break;
        case 'styleSheetIsInjected':
            isStyleSheetInjected = true;
            break;
        case 'requestTypeSelectionDidChange':
            document.getElementById(containerId).querySelectorAll('.requestTypes .type').forEach(function(element) {
                if (message.activeRequestTypes.indexOf(element.dataset.type) !== -1) {
                    enableRequestType(element);
                } else {
                    disableRequestType(element);
                }
            });
            break;
        case 'responseCompleted':
        // Fall through to tabLoaded
        case 'tabActivated':
        // Fall through to tabLoaded
        case 'tabCreated':
        // Fall through to tabLoaded
        case 'tabUpdated':
            let options = message.options,
                containerElement = createContainer(options),
                requestIds = Object.keys(message.headers),
                headers;

            hasLicense = message.hasLicense;

            if (containerElement.children.length >= options.tabRequestLimit) {
                let xhrCount = containerElement.querySelectorAll("[data-request-type='xmlhttprequest']").length,
                    frameCount = containerElement.querySelectorAll("[data-request-type='sub_frame']").length;
                if (xhrCount >= frameCount) {
                    removeElementFromContainer(containerElement.querySelector("[data-request-type='xmlhttprequest']"));
                } else {
                    removeElementFromContainer(containerElement.querySelector("[data-request-type='sub_frame']"));
                }
            }

            // Add the toolbar
            if (!containerElement.querySelector('#toolBar11') && !options.hidePanelAfterTimeout) {
                containerElement.appendChild(getToolbar(options));
                if (isProVersion()) {
                    // Request type selector
                    containerElement.querySelectorAll('.requestTypes .type').forEach(function(element) {
                        element.addEventListener('click', function(event) {
                            toggleRequestType(event.target);
                            storeRequestTypeSelection(containerElement);
                        });
                    });

                    // Header filter
                    containerElement.querySelector('#inlineFilterInput').addEventListener('keyup', function() {
                        filterHeaders();
                    });
                    containerElement.querySelector('#inlineFilterAllowRegex').addEventListener('click', function() {
                        filterHeaders();
                    });
                }

                let eye = document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
                    eyePath = document.createElementNS('http://www.w3.org/2000/svg', 'path'),
                    summary = document.createElement('summary');
                summary.classList.add('eye');
                summary.title = chrome.i18n.getMessage('contentMessagesPressEscToClosePanels');

                eye.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                eye.setAttribute('height', '16');
                eye.setAttribute('viewBox', '0 0 25.4 16');
                eye.setAttribute('width', '25.4');
                eyePath.setAttribute('d', 'm12.6 0.000302c-0.3 0.002-0.6 0.0161-1 0.0427-5.79 0.452-8.07 4.95-11.6 7.87 3.55 3.29 6.21 8.09 12.7 8.09 6.5 0 9.1-4.8 12.7-8.09-3.7-3.12-6.2-7.95-12.8-7.91zm1.4 2.03c3.93 0.572 5.76 3.73 8.28 5.87-2.59 2.55-4.7 6.13-9.51 6.14-4.94 0.0125-6.83-3.6-9.66-5.99 0.911-0.831 1.73-1.8 2.61-2.72-0.143 0.497-0.22 1.02-0.22 1.57 0 3.12 2.53 5.65 5.65 5.65s5.65-2.53 5.65-5.65c0-2.08-1.12-3.89-2.79-4.87zm-2.86 3.18c0.933 0 1.69 0.756 1.69 1.69 0 0.933-0.756 1.69-1.69 1.69-0.933 0-1.69-0.757-1.69-1.69s0.757-1.69 1.69-1.69z');
                eye.appendChild(eyePath);

                summary.appendChild(eye);

                switch (options.location) {
                    case 'topLeft':
                    case 'topRight':
                        containerElement.appendChild(summary);
                        break;
                    case 'bottomLeft':
                    case 'bottomRight':
                        containerElement.insertBefore(summary, containerElement.querySelector('#toolBar'));
                        break;
                }
            }

            requestIds.forEach(function(requestId) {
                // Render a request only once.
                if (containerElement.querySelector("[data-request-id='" + requestId + "']")) {
                    return;
                }
                headers = message.headers[requestId];

                if (options.renderMode === 'microMode') {
                    let panel = createMicroPanel(headers, requestId, options);
                    if (panel.children.length) {
                        switch (options.location) {
                            case 'topLeft':
                            case 'topRight':
                                containerElement.appendChild(panel);
                                break;
                            case 'bottomLeft':
                            case 'bottomRight':
                                containerElement.insertBefore(panel, containerElement.querySelector('#toolBar'));
                                break;
                        }
                        containerElement.scrollTop = 0;
                    }

                    // Fade out after specified time
                    if (options.hidePanelAfterTimeout) {
                        let panelTimer = new Timer(fadeOutPanel, options.timeout * 1000, requestId);

                        panel.addEventListener('mouseover', function() {
                            panelTimer.pause();
                        });

                        panel.addEventListener('mouseout', function() {
                            panelTimer.reset(fadeOutPanel, options.timeout * 1000, requestId);
                        });
                    }

                    // Mark my words
                    if (options.markers.length > 0) {
                        let magicMarker = new Mark(panel);
                        options.markers.forEach(function(marker) {
                            let regexp = new RegExp(marker, 'gmi');
                            magicMarker.markRegExp(regexp);
                        });
                    }
                } else {
                    let panel = getPanel(headers, requestId, options, true);
                    if (panel.children.length > 1) {
                        switch (options.location) {
                            case 'topLeft':
                            case 'topRight':
                                containerElement.appendChild(panel);
                                break;
                            case 'bottomLeft':
                            case 'bottomRight':
                                containerElement.insertBefore(panel, containerElement.querySelector('#toolBar'));
                                break;
                        }
                        containerElement.scrollTop = 0;
                    }

                    // Fade out after specified time
                    if (options.hidePanelAfterTimeout) {
                        let panelTimer = new Timer(fadeOutPanel, options.timeout * 1000, requestId);

                        panel.addEventListener('mouseover', function() {
                            panelTimer.pause();
                        });

                        panel.addEventListener('mouseout', function() {
                            panelTimer.reset(fadeOutPanel, options.timeout * 1000, requestId);
                        });
                    }

                    // Close button
                    panel.querySelectorAll('.closeButton').forEach(function(element) {
                        element.addEventListener('click', function() {
                            removeElementFromContainer(element.parentNode, true);
                        });
                    });

                    // Select cell text on click
                    [].slice.call(panel.getElementsByTagName('td')).forEach(function(element) {
                        element.addEventListener('click', selectElementText);
                    });

                    // Mark my words
                    if (options.markers.length > 0) {
                        let magicMarker = new Mark(panel);
                        options.markers.forEach(function(marker) {
                            let regexp = new RegExp(marker, 'gmi');
                            magicMarker.markRegExp(regexp);
                        });
                    }
                }

            });
            break;
    }
});

if (isChrome) {
    restoreOptions();
}
