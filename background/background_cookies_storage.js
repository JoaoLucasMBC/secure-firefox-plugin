//// Dedicado a listar e salvar os localStorage e cookies

// "Base de dados"
let storageData = {};
let cookiesData = {};

// Função para classificar os cookies
function classifyCookies(cookies, pageDomain) {
    const firstPartyCookies = [];
    const thirdPartyCookies = [];
    const sessionCookies = [];
    const persistentCookies = [];
    const potentialSupercookies = [];

    cookies.forEach(cookie => {
        const cookieDomain = cookie.domain.startsWith(".") ? cookie.domain.substring(1) : cookie.domain;
        const isFirstParty = cookieDomain === pageDomain;

        // Se o domínio é o mesmo da página, é um first-party cookie
        if (isFirstParty) {
            firstPartyCookies.push(cookie);
        } else {
            thirdPartyCookies.push(cookie);
        }

        // Se tem data de expiração, é um cookie persistente
        if (cookie.expirationDate) {
            persistentCookies.push(cookie);
        } else {
            sessionCookies.push(cookie);
        }

        // Truque simples para estimar se é um supercookie, já que é difícil de determinar
        if (cookieDomain.startsWith(".")) {
            potentialSupercookies.push(cookie);
        }
    });

    return {
        firstPartyCookies,
        thirdPartyCookies,
        sessionCookies,
        persistentCookies,
        potentialSupercookies
    };
}


// Listener para quando a página termina de carregar
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        const currentTab = tabs[0];
        const currentDomain = new URL(currentTab.url).hostname;
        
        // Show or process data only for the current domain
        if (storageData[currentDomain] || cookiesData[currentDomain]) {
          console.log(`Displaying data for ${currentDomain}`);
          console.log('LocalStorage Data:', storageData[currentDomain]);
          console.log('Cookies Data:', cookiesData[currentDomain]);
        } else {
          console.log(`No data available for ${currentDomain}`);
        }
      });
  }
});

// Listener para quando atualizar a "base de dados" de localStorage e cookies
browser.runtime.onMessage.addListener((message, sender) => {
    if (!message.url) return;

    const url = new URL(message.url).hostname;

    // LocalStorage
    if (message.action === "localStorageDetected") {
        if (!storageData[url]) storageData[url] = [];
        storageData[url] = message.data;
    }

    // Cookies e classificação
    if (message.action === "getCookies") {
        const pageDomain = new URL(message.url).hostname;
        browser.cookies.getAll({ url: message.url }).then((cookies) => {
            cookiesData[pageDomain] = cookies;
            
            const classifiedCookies = classifyCookies(cookies, pageDomain);
            
            cookiesData[pageDomain] = classifiedCookies;
        });
    }
});


// Listener para devolver os dados de localStorage e cookies para o popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getDataForPopup") {
        browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
            const currentTab = tabs[0];
            const currentDomain = new URL(currentTab.url).hostname;

            sendResponse({
                localStorageData: storageData[currentDomain] || {},
                cookiesData: cookiesData[currentDomain] || {}
            });
        });

        return true;
    }
});