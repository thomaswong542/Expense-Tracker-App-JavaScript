"use strict";

const zlib = require('zlib');
const crypto = require('crypto');

const corsLink = "http://127.0.0.1:3000";

exports.sendZipCachedData = (res, data, StatusCode, Etag) => {
    zlib.gzip(data, (err, compressed_data) => {
        if(!err){
            res.writeHead(StatusCode, {
                'Content-Type':'application/json',
                'Content-Length':Buffer.byteLength(compressed_data),
                'Access-Control-Allow-Origin': corsLink,
                'Content-Encoding':'gzip',
                'Vary':'accept-encoding',
                'Cache-Control': 'private, max-age=3600',
                'Etag': Etag,
                'Access-Control-Expose-Headers': 'ETag',
            });
            res.write(compressed_data);
            res.end();
            console.log("Success Compression");
        }
        else{
            res.writeHead(500);
            res.end("Compression Error");
        }
    });
}

exports.sendUnzipCachedData = (res, data, StatusCode, Etag) => {
    res.writeHead(StatusCode, {
        'Content-Type':'application/json',
        'Content-Length':Buffer.byteLength(data),
        'Access-Control-Allow-Origin':corsLink,
        'Cache-Control': 'private, max-age=3600',
        'Etag': Etag,
        'Access-Control-Expose-Headers': 'ETag',
    });
    res.write(data);
    res.end();
    console.log("Success Transmission but no Compression");
}

exports.sendZipData = (res, data, StatusCode) => {
    zlib.gzip(data, (err, compressed_data) => {
        if(!err){
            res.writeHead(StatusCode, {
                'Content-Type':'application/json',
                'Content-Length':Buffer.byteLength(compressed_data),
                'Access-Control-Allow-Origin': corsLink,
                'Content-Encoding':'gzip',
                'Vary':'accept-encoding',
            });
            res.write(compressed_data);
            res.end();
            console.log("Success Compression");
        }
        else{
            res.writeHead(500);
            res.end("Compression Error");
        }
    });
}

exports.sendUnzipData = (res, data, StatusCode) => {
    res.writeHead(StatusCode, {
        'Content-Type':'application/json',
        'Content-Length':Buffer.byteLength(data),
        'Access-Control-Allow-Origin': corsLink,
    });
    res.write(data);
    res.end();
    console.log("Success Transmission but no Compression");
}

exports.sendCachedStatus = (res, statusCode, etag, text) => {
    res.writeHead(statusCode, {
        'Content-Type':'application/json',
        'Access-Control-Allow-Origin': corsLink,
        'Cache-Control': 'private, max-age=3600',
        'Etag': etag,
        'Access-Control-Expose-Headers': 'ETag',
    });
    if (text){
        res.end(text);
    }
    else{
        res.end();
    }
}

exports.sendStatus = (res, statusCode, text) => {
    res.writeHead(statusCode, {
        'Content-Type':'application/json',
        'Access-Control-Allow-Origin': corsLink,
    });
    if (text){
        res.end(text);
    }
    else{
        res.end();
    }
}

exports.calEtag = (data) => {
    return crypto.createHash('sha256').update(data).digest('hex');
}


