window.onload = function () {
  const accessTokenFromUrl = getQueryParam('at');
  const objectname = getQueryParam('objectType');
  const id = getQueryParam('recordId');
  const platformUri = getQueryParam('hostname');

  let accessToken = '';
  if(accessTokenFromUrl){
    accessToken = accessTokenFromUrl;
    sessionStorage.setItem('accessToken', accessToken);  
    removeURLParameter("at");
  }
  else{
    accessToken = sessionStorage.getItem('accessToken');
  } 

  const initialData = [];
  showAllData(platformUri, accessToken, objectname, id);

  document.getElementById('searchBox').addEventListener('input', filterTable);
};

function showAllData(platformUri, accessToken, objectname, id){
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
      const tableDiv = document.getElementById('tableDiv');

      if (data.Success && data.Data.length > 0) {
        const templateData = data.Data[0];
        initialData = templateData; 
        createTable(templateData); 

        const objectNameDiv = document.getElementById('objectName');
        objectNameDiv.textContent = `Object: ${objectname}`;
		
		    document.getElementById('searchBox').style.display = 'inline-block';
      }
      else{
        const tableDiv = document.getElementById('tableDiv');
        tableDiv.textContent = `Some error occurred!!`;
      }
    })
    .catch(error => {
      const tableDiv = document.getElementById('tableDiv');
      tableDiv.textContent = `Error fetching API: ${error}`;
    });
  }
}

function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function removeURLParameter(parameter) {

  const url = new URL(window.location.href);
  url.searchParams.delete(parameter);
  window.history.replaceState(null, "", url);
}

function makeCellEditable(cell1, cell2) {
  const originalText = cell2.textContent;
  const input = document.createElement("input");

  input.type = "text";
  input.value = originalText;
  input.style.width = "100%"; 
  input.style.fontSize = "15px";
  input.style.border = '1px solid black';
  input.style.padding = '5px';
  cell2.textContent = ""; 
  cell2.appendChild(input);
  input.focus(); 

  input.addEventListener("blur", () => resetCellValue(cell2, input.value));
  input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") saveCellValue(cell1, cell2, input.value);
  });
}

function isValidJson(value) {
  try {
    JSON.parse(value);
    return true;
  } catch (e) {
    return false;
  }
}

function resetCellValue(cell2,newValue){
  cell2.textContent = newValue;
}

function saveCellValue(cell1, cell2, newValue) {
  cell2.textContent = newValue;
  const platformUri = getQueryParam('hostname');
  const objectname = getQueryParam('objectType');
  const id = getQueryParam('recordId');
  const accessToken = sessionStorage.getItem('accessToken');

  const fAPIName = cell1.textContent;

  //if (newValue) {

    let dataValue = isValidJson(newValue) ? JSON.parse(newValue) : newValue;

    let requestBody = {
      [fAPIName]: dataValue
    };
    
    const apiUrl = `https://${platformUri}/api/data/v1/objects/${objectname}/${id}`;

    fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        "accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    })
    .then(response => {
      
      return response.json();
    })
    .then(data => {
      const messageDiv = document.getElementById("messageDiv");
      if (data.Success) {

        showAllData(platformUri,accessToken, objectname, id);  

        messageDiv.textContent = data.StatusCode+' : '+"Update successful!";
        messageDiv.style.backgroundColor = "#ccffd9";
        messageDiv.style.color='#00850d';
		
      }else if (data.Success === false && data.Errors && data.Errors.length > 0) {
        messageDiv.textContent = data.StatusCode+' : '+data.Errors[0].Message;
        messageDiv.style.backgroundColor='#ffcccc';
        messageDiv.style.color='#850000';
      }else{
        messageDiv.textContent = "Some error occured!";
        messageDiv.style.backgroundColor='#ffcccc';
        messageDiv.style.color='#850000';
      }

      messageDiv.style.display = "block";
      messageDiv.style.top = "0px";

      setTimeout(() => {
        messageDiv.style.top = "-50px";
        setTimeout(() => messageDiv.style.display = "none", 500); 
      }, 3000);
    })
    .catch(error => {
      console.error("Error:", error);
      const messageDiv = document.getElementById("messageDiv");
      messageDiv.style.backgroundColor='#ffcccc';
      messageDiv.style.color='#850000';
      messageDiv.textContent = "An error occurred while processing the request.";

      messageDiv.style.display = "block";
      messageDiv.style.top = "0px";

      setTimeout(() => {
        messageDiv.style.top = "-50px";
        setTimeout(() => messageDiv.style.display = "none", 500);
      }, 3000);
    });
  //}
}

function createTable(templateData) {
  const tableDiv = document.getElementById('tableDiv');
  tableDiv.innerHTML = '';
  const table = document.createElement('table');

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
    cell2.addEventListener("dblclick", function () {
      makeCellEditable(cell1,cell2);
    });
  };

  
  for (const key in templateData) {
    if (typeof templateData[key] === 'object' && templateData[key] !== null) {
      addRow(key, JSON.stringify(templateData[key], null, 2));
    } else {
      addRow(key, templateData[key]);
    }
  }

  tableDiv.appendChild(table); 
}

function filterTable() {
  const searchTerm = document.getElementById('searchBox').value.toLowerCase();
  const filteredData = {};

  for (const key in initialData) {
    if (key.toLowerCase().includes(searchTerm)) {
      filteredData[key] = initialData[key];
    }
  }

  createTable(filteredData);
}