if (window.location.hostname.includes("congacloud.com") || window.location.hostname.includes("congacloud.eu") || window.location.hostname.includes("congacloud.au")) {

  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  if (!pathSegments.includes('swagger')) {

    let templateDataGlobal = null;

    const platformUri = window.location.hostname;

    const cpqObjMap = new Map();
    const clmObjMap = new Map();

    const shortcutButton = document.createElement("button");
    shortcutButton.textContent = "«";
    shortcutButton.id = "extensionShortcutButton";
    document.body.appendChild(shortcutButton);

    shortcutButton.style.position = "fixed";
    shortcutButton.style.top = "35%";
    shortcutButton.style.right = "0px";
    shortcutButton.style.transform = "translateY(-50%)";
    shortcutButton.style.zIndex = "1000";
    shortcutButton.style.padding = "0px 0px 5px 7px";
    shortcutButton.style.fontSize = "20px";
    shortcutButton.style.cursor = "pointer";
    shortcutButton.style.borderRadius = "5px 0px 0px 5px";
    shortcutButton.style.backgroundColor = "#ED1C24";
    shortcutButton.style.color = "#fff";
    shortcutButton.style.border = "none";
    shortcutButton.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
    shortcutButton.style.width = "25px";
    shortcutButton.style.transition = "width 0.3s ease";
    shortcutButton.style.textAlign = "left";

    shortcutButton.addEventListener("mouseenter", () => {
        shortcutButton.style.width = "35px";
    });

    shortcutButton.addEventListener("mouseleave", () => {
        shortcutButton.style.width = "25px";
    });

    const popupDiv = document.createElement("div");
    popupDiv.id = "extensionPopup";
    popupDiv.style.position = "fixed";
    popupDiv.style.top = "50%";
    popupDiv.style.right = "35px";
    popupDiv.style.transform = "translateY(-50%)";
    popupDiv.style.zIndex = "999";
    popupDiv.style.width = "455px";
    //popupDiv.style.width = "23.7%";
    popupDiv.style.height = "410px";
    popupDiv.style.backgroundColor = "#ffffff";
    popupDiv.style.border = "1px solid #0073e6";
    popupDiv.style.borderRadius = "5px";
    popupDiv.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
    popupDiv.style.padding = "10px";
    popupDiv.style.overflowY = "auto";
    popupDiv.style.display = "none";
    popupDiv.style.transition = "opacity 0.3s ease";
    document.body.appendChild(popupDiv);

    const objectNameDiv = document.createElement("div");
    objectNameDiv.id = "objectNameDiv";
    objectNameDiv.style.float = "inline-end";
    popupDiv.appendChild(objectNameDiv);

    const title = document.createElement("h2");
    title.id = "objectName";
    title.textContent = "Conga RLM Inspector";
    title.style.fontSize = "17px";
    title.style.margin = "0px 0px 5px";
    popupDiv.appendChild(title);

    const showAllDataButton = document.createElement("a");
    showAllDataButton.id = "getValueBtn";
    showAllDataButton.textContent = "Show All Data";
    showAllDataButton.href = "javascript:void(0);";
    showAllDataButton.style.margin = "15px 10px 10px 0px";
    showAllDataButton.style.cursor = "pointer";
    showAllDataButton.style.fontSize = "14px";

    popupDiv.appendChild(showAllDataButton);

    const openNewTabButton = document.createElement("a");
    openNewTabButton.id = "openNewTabBtn";
    openNewTabButton.textContent = "Open in New Tab";
    openNewTabButton.href = "javascript:void(0);";
    openNewTabButton.style.margin = "0px";
    openNewTabButton.style.cursor = "pointer";
    openNewTabButton.style.fontSize = "14px";
    popupDiv.appendChild(openNewTabButton);

    const openQueryConsoleButton = document.createElement("a");
    openQueryConsoleButton.id = "openQueryConsoleBtn";
    openQueryConsoleButton.textContent = "Query Console";
    openQueryConsoleButton.href = "javascript:void(0);";
    openQueryConsoleButton.style.margin = "10px";
    openQueryConsoleButton.style.cursor = "pointer";
    openQueryConsoleButton.style.fontSize = "14px";
    popupDiv.appendChild(openQueryConsoleButton);

    const openIdLookupButton = document.createElement("a");
    openIdLookupButton.id = "openIdLookupButton";
    openIdLookupButton.textContent = "Id Lookup";
    openIdLookupButton.href = "javascript:void(0);";
    openIdLookupButton.style.cursor = "pointer";
    openIdLookupButton.style.fontSize = "14px";
    popupDiv.appendChild(openIdLookupButton);

    const resultDiv = document.createElement("div");
    resultDiv.id = "resultDiv";
    resultDiv.style.marginTop = "5px";
    popupDiv.appendChild(resultDiv);

    let userInfo = null;
    let orgInfo = null;
    
    shortcutButton.addEventListener("click", () => {
        popupDiv.style.display = popupDiv.style.display === "none" ? "block" : "none";
        popupDiv.style.opacity = popupDiv.style.display === "none" ? "0" : "1";

        if (popupDiv.style.display === "none") {

            resultDiv.textContent = '';
            objectNameDiv.textContent = '';
        }
        loadUserAndOrganisationData();
        

    });

    function keyStartsWith(prefix) {
        for (let i = 0; i < sessionStorage.length; i++) {
            let key = sessionStorage.key(i);

            if (key.startsWith(prefix)) {
                return key;
            }
        }

        return null;
    }

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

    function toPascalCase(str) {
        let pascalCaseStr = str
            .split('-')
            .map(word =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join('');

        if (pascalCaseStr.endsWith('s')) {
            pascalCaseStr = pascalCaseStr.slice(0, -1);
        }

        return pascalCaseStr;
    }


    function extractObjectDetailsFromUrl(callback) {
        chrome.runtime.sendMessage({
            action: "getActiveTab"
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error:', chrome.runtime.lastError);
                callback(null, null);
                return;
            }

            if (response && response.url) {

                const currentUrl = new URL(response.url);
                const pathSegments = currentUrl.pathname.split('/').filter(Boolean);

                const entityIndex = pathSegments.indexOf('entity');
                const entityIndexCLM = pathSegments.indexOf('clm');
                const entityIndexCPQ = pathSegments.indexOf('cpq');
                const entityIndexRevAdmin = pathSegments.indexOf('cadmin');

                if (entityIndexCLM !== -1 && entityIndexCLM + 1 < pathSegments.length) {

                    let objectnameCLM = 'Agreement';
                    const idCLM = pathSegments[pathSegments.length - 1];

                    if (pathSegments.length > 3 && pathSegments[3] != undefined) {
                        const obName = toPascalCase(pathSegments[3]);
                        objectnameCLM = obName;
                        if (obName === 'Clause') {
                            objectnameCLM = 'AgreementClause';
                        }

                        if (obName === 'Approval') {
                            objectnameCLM = 'ApprovalRequest';
                        }


                    }

                    callback(objectnameCLM, idCLM);
                } else if (entityIndexCPQ !== -1 && entityIndexCPQ + 1 < pathSegments.length) {

                    let objectnameCPQ = 'Proposal';
                    const idCPQ = pathSegments[pathSegments.length - 1];
                    //console.log('length -2 ::'+pathSegments[3]);
                    if (pathSegments.length > 3 && pathSegments[3] != undefined) {
                        const obName = toPascalCase(pathSegments[3]);
                        objectnameCPQ = obName;

                        if (obName === 'Approval') {
                            objectnameCPQ = 'ApprovalRequest';
                        }

                    }

                    callback(objectnameCPQ, idCPQ);

                } else if (entityIndexRevAdmin !== -1 && entityIndexRevAdmin + 1 < pathSegments.length) {

                    let objectnameRevAdmin = toPascalCase(pathSegments[entityIndexRevAdmin + 1]);

                    if (objectnameRevAdmin === 'Catalog') {
                        objectnameRevAdmin = 'Category';
                    }

                    if (objectnameRevAdmin === 'AttributeRule') {
                        objectnameRevAdmin = 'ProductAttributeRule';
                    }

                    if (objectnameRevAdmin === 'VisibilityRule') {
                        objectnameRevAdmin = 'SearchFilter';
                    }

                    if (objectnameRevAdmin === 'Rollup') {
                        objectnameRevAdmin = 'FieldExpression';
                    }

                    if (objectnameRevAdmin === 'WaterfallList') {
                        objectnameRevAdmin = 'Waterfall';
                    }


                    const idRevAdmin = pathSegments[pathSegments.length - 1];

                    if (pathSegments.length > 3 && pathSegments[3] != undefined) {

                        const obName = toPascalCase(pathSegments[3]);
                        objectnameRevAdmin = obName;

                        if (pathSegments[2] == 'edit') {
                            objectnameRevAdmin = toPascalCase(pathSegments[1]);

                            if (pathSegments.length > 4 && pathSegments[4] != undefined) {
                                objectnameRevAdmin = toPascalCase(pathSegments[4]);
                            }
                        }

                        if (objectnameRevAdmin === 'Approval') {
                            objectnameRevAdmin = 'ApprovalRequest';
                        }

                        if (objectnameRevAdmin === 'Catalog') {
                            objectnameRevAdmin = 'Category';
                        }

                    }

                    callback(objectnameRevAdmin, idRevAdmin);

                } else if (entityIndex !== -1 && entityIndex + 1 < pathSegments.length) {
                    const objectname = pathSegments[entityIndex + 1];
                    const id = pathSegments[pathSegments.length - 1];
                    callback(objectname, id);
                } else {
                    callback(null, null);
                }
            } else {
                callback(null, null);
            }
        });
    }


    function callAPIWithToken(accessToken, objectname, id, callback) {
        if (!objectname || !id) {
            document.getElementById('resultDiv').textContent = 'Invalid URL: Could not extract objectname or id.';
            return;
        }

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
        table.style.fontSize = '12px';

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

        resultDiv.style.overflowY = 'auto';
        resultDiv.style.maxHeight = '335px';
    }


    showAllDataButton.addEventListener('click', function() {

        readInputFile((prefix) => {
            if (prefix) {
                const key = keyStartsWith(prefix);
                if (key && key.includes('congacloud')) {

                    extractObjectDetailsFromUrl((objectname, id) => {
                        if (!objectname || !id) {
                            resultDiv.textContent = 'Could not extract objectname or id from URL.';
                            return;
                        }

                        chrome.runtime.sendMessage({
                            action: "executeScript",
                            key: key
                        }, (response) => {
                            if (response.error) {
                                resultDiv.textContent = response.error;
                                return;
                            }

                            const accessToken = response.result;

                            if (accessToken) {
                                document.getElementById("objectNameDiv").textContent = "Object: " + objectname;
                                callAPIWithToken(accessToken, objectname, id, createTable);
                            } else {
                                resultDiv.textContent = 'Error: Could not retrieve session storage value.';
                            }
                        });
                    });

                } else {
                    console.log(`No key starts with "${prefix}" in sessionStorage.`);
                }
            } else {
                resultDiv.textContent = 'Error: session_key_access_token not found in inputs.txt.';
            }
        });
    });


    function createTableInNewTab(accessToken, objectname, id) {

        const newTabUrl = chrome.runtime.getURL(`inspect.html?hostname=${encodeURIComponent(window.location.hostname)}&objectType=${encodeURIComponent(objectname)}&recordId=${encodeURIComponent(id)}&at=${encodeURIComponent(accessToken)}`);
        const newTab1 = window.open(newTabUrl, '_blank');

    }

    function openNewTabWithTemplateData(accessToken, objectname, id) {

        if (accessToken && objectname && id) {
            createTableInNewTab(accessToken, objectname, id);
        } else {
            console.error('Missing data to open the new tab.');
        }
    }

    function laodUserData(accessToken) {

        if (accessToken) {

            const apiUrl = `https://${platformUri}/api/user-management/v1/user/info`;

            fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'accept': '*/*'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.Success && data.Data) {
                        userInfo = data.Data;
                        renderUserInfo();
                    } else {
                        document.getElementById('resultDiv').textContent = 'No data found or request failed';
                        console.error('No data found or request failed.');
                    }
                })
                .catch(error => console.error('Error fetching API:', error));
        } else {
            document.getElementById('resultDiv').textContent = 'No data found or request failed';
            console.error('Session storage does not have accessToken, objectname, or id.');
        }
    }

    function laodOrgData(accessToken) {

      if (accessToken) {

          const apiUrl = `https://${platformUri}/api/user-management/v1/organization/info`;

          fetch(apiUrl, {
                  method: 'GET',
                  headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'accept': '*/*'
                  }
              })
              .then(response => response.json())
              .then(data => {
                  if (data.Success && data.Data) {
                      orgInfo = data.Data;
                      renderOrgInfo();
                  } else {
                      document.getElementById('resultDiv').textContent = 'No data found or request failed';
                      console.error('No data found or request failed.');
                  }
              })
              .catch(error => console.error('Error fetching API:', error));
      } else {
          document.getElementById('resultDiv').textContent = 'No data found or request failed';
          console.error('Session storage does not have accessToken, objectname, or id.');
      }
  }

  function renderUserInfo(){
    
    const resultDiv = document.getElementById('resultDiv');

    const userInofDiv0 = document.createElement("div");
    userInofDiv0.textContent = 'User information:';
    userInofDiv0.style.border='1px solid #c1deff';
    //userInofDiv0.style.marginTop='30px';
    userInofDiv0.style.padding='5px';
    userInofDiv0.style.backgroundColor = '#eef4f8';
    userInofDiv0.style.fontSize = '14px';
    userInofDiv0.style.borderTopLeftRadius = '3px';
    userInofDiv0.style.borderTopRightRadius = '3px';
    resultDiv.appendChild(userInofDiv0);

    const userInofDiv1 = document.createElement("div");
    userInofDiv1.textContent = userInfo.FirstName + ' ' + userInfo.LastName;
    userInofDiv1.style.borderLeft='1px solid #c1deff';
    userInofDiv1.style.borderRight='1px solid #c1deff';
    userInofDiv1.style.padding='5px';
    userInofDiv1.style.fontSize = '12px';
    resultDiv.appendChild(userInofDiv1);

    const userInofDiv2 = document.createElement("div");
    userInofDiv2.textContent = userInfo.UserName + ' / ' + userInfo.Email;
    userInofDiv2.style.borderLeft='1px solid #c1deff';
    userInofDiv2.style.borderRight='1px solid #c1deff';
    userInofDiv2.style.padding='5px';
    userInofDiv2.style.fontSize = '12px';
    resultDiv.appendChild(userInofDiv2);

    const userInofDiv3 = document.createElement("div");
    const timeZoneInfo = JSON.parse(userInfo.Timezone);
    userInofDiv3.textContent = timeZoneInfo.TimezoneName;
    userInofDiv3.style.borderLeft='1px solid #c1deff';
    userInofDiv3.style.borderRight='1px solid #c1deff';
    userInofDiv3.style.borderBottom='1px solid #c1deff';
    userInofDiv3.style.padding='5px';
    userInofDiv3.style.fontSize = '11px';
    userInofDiv3.style.borderBottomLeftRadius = '3px';
    userInofDiv3.style.borderBottomRightRadius = '3px';
    userInofDiv3.style.marginBottom = '30px';
    resultDiv.appendChild(userInofDiv3);
  }

  function renderOrgInfo(){
    
    const resultDiv = document.getElementById('resultDiv');

    const orgInfoDiv0 = document.createElement("div");
    orgInfoDiv0.textContent = 'Org information:';
    orgInfoDiv0.style.border='1px solid #c1deff';
    //orgInfoDiv0.style.marginTop='30px';
    orgInfoDiv0.style.padding='5px';
    orgInfoDiv0.style.backgroundColor = '#eef4f8';
    orgInfoDiv0.style.fontSize = '14px';
    orgInfoDiv0.style.borderTopLeftRadius = '3px';
    orgInfoDiv0.style.borderTopRightRadius = '3px';
    resultDiv.appendChild(orgInfoDiv0);

    const orgInfoDiv1 = document.createElement("div");
    orgInfoDiv1.textContent = orgInfo.OrganizationName;
    orgInfoDiv1.style.borderLeft='1px solid #c1deff';
    orgInfoDiv1.style.borderRight='1px solid #c1deff';
    orgInfoDiv1.style.padding='5px';
    orgInfoDiv1.style.fontSize = '12px';
    resultDiv.appendChild(orgInfoDiv1);

    const orgInfoDiv2 = document.createElement("div");
    orgInfoDiv2.textContent = orgInfo.OrganizationId;
    orgInfoDiv2.style.borderLeft='1px solid #c1deff';
    orgInfoDiv2.style.borderRight='1px solid #c1deff';
    orgInfoDiv2.style.padding='5px';
    orgInfoDiv2.style.fontSize = '12px';
    resultDiv.appendChild(orgInfoDiv2);

    const orgInfoDiv3 = document.createElement("div");
    orgInfoDiv3.textContent = orgInfo.Timezone.TimezoneName;
    orgInfoDiv3.style.borderLeft='1px solid #c1deff';
    orgInfoDiv3.style.borderRight='1px solid #c1deff';
    orgInfoDiv3.style.borderBottom='1px solid #c1deff';
    orgInfoDiv3.style.padding='5px';
    orgInfoDiv3.style.fontSize = '11px';
    orgInfoDiv3.style.borderBottomLeftRadius = '3px';
    orgInfoDiv3.style.borderBottomRightRadius = '3px';
    orgInfoDiv3.style.marginBottom = '30px';
    resultDiv.appendChild(orgInfoDiv3);
  }


    function fetchDataAndOpenNewTab(accessToken, objectname, id) {

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
                        document.getElementById('resultDiv').textContent = 'No data found or request failed';
                        console.error('No data found or request failed.');
                    }
                })
                .catch(error => console.error('Error fetching API:', error));
        } else {
            document.getElementById('resultDiv').textContent = 'No data found or request failed';
            console.error('Session storage does not have accessToken, objectname, or id.');
        }
    }

    function resetDataInspectorView() {
        const popupDiv = document.getElementById('extensionPopup');
        const resultDiv = document.getElementById('resultDiv');

        popupDiv.style.display = popupDiv.style.display === "none" ? "block" : "none";
        popupDiv.style.opacity = popupDiv.style.display === "none" ? "0" : "1";

        if (popupDiv.style.display === "none") {

            resultDiv.textContent = '';
            objectNameDiv.textContent = '';
        }
    }

    function openNewTabShowAllData(objectname, id) {
        readInputFile((prefix) => {
            if (prefix) {
                const key = keyStartsWith(prefix);
                if (key && key.includes('congacloud')) {

                    chrome.runtime.sendMessage({
                        action: "executeScript",
                        key: key
                    }, (response) => {
                        if (response.error) {
                            resultDiv.textContent = response.error;
                            return;
                        }

                        const accessToken = response.result;

                        if (accessToken) {
                            sessionStorage.setItem('accessToken', accessToken);
                            fetchDataAndOpenNewTab(accessToken, objectname, id);
                            resetDataInspectorView();
                        } else {
                            resultDiv.textContent = 'Error: Could not retrieve session storage value.';
                        }
                    });
                } else {
                    console.log(`No key starts with "${prefix}" in sessionStorage.`);
                }
            } else {
                document.getElementById('resultDiv').textContent = 'Error: session_key_access_token not found in inputs.txt.';
            }
        });
    }


    openNewTabButton.addEventListener('click', function() {
        readInputFile((prefix) => {
            if (prefix) {
                const key = keyStartsWith(prefix);
                if (key && key.includes('congacloud')) {
                    extractObjectDetailsFromUrl((objectname, id) => {
                        if (!objectname || !id) {
                            document.getElementById('resultDiv').textContent = 'Could not extract objectname or id from URL.';
                            return;
                        }

                        chrome.runtime.sendMessage({
                            action: "executeScript",
                            key: key
                        }, (response) => {
                            if (response.error) {
                                resultDiv.textContent = response.error;
                                return;
                            }

                            const accessToken = response.result;

                            if (accessToken) {
                                sessionStorage.setItem('accessToken', accessToken);
                                fetchDataAndOpenNewTab(accessToken, objectname, id);
                                resetDataInspectorView();
                            } else {
                                resultDiv.textContent = 'Error: Could not retrieve session storage value.';
                            }
                        });
                    });
                } else {
                    console.log(`No key starts with "${prefix}" in sessionStorage.`);
                }
            } else {
                document.getElementById('resultDiv').textContent = 'Error: session_key_access_token not found in inputs.txt.';
            }
        });
    });

    openQueryConsoleButton.addEventListener("click", () => {

        readInputFile((prefix) => {
            if (prefix) {
                const key = keyStartsWith(prefix);
                if (key && key.includes('congacloud')) {

                    chrome.runtime.sendMessage({
                        action: "executeScript",
                        key: key
                    }, (response) => {
                        if (response.error) {
                            resultDiv.textContent = response.error;
                            return;
                        }

                        const accessToken = response.result;

                        if (accessToken) {

                            chrome.runtime.sendMessage({
                                action: "createTab",
                                accessToken: accessToken,
                                hostName: window.location.hostname
                            }, (response) => {
                                if (response.error) {
                                    resultDiv.textContent = response.error;
                                    return;
                                }
                                resetDataInspectorView();
                            });

                        } else {
                            resultDiv.textContent = 'Error: Could not retrieve session storage value.';
                        }
                    });
                } else {
                    console.log(`No key starts with "${prefix}" in sessionStorage.`);
                }

            } else {
                document.getElementById('resultDiv').textContent = 'Error: session_key_access_token not found in inputs.txt.';
            }
        });

    });

    let iteratorLength = 0;
    let itemFound = false;

    openIdLookupButton.addEventListener("click", () => {
        resultDiv.textContent = '';

        readInputFile((prefix) => {
            if (!prefix) {
                return showErrorMessage('Error: session_key_access_token not found in inputs.txt.');
            }

            const key = keyStartsWith(prefix);
            if (!key || !key.includes('congacloud')) {
                return console.log(`No key starts with "${prefix}" in sessionStorage.`);
            }

            chrome.runtime.sendMessage({
                action: "executeScript",
                key
            }, (response) => {
                if (response.error) {
                    return showErrorMessage(response.error);
                }

                const accessToken = response.result;
                if (!accessToken) {
                    return showErrorMessage('Error: Could not retrieve session storage value.');
                }

                createIdInputField(accessToken);
            });
        });
    });

    function showErrorMessage(message) {
        resultDiv.textContent = message;
    }


    function loadUserAndOrganisationData() {
      if(userInfo){
        const resultDiv = document.getElementById('resultDiv');
        resultDiv.innerHTML = '';
        renderUserInfo();
        renderOrgInfo();
      }
      else{
        readInputFile((prefix) => {
            if (prefix) {
                const key = keyStartsWith(prefix);
                if (key && key.includes('congacloud')) {

                    chrome.runtime.sendMessage({
                        action: "executeScript",
                        key: key
                    }, (response) => {
                        if (response.error) {
                            resultDiv.textContent = response.error;
                            return;
                        }

                        const accessToken = response.result;

                        if (accessToken) {
                          const resultDiv = document.getElementById('resultDiv');
                          resultDiv.innerHTML = '';
                            laodUserData(accessToken);
                            laodOrgData(accessToken)
                        } else {
                            resultDiv.textContent = 'Error: Could not retrieve session storage value.';
                        }
                    });

                } else {
                    console.log(`No key starts with "${prefix}" in sessionStorage.`);
                }
            } else {
                document.getElementById('resultDiv').textContent = 'Error: session_key_access_token not found in inputs.txt.';
            }
        });
      }
    }



    function createIdInputField(accessToken) {
        const input = document.createElement("input");
        input.type = "text";
        input.style.width = "70%";
        input.style.fontSize = "15px";
        input.style.border = '1px solid black';
        input.style.padding = '5px';
        input.placeholder = 'Paste Record Id here and hit Enter...';

        const msgDiv = document.createElement("div");
        msgDiv.id = 'msgDivLookup';
        msgDiv.style.marginTop = '20px';
        msgDiv.style.marginBottom = '5px';
        msgDiv.style.padding = '5px';
        resultDiv.appendChild(msgDiv);

        const inputDiv = document.createElement("div");
        inputDiv.id = 'inputDivLookup';
        inputDiv.appendChild(input);

        resultDiv.appendChild(inputDiv);

        input.focus();

        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {

                msgDiv.textContent = 'Loading...';
                inputDiv.textContent = '';
                iteratorLength = 0;
                itemFound = false;
                startIdLookup(accessToken, input.value.trim());
            }
        });
    }

    async function startIdLookup(accessToken, Id) {
        try {
            const apiUrl = `https://${platformUri}/api/schema/v1/objects`;
            const schemaResponse = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'accept': '*/*'
                }
            });
            const schemaData = await schemaResponse.json();

            if (!schemaData.Success || schemaData.Data.length === 0) {
                return showErrorMessage('No objects found or failed to fetch schema.');
            }

            for (const item of schemaData.Data) {
                console.log('schemaData.Data.length:' + schemaData.Data.length);
                const found = checkIdLookup(item.Name, accessToken, Id, schemaData.Data.length);
            }
        } catch (error) {
            showErrorMessage(`Error fetching schema: ${error}`);
        }
    }


    function checkIdLookup(objectName, accessToken, Id, totalLength) {

        const apiUrl = `https://${platformUri}/api/data/v1/query/${objectName}?IncludeTotalCount=true`;
        const requestBody = {
            ObjectName: objectName,
            Criteria: `Id='${Id}'`,
            Select: ["Id"],
            Distinct: false,
            Limit: 1,
            Skip: 0,
            Sort: {},
            GroupBy: []
        };

        fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            })
            .then(response => response.json())
            .then(data => {
                const msgDivLookup = document.getElementById('msgDivLookup');
                if (data.Success && data.RecordCount > 0) {

                    const inputDivLookup = document.getElementById('inputDivLookup');

                    const table = document.createElement('table');
                    const thead = document.createElement('thead');
                    const tbody = document.createElement('tbody');

                    table.style.fontSize = '13.5px';
                    table.style.border = '1px solid';
                    table.style.borderCollapse = 'collapse';
                    table.style.textAlign = 'left';


                    const headerRow = document.createElement('tr');

                    const th1 = document.createElement('th');
                    th1.textContent = 'Object';
                    th1.style.border = '1px solid';
                    th1.style.borderCollapse = 'collapse';
                    th1.style.padding = '5px';
                    headerRow.appendChild(th1);

                    const th2 = document.createElement('th');
                    th2.textContent = 'Id';
                    th2.style.border = '1px solid';
                    th2.style.borderCollapse = 'collapse';
                    th2.style.padding = '5px';
                    headerRow.appendChild(th2);

                    const th3 = document.createElement('th');
                    th3.textContent = 'Action';
                    th3.style.border = '1px solid';
                    th3.style.borderCollapse = 'collapse';
                    th3.style.padding = '5px';
                    headerRow.appendChild(th3);

                    thead.appendChild(headerRow);

                    const row = document.createElement('tr');

                    const cell1 = document.createElement('td');
                    cell1.textContent = objectName;
                    cell1.style.border = '1px solid';
                    cell1.style.borderCollapse = 'collapse';
                    cell1.style.padding = '5px';
                    row.appendChild(cell1);

                    const cell2 = document.createElement('td');
                    cell2.textContent = Id;
                    cell2.style.border = '1px solid';
                    cell2.style.borderCollapse = 'collapse';
                    cell2.style.padding = '5px';
                    row.appendChild(cell2);

                    const cell3 = document.createElement('td');

                    const lookupResultDiv = document.createElement('div');
                    const lookupResult = document.createElement('a');
                    lookupResult.href = `https://${platformUri}/admin/entity/${objectName}/detail/${Id}`;
                    lookupResult.target = "_blank";
                    lookupResult.textContent = `View Record`;

                    const lookupResultDiv1 = document.createElement('div');
                    const lookupResult1 = document.createElement('a');
                    lookupResult1.href = 'javascript:void(0);';
                    lookupResult1.textContent = `Show All Data`;

                    lookupResult1.addEventListener("click", () => {
                        openNewTabShowAllData(objectName, Id);
                    });

                    cell3.style.border = '1px solid';
                    cell3.style.borderCollapse = 'collapse';
                    cell3.style.padding = '5px';
                    cell3.style.width = '110px';

                    lookupResultDiv.appendChild(lookupResult);
                    lookupResultDiv1.appendChild(lookupResult1);
                    cell3.appendChild(lookupResultDiv);
                    cell3.appendChild(lookupResultDiv1);

                    row.appendChild(cell3);

                    tbody.appendChild(row);

                    table.appendChild(thead);
                    table.appendChild(tbody);

                    inputDivLookup.appendChild(table);

                    msgDivLookup.style.backgroundColor = '#ccffd9';
                    msgDivLookup.style.color = '#00850d';
                    msgDivLookup.textContent = 'Record found !';
                    console.log('Object name found::' + objectName);

                    itemFound = true;
                    return true;
                }

                iteratorLength = iteratorLength + 1;
                console.log('iteratorLength:' + iteratorLength + '----' + totalLength + '------' + itemFound);
                if (totalLength === iteratorLength && itemFound === false) {
                    msgDivLookup.style.backgroundColor = '#ffcccc';
                    msgDivLookup.style.color = '#850000';
                    msgDivLookup.textContent = 'No record found !';
                }

                return false;
            }).catch(error => {
                console.log('Error:' + error);
                return false;
            });
    }
  }
}