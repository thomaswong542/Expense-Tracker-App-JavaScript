"use strict";

exports.getKeysAndValuesFromParam = (data) => {
    const keys = [];
    const values = [];
    for (const [key, value] of data.entries()){
        keys.push(key);
        values.push(value);
    }
    const arr = [keys, values];
    return arr;
}

exports.getKeysAndValuesFromObj = (data) => {
    const keys = [];
    const values = [];
    for (const [key, value] of Object.entries(data)){
        keys.push(key);
        values.push(value);
    }
    const arr = [keys, values];
    return arr;
}

exports.isKeysExistedInModel = (keys, existedKeys) => {
    return keys.every((x) => existedKeys.includes(x));
}

exports.isParamValueTypeCorrect = (paramList, checkerObj) => {
    for (const [key, value] of paramList.entries()){
        if (!checkerObj[key]){
            continue;
        }
        if (checkerObj[key].test(value) == false){
            return false;
        }
    }
    return true;
}

exports.isObjectValueTypeCorrect = (Obj, checkerObj) => {
    for (const [key, value] of Object.entries(Obj)){
        if (!checkerObj[key]){
            continue;
        }
        if (checkerObj[key].test(value) == false){
            return false;
        }
    }
    return true;
}

exports.queryConstructHelper = (keys) => {
    let filterParam = '';
    let paramNum = 1;
    for (const key of keys) {
        filterParam += `${key} = $${paramNum} AND `;
        paramNum += 1;
    }
    filterParam += `deleted = $${paramNum} `;
    return filterParam;
}


exports.getQueryResult = async (con, querybase, values) => {
    let client;
    try{
        client = await con.connect().then(console.log('success connection to database'));
        const queryResult = await con.query(querybase, values);
        return queryResult.rows;
    }
    catch (err){
        console.log(err.message);
    }
    finally{
        if (client){
            client.release();
        }
    }
}

exports.getTransactionQueryResult = async (con, querybaseList, valuesList, queryNum) => {
    let client;
    try{
        client = await con.connect().then(console.log('success connection to database'));
        let isQuerySuccess = true;
        let queryResult = await con.query('BEGIN');
        for (let i = 0; i < queryNum; i++){
            queryResult = await con.query(querybaseList[i], valuesList[i]);
            if (queryResult == undefined){
                isQuerySuccess = false;
            }
        }
        await con.query('COMMIT');
        return isQuerySuccess;
    }
    catch (err){
        console.log(err.message);
    }
    finally{
        if (client){
            client.release();
        }
    }
}