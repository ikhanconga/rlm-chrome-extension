window.onload = function() {
  const accessTokenFromUrl = getQueryParam('at');
  const platformUri = getQueryParam('hostname');

  const saveButton = document.getElementById("saveImportButton");
  saveButton.disabled = true;

  const exportButtonD = document.getElementById("exportButton");
  exportButtonD.disabled = false;

  window.addEventListener('click', function() {
      customMenu.style.display = 'none';
  });

  let accessToken = '';
  if (accessTokenFromUrl) {
      accessToken = accessTokenFromUrl;
      sessionStorage.setItem('accessToken', accessToken);
      removeURLParameter("at");
  } else {
      accessToken = sessionStorage.getItem('accessToken');
  }


  if (accessToken) {

      const apiUrl = `https://${platformUri}/api/schema/v1/objects?sortField=Name&sortDirection=Ascending`;

      fetch(apiUrl, {
              method: 'GET',
              headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'accept': '*/*'
              }
          })
          .then(response => {

              if (!response.ok) {

                  const errorDiv = document.createElement("div");
                  errorDiv.style.color = "red";

                  if (response.Errors) {

                      const message = response.Errors[0]?.Message || "An error occurred";
                      const statusCode = response.StatusCode || "Unknown";
                      errorDiv.innerHTML = "";
                      errorDiv.innerHTML = `<strong>Status Code:</strong> ${statusCode}<strong>, Error:</strong> ${message}`;

                  } else {
                      const message = "An error occurred, Session expired !!";
                      const statusCode = "Unknown";
                      errorDiv.innerHTML = "";
                      errorDiv.innerHTML = `<strong>Status Code:</strong> ${statusCode}<strong>, Error:</strong> ${message}`;
                  }
                  document.getElementById("resultsBody").innerHTML = "Error";
              } else {
                  return response.json();
              }

          })
          .then(data => {
              if (data.Success && data.Data.length > 0) {
                  createSearchBox(data.Data);
              } else {
                  errorDiv.style.color = "red";
                  errorDiv.innerHTML = "";
                  errorDiv.innerHTML = `<strong>Error:</strong> ${data}`;
                  console.error("Error fetching API data:", data);
              }
          })
          .catch(error => {
              errorDiv.style.color = "red";
              const message = "An error occurred, Session expired. Please re-open the Query Console !!";
              errorDiv.innerHTML = "";
              errorDiv.innerHTML = `<strong>Error:</strong> ${message}`;

              console.error(`Error fetching API: ${error}`);
          });
  }

  function removeURLParameter(parameter) {
      const url = new URL(window.location.href);
      url.searchParams.delete(parameter);
      window.history.replaceState(null, "", url);
  }

  function createSearchBox(data) {
      const searchContainer = document.getElementById("ObjectDropDown");
      const input = document.createElement("input");
      input.type = "text";
      input.id = "objectDropDownInput";
      input.placeholder = "Search Object...";
      input.style.fontSize = "16px";
      input.style.padding = "2px";

      const suggestionsList = document.createElement("ul");
      suggestionsList.style.position = "absolute";
      suggestionsList.style.listStyle = "none";
      suggestionsList.style.padding = "0";
      suggestionsList.style.margin = "0";
      suggestionsList.style.border = "1px solid #ccc";
      suggestionsList.style.backgroundColor = "#fff";
      suggestionsList.style.zIndex = "1000";
      suggestionsList.style.display = "none";

      const inputTooltip = document.createElement("div");
      inputTooltip.id = "inputTooltip";
      inputTooltip.className = "tooltip";

      searchContainer.appendChild(input);
      searchContainer.appendChild(inputTooltip);
      searchContainer.appendChild(suggestionsList);

      let currentIndex = -1;

      input.addEventListener("input", () => {
          inputTooltip.style.display = "none";
          const value = input.value.toLowerCase();
          suggestionsList.innerHTML = "";
          currentIndex = -1;

          if (value) {
              const filteredData = data.filter(item => item.Name.toLowerCase().includes(value));

              filteredData.forEach((item, index) => {
                  const suggestionItem = document.createElement("li");
                  suggestionItem.textContent = item.Name;
                  suggestionItem.style.padding = "5px";
                  suggestionItem.style.cursor = "pointer";

                  suggestionItem.addEventListener("click", () => {
                      input.value = item.Name;
                      inputTooltip.textContent = input.value;
                      createQuery(item.Name);
                      fetchFields(item.Name);
                      suggestionsList.innerHTML = "";
                  });

                  suggestionItem.addEventListener("mouseenter", () => {
                      currentIndex = index;
                      updateSuggestionHighlight(suggestionsList, currentIndex);
                  });

                  suggestionsList.appendChild(suggestionItem);
              });

              suggestionsList.style.display = "block";
          } else {
              suggestionsList.style.display = "none";
          }
      });

      input.addEventListener("keydown", (event) => {
          const suggestions = suggestionsList.children;

          if (event.key === "ArrowDown") {
              currentIndex++;
              if (currentIndex >= suggestions.length) currentIndex = suggestions.length - 1;
              updateSuggestionHighlight(suggestionsList, currentIndex);
          } else if (event.key === "ArrowUp") {
              currentIndex--;
              if (currentIndex < 0) currentIndex = 0;
              updateSuggestionHighlight(suggestionsList, currentIndex);
          } else if (event.key === "Enter") {
              if (currentIndex >= 0 && currentIndex < suggestions.length) {
                  input.value = suggestions[currentIndex].textContent;
                  inputTooltip.textContent = 'Selected object::' + input.value;
                  createQuery(suggestions[currentIndex].textContent);
                  fetchFields(suggestions[currentIndex].textContent);
                  suggestionsList.innerHTML = "";
              }
          }
      });

      input.addEventListener('mouseenter', function(event) {

          if (input.value != null && input.value != '') {
              inputTooltip.style.display = 'block';
              inputTooltip.style.left = `${event.pageX + 10}px`;
              inputTooltip.style.top = `${event.pageY + 10}px`;
          }

      });

      input.addEventListener('mouseleave', function() {
          inputTooltip.style.display = 'none';
      });

      function fetchFields(objectName) {
          const fieldsApiUrl = `https://${platformUri}/api/schema/v1/objects/${objectName}`;

          fetch(fieldsApiUrl, {
                  method: 'GET',
                  headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'accept': 'application/json'
                  }
              })
              .then(response => {
                  if (!response.ok) {
                      throw new Error(`HTTP error! Status: ${response.status}`);
                  }
                  return response.json();
              })
              .then(data => {
                  if (data.Success) {
                      createFieldsDropdown(data.Data.FieldMetadata);
                  } else {
                      console.error("Error fetching fields:", data);
                  }
              })
              .catch(error => {
                  console.error(`Error fetching fields API: ${error}`);
              });
      }

      function createFieldsDropdown(fields) {
          console.log('fields::' + JSON.stringify(fields));
          const fieldsContainer = document.getElementById("FieldsDropDown");
          const selectfieldsDiv = document.getElementById("selectfieldsDiv");
          fieldsContainer.innerHTML = "";

          const input = document.createElement("input");
          input.type = "text";
          input.placeholder = "Search Fields...";
          input.id = "searchFieldsInput";
          input.style.fontSize = "16px";
          input.style.padding = "2px";
          input.style.marginLeft = "5px";

          const inputFieldsTooltip = document.createElement("div");
          inputFieldsTooltip.id = "inputFieldsTooltip";
          inputFieldsTooltip.className = "tooltip";

          const suggestionsList = document.createElement("ul");
          suggestionsList.style.position = "absolute";
          suggestionsList.style.listStyle = "none";
          suggestionsList.style.padding = "0";
          suggestionsList.style.margin = "0";
          suggestionsList.style.border = "1px solid #ccc";
          suggestionsList.style.backgroundColor = "#fff";
          suggestionsList.style.zIndex = "1000";
          suggestionsList.style.display = "none";

          fieldsContainer.appendChild(input);
          fieldsContainer.appendChild(inputFieldsTooltip);
          fieldsContainer.appendChild(suggestionsList);

          const elementFooter = document.getElementById('footerDiv');
          if (elementFooter) {
              elementFooter.remove();
          }

          const footer = document.createElement("div");
          footer.style.textAlign = "center";
          footer.id = "footerDiv";
          const finalizeButton = document.createElement("button");
          finalizeButton.textContent = "✔";
          finalizeButton.id = "SelectFieldsBtn";
          finalizeButton.style.padding = "2.5px 5px";
          finalizeButton.style.margin = "0px 3px";
          finalizeButton.style.cursor = "pointer";
          finalizeButton.title = "Select fields";

          const finalizeButtonClear = document.createElement("button");
          finalizeButtonClear.textContent = "✖";
          finalizeButtonClear.id = "clearFieldsBtn";
          finalizeButtonClear.style.padding = "2.5px 5px";
          finalizeButtonClear.style.margin = "0px 0px";
          finalizeButtonClear.style.cursor = "pointer";
          finalizeButtonClear.title = "Clear selection";

          footer.appendChild(finalizeButton);
          footer.appendChild(finalizeButtonClear);
          selectfieldsDiv.appendChild(footer);


          let currentIndex = -1;
          const selectedFields = {};
          let previouslySelectedFields = [];

          input.addEventListener("input", () => {
              inputFieldsTooltip.style.display = "none";
              const value = input.value.toLowerCase();
              suggestionsList.innerHTML = "";
              currentIndex = -1;
              console.log('value::' + value);

              if (value) {

                  let filteredData = [];

                  if (value === '*') {
                      filteredData = fields;
                  } else {
                      filteredData = fields.filter(item =>
                          item.DisplayName.toLowerCase().includes(value) ||
                          item.FieldName.toLowerCase().includes(value)
                      );
                  }


                  filteredData.forEach((item, index) => {
                      const suggestionItem = document.createElement("li");
                      suggestionItem.style.display = "flex";
                      suggestionItem.style.alignItems = "center";

                      const checkbox = document.createElement("input");
                      checkbox.type = "checkbox";
                      checkbox.value = item.FieldName;
                      checkbox.id = `field_${item.FieldName}`;

                      checkbox.checked = previouslySelectedFields.includes(item.FieldName);
                      checkbox.addEventListener("change", (e) => {
                          selectedFields[item.FieldName] = e.target.checked;
                      });

                      const label = document.createElement("label");
                      label.textContent = `${item.DisplayName} (${item.FieldName})`;
                      label.htmlFor = checkbox.id;

                      suggestionItem.appendChild(checkbox);
                      suggestionItem.appendChild(label);
                      suggestionsList.appendChild(suggestionItem);
                  });

                  suggestionsList.style.display = "block";
              } else {
                  suggestionsList.style.display = "none";
              }
          });

          input.addEventListener('mouseenter', function(event) {

              if (JSON.stringify(selectedFields) != '{}') {
                  inputFieldsTooltip.style.display = 'block';
                  inputFieldsTooltip.style.left = `${event.pageX + 10}px`;
                  inputFieldsTooltip.style.top = `${event.pageY + 10}px`;
              }

          });

          input.addEventListener('mouseleave', function() {
              inputFieldsTooltip.style.display = 'none';
          });

          finalizeButton.addEventListener("click", () => {
              let fieldsToSelect = Object.keys(selectedFields)
                  .filter(field => selectedFields[field])
                  .join(", ");

              const queryTextArea = document.getElementById("query");
              let query = queryTextArea.value;

              if (fieldsToSelect.length > 0) {
                  const selectMatch = query.match(/SELECT\s+(.+?)\s+FROM/i);
                  if (selectMatch) {
                      query = query.replace(selectMatch[1], fieldsToSelect);
                  } else {
                      query = `SELECT ${fieldsToSelect} FROM ${query.split('FROM')[1]}`;
                  }
                  queryTextArea.value = query;

                  inputFieldsTooltip.textContent = 'Selected fields:::' + fieldsToSelect;
              } else {
                  inputFieldsTooltip.textContent = '';
                  alert("Please select at least one field.");
              }

              previouslySelectedFields = Object.keys(selectedFields).filter(field => selectedFields[field]);

              suggestionsList.innerHTML = "";
              suggestionsList.style.display = "none";
              input.value = "";
          });

          finalizeButtonClear.addEventListener("click", () => {
              const objectDropDownInputValue = document.getElementById("inputTooltip").textContent;
              fetchFields(objectDropDownInputValue);
              createQuery(objectDropDownInputValue);
          });


          document.addEventListener("click", (event) => {
              if (!fieldsContainer.contains(event.target)) {
                  suggestionsList.innerHTML = "";
                  suggestionsList.style.display = "none";
              }
          });
      }

      function updateSuggestionHighlight(suggestionsList, currentIndex) {
          Array.from(suggestionsList.children).forEach((item, index) => {
              if (index === currentIndex) {
                  item.style.backgroundColor = "#e0e0e0";
              } else {
                  item.style.backgroundColor = "#fff";
              }
          });
      }

      function createQuery(objectName) {
          const query = `SELECT * FROM ${objectName} LIMIT 10;`;
          document.getElementById("query").value = query;
      }

      document.addEventListener("click", (event) => {
          if (!searchContainer.contains(event.target)) {
              suggestionsList.innerHTML = "";
              suggestionsList.style.display = "none";
          }
      });

      

let pageSize = 50; 
let currentPage = 1; 

let totalRecords = 0;
let totalPages = 0;
let allData = [];
let isLoading = false;

let rbNoId = false;
let requestBodySelect = [];
let requestBodyObjectName = '';

function resetInitials() {
    currentPage = 1;

    totalRecords = 0;
    totalPages = 0;
    allData = [];
    isLoading = false;

    rbNoId = false;
    requestBodySelect = [];
    requestBodyObjectName = '';
} 

const exportButton = document.getElementById("exportButton");
exportButton.addEventListener("click", () => {
    if (isLoading) return;
    isLoading = true;
    
    resetInitials();
    fetchData();
});

function handlePagination() {
    const prevPageButton = document.getElementById("prevPageButton");
    const nextPageButton = document.getElementById("nextPageButton");
    const pageNumberInput = document.getElementById("pageNumberInput");

    prevPageButton.disabled = currentPage <= 1;
    nextPageButton.disabled = currentPage >= totalPages;

    pageNumberInput.value = currentPage;
    document.getElementById("totalPages").textContent = `of ${totalPages}`;
}

function fetchData() {
    const query = document.getElementById("query").value.trim();
    if (!query) {
        alert("Please enter a query!");
        isLoading = false;
        return;
    }

    document.getElementById("resultsBody").innerHTML = "Loading...";
    document.getElementById("errorDiv").innerHTML = "...";

    const requestBody = prepareRequestBody(query);

    fetch(`https://${platformUri}/api/data/v1/query/${requestBody.ObjectName}?IncludeTotalCount=true`, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) {
            console.log('Response when failed::' + JSON.stringify(response));
        }
        return response.json();
    })
    .then(data => {
        if (data.Success) {
            allData = data.Data;
            totalRecords = data.Data.length || 0;
            totalPages = Math.ceil(totalRecords / pageSize);

            const errorDiv = document.getElementById("errorDiv");
            errorDiv.style.color = "green";
            const statusCode = data.StatusCode || "Success";
            errorDiv.innerHTML = "";
            errorDiv.innerHTML = `<strong>Status Code:</strong> ${statusCode}.<strong>`;

            const recordCountDiv = document.getElementById("recordCountDiv");
            recordCountDiv.innerHTML = "";
            recordCountDiv.innerHTML = `<strong>    Record count:</strong> ${data.Data.length}, <strong>Total count:</strong> ${data.RecordCount}<strong>`;

            console.log('totalRecords::'+totalRecords);
            console.log('totalPages::'+totalPages);

            requestBodySelect = requestBody.Select;
            requestBodyObjectName = requestBody.ObjectName;

            const startIdx = (currentPage - 1) * pageSize;
            const endIdx = startIdx + pageSize;
            const pageData = allData.slice(startIdx, endIdx);

            populateResultsTable(pageData, requestBodySelect, requestBodyObjectName, rbNoId);
            handlePagination();
        } else {
            console.error("Error in API response:", data);

            const errorDiv = document.getElementById("errorDiv");
            errorDiv.style.color = "red";

            const message = data.Errors[0]?.Message || "An error occurred";
            const statusCode = data.StatusCode || "Unknown";
            errorDiv.innerHTML = "";
            errorDiv.innerHTML = `<strong>Status Code:</strong> ${statusCode}<strong>, Error:</strong> ${message}`;

            const recordCountDiv = document.getElementById("recordCountDiv");
            recordCountDiv.innerHTML = "";

            document.getElementById("resultsBody").innerHTML = "Error";
        }
        isLoading = false;
    })
    .catch(error => {
        console.error("Error:", error);
        document.getElementById("resultsBody").innerHTML = error;
        isLoading = false;
    });
}

function prepareRequestBody(query) {
    const requestBody = {
        ObjectName: "",
        Criteria: "",
        Select: ["Id", "Name"],
        Distinct: false,
        Limit: -1,
        Skip: 0,
        Sort: {}
    };

    const selectMatch = query.match(/SELECT\s+(.+?)\s+FROM/i);
    if (selectMatch) {
        requestBody.Select = selectMatch[1].split(',').map(field => field.trim());
    }


    if (!requestBody.Select.includes('*') && !requestBody.Select.includes('Id')) {
        requestBody.Select.unshift("Id");
        rbNoId = true;
    }

    const objectMatch = query.match(/FROM\s+(\w+)/i);
    var objectNameRequest = '';
    if (objectMatch) {
        requestBody.ObjectName = objectMatch[1];
        objectNameRequest = objectMatch[1];
    }

    const whereMatch = query.match(/WHERE\s+(.*?)(?:\s+ORDER\s+BY\s+.*?|\s+LIMIT\s+\d+|$)/i);
    const orderByMatch = query.match(/ORDER\s+BY\s+(.*?)(?:\s+LIMIT\s+\d+|$)/i);
    const limitMatch = query.match(/LIMIT\s+(\d+)/i);
    const offsetMatch = query.match(/OFFSET\s+(\d+)/i);

    if (whereMatch) {
        requestBody.Criteria = whereMatch[1].trim().replace(/;$/, '');
    }

    if (orderByMatch) {
        const orderByParts = orderByMatch[1].trim().split(" ");
        requestBody.Sort.FieldName = orderByParts[0];
        requestBody.Sort.OrderBy = orderByParts[1].toLowerCase() === 'asc' ? 'Ascending' : 'Descending';
    }

    if (limitMatch) {
        requestBody.Limit = parseInt(limitMatch[1], 10);
    }

    if (offsetMatch) {
      requestBody.Skip = parseInt(offsetMatch[1], 10);
    }

    if (requestBody.Limit === -1) {
        delete requestBody.Limit;
    }

    return requestBody;
}

function populateResultsTable1() {
    const resultsBody = document.getElementById("resultsBody");

    console.log('populateResultsTable');
    
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const pageData = allData.slice(startIdx, endIdx);
    
    const headerRow = document.querySelector("#resultsTable thead tr");
    headerRow.innerHTML = "";
    const tableColumns = ["#", "Id", "Name"];
    tableColumns.forEach((header) => {
        const th = document.createElement("th");
        th.textContent = header;
        headerRow.appendChild(th);
    });

    pageData.forEach(item => {
        const row = document.createElement("tr");
        tableColumns.forEach(key => {
            const cell = document.createElement("td");
            if (key === '#') {
                const recordUrl = document.createElement("a");
                recordUrl.target = "_blank";
                recordUrl.href = `https://${platformUri}/admin/entity/${item['Id']}`;
                recordUrl.textContent = "Open";
                cell.appendChild(recordUrl);
            } else {
                cell.textContent = item[key] || '';
            }
            row.appendChild(cell);
        });
        resultsBody.appendChild(row);
    });

    document.getElementById("resultsTable").style.display = "table"; 
}

function nextPage() {
    console.log('currentPage::'+currentPage);
    console.log('totalPages::'+totalPages);
    if (currentPage < totalPages) {
        currentPage++;

        const startIdx = (currentPage - 1) * pageSize;
        const endIdx = startIdx + pageSize;
        const pageData = allData.slice(startIdx, endIdx);

        populateResultsTable(pageData, requestBodySelect, requestBodyObjectName, rbNoId);
        handlePagination();
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        const startIdx = (currentPage - 1) * pageSize;
        const endIdx = startIdx + pageSize;
        const pageData = allData.slice(startIdx, endIdx);

        populateResultsTable(pageData, requestBodySelect, requestBodyObjectName, rbNoId);
        handlePagination();
    }
}

function goToPage() {
    const pageInput = document.getElementById("pageNumberInput").value;
    const page = parseInt(pageInput, 10);
    if (page > 0 && page <= totalPages) {
        currentPage = page;
        const startIdx = (currentPage - 1) * pageSize;
        const endIdx = startIdx + pageSize;
        const pageData = allData.slice(startIdx, endIdx);
        populateResultsTable(pageData, requestBodySelect, requestBodyObjectName, rbNoId);
        handlePagination();
    }
}


document.getElementById('pageSizes').addEventListener('change', function() {
    console.log(this.value);
    const selectedValue = parseInt(this.value, 10);
    console.log('selectedValue1::'+selectedValue);
    if (!isNaN(selectedValue) && selectedValue > 0) {
        console.log('selectedValue2::'+selectedValue);
        pageSize = selectedValue;
        totalPages = Math.ceil(totalRecords / pageSize);
        currentPage = 1;

        const startIdx = (currentPage - 1) * pageSize;
        const endIdx = startIdx + pageSize;
        const pageData = allData.slice(startIdx, endIdx);

        populateResultsTable(pageData, requestBodySelect, requestBodyObjectName, rbNoId);
        handlePagination();
    }
});

document.getElementById("nextPageButton").addEventListener("click", nextPage);
document.getElementById("prevPageButton").addEventListener("click", prevPage);
document.getElementById("pageNumberInput").addEventListener("change", goToPage);



  }

  function fetchFieldsForColumns(objectName) {
      const fieldsApiUrl = `https://${platformUri}/api/schema/v1/objects/${objectName}`;

      fetch(fieldsApiUrl, {
              method: 'GET',
              headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'accept': 'application/json'
              }
          })
          .then(response => {
              if (!response.ok) {
                  throw new Error(`HTTP error! Status: ${response.status}`);
              }
              return response.json();
          })
          .then(data => {
              if (data.Success) {

                  const headerData = data.map(item => item.FieldName);
                  return headerData;
              } else {
                  console.error("Error fetching fields:", data);
              }
          })
          .catch(error => {
              console.error(`Error fetching fields API: ${error}`);
          });
  }

  function populateResultsTable(dataM, tableColumns, obName, noId) {

      const headerData = [];
      if (tableColumns.includes('*')) {

          const fieldsApiUrl = `https://${platformUri}/api/schema/v1/objects/${obName}`;

          fetch(fieldsApiUrl, {
                  method: 'GET',
                  headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'accept': 'application/json'
                  }
              })
              .then(response => {
                  if (!response.ok) {
                      throw new Error(`HTTP error! Status: ${response.status}`);
                  }
                  return response.json();
              })
              .then(data => {
                  if (data.Success) {

                      const headerData = data.Data.FieldMetadata.map(item => item.FieldName);
                      headerData.unshift("#");

                      let tableColumns = headerData;

                      const resultsBody = document.getElementById("resultsBody");
                      resultsBody.innerHTML = "";
                      const resultsTable = document.getElementById("resultsTable");

                      const headerRow = resultsTable.querySelector("thead tr");
                      headerRow.innerHTML = "";

                      if (dataM.length > 0) {

                          const headers = tableColumns;
                          
                          headers.forEach((header, index) => {
                              const th = document.createElement("th");
                              th.textContent = header;

                              th.addEventListener('click', () => {
                                toggleColumnHighlight(index);
                              });
                              headerRow.appendChild(th);

                             
                          });
                      }

                      dataM.forEach(item => {
                          const row = document.createElement("tr");
                          tableColumns.forEach(key => {
                              const cell = document.createElement("td");
                              if (key === '#') {
                                  const recordUrl = document.createElement("a");
                                  recordUrl.target = "_blank";
                                  recordUrl.href = `https://${platformUri}/admin/entity/${obName}/detail/${item['Id']}`;
                                  recordUrl.textContent = "Open";

                                  cell.style.width = '40px';

                                  const customMenuUl = document.getElementById("customMenu");

                                  recordUrl.addEventListener('contextmenu', function(event) {
                                      event.preventDefault();

                                      customMenuUl.style.top = `${event.pageY}px`;
                                      customMenuUl.style.left = `${event.pageX}px`;

                                      customMenuUl.style.display = 'block';
                                      customMenuUl.style.paddingLeft = '15px';

                                      document.getElementById('menuOption1').onclick = () => {
                                          let link = recordUrl.href;
                                          if (obName === 'Agreement') {
                                              link = `https://${platformUri}/clm/detail/${item['Id']}`;
                                          }
                                          if (obName === 'Proposal') {
                                              link = `https://${platformUri}/cpq/quotes/${item['Id']}`;
                                          }

                                          window.open(link, '_blank');
                                          customMenuUl.style.display = 'none';
                                      };

                                      document.getElementById('menuOption2').onclick = () => {
                                          const link = recordUrl.href;
                                          window.open(link, '_blank');
                                          customMenuUl.style.display = 'none';
                                      };

                                      document.getElementById('menuOption3').onclick = () => {
                                          const link = recordUrl.href;
                                          navigator.clipboard.writeText(link).then(() => {
                                              alert('Link copied to clipboard!');
                                          }).catch(err => {
                                              console.error('Error copying link: ', err);
                                          });
                                          customMenuUl.style.display = 'none';
                                      };

                                  });

                                  cell.appendChild(recordUrl);


                              } else if (item[key] === undefined) {
                                  cell.textContent = '';
                              } else {
                                  if (item[key] && typeof item[key] === 'object' && !Array.isArray(item[key])) {
                                      cell.textContent = JSON.stringify(item[key]);
                                  } else {
                                      cell.textContent = item[key];
                                  }
                              }

                              row.appendChild(cell);
                          });



                          resultsBody.appendChild(row);
                      });


                  } else {
                      console.error("Error fetching fields:", data);
                  }
              })
              .catch(error => {
                  console.error(`Error fetching fields API: ${error}`);
              });
      } else {
          const resultsBody = document.getElementById("resultsBody");
          resultsBody.innerHTML = "";
          const resultsTable = document.getElementById("resultsTable");

          const headerRow = resultsTable.querySelector("thead tr");
          headerRow.innerHTML = "";
          console.log('tableColumns::'+tableColumns);
          if(!tableColumns.includes('#')){
            tableColumns.unshift("#");
          }
          
          console.log('tableColumns::'+tableColumns);
          if (dataM.length > 0) {

              if (noId) {
                  const index = tableColumns.indexOf('Id');
                  if (index > -1) {
                      tableColumns.splice(index, 1);
                  }
              }
              const headers = tableColumns;
              headers.forEach((header, index) => {
                  const th = document.createElement("th");
                  th.textContent = header;
                  th.addEventListener('click', () => {
                    toggleColumnHighlight(index);
                  });
                  headerRow.appendChild(th);
              });
          }

          dataM.forEach(item => {
              const row = document.createElement("tr");
              tableColumns.forEach(key => {
                  const cell = document.createElement("td");
                  if (key === '#') {
                      const recordUrl = document.createElement("a");
                      recordUrl.target = "_blank";
                      recordUrl.href = `https://${platformUri}/admin/entity/${obName}/detail/${item['Id']}`;
                      recordUrl.textContent = "Open";

                      cell.style.width = '40px';

                      const customMenuUl = document.getElementById("customMenu");

                      recordUrl.addEventListener('contextmenu', function(event) {
                          event.preventDefault();
                          customMenuUl.style.top = `${event.pageY}px`;
                          customMenuUl.style.left = `${event.pageX}px`;

                          customMenuUl.style.display = 'block';
                          customMenuUl.style.paddingLeft = '15px';

                          document.getElementById('menuOption1').onclick = () => {
                              let link = recordUrl.href;
                              if (obName === 'Agreement') {
                                  link = `https://${platformUri}/clm/detail/${item['Id']}`;
                              }
                              if (obName === 'Proposal') {
                                  link = `https://${platformUri}/cpq/quotes/${item['Id']}`;
                              }

                              window.open(link, '_blank');
                              customMenuUl.style.display = 'none';
                          };

                          document.getElementById('menuOption2').onclick = () => {
                              const link = recordUrl.href;
                              window.open(link, '_blank');
                              customMenuUl.style.display = 'none';
                          };

                          document.getElementById('menuOption3').onclick = () => {
                              const link = recordUrl.href;
                              navigator.clipboard.writeText(link).then(() => {
                                  alert('Link copied to clipboard!');
                              }).catch(err => {
                                  console.error('Error copying link: ', err);
                              });
                              customMenuUl.style.display = 'none';
                          };

                      });

                      cell.appendChild(recordUrl);

                  } else if (item[key] === undefined) {
                      cell.textContent = '';
                  } else {
                      if (item[key] && typeof item[key] === 'object' && !Array.isArray(item[key])) {
                          cell.textContent = JSON.stringify(item[key]);
                      } else {
                          cell.textContent = item[key];
                      }
                  }
                  row.appendChild(cell);
              });
              resultsBody.appendChild(row);
          });
      }

      resultsTable.style.display = "table";
  }

  const copyButton = document.getElementById("copyAsExcelButton");
  copyButton.addEventListener("click", checkIfColumnsSelected);

  function checkIfColumnsSelected(){

    console.log('selectedColumns.size:'+selectedColumns.size);

    if(selectedColumns.size === 0){
        copyTableAsExcel();
    }
    else{
        copyHighlightedColumns();
    }

  }

  function copyTableAsExcel() {
      const table = document.getElementById("resultsTable");
      let dataToCopy = "";

      const headers = [...table.querySelectorAll("thead th")].map(th => th.textContent.trim());
      dataToCopy += headers.join("\t") + "\n";
      const rows = [...table.querySelectorAll("tbody tr")];
      rows.forEach(row => {
          const rowData = [...row.querySelectorAll("td")].map(td => td.textContent.trim());
          dataToCopy += rowData.join("\t") + "\n";
      });

      navigator.clipboard.writeText(dataToCopy).then(() => {
          alert("Table data copied to clipboard!");
      }).catch(err => {
          console.error("Failed to copy table data: ", err);
          const messageDiv = document.getElementById("messageDiv");

          messageDiv.textContent = "Failed to copy table data:" + err;
          messageDiv.style.backgroundColor = "#dc3545";

          messageDiv.style.display = "block";
          messageDiv.style.top = "0px";

          setTimeout(() => {
              messageDiv.style.top = "-50px";
              setTimeout(() => messageDiv.style.display = "none", 500);
          }, 3000);
      });
  }

  const exportAsExcelButton = document.getElementById("exportAsExcelButton");
  exportAsExcelButton.addEventListener("click", exportTableToExcel);

  function exportTableToExcel() {
      try {

          const table = document.getElementById("resultsTable");

          const worksheetData = [];

          const headers = [...table.querySelectorAll("thead th")].map(th => th.textContent.trim());
          worksheetData.push(headers);

          const rows = [...table.querySelectorAll("tbody tr")];
          rows.forEach(row => {
            if (row.style.display !== 'none') {
              const rowData = [...row.querySelectorAll("td")].map(td => td.textContent.trim());
              worksheetData.push(rowData);
            }
          });

          const workbook = XLSX.utils.book_new();
          const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
          XLSX.utils.book_append_sheet(workbook, worksheet, "DataExport");

          XLSX.writeFile(workbook, "DataExport.xlsx");

      } catch (error) {
          console.log('Error:' + error);
          const messageDiv = document.getElementById("messageDiv");

          messageDiv.textContent = "Failed to export file:" + error;
          messageDiv.style.backgroundColor = "#dc3545";

          messageDiv.style.display = "block";
          messageDiv.style.top = "0px";

          setTimeout(() => {
              messageDiv.style.top = "-50px";
              setTimeout(() => messageDiv.style.display = "none", 500);
          }, 3000);
      }
  }

  function exportQueryResultAsExcel(dataM) {
      const downloadingDiv = document.getElementById("downloadingDiv"); 
      const flattenedData = dataM.map(item => flattenObject(item));

      const worksheet = XLSX.utils.json_to_sheet(flattenedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "DataExport");

      XLSX.writeFile(workbook, "DataExport.xlsx");

      setTimeout(() => {
        downloadingDiv.style.top = "-50px";
        setTimeout(() => downloadingDiv.style.display = "none", 500);
    }, 1000);
  }

  function flattenObject(obj, prefix = "") {
      return Object.keys(obj).reduce((acc, key) => {
          const newKey = prefix ? `${prefix}_${key}` : key;
          if (obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
              acc[newKey] = JSON.stringify(obj[key]);
          } else {
              acc[newKey] = obj[key];
          }
          return acc;
      }, {});
  }

  const exportAsExcelQueryButton = document.getElementById("exportAsExcelQueryButton");
  exportAsExcelQueryButton.addEventListener("click", () => {
     
     const downloadingDiv = document.getElementById("downloadingDiv");  
     downloadingDiv.style.display = "block";
     
     const query = document.getElementById("query").value.trim();

      const requestBody = {
          ObjectName: "",
          Criteria: "",
          Select: ["Id", "Name"],
          Distinct: false,
          Limit: -1,
          Skip: 0,
          Sort: {}
      };

      const selectMatch = query.match(/SELECT\s+(.+?)\s+FROM/i);
      if (selectMatch) {
          requestBody.Select = selectMatch[1].split(',').map(field => field.trim());
      }

      let noId = false;
      if (!requestBody.Select.includes('*') && !requestBody.Select.includes('Id')) {
          requestBody.Select.unshift("Id");
          noId = true;
      }

      const objectMatch = query.match(/FROM\s+(\w+)/i);
      var objectNameRequest = '';
      if (objectMatch) {
          requestBody.ObjectName = objectMatch[1];
          objectNameRequest = objectMatch[1];
      }

      const whereMatch = query.match(/WHERE\s+(.*?)(?:\s+ORDER\s+BY\s+.*?|\s+LIMIT\s+\d+|$)/i);
      const orderByMatch = query.match(/ORDER\s+BY\s+(.*?)(?:\s+LIMIT\s+\d+|$)/i);
      const limitMatch = query.match(/LIMIT\s+(\d+)/i);
      const offsetMatch = query.match(/OFFSET\s+(\d+)/i);

      if (whereMatch) {
          requestBody.Criteria = whereMatch[1].trim().replace(/;$/, '');
      }

      if (orderByMatch) {
          const orderByParts = orderByMatch[1].trim().split(" ");
          requestBody.Sort.FieldName = orderByParts[0];
          requestBody.Sort.OrderBy = orderByParts[1].toLowerCase() === 'asc' ? 'Ascending' : 'Descending';
          console.log(requestBody.Sort);
      }

      if (limitMatch) {
          requestBody.Limit = parseInt(limitMatch[1], 10);
      }

      if (offsetMatch) {
        requestBody.Skip = parseInt(offsetMatch[1], 10);
      }

      if (requestBody.Limit === -1) {
          delete requestBody.Limit;
      }

      fetch('https://' + platformUri + '/api/data/v1/query/' + objectNameRequest + '?IncludeTotalCount=false', {
              method: 'POST',
              headers: {
                  'accept': 'application/json',
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestBody)
          })
          .then(response => {
              if (!response.ok) {
                  alert('Response when failed::' + JSON.stringify(response));
              }
              return response.json();
          })
          .then(data => {

            const downloadingDiv = document.getElementById("downloadingDiv"); 
              if (data.Success) {
                  exportQueryResultAsExcel(data.Data);
              } else if (data.Success === false && data.Errors && data.Errors.length > 0) {
                  downloadingDiv.style.display = 'none';
                  messageDiv.textContent = data.StatusCode + ' : ' + data.Errors[0].Message;

              } else {
                downloadingDiv.style.display = 'none';
                  messageDiv.textContent = "Some error occured!";
              }

              if (!data.Success) {
                downloadingDiv.style.display = 'none';
                  messageDiv.style.backgroundColor = "#dc3545";
                  messageDiv.style.display = "block";
                  messageDiv.style.top = "0px";

                  setTimeout(() => {
                      messageDiv.style.top = "-50px";
                      setTimeout(() => messageDiv.style.display = "none", 500);
                  }, 3000);
              }

          })
          .catch(error => {
            downloadingDiv.style.display = 'none';
              messageDiv.textContent = error;
              messageDiv.style.backgroundColor = "#dc3545";
              messageDiv.style.display = "block";
              messageDiv.style.top = "0px";

              setTimeout(() => {
                  messageDiv.style.top = "-50px";
                  setTimeout(() => messageDiv.style.display = "none", 500);
              }, 3000);
          });
  });



  const importAsExcelButton = document.getElementById("importAsExcelButton");
  importAsExcelButton.addEventListener("click", importTableFromExcel);

  function importTableFromExcel() {

      try {

          const obName = document.getElementById("objectDropDownInput").value || '';
          if (obName == '') {
              alert("Please select the Object before you import !");
              return;
          }

          const fileInput = document.createElement("input");
          fileInput.type = "file";
          fileInput.accept = ".xlsx, .xls";

          fileInput.addEventListener("change", (event) => {

              const file = event.target.files[0];
              if (file) {
                  const reader = new FileReader();

                  reader.readAsBinaryString(file);

                  reader.onload = (e) => {
                      const binaryStr = e.target.result;

                      const workbook = XLSX.read(binaryStr, {
                          type: "binary"
                      });

                      const sheetName = workbook.SheetNames[0];
                      const sheet = workbook.Sheets[sheetName];

                      const data = XLSX.utils.sheet_to_json(sheet, {
                          header: 1
                      });

                      let [headers, ...rows] = data;

                      if (headers[0] === "#") {
                          headers.shift();
                          rows = rows.map(row => row.slice(1));
                      }

                      if (!headers.includes("Id")) {

                          const action = getSelectedValueForAction();
                          if (action && action !== 'insert') {
                              alert("The selected file does not contain an 'Id' column. Please check and try again.");
                              return;
                          }
                      }

                      console.log('headers::' + headers);
                      console.log('rows::' + rows);

                     openHeaderSelectionPopup(headers, rows, obName);

                  };

                  reader.onerror = (error) => {
                      console.error("Failed to read file:", error);

                      const messageDiv = document.getElementById("messageDiv");

                      messageDiv.textContent = "Failed to read file:" + error;
                      messageDiv.style.backgroundColor = "#dc3545";

                      messageDiv.style.display = "block";
                      messageDiv.style.top = "0px";

                      setTimeout(() => {
                          messageDiv.style.top = "-50px";
                          setTimeout(() => messageDiv.style.display = "none", 500);
                      }, 3000);

                  };
              }
          });

          fileInput.click();
      } catch (error) {
          console.error("Error:", error);
          const messageDiv = document.getElementById("messageDiv");

          messageDiv.textContent = "Failed to read file:" + error;
          messageDiv.style.backgroundColor = "#dc3545";

          messageDiv.style.display = "block";
          messageDiv.style.top = "0px";

          setTimeout(() => {
              messageDiv.style.top = "-50px";
              setTimeout(() => messageDiv.style.display = "none", 500);
          }, 3000);
      }
  }

  function openHeaderSelectionPopup(headers, rows, obName) {
    // Create popup container
    const popup = document.createElement("div");
    popup.id = "headerPopup";
    popup.style.position = "fixed";
    popup.style.top = "45%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.backgroundColor = "#fff";
    popup.style.padding = "20px";
    popup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    popup.style.zIndex = "1000";
    popup.style.maxHeight = "80%";
    popup.style.overflowY = "auto";

    // Add search input
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search columns...";
    searchInput.style.marginBottom = "10px";
    searchInput.style.marginTop = "5px";
    searchInput.style.width = "95%";
    searchInput.style.padding = "5px";
    searchInput.addEventListener("input", () => {
        const searchTerm = searchInput.value.toLowerCase();
        const labels = form.querySelectorAll("label");
        labels.forEach(label => {
            const text = label.textContent.toLowerCase();
            label.style.display = text.includes(searchTerm) ? "block" : "none";
        });
    });
    popup.appendChild(searchInput);

    const form = document.createElement("form");
    form.style.height = "300px";
    form.style.overflowY = "auto";
    form.style.flexWrap = "wrap";

    const action = getSelectedValueForAction();
    console.log('action::'+action);

    const chunkSize = 10;
    for (let i = 0; i < headers.length; i += chunkSize) {
        const chunk = headers.slice(i, i + chunkSize);

        const column = document.createElement("div");
        column.style.flex = "1";
        column.style.marginRight = "10px";

        

        chunk.forEach(header => {
            const label = document.createElement("label");
            label.style.display = "block";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = header;

            if (header === "Id") {
                checkbox.checked = true;
                
                if(action !== 'insert'){
                    checkbox.disabled = true;
                }
                
            } else {
                checkbox.checked = true;
            }

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(" " + header));
            column.appendChild(label);
        });

        form.appendChild(column);
    }

    const selectAllButton = document.createElement("button");
    selectAllButton.type = "button";
    selectAllButton.textContent = "Select All";
    selectAllButton.style.margin = "10px 10px 10px 0";
    selectAllButton.style.padding = "5px 10px";
    selectAllButton.style.borderRadius = "5px";
    selectAllButton.className = "btn";
    selectAllButton.addEventListener("click", () => {
        form.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
            if (!checkbox.disabled) checkbox.checked = true; 
        });
    });

    const deselectAllButton = document.createElement("button");
    deselectAllButton.type = "button";
    deselectAllButton.textContent = "Deselect All";
    deselectAllButton.style.margin = "10px 10px 10px 0";
    deselectAllButton.style.padding = "5px 10px";
    deselectAllButton.style.borderRadius = "5px";
    deselectAllButton.className = "btn";
    deselectAllButton.addEventListener("click", () => {
        form.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
            if (!checkbox.disabled) checkbox.checked = false;
        });
    });

    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.textContent = "Confirm";
    confirmButton.style.margin = "10px 0 0 0";
    confirmButton.style.padding = "5px 10px";
    confirmButton.style.borderRadius = "5px";
    confirmButton.className = "btn";
    confirmButton.addEventListener("click", () => {
        const selectedHeaders = Array.from(form.querySelectorAll("input:checked")).map(input => input.value);

        const filteredData = rows.map(row => {
            return Object.fromEntries(
                selectedHeaders.map(header => {
                    const index = headers.indexOf(header);
                    return [header, row[index] !== undefined ? row[index] : null];
                })
            );
        });

        populateResultsTable(filteredData, selectedHeaders, obName, false);

        document.getElementById("saveImportButton").disabled = false;
        //document.getElementById("exportButton").disabled = true;

        document.body.removeChild(popup);
    });

    const cancelPopupButton = document.createElement("button");
    cancelPopupButton.type = "button";
    cancelPopupButton.textContent = "Cancel";
    cancelPopupButton.style.margin = "10px 10px 0";
    cancelPopupButton.style.padding = "5px 10px";
    cancelPopupButton.style.borderRadius = "5px";
    cancelPopupButton.className = "btn";
    cancelPopupButton.addEventListener("click", () => {
        document.body.removeChild(popup);
    });

    const formDiv = document.createElement("div");
    const confirmButtonDiv = document.createElement("div");

    popup.appendChild(selectAllButton);
    popup.appendChild(deselectAllButton);
    popup.appendChild(formDiv);
    formDiv.appendChild(form);
    popup.appendChild(confirmButtonDiv);
    confirmButtonDiv.appendChild(confirmButton);
    confirmButtonDiv.appendChild(cancelPopupButton);
    document.body.appendChild(popup);
}

  

  function getSelectedValueForAction() {
      const selectedRadio = document.querySelector('input[name="actionOption"]:checked');
      if (selectedRadio) {
          console.log("Selected action:", selectedRadio.value);
          return selectedRadio.value;
      } else {
          console.log("No option selected");
          return null;
      }
  }

  document.getElementById("saveImportButton").addEventListener("click", () => {
      const action = getSelectedValueForAction();
      if (action) {

          const table = document.getElementById("resultsTable");
          const headers = [...table.querySelectorAll("thead th")].slice(1).map(th => th.textContent.trim());
          const rows = [...table.querySelectorAll("tbody tr")];

          if (!headers.includes('Id') && action !== 'insert') {
              alert("Column 'Id' is required for " + action + " operation.");
              return;
          }

          const jsonData = rows.map(row => {
              const cells = [...row.querySelectorAll("td")].slice(1);
              const rowData = {};

              headers.forEach((header, index) => {
                  rowData[header] = cells[index].textContent.trim();
              });

              return rowData;
          });

          const jsonString = JSON.stringify(jsonData);
          console.log(jsonString);

          let method = (action === "insert") ? "POST" :
              (action === "update") ? "PUT" :
              (action === "delete") ? "DELETE" : "ERROR";

          sendBatchedUpdates(jsonData, method);
      } else {
          alert('Please select any action : Update, Insert or Delete.');
      }

  });

  let currentIndex = 0;

  function sendBatchedUpdates(data, method) {
      const batchSize = 100;

      const obName = document.getElementById("objectDropDownInput").value || '';

      if (obName == '') {
          alert("Please select the Object before you import !");
          return;
      }

      const saveButton = document.getElementById("saveImportButton");
      saveButton.disabled = true;

      const exportButtonD = document.getElementById("exportButton");
      exportButtonD.disabled = false;

      const payLoadResponseParam = method === 'DELETE' ? 'IncludeDeleteResultStatus' : 'IncludeRecordPayloadInResponse'
      data = method === 'DELETE' ? data.map(item => item.Id) : data;

      function sendBatch(batch) {

          const apiUrl = `https://${platformUri}/api/data/v1/objects/${obName}/bulk?${payLoadResponseParam}=true`;

          return fetch(apiUrl, {
                  method: method,
                  headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'accept': '*/*',
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(batch)
              })
              .then(response => {
                  return response.json();
              })
              .then(responseData => {
                  updateTableWithStatus(responseData, batch, method);
                  return responseData;
              })
              .catch(error => {
                  console.error("Error updating batch:", error);
                  updateTableWithStatus(null, batch, method, error);

                  saveButton.disabled = false;

              });
      }

      async function processBatches(startIndex = 0) {
          const endIndex = startIndex + batchSize;
          const batch = data.slice(startIndex, endIndex);

          if (batch.length > 0) {
              await sendBatch(batch);
              processBatches(endIndex);
          } else {
              console.log("All batches have been processed.");
          }
      }


      processBatches();
  }

  function updateTableWithStatus(responseData, batch, method, error = null) {
      const table = document.getElementById("resultsTable");

      if (method === 'POST') {
          const initialHeaders = ['Id'];

          const headers = table.querySelectorAll("thead th");
          let headerNames = Array.from(headers).map(header => header.textContent);
          headerNames = headerNames.filter(item => item !== '#');
          headerNames = headerNames.filter(item => item !== 'Id');

          const tableColumns = initialHeaders.concat(headerNames);
          console.log('headers:::::' + tableColumns);
          const obName = document.getElementById("objectDropDownInput").value;
          console.log('objectDropDownInput:::::' + obName);
          console.log('responseData:::::' + responseData);
          populateResultsTable(responseData.Data, tableColumns, obName, false);
          console.log('if loop');
          updateTableWithStatusBatch(responseData, responseData.Data, error);
      } else {
          console.log('else loop');
          updateTableWithStatusBatch(responseData, batch, error);
      }



  }

  function updateTableWithStatusBatch(responseData, batch, error) {
      const table = document.getElementById("resultsTable");
      const statusHeader = document.querySelector("thead th.status-column");
      if (!statusHeader) {
          const th = document.createElement("th");
          th.textContent = "Response Status";
          th.classList.add("status-column");
          table.querySelector("thead tr").appendChild(th);

          table.querySelectorAll("tbody tr").forEach(row => {
              const statusCell = document.createElement("td");
              statusCell.classList.add("status-cell");
              row.appendChild(statusCell);
          });
      }

      batch.forEach(record => {

          console.log(record);

          const row = [...table.querySelectorAll("tbody tr")].find(
              tr => (tr.querySelector("td").nextElementSibling.textContent.trim() === record.Id || tr.querySelector("td").nextElementSibling.textContent.trim() === record)
          );

          console.log('row::' + record.Id);

          console.log('row::' + row);

          if (row) {
              const statusCell = row.querySelector(".status-cell");
              try {

                  if (error) {
                      statusCell.style.color = 'Red';
                      statusCell.textContent = "Error - " + error;
                  } else {
                      if (responseData.Errors) {

                          if (currentIndex > (responseData.Errors.length - 1)) {
                              currentIndex = 0;
                          }
                          statusCell.style.color = 'Red';
                          statusCell.textContent = "Error - " + responseData.Errors[currentIndex].Message;

                          currentIndex = currentIndex + 1;
                      } else {
                          let match;
                          if (Array.isArray(responseData.Data)) {
                              match = responseData.Data.find(item => item && item.Id === record.Id);
                          } else if (typeof responseData.Data === "object" && responseData.Data !== null) {
                              match = Object.entries(responseData.Data).find(
                                  ([key, value]) => key === record || value === record
                              );
                          }
                          //const responseRecord = responseData.Data.find(resp => (resp && resp.Id === record.Id || resp && resp===record.Id));
                          if (match) {
                              statusCell.style.color = 'Green';
                              statusCell.textContent = "Success";
                          } else {

                              statusCell.style.color = 'Red';
                              statusCell.textContent = "Error";
                          }

                      }
                  }
              } catch (err) {
                  statusCell.style.color = 'Red';
                  statusCell.textContent = "Error from catch- " + err;
              }
          }
      });
  }

  const searchInput = document.getElementById("boxSearchData");
  const resultsTable = document.getElementById("resultsTable");
  const resultsBody = document.getElementById("resultsBody");

  searchInput.addEventListener("input", () => {
      const searchText = searchInput.value.toLowerCase();

      const rows = resultsBody.getElementsByTagName("tr");

      Array.from(rows).forEach(row => {
          const rowText = Array.from(row.getElementsByTagName("td")).map(cell => cell.textContent.toLowerCase()).join(" ");
          row.style.display = rowText.includes(searchText) ? "" : "none";
      });
  });




let selectedColumns = new Set();

function toggleColumnHighlight(index) {
  if(index!==0){
    const table = document.getElementById('resultsTable');
    const isHighlighted = selectedColumns.has(index);

    Array.from(table.rows).forEach(row => {
      row.cells[index].classList.toggle('highlight', !isHighlighted);
    });

    if(!selectedColumns.has(0)){
        //selectedColumns.add(0);
    }

    if (isHighlighted) {
      selectedColumns.delete(index);
      if(selectedColumns.size === 1){
        //selectedColumns.delete(0);
      }
    } else {
      selectedColumns.add(index);
    }
  }

  selectedColumns.forEach(value => {
    console.log('selectedColumns:'+value);
  });
  
}

function copyHighlightedColumns() {
  const table = document.getElementById('resultsTable');
  const dataToCopy = [];
  
  Array.from(table.rows).forEach(row => {
    if (row.style.display !== 'none') {
        const rowData = Array.from(selectedColumns).map(index => {
            return index === 0 ? row.cells[index].innerHTML : row.cells[index].textContent;
        });
        console.log('rowData:'+rowData);
        dataToCopy.push(rowData.join('\t'));
    }
  });

  navigator.clipboard.writeText(dataToCopy.join('\n')).then(() => {
    alert('Copied to clipboard!');
  });
}

document.getElementById('openImportDataPopupButton').addEventListener('click', () => {
  document.getElementById('pastePopup').style.display = 'block';
  document.getElementById('pasteArea').innerHTML = 'Click here & paste !';
});

document.getElementById('closeButton').addEventListener('click', () => {
  document.getElementById('pastePopup').style.display = 'none';
});

document.getElementById('pasteArea').addEventListener('paste', (event) => {
  event.preventDefault();

  const clipboardData = event.clipboardData.getData('text');
  const rows = clipboardData.trim().split('\n').map(row => row.split('\t'));

  const table = document.createElement('table');
  table.id = 'pasteAreaTable';
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.whiteSpace = 'nowrap';
  table.style.textAlign = 'left';
  table.style.fontFamily = '"Segoe UI", Tahoma, sans-serif;';
  table.style.fontSize = '75%';
  table.style.color = '#707070';

  rows.forEach((rowData, rowIndex) => {
    const row = document.createElement('tr');
    rowData.forEach((cellData, index) => {
     const cell = document.createElement('td');
     if(index === 0){
        cell.innerHTML = cellData;
     }else{
        cell.textContent = cellData;
     }
      cell.style.border = '1px solid #ccc';
      cell.style.padding = '2px';
      row.appendChild(cell);
    });
    if(rowIndex === 0){
        row.style.backgroundColor = '#f0f0f0';
        row.style.fontWeight = 'bold';
    }
    table.appendChild(row);
  });

  const pasteArea = document.getElementById('pasteArea');
  pasteArea.innerHTML = ''; 
  pasteArea.appendChild(table);
});

document.getElementById('saveButton').addEventListener('click', () => {
  selectedColumns = new Set();
  const pastedTable = document.querySelector('#pasteArea table');
  if (pastedTable) {
    const dataToSave = [];
    pastedTable.querySelectorAll('tr').forEach(row => {
      let index = 0;  
      const rowData = Array.from(row.cells).map(cell => {
        const content = index === 0 ? cell.innerHTML : cell.textContent;
        return content;
      });
      dataToSave.push(rowData);
    });

    console.log('dataToSave:'+JSON.stringify(dataToSave));

    addDataToMainTable(dataToSave);
    document.getElementById('pastePopup').style.display = 'none';
    
    const saveButton = document.getElementById("saveImportButton");
    saveButton.disabled = false;
  }
});

function addDataToMainTable(data) {
  const table = document.getElementById('resultsTable');

  console.log(data);

  const tableColumnsT = data[0].map(header => header.trim());
  const dataT = convertArrayToObjects(data);
  const obName = document.getElementById("objectDropDownInput").value;
  console.log(data);
  console.log(tableColumnsT);
  if(dataT && tableColumnsT){
    populateResultsTable(dataT, tableColumnsT, obName, false);
  }
  else{
    alert('Data is not in correct format !');
  }  
}

function convertArrayToObjects(data) {
    const headers = data[0].map(header => header.trim());
    
    return data.slice(1).map(row => {
      const obj = {};
      row.forEach((value, index) => {
        obj[headers[index]] = value.trim() || null;
      });
      return obj;
    });
}
  


};

function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}