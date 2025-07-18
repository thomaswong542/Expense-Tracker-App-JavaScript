async function getData(url){
    let data;
    const ifNoneMatch = localStorage.getItem('ifNoneMatch');
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'If-None-Match': ifNoneMatch,
            }
        });
        if (!response.ok){
           if (response.status == 304){
                return '304';
           }
           return '500';
        }
        const etag = response.headers.get("ETag");
        localStorage.setItem('ifNoneMatch', etag);
        data = await response.json();
    }
    catch (err) {
        console.log(err.message);
    }
    return data;
}

async function postData(url, JSONbody){
    try {
        const response = await fetch(url, {
            method: "POST",
            body: JSONbody,
            headers: {
                'Accept': 'application/json',
            }
        });
        if (!response.ok){
            if (response.status == 400){
                return '400';
            }
            return '500';
        }
    }
    catch (err) {
        console.log(err.message);
    }
    return;
}

async function updateData(url, JSONbody){
    try{
        const response = await fetch(url, {
            method: "PUT",
            body: JSONbody,
        });
        if (!response.ok){
            if (response.status == 404){
                return '404';
            }
            if (response.status == 400){
                return '400'
            }
            return '500';
        }
    }
    catch (err) {
        console.log(err.message);
    }
    return;
}

async function deleteData(url){
    try{
        const response = await fetch(url, {
            method: "DELETE",
        });
        if (!response.ok){
            if (response.status == 404){
                return '404';
            }
            if (response.status == 400){
                return '400';
            }
            return '500';
        }
    }
    catch (err) {
        console.log(err.message);
    }
}

export {getData, postData, updateData, deleteData};