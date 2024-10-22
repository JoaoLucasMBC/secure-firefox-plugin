document.addEventListener('DOMContentLoaded', () => {
  // Assuming third-party requests are stored in localStorage or an in-memory store
  const domainsList = document.getElementById('domainsList');
  const thirdPartyDomains = JSON.parse(localStorage.getItem('thirdPartyDomains')) || [];

  thirdPartyDomains.forEach(domain => {
    const listItem = document.createElement('div');
    listItem.textContent = domain;
    domainsList.appendChild(listItem);
  });

  browser.runtime.sendMessage({ action: "getDataForPopup" }).then(response => {
    const localStorageSection = document.getElementById('localStorage');
    const cookiesSection = document.getElementById('cookies');

    console.log(response);

    // Display Local Storage data
    for (const [domain, data] of Object.entries(response.localStorageData)) {
        let domainDiv = document.createElement('div');
        domainDiv.innerHTML = `<h3>Local Storage for ${domain}</h3>`;
        data.forEach(entry => {
            let entryDiv = document.createElement('div');
            entryDiv.innerText = `${entry.key}: ${entry.value}`;
            domainDiv.appendChild(entryDiv);
        });
        localStorageSection.appendChild(domainDiv);
    }

    // Display Cookies data
    for (const [domain, cookies] of Object.entries(response.cookiesData)) {
        let domainDiv = document.createElement('div');
        domainDiv.innerHTML = `<h3>Cookies for ${domain}</h3>`;
        cookies.forEach(cookie => {
            let cookieDiv = document.createElement('div');
            cookieDiv.innerText = `${cookie.name}: ${cookie.value}`;
            domainDiv.appendChild(cookieDiv);
        });
        cookiesSection.appendChild(domainDiv);
    }
  });
});
