/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*global google, chrome, isChrome, containerId, isValidUrl, sanitizeString, getPanel, getSettings, htmlEntities, Mark, googleAnalyticsId */
'use strict';

document.addEventListener('DOMContentLoaded', function() {
    function saveOptions() {
        let multiSelectFields = ['hiddenRequestHeaders', 'hiddenResponseHeaders', 'shownResponseHeaders', 'markers'],
            updatedValues = {
                location: document.getElementById('location').value,
                tabRequestLimit: document.getElementById('tabRequestLimit').value,
                timeout: document.getElementById('timeout').value,
                hidePanelAfterTimeout: parseInt(document.getElementById('hidePanelAfterTimeout').value, 10) === 1,
                renderMode: document.getElementById('renderMode').value,
                theme: document.getElementById('theme').value,
                hideonhover: document.getElementById('hideonhover').value
            };

        multiSelectFields.forEach(function(fieldId) {
            let element = document.getElementById(fieldId);
            if (element) {
                updatedValues[fieldId] = [];
                element.childNodes.forEach(function(node) {
                    updatedValues[fieldId].push(node.textContent);
                });
            }
        });

        try {
            // Firefox developer edition supports storage, but a config option needs to be enabled
            if (isChrome && isDefined(chrome.storage.sync)) {
                chrome.storage.sync.set(updatedValues);
            } else {
                localStorage.location = document.getElementById('location').value;
                localStorage.tabRequestLimit = document.getElementById('tabRequestLimit').value;
                localStorage.timeout = document.getElementById('timeout').value;
                localStorage.hidePanelAfterTimeout = parseInt(document.getElementById('hidePanelAfterTimeout').value, 10) === 1;
                localStorage.renderMode = document.getElementById('renderMode').value;
                localStorage.theme = document.getElementById('theme').value;
                localStorage.hideonhover = document.getElementById('hideonhover').value;

                multiSelectFields.forEach(function(fieldId) {
                    localStorage[fieldId] = JSON.stringify(updatedValues[fieldId]);
                });
            }
        } catch (e) {
            // No-op
        }
    }

    function removeElement(element) {
        element.remove();
        saveOptions();
    }

    function addElement(element, newElementId, containerID) {
        if (element === '') {
            return;
        }

        let container = document.getElementById(containerID),
            closeButton = document.createElement('span'),
            label = document.createElement('span'),
            elementText;

        if (!container) {
            return;
        }

        elementText = document.createTextNode(element);
        closeButton.classList.add('aui-icon', 'aui-icon-close');
        label.classList.add('aui-label', 'aui-label-closeable');
        label.appendChild(elementText);
        label.appendChild(closeButton);

        container.appendChild(label);
        closeButton.addEventListener('click', function(event) {
            removeElement(event.target.parentNode);
        });

        document.getElementById(newElementId).value = '';
        saveOptions();
    }

    function getSettingsAndRestoreOptions() {
        let settings;
        // Firefox developer edition supports storage, but a config option needs to be enabled
        if (isChrome && isDefined(chrome.storage.sync)) {
            chrome.storage.sync.get(null, function(result) {
                settings = {
                    location: result.location ? result.location : 'bottomRight',
                    theme: result.theme ? result.theme : 'light',
                    tabRequestLimit: result.tabRequestLimit ? result.tabRequestLimit : 25,
                    timeout: result.timeout ? result.timeout : 3,
                    hideonhover: result.hideonhover ?? null,
                    hidePanelAfterTimeout: isDefined(result.hidePanelAfterTimeout) ? result.hidePanelAfterTimeout : true,
                    renderMode: result.renderMode ? result.renderMode : 'microMode',
                    hiddenRequestHeaders: result.hiddenRequestHeaders ? result.hiddenRequestHeaders : [],
                    hiddenResponseHeaders: result.hiddenResponseHeaders ? result.hiddenResponseHeaders : [],
                    shownResponseHeaders: result.shownResponseHeaders ? result.shownResponseHeaders : ['^Server$'],
                    markers: result.markers ? result.markers : []
                };
                restoreOptions(settings);
            });
        } else {
            settings = {
                location: localStorage.location ? localStorage.location : 'bottomRight',
                theme: localStorage.theme ? localStorage.theme : 'light',
                tabRequestLimit: localStorage.tabRequestLimit ? localStorage.tabRequestLimit : 25,
                timeout: localStorage.timeout ? localStorage.timeout : 3,
                hideonhover: localStorage.hideonhover ?? null,
                hidePanelAfterTimeout: isDefined(localStorage.hidePanelAfterTimeout) ? localStorage.hidePanelAfterTimeout : true,
                renderMode: localStorage.renderMode ? localStorage.renderMode : 'microMode',
                hiddenRequestHeaders: isDefined(localStorage.hiddenRequestHeaders) ? JSON.parse(localStorage.hiddenRequestHeaders) : [],
                hiddenResponseHeaders: isDefined(localStorage.hiddenResponseHeaders) ? JSON.parse(localStorage.hiddenResponseHeaders) : [],
                shownResponseHeaders: isDefined(localStorage.shownResponseHeaders) ? JSON.parse(localStorage.shownResponseHeaders) : ['^Server$'],
                markers: isDefined(localStorage.markers) ? JSON.parse(localStorage.markers) : []
            };
            restoreOptions(settings);
        }
    }

    function restoreOptions(options) {
        document.getElementById('location').value = options.location;
        document.getElementById('tabRequestLimit').value = options.tabRequestLimit;
        document.getElementById('timeout').value = options.timeout;
        document.getElementById('hidePanelAfterTimeout').value = options.hidePanelAfterTimeout ? 1 : 0;
        document.getElementById('renderMode').value = options.renderMode;
        document.getElementById('theme').value = options.theme;
        document.getElementById('hideonhover').value = options.hideonhover;

        options.hiddenRequestHeaders.forEach(function(element) {
            addElement(element, 'newHiddenRequestHeader', 'hiddenRequestHeaders');
        });
        options.hiddenResponseHeaders.forEach(function(element) {
            addElement(element, 'newHiddenResponseHeader', 'hiddenResponseHeaders');
        });
        options.shownResponseHeaders.forEach(function(element) {
            addElement(element, 'newShownResponseHeader', 'shownResponseHeaders');
        });
        options.markers.forEach(function(element) {
            addElement(element, 'newMarker', 'markers');
        });
    }

    document.getElementById('renderMode').addEventListener('change', function() {
        saveOptions();
    });
    document.getElementById('location').addEventListener('change', function() {
        saveOptions();
    });
    document.getElementById('tabRequestLimit').addEventListener('change', function() {
        saveOptions();
    });
    document.getElementById('timeout').addEventListener('change', function() {
        saveOptions();
    });
    document.getElementById('hidePanelAfterTimeout').addEventListener('change', function() {
        saveOptions();
    });
    document.getElementById('theme').addEventListener('change', function() {
        saveOptions();
    });
    document.getElementById('hideonhover').addEventListener('keyup', function() {
        saveOptions();
    });

    let multiSelectFields = {
        'hiddenRequestHeaders': {addId: 'addHiddenRequestHeader', newId: 'newHiddenRequestHeader'},
        'hiddenResponseHeaders': {addId: 'addHiddenResponseHeader', newId: 'newHiddenResponseHeader'},
        'shownResponseHeaders': {addId: 'addShownResponseHeader', newId: 'newShownResponseHeader'},
        'markers': {addId: 'addMarker', newId: 'newMarker'}
    };

    Object.keys(multiSelectFields).forEach(function(field) {
        let element = document.getElementById(multiSelectFields[field].addId);
        if (element) {
            document.getElementById(multiSelectFields[field].addId).addEventListener('click', function() {
                addElement(document.getElementById(multiSelectFields[field].newId).value, multiSelectFields[field].newId, field);
            });
            document.getElementById(multiSelectFields[field].newId).addEventListener('keyup', function(event) {
                if (event.keyCode === 13) {
                    addElement(event.target.value, multiSelectFields[field].newId, field);
                }
            });
        }
    });

    if (isProVersion()) {
        document.querySelectorAll('.pro').forEach(function(element) {
            if (element.classList.contains('hidden')) {
                element.classList.remove('hidden');
            }
        });
    }
    getSettingsAndRestoreOptions();
});
