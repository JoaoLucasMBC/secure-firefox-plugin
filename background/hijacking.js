// GLOBAL FUNCTION FOR NOTIFICATIONS
function notifyUser(message) {
    browser.notifications.create({
        "type": "basic",
        "title": "Secure Fox Alert",
        "message": message
    });
}



// CHECK FOR CONFIGURATION CHANGES
function checkSettings() {
    if (browser.browserSettings && browser.browserSettings.homepageOverride) {
        browser.browserSettings.homepageOverride.get({}).then(result => {
            if (result.value !== "about:home") {
                notifyUser("Warning: Your homepage has been changed!");
            }
        });
    } else {
        console.error("browserSettings API is not supported in this browser.");
    }

    // Check search engine if available
    if (browser.browserSettings && browser.browserSettings.defaultSearchEngine) {
        browser.browserSettings.defaultSearchEngine.get({}).then(result => {
            if (result.value !== "https://google.com") {
                notifyUser("Warning: Your search engine has been changed!");
            }
        });
    } else {
        console.error("defaultSearchEngine is not supported in this browser.");
    }
}

// Check settings every 10 seconds (adjust interval as needed)
setInterval(checkSettings, 100000);



// CHECK STRANGE PLUGINS
function checkExtensions() {
    browser.management.getAll().then((extensions) => {
        extensions.forEach((extension) => {
            if (!extension.enabled) {
                notifyUser(`Disabled extension detected: ${extension.name}`);
            }
        });
    });
}

// Check installed extensions every 10 seconds
setInterval(checkExtensions, 100000);



// CHECK FOR STRANGE JS EVENTS
(function() {
    const originalEval = window.eval;
    window.eval = function() {
        notifyUser("Warning: eval() was called. Possible malicious script execution.");
        return originalEval.apply(this, arguments);
    };

    const originalFunction = window.Function;
    window.Function = function() {
        notifyUser("Warning: new Function() was called. Possible malicious code execution.");
        return originalFunction.apply(this, arguments);
    };
})();



// CHECK FOR MODIFICATION OF DOM OR INJECTION OF NEW JS FILES FOR A SITE
(function() {
    const originalAddEventListener = EventTarget.prototype.addEventListener;

    EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'keydown' || type === 'submit') {
            notifyUser(`Warning: An event listener for ${type} was added. Possible malicious behavior.`);
        }
        return originalAddEventListener.apply(this, arguments);
    };
})();

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
            notifyUser("Warning: A new node has been added to the DOM. Possible malicious injection.");
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

const scriptObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.tagName === 'SCRIPT') {
                notifyUser("Warning: A new script tag was injected into the page. Possible malicious code.");
            }
        });
    });
});

scriptObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
});



// CHECK COOKIES
browser.cookies.onChanged.addListener((changeInfo) => {
    notifyUser(`Cookie change detected for domain: ${changeInfo.cookie.domain}.`);
    // Additional logic to detect suspicious cookie changes
});



// CHECK REDIRECTS
function trackRedirects(details) {
    if (details.redirectUrl && details.url !== details.redirectUrl) {
        notifyUser(`Redirect detected from ${details.url} to ${details.redirectUrl}`);
    }
}

browser.webRequest.onBeforeRedirect.addListener(
    trackRedirects,
    { urls: ["<all_urls>"] }
);



// EXTRA: suspicious domains? Not https??
function trackHttpRequests(details) {
    const requestUrl = new URL(details.url);

    // Check if the request is not using HTTPS
    if (requestUrl.protocol === "http:") {
        console.log(`Non-secure (HTTP) request detected: ${details.url}`); // Debugging log
        notifyUser(`Non-secure (HTTP) request detected: ${details.url}`);
    }
}

// Listen for all web requests
browser.webRequest.onBeforeRequest.addListener(
    trackHttpRequests,
    { urls: ["<all_urls>"] }
);