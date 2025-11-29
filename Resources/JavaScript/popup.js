/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*global chrome, containerId, options, isValidUrl, sanitizeString, getPanel, getSettings, htmlEntities, Mark, googleAnalyticsId */
'use strict';

/**
 * Google Analytics
 */
try {
    let request = new XMLHttpRequest();
    let message = 'v=1&tid=' + googleAnalyticsId + '&cid=23456780-ABAB-98FE-E2AF-9876AFBCC212&aip=1&ds=add-on&t=event&ec=AAA&ea=libraryLoad';
    request.open('POST', 'https://www.google-analytics.com/collect', true);
    request.send(message);
} catch (e) {
    console.warn('Error sending report to Google Analytics.\n' + e);
}

/**
 * Update the current tab and refresh popup after 1s
 *
 * @param {object} e  The click event.
 * @return {*}  Not defined.
 */
var updateTab = function(e) {
    chrome.tabs.update(
        {url: e.target.href}
    );
    window.setTimeout(function() {
        window.location.href = '/Resources/HTML/popup.html';
    }, 1000);
};

document.addEventListener('DOMContentLoaded', function() {
    restoreOptions();

    document.getElementById('extensionName').textContent = chrome.i18n.getMessage('extensionName');
    let defaultMessageParagraph = document.createElement('p'),
        defaultMessageParagraphText = document.createTextNode(chrome.i18n.getMessage('popupDefaultMessage')),
        optionsButtonDiv = document.createElement('div'),
        optionsButton = document.createElement('button'),
        optionsButtonText = document.createTextNode(chrome.i18n.getMessage('buttonOptions'));

    defaultMessageParagraph.className = 'defaultMessage';
    defaultMessageParagraph.appendChild(defaultMessageParagraphText);
    optionsButton.id = 'goToOptions';
    optionsButton.appendChild(optionsButtonText);
    optionsButtonDiv.appendChild(optionsButton);
    optionsButtonDiv.className = 'optionsButtonInDefaultMessage';
    document.getElementById('result').appendChild(defaultMessageParagraph);
    document.getElementById('result').appendChild(optionsButtonDiv);

    // Display settings panel
    document.getElementById('settingsIcon').addEventListener('click', function() {
        toggleElementVisibility(document.getElementById('settings'));
        if (isProVersion()) {
            document.querySelectorAll('.pro').forEach(function(element) {
                if (element.classList.contains('hidden')) {
                    element.classList.remove('hidden');
                }
            });
        }
    });
    document.getElementById('settings').querySelectorAll('.closeButton').forEach(function(element) {
        element.addEventListener('click', function(event) {
            toggleElementVisibility(event.target.parentNode);
        });
    });

    // Button to go to options page
    document.querySelectorAll('#goToOptions').forEach(function(element) {
        element.addEventListener('click', function() {
            if (chrome.runtime.openOptionsPage) {
                // New way to open options pages, if supported (Chrome 42+).
                chrome.runtime.openOptionsPage();
            } else {
                // Reasonable fallback.
                window.open(chrome.runtime.getURL('/Resources/HTML/options.html'));
            }
        });
    });

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        // For example: only the background devtools or a popup are opened
        if (tabs.length === 0) {
            return;
        }
        let tab = tabs.shift();
        if (!isValidUrl(tab.url)) {
            return;
        }
        document.getElementById('extensionName').setAttribute('title', tab.id);
        chrome.runtime.getBackgroundPage(function(backgroundPage) {
            let headerStore = backgroundPage.headerStore;

            if (typeof headerStore === 'undefined') {
                return;
            }
            let requestIds = Object.keys(headerStore[String(tab.id)]),
                store = headerStore[String(tab.id)],
                containerElement = document.getElementById('result');

            while (containerElement.firstChild) {
                containerElement.removeChild(containerElement.firstChild);
            }

            // Add the toolbar
            if (!containerElement.querySelector('#toolBar')) {
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
            }

            requestIds.forEach(function(requestId) {
                let panel = getPanel(store[requestId], requestId, options);
                if (panel.children.length) {
                    containerElement.insertBefore(panel, containerElement.querySelector('#toolBar'));
                    containerElement.scrollTop = 0;
                }
            });

            if (options.markers.length > 0) {
                let magicMarker = new Mark(containerElement);
                options.markers.forEach(function(marker) {
                    let regexp = new RegExp(marker, 'gmi');
                    magicMarker.markRegExp(regexp);
                });
            }
        });

        // Select cell text on click
        [].slice.call(document.getElementsByTagName('td')).forEach(function(element) {
            element.addEventListener('click', selectElementText);
        });

        // Header filter
        if (isProVersion()) {
            let filterInput = document.getElementById('inlineFilterInput');
            if (filterInput) {
                filterInput.focus();
                filterInput.addEventListener('keyup', function() {
                    filterHeaders();
                });
            }
            let inlineFilterAllowRegex = document.getElementById('inlineFilterAllowRegex');
            if (inlineFilterAllowRegex) {
                inlineFilterAllowRegex.addEventListener('click', function() {
                    filterHeaders();
                });
            }
        }
    });

    // Make links clickable
    [].slice.call(document.getElementsByTagName('a')).forEach(function(link) {
        link.addEventListener('click', updateTab);
    });
});
