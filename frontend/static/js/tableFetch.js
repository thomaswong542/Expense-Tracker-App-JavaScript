import {getData, postData, updateData, deleteData} from "./fetch.js";

// Add Event Listener to corresponding element
function addUpdateEvent(updateForm, obj, updateDialog){
    updateForm.addEventListener('submit', async (event)=>{
        event.preventDefault();
        const formData = new FormData(updateForm);
        const bodyObj = {}
        for (const [key, values] of formData.entries()){
            bodyObj[`${key}`] = values
        }
        const fetchedBodyObj = JSON.stringify(bodyObj);
        const url = `http://localhost:8000/expensetable?id=${obj.id}`;

        const response = await updateData(url, fetchedBodyObj);
        if (response == '404'){
            alert('Update item not exist');
            return;
        }
        if (response == '400'){
            alert('Something wrong with form input');
            return;
        }
        if (response == '500'){
            alert('Server Error');
            return;
        }        
        updateDialog.close();
        updateForm.reset();
        window.location.reload();
    })
}

function addDeletEvent(deleteForm, obj, deleteDialog){
    deleteForm.addEventListener('submit', async (event)=> {
        event.preventDefault();
        const url = `http://localhost:8000/expensetable?id=${obj.id}`;

        const response = await deleteData(url);
        if (response == '400'){
            alert('Something went wrong with the fetch url');
            return;
        }
        if (response == '404'){
            alert('Delete item not exist');
            return;
        }
        if (response == '500'){
            alert('Server Error');
            return;
        }

        deleteDialog.close();
        window.location.reload();
    })
}

// table list page DOM (update and delete event listener included)
function getTableListDOM(data, dataArray, tableArray, method){
    // <div class="table-list" id="table-list">
    //     <div class="table-list-item">
    //         <a href="http://localhost:3000/frontend/html/expenseitems.html?id=1">table 1</a>
    //         <div class="tableList-btn-grp">
    //             <button class="update-btn"><i class="bi bi-arrow-clockwise"></i></button>
    //             <button class="delete-btn"><i class="bi bi-trash3"></i></button>
    //         </div>
    //     </div>
    // </div>
    while (tableArray.firstChild) {
        tableArray.removeChild(tableArray.lastChild);
    }        
    for (const obj of data) {
        let elementNum = 0;
        
        const tableLink = document.createElement('a');
        tableLink.setAttribute('href', 
            `http://127.0.0.1:3000/frontend/html/expenseitems.html?id=${obj.id}`);
        const tableName = document.createTextNode(obj.name);
        tableLink.appendChild(tableName);

        const tableList_btnGrp = document.createElement('div');
        tableList_btnGrp.classList.add('tableList-btn-grp');
        
        const updateButton = document.createElement('button');
        updateButton.classList.add('update-btn');
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-btn');
        const updateIcon = document.createElement('i');
        const deleteIcon = document.createElement('i');
        updateIcon.classList.add('bi', 'bi-arrow-clockwise');
        deleteIcon.classList.add('bi', 'bi-trash3');

        updateButton.appendChild(updateIcon);
        deleteButton.appendChild(deleteIcon);

        // // make button open dialog
        const deleteDialog = document.getElementById('delete-dialog');
        const closeButtonDelete = document.getElementById('close-btn-delete');
        const deleteForm = (document.getElementsByClassName('delete-form'))[elementNum];

        const updateDialog = document.getElementById('update-dialog');
        const closeButtonUpdate = document.getElementById('close-btn-update');
        const updateForm = (document.getElementsByClassName('update-form'))[elementNum];

        deleteButton.addEventListener("click", () => {
            deleteDialog.showModal();
            const deleteMessage = deleteForm.firstElementChild;
            deleteMessage.innerHTML = `Do you want to delete ${obj.name}`;
            addDeletEvent(deleteForm, obj, deleteDialog);
        });
        closeButtonDelete.addEventListener("click", () => {
            deleteDialog.close();
        });

        updateButton.addEventListener("click", () => {
            updateDialog.showModal();
            updateForm['name'].value = obj.name;
            addUpdateEvent(updateForm, obj, updateDialog);
        });
        closeButtonUpdate.addEventListener("click", () => {
            updateDialog.close();
        });
        
        tableList_btnGrp.appendChild(updateButton);
        tableList_btnGrp.appendChild(deleteButton);

        const item = document.createElement('div');
        item.classList.add('table-list-item');
        item.appendChild(tableLink);
        item.appendChild(tableList_btnGrp);

        tableArray.appendChild(item);
        if (method == 'pop'){
            dataArray.pop(obj);
        }
        else if (method == 'push'){
            dataArray.push(obj);
        }
        elementNum += 1;
    }
}


window.addEventListener("load", async () => {
    const result = await getData("http://localhost:8000/expensetables");
    const tableListContainer = document.getElementById('table-list');
    const responseDataArray = [];
    if (result == '304'){
        const data = JSON.parse(localStorage.getItem('tableData'));
        getTableListDOM(data, responseDataArray, tableListContainer, 'pop');
        return;
    }
    else if (result == '500'){
        alert('Server Error');
        return;
    }
    getTableListDOM(result, responseDataArray, tableListContainer, 'push');

    const responseDataJSON = JSON.stringify(responseDataArray);
    localStorage.setItem('tableData', responseDataJSON);
});

const filterButton = document.getElementById('filter-btn');
const filterDialog = document.getElementById('filter-dialog');
const closeButtonFilter = document.getElementById('close-btn-filter');
const filterForm = document.getElementById('filter-form');

filterButton.addEventListener('click', ()=> {
    filterDialog.showModal();
});

closeButtonFilter.addEventListener('click', ()=> {
    filterDialog.close();
});

filterForm.addEventListener('submit', async (event)=> {
    event.preventDefault();
    const formData = new FormData(filterForm);

    const param = new URLSearchParams(formData).toString();
    const url = `http://localhost:8000/expensetables?${param}`;
    const result = await getData(url);
    const tableListContainer = document.getElementById('table-list');
    const responseDataArray = [];
    if (result == '304'){
        const data = JSON.parse(localStorage.getItem('filterTableData'));
        getTableListDOM(data, responseDataArray, tableListContainer, 'pop');
        return;
    }
    else if (result == '500'){
        alert('Server Error');
        return;
    }
    getTableListDOM(result, responseDataArray, tableListContainer, 'push');

    const responseDataJSON = JSON.stringify(responseDataArray);
    localStorage.setItem('filterTableData', responseDataJSON);

    filterDialog.close();
    filterForm.reset();
})

const addButton = document.getElementById('addTable-btn');
const addDialog = document.getElementById('add-dialog');
const closeButtonAdd = document.getElementById('close-btn-add');
const addForm = document.getElementById('add-form');

addButton.addEventListener('click', ()=> {
    addDialog.showModal();
});

closeButtonAdd.addEventListener('click', ()=> {
    addDialog.close();
});

addForm.addEventListener('submit', async (event)=> {
    event.preventDefault();
    const formData = new FormData(addForm);
    const bodyObj = {}
    for (const [key, values] of formData.entries()){
        bodyObj[`${key}`] = values
    }
    const fetchedBodyObj = JSON.stringify(bodyObj);
    const url = "http://localhost:8000/expensetable";
    const result = await postData(url, fetchedBodyObj);
    if (result == '400'){
        alert('Something wrong with form input');
        return;
    }
    if (result == '500'){
        alert('Server error');
        return;
    }
    addDialog.close();
    addForm.reset();
    window.location.reload();
})



