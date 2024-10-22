let storageData = {};
let cookiesData = {};


browser.runtime.onMessage.addListener((message, sender) => {
    const url = new URL(message.url).hostname;

    // Store LocalStorage data
    if (message.action === "localStorageDetected") {
        if (!storageData[url]) storageData[url] = [];
        storageData[url] = message.data;
    }

    // Fetch cookies
    if (message.action === "getCookies") {
        console.log(cookiesData);
        browser.cookies.getAll({ url: message.url }).then((cookies) => {
            cookiesData[url] = cookies;
        });
    }
});


browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getDataForPopup") {
        sendResponse({
            localStorageData: storageData,
            cookiesData: cookiesData
        });
    }
});
