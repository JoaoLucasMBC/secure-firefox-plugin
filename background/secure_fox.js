//// Dedicado para listar e salvar os domínios de terceiros

// "Base de dados"
let thirdPartyDomains = {};

const trackThirdPartyDomains = (details) => {
  // Pega o domínio do iniciador e do solicitante
  const initiatorDomain = details.initiator ? new URL(details.initiator).hostname : 'Unknown';
  const requestDomain = new URL(details.url).hostname;

  if (initiatorDomain !== requestDomain) {
    // Pega a URL da aba ativa
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      const currentTab = tabs[0];
      const currentDomain = new URL(currentTab.url).hostname;

      // Coloca no dicionário
      if (!thirdPartyDomains[currentDomain]) {
        thirdPartyDomains[currentDomain] = [];
      }

      // Evita duplicatas
      if (!thirdPartyDomains[currentDomain].includes(requestDomain)) {
        thirdPartyDomains[currentDomain].push(requestDomain);
        console.log(`Added third-party domain for ${currentDomain}: ${requestDomain}`);
      }

      // Salva no próprio local storage para facilitar o acesso se preciso
      localStorage.setItem("thirdPartyDomains", JSON.stringify(thirdPartyDomains));
    });
  }
};

// Listener para todos os requests de todas as URLs
browser.webRequest.onBeforeRequest.addListener(
  trackThirdPartyDomains,
  { urls: ["<all_urls>"] },
  ["blocking"]
);

// Listener para devolver os domínios de terceiros para o popup de um site específico
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getDataThirdParty") {
    // URL atual
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      const currentTab = tabs[0];
      const currentDomain = new URL(currentTab.url).hostname;
      
      // Busca e devolve os domínios de terceiros para o domínio atual
      const thirdPartyDomainsForCurrentDomain = thirdPartyDomains[currentDomain] || [];
      sendResponse({ thirdPartyDomains: thirdPartyDomainsForCurrentDomain });
    });

    return true;
  }
});