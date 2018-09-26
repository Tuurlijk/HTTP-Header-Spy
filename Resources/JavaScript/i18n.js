/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*global google, chrome, isChrome, containerId, isValidUrl, sanitizeString, getPanel, getSettings, htmlEntities, Mark, googleAnalyticsId */
'use strict';

document.addEventListener('DOMContentLoaded', function() {
    /**
     * Translate the labels
     */
    var translateLabels = function() {
        document.querySelectorAll('[i18n-content]').forEach(function(element) {
            if (chrome.i18n.getMessage(element.getAttribute('i18n-content'))) {
                // element.textContent = '[Ok] ' + chrome.i18n.getMessage(element.getAttribute('i18n-content'));
                element.textContent = chrome.i18n.getMessage(element.getAttribute('i18n-content'));
            } else {
                element.textContent = '[' + element.getAttribute('i18n-content') + ']';
            }
        });
    };

    translateLabels();
});
