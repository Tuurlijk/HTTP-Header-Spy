/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*global google, chrome, isChrome, containerId, validProducts, isValidUrl, sanitizeString, getPanel, getSettings, htmlEntities, Mark, googleAnalyticsId */
'use strict';

var subscriptionPlans = [
    'lifetime_subscription',
    'yearly_subscription',
    'monthly_subscription'
];

var beerPlans = [
    'one_beer',
    'three_beers',
    'six_pack',
    'ten_beers'
];

var pizzaPlans = [
    'one_pizza',
    'two_pizzas',
    'three_pizzas',
    'four_pizzas',
    'five_pizzas'
];

var countMap = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    ten: 10,
    twenty: 20,
    lifetime: 20,
    monthly: 1,
    yearly: 4
};

/**
 * Get the beer icons
 *
 * @param {string} sku
 * @return {Node}
 */
function getBeerIcons(sku) {
    try {
        let number = sku.split('_').shift(),
            element = document.createElement('div');
        for (let index = 1; index <= countMap[number]; index++) {
            // Between the ticks is a beer emoji, which may not show in every console font
            element.appendChild(document.createTextNode('🍺'));
            if (index !== countMap[number] && index % 10 === 0) {
                element.appendChild(document.createElement('br'));
            }
        }
        return element;
    } catch (e) {
        console.log(e);
        return document.createElement('div');
    }
}

/**
 * Get the pizza icons
 *
 * @param {string} sku
 * @return {Node}
 */
function getPizzaIcons(sku) {
    try {
        let number = sku.split('_').shift(),
            element = document.createElement('div');
        for (let index = 1; index <= countMap[number]; index++) {
            // Between the ticks is a pizza emoji, which may not show in every console font
            element.appendChild(document.createTextNode('🍕'));
            if (index !== countMap[number] && index % 10 === 0) {
                element.appendChild(document.createElement('br'));
            }
        }
        return element;
    } catch (e) {
        console.log(e);
        return document.createElement('div');
    }
}

/**
 * Get the value in beers
 *
 * @param {string} sku
 * @return {string}
 */
function getBeerValue(sku) {
    let number = sku.split('_').shift();
    return countMap[number] + ' ' + chrome.i18n.getMessage('plansPageBeers');
}

/**
 * Get the value in pizza
 *
 * @param {string} sku
 * @return {string}
 */
function getPizzaValue(sku) {
    let number = sku.split('_').shift();
    return countMap[number] + ' ' + chrome.i18n.getMessage('plansPagePizzas');
}

/**
 * Get a product table row
 *
 * @param {object} product
 * @return {Node}
 */
function getSubscriptionTableRow(product) {
    let row = document.createElement('tr'),
        titleCell = document.createElement('td'),
        titleText = document.createTextNode(product.localeData['0'].title),
        priceCell = document.createElement('td'),
        // beerCell = document.createElement('td'),
        priceText = document.createTextNode(product.prices['0'].currencyCode + ' ' + Number(product.prices['0'].valueMicros / 1000 / 1000).toFixed(2)),
        buttonCell = document.createElement('td'),
        button = document.createElement('a'),
        buttonText = document.createTextNode(chrome.i18n.getMessage('plansPageIWillSupportYouWith') + ' ' + getBeerValue(product.sku));
    titleCell.className = 'title';
    titleCell.appendChild(titleText);
    row.appendChild(titleCell);
    // beerCell.appendChild(getBeerIcons(Number(product.prices['0'].valueMicros)));
    // row.appendChild(beerCell);
    buttonCell.className = 'buyNow';
    button.classList.add('button');
    button.dataset.sku = product.sku;
    button.appendChild(buttonText);
    buttonCell.appendChild(button);
    row.appendChild(buttonCell);
    priceCell.className = 'price';
    priceCell.appendChild(priceText);
    row.appendChild(priceCell);
    return row;
}

/**
 * Get a product table row
 *
 * @param {object} product
 * @return {Node}
 */
function getBeerTableRow(product) {
    let row = document.createElement('tr'),
        // titleCell = document.createElement('td'),
        // titleText = document.createTextNode(product.localeData['0'].title),
        priceCell = document.createElement('td'),
        beerCell = document.createElement('td'),
        priceText = document.createTextNode(product.prices['0'].currencyCode + ' ' + Number(product.prices['0'].valueMicros / 1000 / 1000).toFixed(2)),
        buttonCell = document.createElement('td'),
        button = document.createElement('a'),
        buttonText = document.createTextNode(chrome.i18n.getMessage('plansPageIWillSupportYouWith') + ' ' + getBeerValue(product.sku));
    // titleCell.className = 'title';
    // titleCell.appendChild(titleText);
    // row.appendChild(titleCell);
    buttonCell.className = 'buyNow';
    button.classList.add('button');
    button.dataset.sku = product.sku;
    button.appendChild(buttonText);
    buttonCell.appendChild(button);
    row.appendChild(buttonCell);
    beerCell.appendChild(getBeerIcons(product.sku));
    row.appendChild(beerCell);
    priceCell.className = 'price';
    priceCell.appendChild(priceText);
    row.appendChild(priceCell);
    return row;
}

/**
 * Get a product table row
 *
 * @param {object} product
 * @return {Node}
 */
function getPizzaTableRow(product) {
    let row = document.createElement('tr'),
        // titleCell = document.createElement('td'),
        // titleText = document.createTextNode(product.localeData['0'].title),
        priceCell = document.createElement('td'),
        beerCell = document.createElement('td'),
        priceText = document.createTextNode(product.prices['0'].currencyCode + ' ' + Number(product.prices['0'].valueMicros / 1000 / 1000).toFixed(2)),
        buttonCell = document.createElement('td'),
        button = document.createElement('a'),
        buttonText = document.createTextNode(chrome.i18n.getMessage('plansPageIWillSupportYouWith') + ' ' + getPizzaValue(product.sku));
    // titleCell.className = 'title';
    // titleCell.appendChild(titleText);
    // row.appendChild(titleCell);
    buttonCell.className = 'buyNow';
    button.classList.add('button');
    button.dataset.sku = product.sku;
    button.appendChild(buttonText);
    buttonCell.appendChild(button);
    row.appendChild(buttonCell);
    beerCell.appendChild(getPizzaIcons(product.sku));
    row.appendChild(beerCell);
    priceCell.className = 'price';
    priceCell.appendChild(priceText);
    row.appendChild(priceCell);
    return row;
}

/**
 * Show status message
 *
 * @param {string} status
 * @param {string} statusCode
 */
function setStatus(status = '', statusCode = 'information') {
    let statusElement = document.getElementById('status');
    if (status === '') {
        statusElement.className = 'hidden';
    } else {
        while (statusElement.firstChild) {
            statusElement.removeChild(statusElement.firstChild);
        }
        statusElement.className = '';
        statusElement.classList.add('status', statusCode);
        statusElement.appendChild(document.createTextNode(status));
    }
}

function addLicenseDataToProduct(license) {
    document.querySelectorAll('.buyNow .button').forEach(function(element) {
        if (element.dataset.sku === license.sku) {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
            element.appendChild(document.createTextNode(chrome.i18n.getMessage('plansPageThankYou')));
            element.className = 'currentPlan';
        }
    });
}

function onLicenseUpdate(response) {
    // console.log('onLicenseUpdate', response);
    var activeLicense,
        licenses = response.response.details;
    var count = licenses.length;
    for (var i = 0; i < count; i++) {
        var license = licenses[i];
        if (validProducts.includes(license.sku)) {
            activeLicense = license;
            addLicenseDataToProduct(license);
        }
    }
    chrome.runtime.getBackgroundPage(function(backgroundPage) {
        // console.log(activeLicense);
        backgroundPage.activeLicense = activeLicense;
    });
    setStatus();
}

function onLicenseUpdateFailed(response) {
    // console.log('onLicenseUpdateFailed', response);
    setStatus(chrome.i18n.getMessage('buyErrorRetrievingPurchasedProducts'), 'error');
}

/*****************************************************************************
 * Get the list of purchased products from the Chrome Web Store
 *****************************************************************************/
function getLicenses() {
    // console.log('google.payments.inapp.getPurchases');
    setStatus(chrome.i18n.getMessage('buyStatusRetrievingPurchasedProducts') + '...');
    google.payments.inapp.getPurchases({
        'parameters': {'env': 'prod'},
        'success': onLicenseUpdate,
        'failure': onLicenseUpdateFailed
    });
}

function onPurchase(purchase) {
    // console.log('onPurchase', purchase);
    var orderId = purchase.response.orderId;
    setStatus(chrome.i18n.getMessage('buyStatusPurchaseComplete') + ': ' + orderId, 'ok');
    getLicenses();
}

function onPurchaseFailed(purchase) {
    // console.log('onPurchaseFailed', purchase);
    var reason = purchase.response.errorType;
    setStatus(chrome.i18n.getMessage('buyErrorPurchaseFailed') + '. ' + reason, 'error');
}

/**
 * Buy subscription
 *
 * @param {string} sku
 */
function buyProduct(sku) {
    // setStatus('Kicking off purchase flow for ' + sku);
    google.payments.inapp.buy({
        parameters: {'env': 'prod'},
        'sku': sku,
        'success': onPurchase,
        'failure': onPurchaseFailed
    });
}

function getProductBySku(products, sku) {
    let result = false;
    products.forEach(function(product) {
        if (product.sku === sku) {
            result = product;
        }
    });
    return result;
}

function onSkuDetails(response) {
    if (response.response.details.inAppProducts.length) {
        let products = response.response.details.inAppProducts,
            subscriptionList = document.getElementById('subscriptionList');
        products.forEach(function(product) {
            if (subscriptionPlans.includes(product.sku)) {
                subscriptionList.appendChild(getSubscriptionTableRow(product));
            }
        });
        document.getElementById('subscriptionList').querySelectorAll('.buyNow .button').forEach(function(element) {
            element.addEventListener('click', function(event) {
                buyProduct(event.target.dataset.sku);
            });
        });

        // Beer plans
        let beerList = document.getElementById('beerList');
        beerPlans.forEach(function(sku) {
            let product = getProductBySku(products, sku);
            if (product) {
                beerList.appendChild(getBeerTableRow(product));
            }
        });
        document.getElementById('beerList').querySelectorAll('.buyNow .button').forEach(function(element) {
            element.addEventListener('click', function(event) {
                buyProduct(event.target.dataset.sku);
            });
        });

        // Pizza plans
        let pizzaList = document.getElementById('pizzaList');
        pizzaPlans.forEach(function(sku) {
            let product = getProductBySku(products, sku);
            if (product) {
                pizzaList.appendChild(getPizzaTableRow(product));
            }
        });
        document.getElementById('pizzaList').querySelectorAll('.buyNow .button').forEach(function(element) {
            element.addEventListener('click', function(event) {
                buyProduct(event.target.dataset.sku);
            });
        });
    }
    setStatus();
    getLicenses();
}

function onSkuDetailsFailed(response) {
    console.log('onSkuDetailsFailed', response);
    setStatus(chrome.i18n.getMessage('buyErrorRetrievingProducts') + '. (' + response.response.errorType + ')', 'error');
}

function getProductList() {
    setStatus(chrome.i18n.getMessage('buyStatusRetrievingProducts') + '...');
    google.payments.inapp.getSkuDetails({
        'parameters': {env: "prod"},
        'success': onSkuDetails,
        'failure': onSkuDetailsFailed
    });
}

getProductList();
