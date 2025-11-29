document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    if (typeof chrome === 'object') {
        document.querySelector('body').className = 'chromeOptionBody';
    }
    if (typeof browser !== 'undefined') {
        document.querySelector('body').className = 'firefoxOptionBody';
    }
});
