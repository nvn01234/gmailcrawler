import Message from './models/message';
import Feature from './models/feature';
const fs = require('fs');
const striptags = require('striptags');

// Cần bước nào thì comment các bước còn lại, chỉ để lại 1 bước cần chạy
function run() {
    // Xoá trạng thái extract của message, để chạy lại hàm extractFeature từ đầu
    // Cần xoá collection features bằng tay
    clearExtract().then(done);

    // extract message ra thành feature cần (raw, normalized, numOfLink, numOfImage, v.v...)
    extractFeature().then(done);

    // Xoá trạng thái export của các feature, để chạy lại hàm toFile từ đầu
    // Cần xoá file json trong thư mục data
    clearExported().then(done);

    // Tạo thư mục data trong project
    // Chạy hàm này để chuyển mongoDB thành json, để import vào mysql
    toFile().then(done);
}

function done() {
    console.log("done");
}

async function clearExtract() {
    return Message.update({}, {"$unset": {"extracted": 1}}, {"multi": true});
}

async function extractFeature() {
    let message = await Message.findOne({"extracted": {"$exists": false}});
    if (message) {
        console.log(`extract message ${message.id}`);
        let extractedFeatures = {messageId: message.id};
        extractedFeatures.label = message.labelIds.some(label => ["CATEGORY_PROMOTIONS", "SPAM"].includes(label)) ? "SPAM" : "NON-SPAM";
        extractBody(extractedFeatures, message.payload);
        if (!('raw' in extractedFeatures)) {
            extractedFeatures.raw = extractedFeatures.normalized;
        } else if (!('normalized' in extractedFeatures)) {
            extractedFeatures.normalized = extractedFeatures.raw;
        }
        extractedFeatures.normalized = strip(extractedFeatures.normalized);
        extractedFeatures.numOfLink = countLink(extractedFeatures.raw);
        extractedFeatures.numOfImage = countImage(extractedFeatures.raw);
        await Feature.create(extractedFeatures);
        message.extracted = true;
        await message.save();
        return extractFeature();
    } else {
        return Promise.resolve();
    }
}

function extractBody(extractedFeatures, payload) {
    if (payload.mimeType.startsWith("multipart")) {
        payload.parts.forEach(part => extractBody(extractedFeatures, part));
    } else if (payload.mimeType == "text/plain" && "data" in payload.body) {
        extractedFeatures.normalized = new Buffer(payload.body.data, "base64").toString();
    } else if (payload.mimeType == "text/html" && "data" in payload.body) {
        extractedFeatures.raw = new Buffer(payload.body.data, "base64").toString();
    }
}

function strip(str) {
    return striptags(str.replace(/<style[^>]*>[^<]*<\/style>/g, ' '), [], ' ').replace(/ +/g, ' ');
}

function countImage(html) {
    return (html.match(/<img[^>]*\/?>/g) || []).length;
}

function countLink(html) {
    return (html.match(/https?:\/\/[^ ]+/g) || []).length;
}

async function clearExported() {
    return Feature.update({}, {"$unset": {"exported": 1}}, {"multi": true});
}

async function toFile(cycle = 1) {
    let features = await Feature.find({"exported": {"$exists": false}}).limit(10000);
    if (features.length) {
        let data = features.map(exportFeature);
        let json = JSON.stringify(data);
        fs.writeFile(`data/extracted_part_${cycle}.json`, json, function(err) {
            if(err) {
                return console.log(err);
            }

            console.log("The file was saved!");
        });
        let ids = features.map(f => f._id);
        await Feature.update({"_id": {"$in": ids}}, {"$set": {"exported": true}}, {"multi": true});
        return toFile(cycle + 1);
    } else {
        return Promise.resolve();
    }
}

function exportFeature(feature) {
    return {
        label: feature.label,
        normalized: feature.normalized,
        raw: feature.raw,
        numOfLink: feature.numOfLink,
        numOfImage: feature.numOfImage,
    }
}

export default run