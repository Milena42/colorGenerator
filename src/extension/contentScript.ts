chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'add-style') {
        //TODO сюда надо отправлять сами сгенерированные стили
        document.body.style.border = '5px solid #42b883';

        sendResponse({ status: 'Styles applied!' });
    }
    sendResponse({ status: 'unknown command' });
});
