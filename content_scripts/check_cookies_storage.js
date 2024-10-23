// Verifica se o localStorage contém algum dado
function checkLocalStorage() {
    let storageEntries = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        storageEntries.push({ key, value });
    }
    return storageEntries;
}

// Pede para o background script pegar os cookies
function getCookies() {
    browser.runtime.sendMessage({ action: "getCookies", url: window.location.href });
}

// Envia os dados do localStorage para o background script
const localStorageData = checkLocalStorage();
if (localStorageData.length > 0) {
    browser.runtime.sendMessage({ action: "localStorageDetected", data: localStorageData, url: window.location.href });
}

getCookies();