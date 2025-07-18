import {getData, postData, updateData, deleteData} from "./fetch.js";


function dataValidation(obj){
    const valuesType = {
        date: /^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/,
        quantity: /[0-9]+/,
        price: /^[0-9]{1,10}(\.[0-9]{1,2})?$/,
    }

    if(!valuesType['date'].test(obj['date'])){
        alert('Date format is incorrect');
    };
    if(!valuesType['quantity'].test(obj['quantity'])){
        alert('quantity must be a number');
    }
    if(!valuesType['price'].test(obj['price'])){
        alert('price must be maximun of 10 digits with at most two decimal');
    }
}

function addUpdateEvent(updateForm, obj, updateDialog){
    updateForm.addEventListener('submit', async (event)=>{
        event.preventDefault();
        const formData = new FormData(updateForm);
        const bodyObj = {}
        for (const [key, values] of formData.entries()){
            bodyObj[`${key}`] = values
        }

        dataValidation(bodyObj);

        const fetchedBodyObj = JSON.stringify(bodyObj);
        const url = `http://localhost:8000/expenseitem?id=${obj.id}`;

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

function addDeleteEvent(deleteForm, obj, deleteDialog){
    deleteForm.addEventListener('submit', async (event)=>{
        event.preventDefault();
        const url = `http://localhost:8000/expenseitem?id=${obj.id}`;

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

async function getTableRowsDOM(data, dataArray, tbody, method){
    // <tbody id="table-content">
    //     <tr>
    //         <td>2025-01-02</td>
    //         <td>Meal</td>
    //         <td>McDonalds</td>
    //         <td>McCrispy</td>
    //         <td>1</td>
    //         <td>5.25</td>
    //         <td><button class="update-btn"><i class="bi bi-arrow-clockwise"></i></button></td>
    //         <td><button class="delete-btn"><i class="bi bi-trash3"></i></button></td>
    //     </tr>
    // </tbody>

    while (tbody.firstChild){
        tbody.removeChild(tbody.lastChild);
    }
    for (const obj of data){
        let elementNum = 0;

        const tableRow = document.createElement('tr');
        const dateColumn = document.createElement('td');
        const categoryColumn = document.createElement('td');
        const shopColumn = document.createElement('td');
        const itemColumn = document.createElement('td');
        const quantityColumn = document.createElement('td');
        const priceColumn = document.createElement('td');
        const updateColumn = document.createElement('td');
        const deleteColumn = document.createElement('td');

        const dateValue = document.createTextNode((obj.date).slice(0,10));
        const categoryValue = document.createTextNode(obj.category);
        const shopValue = document.createTextNode(obj.shop);
        const itemValue = document.createTextNode(obj.item);
        const quantityValue = document.createTextNode(obj.quantity);
        const priceValue = document.createTextNode(obj.price);

        dateColumn.appendChild(dateValue);
        categoryColumn.appendChild(categoryValue);
        shopColumn.appendChild(shopValue);
        itemColumn.appendChild(itemValue);
        quantityColumn.appendChild(quantityValue);
        priceColumn.appendChild(priceValue);

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

        const deleteDialog = document.getElementById('delete-dialog');
        const closeButtonDelete = document.getElementById('close-btn-delete');
        const deleteForm = document.getElementsByClassName('delete-form')[elementNum];
        
        const updateDialog = document.getElementById('update-dialog');
        const closeButtonUpdate = document.getElementById('close-btn-update');
        const updateForm = document.getElementsByClassName('update-form')[elementNum];

        deleteButton.addEventListener('click', ()=>{
            deleteDialog.showModal();
            const deleteMessage = deleteForm.firstElementChild;
            deleteMessage.innerHTML = `Do you want to delete ${(obj.date).slice(0,10)} ${obj.category} ${obj.shop} \
            ${obj.item} quantity:${obj.quantity} price:${obj.price}`;
            addDeleteEvent(deleteForm, obj, deleteDialog);
        })
        closeButtonDelete.addEventListener('click', ()=>{
            deleteDialog.close();
        })

        updateButton.addEventListener('click', ()=>{
            updateDialog.showModal();
            updateForm['date'].value = (obj.date).slice(0,10);
            updateForm['category'].value = obj.category;
            updateForm['shop'].value = obj.shop;
            updateForm['item'].value = obj.item;
            updateForm['quantity'].value = obj.quantity;
            updateForm['price'].value = obj.price;
            addUpdateEvent(updateForm, obj, updateDialog);
        })
        closeButtonUpdate.addEventListener('click', ()=>{
            updateDialog.close();
        })
        

        updateColumn.appendChild(updateButton);
        deleteColumn.appendChild(deleteButton);

        tableRow.appendChild(dateColumn);
        tableRow.appendChild(categoryColumn);
        tableRow.appendChild(shopColumn);
        tableRow.appendChild(itemColumn);
        tableRow.appendChild(quantityColumn);
        tableRow.appendChild(priceColumn);
        tableRow.appendChild(updateColumn);
        tableRow.appendChild(deleteColumn);

        tbody.append(tableRow);
        
        if (method == 'pop'){
            dataArray.pop(obj);
        }
        else if (method == 'push'){
            dataArray.push(obj);
        }

        elementNum += 1;
    }
}

window.addEventListener('load', async () => {
    const currentUrl = new URL(window.location.href);
    const params = currentUrl.search;
    const id = new URLSearchParams(params).get('id');
    const url = `http://localhost:8000/expenseitems?table_id=${id}`;
    const result = await getData(url);

    const tbody = document.getElementById('table-content');
    const responseDataArray = [];

    if (result == '304'){
        const data = JSON.parse(localStorage.getItem('itemData'));
        getTableRowsDOM(data, responseDataArray, tbody, 'pop');
        return;
    }
    else if (result == '500'){
        alert('Server Error');
        return;
    }
    getTableRowsDOM(result, responseDataArray, tbody, 'push');

    const responseDataJSON = JSON.stringify(responseDataArray);
    localStorage.setItem('itemData', responseDataJSON);
});

const filterButton = document.getElementById('filter-btn');
const filterDialog = document.getElementById('filter-dialog');
const closeButtonFilter = document.getElementById('close-btn-filter');
const filterForm = document.getElementById('filter-form');

filterButton.addEventListener('click', () => {
    filterDialog.showModal();
});

closeButtonFilter.addEventListener('click', () => {
    filterDialog.close();
});

filterForm.addEventListener('submit', async (event)=>{
    event.preventDefault();
    const formData = new FormData(filterForm);
    const param = new URLSearchParams(formData).toString();
    const url = `http://localhost:8000/expenseitems?${param}`;
    const result = await getData(url);

    const tbody = document.getElementById('table-content');
    const responseDataArray = [];

    if (result == '304'){
        const data = JSON.parse(localStorage.getItem('filterItemData'));
        getTableRowsDOM(data, responseDataArray, tbody, 'pop');
        return;
    }
    else if (result == '500'){
        alert('Server Error');
        return;
    }
    getTableRowsDOM(result, responseDataArray, tbody, 'push');

    const responseDataJSON = JSON.stringify(responseDataArray);
    localStorage.setItem('filterItemData', responseDataJSON);

    filterDialog.close();
    filterForm.reset();
});

const addButton = document.getElementById('addItem-btn');
const addDialog = document.getElementById('add-dialog');
const closeButtonAdd = document.getElementById('close-btn-add');
const addForm = document.getElementById('add-form');

addButton.addEventListener('click', ()=> {
    addDialog.showModal();
    addForm['quantity'].value = 0;
    addForm['price'].value = 0;
});

closeButtonAdd.addEventListener('click', ()=> {
    addDialog.close();
});

addForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const currentUrl = new URL(window.location.href);
    const params = currentUrl.search;
    const id = new URLSearchParams(params).get('id');

    const formData = new FormData(addForm);
    const bodyObj = {}
    for (const [key, values] of formData.entries()){
        bodyObj[`${key}`] = values
    }

    dataValidation(bodyObj);

    bodyObj['table_id'] = id;
    const fetchedBodyObj = JSON.stringify(bodyObj);

    const url = "http://localhost:8000/expenseitem";
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
});