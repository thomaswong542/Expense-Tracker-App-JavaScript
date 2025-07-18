"use strict";
const http = require('http');
const {Pool} = require('pg');
const queryMethod = require('./query');
const httpRequest = require('./request');
require('dotenv').config();

let etag = '';

const con = new Pool({
    host: process.env.Host,
    user: process.env.User,
    port: process.env.Port,
    password: process.env.Password,
    database: process.env.Database
});

const server = http.createServer(async (req, res)=>{
    const validateUrl = new URL(req.url, `http://${req.headers.host}`);
    if (req.method == 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': "http://127.0.0.1:3000",
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
            'Access-Control-Allow-Headers': 'Content-Type, If-None-Match',
            'Access-Control-Expose-Headers': 'ETag',
        });
        res.end();
    }

    else if (req.url == "/expensetables" && req.method == "GET"){
        const ifNoneMatch = req.headers['if-none-match'] || '';
        const acceptEncoding = req.headers['accept-encoding'] || '';
        
        if (etag != '' && ifNoneMatch != '' && ifNoneMatch == etag){
            httpRequest.sendCachedStatus(res, 304, etag, 'not modified');
            return;
        }

        let values = [false];
        let querybase = "SELECT id, name, deleted FROM expensetables WHERE deleted = $1 ORDER BY id DESC";

        const result = await queryMethod.getQueryResult(con, querybase, values);
        // check if the SQL statement has error
        if (result == undefined){
            httpRequest.sendStatus(res, 500, 'Error on SQL Statement');
            return;
        }
        let responseData = JSON.stringify(result);
        etag = httpRequest.calEtag(JSON.stringify(result));

        if (acceptEncoding.includes('gzip')) {
            httpRequest.sendZipCachedData(res, responseData, 200, etag);
        }
        else {
            httpRequest.sendUnzipCachedData(res, responseData, 200, etag);
        }
    }

    else if (req.url.startsWith('/expensetables') &&
        /expensetables\?/.test(req.url) && req.method == 'GET'){
        
        const ifNoneMatch = req.headers['if-none-match'] || '';
        const acceptEncoding = req.headers['accept-encoding'] || '';
        const paramList = validateUrl.searchParams;
        const existedKeys = ['id', 'name'];
        const valuesType = {
            id: /[0-9]+/
        }

        // 0 is keys, 1 is values
        const keysAndValues = queryMethod.getKeysAndValuesFromParam(paramList);
        
        if (queryMethod.isKeysExistedInModel(keysAndValues[0], existedKeys) == false){
            httpRequest.sendStatus(res, 400, 'One of the Key is not included in database');
            return;
        }

        if (queryMethod.isParamValueTypeCorrect(paramList, valuesType) == false){
            httpRequest.sendStatus(res, 400, 'One of the value type is incorrect');
            return;
        }

        // queryPart construct key = value
        const queryPart = queryMethod.queryConstructHelper(keysAndValues[0]);
        const querybase = `SELECT id, name, deleted FROM expensetables WHERE ` +
            queryPart + 'ORDER BY id DESC';

        // for column deleted, check queryConstructHelper in query.js
        keysAndValues[1].push(false);

        const result = await queryMethod.getQueryResult(con, querybase, keysAndValues[1]);
        if (result == undefined){
            httpRequest.sendStatus(res, 500, 'Error on SQL Statement');
            return;
        }

        const responseData = JSON.stringify(result);
        const etag = httpRequest.calEtag(responseData);
        if (etag != '' && ifNoneMatch != '' && ifNoneMatch == etag){
            httpRequest.sendCachedStatus(res, 304, etag, 'Not Modified');
            return;
        }

        if (acceptEncoding.includes('gzip')) {
            httpRequest.sendZipCachedData(res, responseData, 200, etag);
        }
        else {
            httpRequest.sendUnzipCachedData(res, responseData, 200, etag);
        }

    }

    else if (req.url == "/expensetable" && req.method == "POST"){
        const acceptEncoding = req.headers['accept-encoding'] || '';
        let body = '';
        req.on('data', (data) =>{
            body += data.toString();
        });
        req.on('end', async () =>{
            const bodyObj = JSON.parse(body);
            const existedKeys = ['name'];

            // 0 is keys, 1 is values
            const keysAndValues = queryMethod.getKeysAndValuesFromObj(bodyObj);

            if (queryMethod.isKeysExistedInModel(keysAndValues[0], existedKeys) == false 
                || keysAndValues[0].includes('name') == false) {
                httpRequest.sendStatus(res, 400, 'One of the key is not included in database OR name column must be included');
                return;
            }

            if (!bodyObj.name) {
                httpRequest.sendStatus(res, 400, 'Name column value cannot be null');
                return;
            }

            // creating $1, $2 ...
            const valuesPlacehoder = keysAndValues[1].map((i, idx) => `$${idx+1}`);
            let querybase = `INSERT INTO expensetables (${keysAndValues[0]}) VALUES (${valuesPlacehoder})`
            const result = await queryMethod.getQueryResult(con, querybase, keysAndValues[1]);
            if (result == undefined){
                httpRequest.sendStatus(res, 500, 'Server Error');
                return;
            }

            const responseData = JSON.stringify(bodyObj);
            etag = httpRequest.calEtag(responseData);
            if (acceptEncoding.includes('gzip')){
                httpRequest.sendZipData(res, responseData, 201);
            }
            else {
                httpRequest.sendUnzipData(res, responseData, 201);
            }
        })
    }

    else if (req.url.startsWith("/expensetable") && 
        /expensetable\?id=/.test(req.url) && req.method == "PUT"){
        
        const existedKeysGet = ['id'];
        const paramList = validateUrl.searchParams;
        const keys = queryMethod.getKeysAndValuesFromParam(paramList)[0];
        if (queryMethod.isKeysExistedInModel(keys, existedKeysGet) == false) {
            httpRequest.sendStatus(res, 400, 'Only id allowed');
            return;
        }
        
        const id = validateUrl.searchParams.get('id');
        if (!/[0-9]+/.test(id)) {
            httpRequest.sendStatus(res, 400, 'Id must be a number');
            return;
        }
        const valuesGet = [id, false];
        let querybaseGet = "SELECT id, name, deleted FROM expensetables WHERE id = $1 AND deleted = $2";
        const resultGet = await queryMethod.getQueryResult(con, querybaseGet, valuesGet);
        if (resultGet == undefined){
            httpRequest.sendStatus(res, 500, 'Server Error');
            return;
        }
        if (resultGet.length == 0) {
            httpRequest.sendStatus(res, 404, "Not Found");
            return;
        }
        let body = '';
        req.on('data', (data) => {
            body += data.toString();
        });
        
        req.on('end', async () => {
            const bodyObj = JSON.parse(body);
            const responseData = JSON.stringify(bodyObj);
            const existedKeysUpdate = ['name'];

            // 0 is keys, 1 is values
            const keysAndValues = queryMethod.getKeysAndValuesFromObj(bodyObj);
            
            if (queryMethod.isKeysExistedInModel(keysAndValues[0], existedKeysUpdate) == false){
                httpRequest.sendStatus(res, 400, 'One of the key is not included in database OR name column must be included');
                return;
            }

            if (!bodyObj.name) {
                httpRequest.sendStatus(res, 400, 'Name column value cannot be null');
                return;                
            }
            
            // construct (key = value) statement and get the latest number of parameters
            let sqlKeyValuePairs = '';
            let paramNum = 1;
            for (const key of keysAndValues[0]) {
                sqlKeyValuePairs += `${key} = $${paramNum}, `;
                paramNum += 1;
            }
            sqlKeyValuePairs = sqlKeyValuePairs.slice(0, sqlKeyValuePairs.length - 2);
            let querybaseUpdate = `UPDATE expensetables SET ${sqlKeyValuePairs} WHERE id = $${paramNum}`;

            keysAndValues[1].push(id);
            const resultUpdate = await queryMethod.getQueryResult(con, querybaseUpdate, keysAndValues[1]);
            etag = httpRequest.calEtag(responseData);
            if (resultUpdate == undefined) {
                httpRequest.sendStatus(res, 500);
            }
            else {
                httpRequest.sendStatus(res, 200);
            }
        });        
    }

    else if (req.url.startsWith('/expensetable') &&
        /expensetable\?id=/.test(req.url) && req.method == 'DELETE'){
        
        const existedKeysGet = ['id'];
        const paramList = validateUrl.searchParams;
        const keys = queryMethod.getKeysAndValuesFromParam(paramList)[0];
        if (queryMethod.isKeysExistedInModel(keys, existedKeysGet) == false) {
            httpRequest.sendStatus(res, 400, 'Only id allowed');
            return;
        }

        const id = validateUrl.searchParams.get('id');
        if (!/[0-9]+/.test(id)){
            httpRequest.sendStatus(res, 400, 'Id must be number');
            return;
        }
        
        const valuesGet = [id, false];
        const querybaseGet = 'SELECT id, name FROM expensetables '
            + 'WHERE id = $1 AND deleted = $2';

        const resultGet = await queryMethod.getQueryResult(con, querybaseGet, valuesGet);
        if (resultGet == undefined){
            httpRequest.sendStatus(res, 500, 'Server Error');
            return;
        }
        if (resultGet.length == 0){
            httpRequest.sendStatus(res, 404, 'Not Found');
            return;
        }
        let valuesUpdateList = [[true, id], [true, id]];
        let querybaseUpdateList = ['Update expensetables SET deleted = $1 WHERE id = $2', 
            'Update expenseitems SET deleted = $1 WHERE table_id = $2']
        
        etag = httpRequest.calEtag(JSON.stringify(resultGet));
        const resultUpdate = await queryMethod.getTransactionQueryResult(con, querybaseUpdateList, valuesUpdateList, 2);
        if (resultUpdate == false){
            httpRequest.sendStatus(res, 500, 'Server Error');
        }
        else{
            httpRequest.sendStatus(res, 200, 'Deleted');
        }
    }

    else if (req.url.startsWith("/expenseitems") &&
        /expenseitems\?/.test(req.url) && req.method == "GET"){

        const ifNoneMatch = req.headers['if-none-match'] || '';
        const acceptEncoding = req.headers['accept-encoding'] || '';
        const paramList = validateUrl.searchParams;
        const existedKeys = ['id', 'date', 'category', 'shop', 'item', 'quantity', 'price', 'table_id'];
        const valuesType = {
            id: /[0-9]+/,
            date: /^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/,
            quantity: /[0-9]+/,
            price: /^[0-9]{1,10}(\.[0-9]{1,2})?$/,
            table_id: /[0-9]+/
        }

        // 0 is keys, 1 is values
        const keysAndValues = queryMethod.getKeysAndValuesFromParam(paramList);
        if (queryMethod.isKeysExistedInModel(keysAndValues[0], existedKeys) == false) {
            httpRequest.sendStatus(res, 400, 'One of the key is not included in database');
            return;
        }
        if (queryMethod.isParamValueTypeCorrect(paramList, valuesType) == false){
            httpRequest.sendStatus(res, 400, 'One of the value type is incorrect');
            return;
        }
        
        // queryPart construct key = value
        const queryPart = queryMethod.queryConstructHelper(keysAndValues[0]);
        let querybase = 'SELECT id, date, category, shop, item, quantity, price, deleted, table_id FROM expenseitems WHERE ' 
            + queryPart + 'ORDER BY date DESC';

        // for column deleted, check queryConstructHelper in query.js
        keysAndValues[1].push(false);
        const result = await queryMethod.getQueryResult(con, querybase, keysAndValues[1]);
        if (result == undefined){
            httpRequest.sendStatus(res, 500, 'Server Error');
            return;
        }

        const responseData = JSON.stringify(result);
        etag = httpRequest.calEtag(responseData);
        if (etag != '' && ifNoneMatch != '' && ifNoneMatch == etag){
            httpRequest.sendCachedStatus(res, 304, 'Not Modified');
            return;
        }

        if (acceptEncoding.includes('gzip')) {
            httpRequest.sendZipCachedData(res, responseData, 200, etag);
        }
        else {
            httpRequest.sendUnzipCachedData(res, responseData, 200, etag);
        }
    }

    else if (req.url == '/expenseitem' && req.method == 'POST') {
        const acceptEncoding = req.headers['accept-encoding'];
        let body = '';
        req.on('data', (data) => {
            body += data.toString();
        })
        req.on('end', async () => {
            const bodyObj = JSON.parse(body);
            const existedKeys = ['date', 'category', 'shop', 'item', 'quantity', 'price', 'table_id'];
            const valuesType = {
                date: /^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/,
                quantity: /[0-9]+/,
                price: /^[0-9]{1,10}(\.[0-9]{1,2})?$/,
                table_id: /[0-9]+/
            }

            // 0 is keys, 1 is values
            const keysAndValues = queryMethod.getKeysAndValuesFromObj(bodyObj);

            if (queryMethod.isKeysExistedInModel(keysAndValues[0], existedKeys) == false
                || keysAndValues[0].includes('date') == false ||  keysAndValues[0].includes('table_id') == false) {
                httpRequest.sendStatus(res, 400, 'One of the key is not included in database OR date and table_id must be included');
                return;
            }
            if (queryMethod.isObjectValueTypeCorrect(bodyObj, valuesType) == false) {
                httpRequest.sendStatus(res, 400, 'One of the value is incorrect');
                return;
            }

            const valuesPlacehoder = keysAndValues[1].map((i, idx) => `$${idx + 1}`);
            const querybase = `INSERT INTO expenseitems (${keysAndValues[0]}) VALUES (${valuesPlacehoder})`;

            const result = await queryMethod.getQueryResult(con, querybase, keysAndValues[1]);
            if (result == undefined){
                httpRequest.sendStatus(res, 500, 'Server Error');
                return;
            }

            const responseData = JSON.stringify(bodyObj);
            etag = httpRequest.calEtag(responseData);
            if (acceptEncoding.includes('gzip')){
                httpRequest.sendZipData(res, responseData, 201);
            }
            else {
                httpRequest.sendUnzipData(res, responseData, 201);
            }
        })
    }

    else if (req.url.startsWith('/expenseitem') &&
        /expenseitem\?id=/.test(req.url) && req.method == 'PUT') {
        
        const existedKeysGet = ['id'];
        const paramList = validateUrl.searchParams;
        const keys = queryMethod.getKeysAndValuesFromParam(paramList)[0];
        if (queryMethod.isKeysExistedInModel(keys, existedKeysGet) == false) {
            httpRequest.sendStatus(res, 400, 'Only id is allowed');
            return;
        }
        
        const id = validateUrl.searchParams.get('id');
        if (!/[0-9]+/.test(id)){
            httpRequest.sendStatus(res, 400, 'Id must be a number');
            return;
        }
        const valuesGet = [id, false];
        const querybaseUpdate = `SELECT id, date, category, shop, item, quantity, price, deleted, table_id FROM expenseitems
            WHERE id = $1 AND deleted = $2`;
        
        const resultGet = await queryMethod.getQueryResult(con, querybaseUpdate, valuesGet);
        if (resultGet == undefined){
            httpRequest.sendStatus(res, 500, 'Server Error');
            return;
        }
        if (resultGet.length == 0){
            httpRequest.sendStatus(res, 404, 'Not Found');
            return;
        }

        let body = '';
        req.on('data', (data) => {
            body += data.toString();
        })
        req.on('end', async () => {
            const bodyObj = JSON.parse(body);
            const responseData = JSON.stringify(bodyObj);
            const existedKeysUpdate = ['date', 'category', 'shop', 'item', 'quantity', 'price'];
            const valuesType = {
                date: /^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/,
                quantity: /[0-9]+/,
                price: /^[0-9]{1,10}(\.[0-9]{1,2})?$/
            }

            // 0 is key, 1 is value
            const keysAndValues = queryMethod.getKeysAndValuesFromObj(bodyObj);
            if (queryMethod.isKeysExistedInModel(keysAndValues[0], existedKeysUpdate) == false){
                httpRequest.sendStatus(res, 400, 'One of the key is not included in database');
                return;
            }
            if (queryMethod.isObjectValueTypeCorrect(bodyObj, valuesType) == false){
                httpRequest.sendStatus(res, 400, 'One of the value type is incorrect');
                return;
            }

            let sqlKeyValuePairs = '';
            let paramNum = 1;
            for (const keys of keysAndValues[0]){
                sqlKeyValuePairs += `${keys} = $${paramNum}, `;
                paramNum += 1;
            }
            const queryPart = sqlKeyValuePairs.slice(0, sqlKeyValuePairs.length - 2);
            const querybaseUpdate = `UPDATE expenseitems SET ${queryPart} WHERE id = $${paramNum}`;
            
            keysAndValues[1].push(id);
            const result = await queryMethod.getQueryResult(con, querybaseUpdate, keysAndValues[1]);
            etag = httpRequest.calEtag(responseData);
            if (result == undefined){
                httpRequest.sendStatus(res, 500, 'Server Error');
            }
            else{
                httpRequest.sendStatus(res, 200, 'Updated');
            }
        })
    }

    else if (req.url.startsWith('/expenseitem') &&
        /expenseitem\?id=/.test(req.url) && req.method == 'DELETE'){
        
        const existedKeysGet = ['id'];
        const paramList = validateUrl.searchParams;
        const keys = queryMethod.getKeysAndValuesFromParam(paramList)[0];
        if (queryMethod.isKeysExistedInModel(keys, existedKeysGet) == false) {
            httpRequest.sendStatus(res, 400, 'Only id is allowed');
            return;
        }

        const id = validateUrl.searchParams.get('id');
        if (!/[0-9]+/.test(id)){
            httpRequest.sendStatus(res, 400, 'Id must be number');
            return;
        }
        
        const valuesGet = [id, false];
        const querybaseGet = 'SELECT id, date, category, shop, item, quantity, price, table_id FROM expenseitems '
            + 'WHERE id = $1 AND deleted = $2';

        const resultGet = await queryMethod.getQueryResult(con, querybaseGet, valuesGet);
        if (resultGet == undefined){
            httpRequest.sendStatus(res, 500, 'Server Error');
            return;
        }
        if (resultGet.length == 0){
            httpRequest.sendStatus(res, 404, 'Not Found');
            return;
        }
        const valuesUpdate = [true, id];
        const querybaseUpdate = 'Update expenseitems SET deleted = $1 WHERE id = $2';
        const resultUpdate = await queryMethod.getQueryResult(con, querybaseUpdate, valuesUpdate);
        etag = httpRequest.calEtag(JSON.stringify(resultGet));
        if (resultUpdate == undefined){
            httpRequest.sendStatus(res, 500, 'Server Error');
        }
        else{
            httpRequest.sendStatus(res, 200, 'Deleted');
        }  
    }

    else {
        res.writeHead(404);
        res.end("Request Not Found");
    }

});

server.listen(8000, ()=>{
    console.log("listening in port 8000.....");
});

process.on('SIGINT', ()=>{
    try{
        con.end(()=>{
            console.log('connection ended');
        })
    }
    catch (err){
        console.log(err.message);
    }
    finally{
        process.exit();
    }
});
