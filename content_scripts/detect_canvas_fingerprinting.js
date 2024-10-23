// Função para monitorar e detectar Canvas Fingerprinting
function detectCanvasFingerprinting() {
    // Pega o método toDataURL do canvas
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(...args) {
        // Notifica o background script que o método toDataURL foi chamado para salver e notificar usuário
        browser.runtime.sendMessage({ action: 'canvasFingerprintDetected', method: 'toDataURL' });
        return originalToDataURL.apply(this, args); 
    };

    // Pega o método getImageData do contexto 2D do canvas
    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function(...args) {
        browser.runtime.sendMessage({ action: 'canvasFingerprintDetected', method: 'getImageData' });
        return originalGetImageData.apply(this, args);
    };
}

// Executa a função de detecção
detectCanvasFingerprinting();
