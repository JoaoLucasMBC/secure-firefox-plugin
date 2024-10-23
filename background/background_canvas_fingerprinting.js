//// Dedicado para listar e salvar os eventos de fingerprinting

// "Base de dados"
let fingerprintingEventsPerDomain = {};

// Listener para quando um evento de fingerprinting é detectado
browser.runtime.onMessage.addListener((message, sender) => {
    if (message.action === 'canvasFingerprintDetected') {
        const method = message.method;
        const url = sender.tab ? sender.tab.url : 'unknown';
        const domain = new URL(url).hostname;

        // Add dominio ao dicionário
        if (!fingerprintingEventsPerDomain[domain]) {
            fingerprintingEventsPerDomain[domain] = [];
        }

        // Adiciona o evento de fingerprinting ao dicionário
        fingerprintingEventsPerDomain[domain].push({ url, method });

        // Notifica o usuário
        browser.notifications.create({
            type: 'basic',
            iconUrl: 'icons/secure_fox_icon_48x48.png',
            title: 'Canvas Fingerprinting Detected',
            message: `Canvas fingerprinting detected on ${url} using ${method}`
        });
    }
});

// Listener para devolver os eventos de fingerprinting para o popup de um site específico
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getFingerprintingEvents") {
        // Aba ativa
        browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
            const currentTab = tabs[0];
            const currentDomain = new URL(currentTab.url).hostname;

            const canvasEvents = fingerprintingEventsPerDomain[currentDomain] || [];

            sendResponse({
                canvasEvents: canvasEvents
            });
        });

        return true;
    }
});
