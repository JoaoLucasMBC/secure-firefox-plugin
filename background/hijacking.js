//// Detecção de Hijacking

// Função de notificação
function notifyUser(message) {
    browser.notifications.create({
        "type": "basic",
        "title": "Secure Fox Alert",
        "message": message
    });
}

let hijackWarnings = {}; // "Base de dados"

// Adiciona um aviso para o domínio atual
function addWarningForDomain(message) {
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        const currentTab = tabs[0];
        const currentDomain = new URL(currentTab.url).hostname;

        if (!hijackWarnings[currentDomain]) {
            hijackWarnings[currentDomain] = [];
        }
        
        hijackWarnings[currentDomain].push(message);
    });
}




// 1) Verifica se a página inicial ou o mecanismo de busca padrão foram alterados
function checkSettings() {
    if (browser.browserSettings && browser.browserSettings.homepageOverride) {
        browser.browserSettings.homepageOverride.get({}).then(result => {
            if (result.value !== "about:home") {
                const message = "Warning: Your homepage has been changed!";
                notifyUser(message);
                addWarningForDomain(message);
            }
        });
    } else {
        console.error("browserSettings API is not supported in this browser.");
    }

    // Search engine pode não ser disponível no navegador
    if (browser.browserSettings && browser.browserSettings.defaultSearchEngine) {
        browser.browserSettings.defaultSearchEngine.get({}).then(result => {
            if (result.value !== "https://google.com") {
                const message = "Warning: Your search engine has been changed!";
                notifyUser(message);
                addWarningForDomain(message);
            }
        });
    } else {
        console.error("defaultSearchEngine is not supported in this browser.");
    }
}

// Checa as configurações em loop
setInterval(checkSettings, 10000);



// 2) Verifica se as extensões estão desativadas (podem ser suspeitas)
function checkExtensions() {
    browser.management.getAll().then((extensions) => {
        extensions.forEach((extension) => {
            if (!extension.enabled) {
                const message = `Disabled extension detected: ${extension.name}`;
                addWarningForDomain(message);
            }
        });
    });
}

// Checa as extensões em loop
setInterval(checkExtensions, 100000);



// 3) Verifica se algum código malicioso é executado
(function() {
    const originalEval = window.eval;
    window.eval = function() {
        const message = "Warning: eval() was called. Possible malicious script execution.";
        notifyUser(message);
        addWarningForDomain(message);
        return originalEval.apply(this, arguments);
    };

    const originalFunction = window.Function;
    window.Function = function() {
        const message = "Warning: new Function() was called. Possible malicious code execution.";
        notifyUser(message);
        addWarningForDomain(message);
        return originalFunction.apply(this, arguments);
    };
})();
// Essa função se auto executa para monitorar o eval e o Function


// 4) Verifica se eventos de teclado e submissão de formulários são adicionados (pode ser Hijacking)
(function() {
    const originalAddEventListener = EventTarget.prototype.addEventListener;

    EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'keydown' || type === 'submit') {
            const message = `Warning: An event listener for ${type} was added. Possible malicious behavior.`;
            notifyUser(message);
            addWarningForDomain(message);
        }
        return originalAddEventListener.apply(this, arguments);
    };
})();
// Essa função se auto executa para monitorar os eventos

// 5) Verifica se novos elementos são adicionados ao DOM (possível injeção de código)
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
            const message = "Warning: A new node has been added to the DOM. Possible malicious injection.";
            notifyUser(message);
            addWarningForDomain(message);
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// 6) Verifica se novos scripts são injetados na página (possível injeção de código)
const scriptObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.tagName === 'SCRIPT') {
                const message = "Warning: A new script tag was injected into the page. Possible malicious code.";
                notifyUser(message);
                addWarningForDomain(message);
            }
        });
    });
});

scriptObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
});


// 7) Verifica se há redirecionamentos suspeitos
function trackRedirects(details) {
    if (details.redirectUrl && details.url !== details.redirectUrl) {
        const message = `Redirect detected from ${details.url} to ${details.redirectUrl}`;
        addWarningForDomain(message);
    }
}

browser.webRequest.onBeforeRedirect.addListener(
    trackRedirects,
    { urls: ["<all_urls>"] }
);



// 8) Verifica se há solicitações não seguras (HTTP) e notifica apenas o usuário
function trackHttpRequests(details) {
    const requestUrl = new URL(details.url);

    // Check if the request is not using HTTPS
    if (requestUrl.protocol === "http:") {
        notifyUser(`Non-secure (HTTP) request detected: ${details.url}`);
    }
}

browser.webRequest.onBeforeRequest.addListener(
    trackHttpRequests,
    { urls: ["<all_urls>"] }
);


// Listener para devolver os avisos de hijacking para o popup de um site específico
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getHijackWarnings") {
        browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
            const currentTab = tabs[0];
            const currentDomain = new URL(currentTab.url).hostname;

            sendResponse({
                hijackWarnings: hijackWarnings[currentDomain] || [] 
            });
        });

        return true;
    }
});

// Para limpar os avisos quando a página é recarregada
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        const currentDomain = new URL(tab.url).hostname;
        hijackWarnings[currentDomain] = [];
    }
});
