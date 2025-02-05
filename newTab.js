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

function renderOpenRecordinODE(platformUri, objectname, id){
  const OpenInODEDiv = document.getElementById("OpenInODE");
  OpenInODEDiv.innerHTML = '';
  const OpenRecordinODE = document.createElement("a");
  OpenRecordinODE.target = "_blank";
  OpenRecordinODE.href = `https://${platformUri}/admin/entity/${objectname}/detail/${id}`;
  OpenRecordinODE.textContent = "Open Record in ODE";
  OpenInODEDiv.appendChild(OpenRecordinODE);
}

function renderOpenRecordinApp(platformUri, objectname, id){
  if(objectname === 'Agreement'){
 
    const OpenInAppDiv = document.getElementById("OpenInApp");
    OpenInAppDiv.innerHTML = '';
    const OpenRecordinApp = document.createElement("a");
    OpenRecordinApp.target = "_blank";
    OpenRecordinApp.href = `https://${platformUri}/clm/detail/${id}`;
    OpenRecordinApp.textContent = "Open Record in App";
    OpenInAppDiv.appendChild(OpenRecordinApp);

  }
}

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

      if (data.Success && data.Data.length > 0) {
        const templateData = data.Data[0];

        const fields = Object.keys(templateData).map(key => ({
            name: key,
            value: templateData[key],
        }));

        initializeTable(fields, platformUri, accessToken, objectname);

        


		
		    document.getElementById('searchBox').style.display = 'inline-block';
        renderOpenRecordinODE(platformUri, objectname, id);
        renderOpenRecordinApp(platformUri, objectname, id)
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

async function fetchMetadata(platformUri, accessToken, objectname) {
  
  const apiUrl = `https://${platformUri}/api/metadata/v1/objects/${objectname}`;

  const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
      }
  });

  if (!response.ok) {
      console.error('Failed to fetch metadata', response.statusText);
      return null;
  }

  const data = await response.json();
  if (!data.Success) {
      console.error('API did not return a successful response');
      return null;
  }

  const objectNameDiv = document.getElementById('objectName');
  objectNameDiv.textContent = data.Data.Name+' ('+ data.Data.DisplayName +')';
  objectNameDiv.appendChild(createDropdownForObject());

  return data.Data.FieldMetadata;
}

function createFieldMetadataMap(templateData, metadata) {
 
  const metadataMap = {};
  metadata.forEach(field => {
      metadataMap[field.FieldName] = field;
  });

  const combinedData = templateData.map(item => ({
    name: item.name,
    value: item.value,
    type: metadataMap[item.name].DataType,
    displayName: metadataMap[item.name].DisplayName

  }));
  initialData = combinedData;
  return combinedData;
}

function renderTable(dataMap) {
  const tableDiv = document.getElementById('tableDiv');
  tableDiv.innerHTML = '';
  const table = document.createElement('table');
  table.id = "dataTable";

  // Add table header
  const headerRow = table.insertRow();
  ['Field API Name', 'Display Name', 'Data Type', 'Value', ' '].forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
  });

  dataMap.forEach(data => {
    const row = table.insertRow();
    const fieldNameCell = row.insertCell();
    const displayNameCell = row.insertCell();
    const dataTypeCell = row.insertCell();
    const valueCell = row.insertCell();
    const dropdownCell = row.insertCell();

    fieldNameCell.textContent = data.name;
    displayNameCell.textContent = data.displayName;
    dataTypeCell.textContent = data.type || 'Unknown';
    valueCell.textContent = typeof data.value === 'object' && data.value !== null ? JSON.stringify(data.value, null, 2) : data.value;

    valueCell.addEventListener("dblclick", function () {
      makeCellEditable(fieldNameCell,valueCell);
    });

    dropdownCell.appendChild(createDropdown(data.name));

  });

  tableDiv.appendChild(table);

}

async function initializeTable(templateData, platformUri, accessToken, objectname) {
  
  const metadata = await fetchMetadata(platformUri, accessToken, objectname);
  if (!metadata) return;

  const dataMap = createFieldMetadataMap(templateData,metadata);

  

  renderTable(dataMap);
}

function createDropdown(fieldName) {

  const faI = document.createElement('i');
  faI.classList.add('fa');
  faI.classList.add('fa-caret-down');
  // Create the dropdown button
  const button = document.createElement('button');
  button.appendChild(faI);
  button.classList.add('dropdown-btn'); // Add class for styling (optional)

  // Create the dropdown container (hidden initially)
  const dropdownContent = document.createElement('div');
  dropdownContent.classList.add('dropdown-content'); // Add class for styling (optional)
  dropdownContent.style.display = 'none'; // Initially hidden

  const objectname = getQueryParam('objectType');
  const platformUri = getQueryParam('hostname');
  // Create the dropdown list items
  const item1 = document.createElement('a');
  item1.textContent = 'Field setup';
  item1.target = "_blank";
  item1.href = `https://${platformUri}/schemas/object/details/${objectname}/fields/edit/${fieldName}`;
  //item1.addEventListener('click', () => alert('Option 1 clicked'));

  /*const item2 = document.createElement('a');
  item2.textContent = 'Option 2';
  item2.href = '#';
  item2.addEventListener('click', () => alert('Option 2 clicked'));

  const item3 = document.createElement('a');
  item3.textContent = 'Option 3';
  item3.href = '#';
  item3.addEventListener('click', () => alert('Option 3 clicked'));
  */
  // Append items to the dropdown content
  dropdownContent.appendChild(item1);
  //dropdownContent.appendChild(item2);
  //dropdownContent.appendChild(item3);

  // Toggle dropdown visibility when the button is clicked
  button.addEventListener('click', () => {
    dropdownContent.style.display = dropdownContent.style.display === 'none' ? 'block' : 'none';
  });

  // Append the button and the dropdown content to the document body (or any container)
  const container = document.createElement('dropdown-container'); // You can change this ID
  container.appendChild(button);
  container.appendChild(dropdownContent);

  return container;
}

function createDropdownForObject() {

  const faI = document.createElement('i');
  faI.classList.add('fa');
  faI.classList.add('fa-caret-down');
  // Create the dropdown button
  const button = document.createElement('button');
  button.appendChild(faI);
  button.style.padding = '5px 10px';
  button.style.borderRadius = '0';
  button.classList.add('dropdown-btn'); // Add class for styling (optional)

  // Create the dropdown container (hidden initially)
  const dropdownContent = document.createElement('div');
  dropdownContent.classList.add('dropdown-content'); // Add class for styling (optional)
  dropdownContent.style.right = '0.8%';
  dropdownContent.style.fontSize = '16px';
  dropdownContent.style.display = 'none'; // Initially hidden

  const objectname = getQueryParam('objectType');
  const platformUri = getQueryParam('hostname');
  // Create the dropdown list items
  const item1 = document.createElement('a');
  item1.textContent = 'Object setup';
  item1.target = "_blank";
  item1.href = `https://${platformUri}/schemas/object/details/${objectname}`;
  //item1.addEventListener('click', () => alert('Option 1 clicked'));

  /*const item2 = document.createElement('a');
  item2.textContent = 'Option 2';
  item2.href = '#';
  item2.addEventListener('click', () => alert('Option 2 clicked'));

  const item3 = document.createElement('a');
  item3.textContent = 'Option 3';
  item3.href = '#';
  item3.addEventListener('click', () => alert('Option 3 clicked'));
  */
  // Append items to the dropdown content
  dropdownContent.appendChild(item1);
  //dropdownContent.appendChild(item2);
  //dropdownContent.appendChild(item3);

  // Toggle dropdown visibility when the button is clicked
  button.addEventListener('click', () => {
    dropdownContent.style.display = dropdownContent.style.display === 'none' ? 'block' : 'none';
  });

  // Append the button and the dropdown content to the document body (or any container)
  const container = document.createElement('objectDropdown-container'); // You can change this ID
  container.style.margin='0px 10px';
  container.appendChild(button);
  container.appendChild(dropdownContent);

  return container;
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

function filterTable() {
  const searchTerm = document.getElementById('searchBox').value.toLowerCase();
  const filteredData = [];
  for (const item of initialData) {
    if (
      item.name.toLowerCase().includes(searchTerm) ||
      (item.value && item.value.toString().toLowerCase().includes(searchTerm)) ||
      item.type.toLowerCase().includes(searchTerm) ||
      item.displayName.toLowerCase().includes(searchTerm)
    ) {
      filteredData.push(item);
    }
  }

  renderTable(filteredData);
}

