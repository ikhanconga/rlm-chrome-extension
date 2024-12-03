chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openPopup") {
    chrome.action.openPopup();
  } else if (message.action === "getActiveTab") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
         sendResponse({ tabId: tabs[0].id, url: tabs[0].url });
      } else {
        sendResponse({ error: "No active tab found." });
      }
    });
    return true; 
  }
  else if (message.action === "executeScript") {
    const key = message.key;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const activeTabId = tabs[0].id;

        chrome.scripting.executeScript(
          {
            target: { tabId: activeTabId },
            func: (key) => {
              const jsonString = sessionStorage.getItem(key);
              if (jsonString) {
                try {
                  const json = JSON.parse(jsonString);
                  return json.access_token;
                } catch (e) {
                  return 'Invalid JSON format.';
                }
              } else {
                return 'Key not found or no value stored.';
              }
            },
            args: [key]
          },
          (results) => {
            if (chrome.runtime.lastError) {
              sendResponse({ error: chrome.runtime.lastError.message });
            } else {
              sendResponse({ result: results[0].result });
            }
          }
        );
      } else {
        sendResponse({ error: "No active tab found." });
      }
    });

    return true;
  }
  else if (message.action === "createTab") {
    const at = message.accessToken;
    const hostName = message.hostName;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

      const tab = tabs[0];

      if (tab.incognito) {

        chrome.tabs.create({
          windowId: tab.windowId,
          url: `chrome-extension://${chrome.runtime.id}/newQueryTab.html?hostname=${encodeURIComponent(hostName)}&at=${at}` 
        },
        (results) => {
          if (chrome.runtime.lastError) {
            sendResponse({ error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ status: "success" });
          }
        });
      } else {

        chrome.tabs.create({
          windowId: tab.windowId,
          url: `chrome-extension://${chrome.runtime.id}/newQueryTab.html?hostname=${encodeURIComponent(hostName)}&at=${at}`
        },
        (results) => {
          if (chrome.runtime.lastError) {
            sendResponse({ error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ status: "success" });
          }
        });
      }
    });

    return true;
  }
});
