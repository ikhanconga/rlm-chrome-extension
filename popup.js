let templateDataGlobal = null; 

function readInputFile(callback) {
  fetch(chrome.runtime.getURL('inputs.txt'))
    .then(response => response.text())
    .then(text => {
      const lines = text.split('\n');
      let sessionKey = '';
      
      lines.forEach(line => {
        if (line.startsWith('session_key_access_token=')) {
          sessionKey = line.split('=')[1].trim();
        }
      });
      
      callback(sessionKey);
    })
    .catch(error => {
      console.error('Error reading inputs.txt:', error);
    });
}

function extractObjectDetailsFromUrl(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentUrl = new URL(tabs[0].url);
    
    const pathSegments = currentUrl.pathname.split('/').filter(Boolean); 
    const entityIndex = pathSegments.indexOf('entity'); 

    const clmEntityIndex = pathSegments.indexOf('clm'); 

    if (entityIndex !== -1 && entityIndex + 1 < pathSegments.length) {
      const objectname = pathSegments[entityIndex + 1]; 
      const id = pathSegments[pathSegments.length - 1]; 
      callback(objectname, id);
    } else {
      callback(null, null);
    }
  });
}

function callAPIWithToken(accessToken, objectname, id, callback) {
  if (!objectname || !id) {
    document.getElementById('resultDiv').textContent = 'Invalid URL: Please open a record using Object Data Explorer.';
    return;
  }

  const platformUri = window.location.hostname;

  const apiUrl = `https://${platformUri}/api/data/v1/objects/${objectname}/${id}`;
  
  fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'accept': '*/*'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.Success && data.Data.length > 0) {
      const templateData = data.Data[0];
      templateDataGlobal = templateData; 
      callback(templateData);  
    } else {
      document.getElementById('resultDiv').textContent = 'No data found or request failed.';
    }
  })
  .catch(error => {
    const resultDiv = document.getElementById('resultDiv');
    resultDiv.textContent = `Error fetching API: ${error}`;
  });
}

function createTable(templateData) {
  const resultDiv = document.getElementById('resultDiv');
  resultDiv.innerHTML = '';  
  const table = document.createElement('table');
  table.style.border = '1px solid black';
  table.style.borderCollapse = 'collapse';
  table.style.width = '100%';

  const addRow = (key, value) => {
    const row = table.insertRow();
    const cell1 = row.insertCell(0);
    const cell2 = row.insertCell(1);
    cell1.textContent = key;
    cell2.textContent = value;
    cell1.style.border = '1px solid black';
    cell2.style.border = '1px solid black';
    cell1.style.padding = '5px';
    cell2.style.padding = '5px';
  };

  for (const key in templateData) {
    if (typeof templateData[key] === 'object' && templateData[key] !== null) {
      addRow(key, JSON.stringify(templateData[key], null, 2));  
    } else {
      addRow(key, templateData[key]);
    }
  }

  resultDiv.appendChild(table); 
}

function createTableInNewTab(accessToken, objectname, id) {
	
  const newTabUrl = chrome.runtime.getURL(`inspect.html?objectType=${encodeURIComponent(objectname)}&recordId=${encodeURIComponent(id)}`);
  chrome.tabs.create({ url: newTabUrl, incognito: true});

  newTab.onload = function () {
    newTab.sessionStorage.setItem('accessToken', accessToken);
  };
}


document.getElementById('getValueBtn').addEventListener('click', function() {
  readInputFile((key) => {
    if (key) {

      extractObjectDetailsFromUrl((objectname, id) => {
        if (!objectname || !id) {
          document.getElementById('resultDiv').textContent = 'Please open a record using Object Data Explorer.';
          return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          chrome.scripting.executeScript(
            {
              target: { tabId: tabs[0].id },
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
              const resultDiv = document.getElementById('resultDiv');
              if (results && results[0].result) {
                const accessToken = results[0].result;
                callAPIWithToken(accessToken, objectname, id, createTable);
              } else {
                resultDiv.textContent = 'Error: Could not retrieve session storage value.';
              }
            }
          );
        });
      });
    } else {
      document.getElementById('resultDiv').textContent = 'Error: session_key_access_token not found in inputs.txt.';
    }
  });
});

function fetchDataAndOpenNewTab(accessToken, objectname, id) {

  const platformUri = window.location.hostname;

  if (accessToken && objectname && id) {
    const apiUrl = `https://${platformUri}/api/data/v1/objects/${objectname}/${id}`;

    fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'accept': '*/*'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.Success && data.Data.length > 0) {

        templateDataGlobal = {
          accessToken: accessToken,
          objectname: objectname,
          id: id,
          templateData: data.Data[0] 
        };

        openNewTabWithTemplateData(accessToken, objectname, id);
      } else {
        console.error('No data found or request failed.');
      }
    })
    .catch(error => console.error('Error fetching API:', error));
  } else {
    console.error('Session storage does not have accessToken, objectname, or id.');
  }
}

function openNewTabWithTemplateData(accessToken, objectname, id) {

  if (accessToken && objectname && id) {
    createTableInNewTab(accessToken, objectname, id);
  } else {
    console.error('Missing data to open the new tab.');
  }
}

document.getElementById('openNewTabBtn').addEventListener('click', function() {
  readInputFile((key) => {
    if (key) {

      extractObjectDetailsFromUrl((objectname, id) => {
        if (!objectname || !id) {
          document.getElementById('resultDiv').textContent = 'Please open a record using Object Data Explorer.';
          return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          chrome.scripting.executeScript(
            {
              target: { tabId: tabs[0].id },
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
              const resultDiv = document.getElementById('resultDiv');
              if (results && results[0].result) {
                const accessToken = results[0].result;

				sessionStorage.setItem('accessToken', accessToken);

				fetchDataAndOpenNewTab(accessToken, objectname, id);
              } else {
                resultDiv.textContent = 'Error: Could not retrieve session storage value.';
              }
            }
          );
        });
      });
    } else {
      document.getElementById('resultDiv').textContent = 'Error: session_key_access_token not found in inputs.txt.';
    }
  });
});




