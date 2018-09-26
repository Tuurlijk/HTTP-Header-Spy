document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    if (typeof chrome === 'object') {
        document.querySelector('body').className = 'chromeOptionBody';
    }
    if (typeof InstallTrigger !== 'undefined') {
        document.querySelector('body').className = 'firefoxOptionBody';
    }
});
