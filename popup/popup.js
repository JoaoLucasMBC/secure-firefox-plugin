// Todas as funções do pop-up
document.addEventListener('DOMContentLoaded', () => {
  let privacyScore = 10; // score inicial
  const privacyScoreElement = document.getElementById('privacyScore');

  // Para colocar o nome do site no popup
  browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
    const currentTab = tabs[0];
    const siteName = new URL(currentTab.url).hostname;
    document.getElementById('siteName').textContent = siteName;
  });

  // Configuração dos toggles
  document.querySelectorAll('.toggle').forEach(toggle => {
    toggle.addEventListener('click', function () {
      const targetId = this.getAttribute('data-target');
      const target = document.getElementById(targetId);

      if (target) {
        target.classList.toggle('expanded');
        this.textContent = target.classList.contains('expanded') ? 'V' : '>';
      } else {
        console.error(`Target not found: ${targetId}`);
      }
    });
  });

  /////// Funções para obter dados do background.js e exibir no popup ///////

  // Primeiro, pegamos os dados de conexão de terceiros
  const thirdPartyDomainsPromise = browser.runtime.sendMessage({ action: "getDataThirdParty" }).then(response => {
    const thirdPartyDomainsList = document.getElementById('thirdPartyDomainsList');
    
    if (response.thirdPartyDomains) {
      document.getElementById('thirdPartyDomainsCount').textContent = response.thirdPartyDomains.length;

      // -1 ponto a cada 15 third-party domains
      const thirdPartyDomainsCount = response.thirdPartyDomains.length;
      privacyScore -= Math.floor(thirdPartyDomainsCount / 15);

      response.thirdPartyDomains.forEach(domain => {
        const listItem = document.createElement('div');
        listItem.textContent = domain;
        thirdPartyDomainsList.appendChild(listItem);
      });
    }
  });


  // Segundo, pegamos os dados de local storage e cookies
  const localStorageAndCookiesPromise = browser.runtime.sendMessage({ action: "getDataForPopup" }).then(response => {
    const localStorageSection = document.getElementById('localStorageList');
    const cookiesSection = document.getElementById('cookiesList');

    // -1 ponto a cada 15 local storage
    const localStorageCount = response.localStorageData ? Object.entries(response.localStorageData).flatMap(([_, data]) => data).length : 0;
    privacyScore -= Math.floor(localStorageCount / 15);

    // -1 ponto a cada 50 cookies
    const cookieKeys = response.cookiesData ? Object.values(response.cookiesData).flatMap(cookies => Object.values(cookies).flat()) : [];
    privacyScore -= Math.floor(cookieKeys.length / 50);

    // Organiza os Local Storage com clique parar ver detalhes
    if (response.localStorageData) {
      const localStorageKeys = Object.entries(response.localStorageData).flatMap(([_, data]) => data);
      document.getElementById('localStorageCount').textContent = localStorageKeys.length;

      response.localStorageData.forEach(entry => {
        let keyDiv = document.createElement('div');
        // Para poder ter o click to open
        keyDiv.innerHTML = `<span class="show-value">${entry.key}</span><span class="hidden-value" style="display:none;">${entry.value}</span>`;
        
        keyDiv.querySelector('.show-value').addEventListener('click', function () {
          const hiddenValue = keyDiv.querySelector('.hidden-value');
          hiddenValue.style.display = hiddenValue.style.display === 'none' ? 'block' : 'none';
        });
        localStorageSection.appendChild(keyDiv);
      });
    }

    // Organiza os cookies com clique parar ver detalhes
    if (response.cookiesData) {
      const cookieKeys = Object.values(response.cookiesData).flatMap(cookies => Object.values(cookies).flat());
      document.getElementById('cookiesCount').textContent = cookieKeys.length;
      
      // Categorias de cookies vem do background script
      const cookieCategories = [
          { label: 'First-party Cookies', array: 'firstPartyCookies' },
          { label: 'Third-party Cookies', array: 'thirdPartyCookies' },
          { label: 'Session Cookies', array: 'sessionCookies' },
          { label: 'Persistent Cookies', array: 'persistentCookies' },
          { label: 'Potential Supercookies', array: 'potentialSupercookies' }
      ];
  
      // Para cada categoria
      cookieCategories.forEach(category => {
          let categoryDiv = document.createElement('div');
          categoryDiv.innerHTML = `<h4>${category.label}</h4>`;
          
          // Para cada cookie na categoria
          const cookiesForCategory = response.cookiesData[category.array];
  
          if (cookiesForCategory && cookiesForCategory.length > 0) {
              cookiesForCategory.forEach(cookie => {
                  let cookieDiv = document.createElement('div');
                  // Para poder ter o click to open
                  cookieDiv.innerHTML = `<span class="show-value">${cookie.name}</span><span class="hidden-value" style="display:none;">${cookie.value}</span>`;
                  
                  cookieDiv.querySelector('.show-value').addEventListener('click', function () {
                      const hiddenValue = cookieDiv.querySelector('.hidden-value');
                      hiddenValue.style.display = hiddenValue.style.display === 'none' ? 'block' : 'none';
                  });
                  categoryDiv.appendChild(cookieDiv);
              });
          } else {
              // Se não houver cookies na categoria, exibe uma mensagem
              let emptyMessage = document.createElement('div');
              emptyMessage.textContent = `No ${category.label.toLowerCase()}.`;
              categoryDiv.appendChild(emptyMessage);
          }
  
          cookiesSection.appendChild(categoryDiv);
      });
    }  
  });

  // Terceiro, pegamos os dados de hijack warnings
  const hijackWarningsPromise = browser.runtime.sendMessage({ action: "getHijackWarnings" }).then(response => {
    const hijackWarningsSection = document.getElementById('hijackWarningsList');
    const hijackWarningsCount = document.getElementById('hijackWarningsCount');
    const toggleButton = document.querySelector('.toggle[data-target="hijackWarningsList"]');
    const hijackWarnings = response.hijackWarnings;

    // -1 ponto a cada 15 hijack warnings
    const hijackWarningsCountScore = hijackWarnings ? hijackWarnings.length : 0;
    privacyScore -= Math.floor(hijackWarningsCountScore / 15);

    // Número de hijack warnings
    hijackWarningsCount.textContent = hijackWarnings ? hijackWarnings.length : 0;

    // Para o toggle
    let isExpanded = false;

    toggleButton.addEventListener('click', () => {
      isExpanded = !isExpanded;
      toggleButton.textContent = isExpanded ? 'V' : '>';

      if (isExpanded) {
        hijackWarningsSection.style.display = 'block';
        hijackWarningsSection.innerHTML = '';

        // Coloca warnings
        if (hijackWarnings && hijackWarnings.length > 0) {
          hijackWarnings.forEach(warning => {
            let warningDiv = document.createElement('div');
            warningDiv.textContent = warning;
            hijackWarningsSection.appendChild(warningDiv);
          });
        } else {
          hijackWarningsSection.textContent = 'No hijack vulnerabilities detected.';
        }
      } else {
        // Escoder warnings
        hijackWarningsSection.style.display = 'none';
      }
    });

    hijackWarningsSection.style.display = 'none';
    toggleButton.textContent = '>';
  });

  // Por fim, pegamos os dados de fingerprinting
  const fingerprintingPromise = browser.runtime.sendMessage({ action: "getFingerprintingEvents" }).then(response => {
    const fingerprintingSection = document.getElementById('fingerprintingList');
    const fingerprintingCount = document.getElementById('fingerprintingCount');
    const toggleButton = document.querySelector('.toggle[data-target="fingerprintingList"]');
    const canvasEvents = response.canvasEvents;

    fingerprintingCount.textContent = canvasEvents ? canvasEvents.length : 0;

    // -1 ponto a cada fingerprinting event
    const fingerprintingCountScore = canvasEvents ? canvasEvents.length : 0;
    privacyScore -= fingerprintingCountScore;

    // Toggle
    let isExpanded = false;

    toggleButton.addEventListener('click', () => {
      isExpanded = !isExpanded;
      toggleButton.textContent = isExpanded ? 'V' : '>';

      if (isExpanded) {
        fingerprintingSection.style.display = 'block';
        fingerprintingSection.innerHTML = '';

        if (canvasEvents && canvasEvents.length > 0) {
          canvasEvents.forEach(event => {
            let eventDiv = document.createElement('div');
            eventDiv.textContent = `Canvas fingerprinting detected on ${event.url} using ${event.method}`;
            fingerprintingSection.appendChild(eventDiv);
          });
        } else {
          fingerprintingSection.textContent = 'No canvas fingerprinting events detected.';
        }
      } else {
        fingerprintingSection.style.display = 'none';
      }
    });

    fingerprintingSection.style.display = 'none';
    toggleButton.textContent = '>';
  });

  // Espera até que todas as requisições sejam concluídas e tenhamos o score final
  Promise.all([thirdPartyDomainsPromise, localStorageAndCookiesPromise, hijackWarningsPromise, fingerprintingPromise]).then(() => {
    // Não deixe a pontuação ser negativa
    privacyScore = Math.max(0, privacyScore);

    // Exibe a pontuação no popup
    privacyScoreElement.textContent = `Privacy Score: ${privacyScore}/10`;
  });

});
