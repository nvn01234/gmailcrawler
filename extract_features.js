import Message from './models/message'
const fs = require('fs');

function run() {
    // clearExtract().then(done);
    // extractFeature().then(done);
    toFile().then(done);
}

function done() {
    console.log("done");
}

async function clearExtract() {
    let messages = await Message.find({"extractedFeatures": {"$exists": true}});
    let promises = messages.map(m => {
        m.extractedFeatures = undefined;
        return m.save();
    });
    return Promise.all(promises);
}

async function extractFeature() {
    let message = await Message.findOne({"extractedFeatures": {"$exists": false}});
    if (message) {
        console.log(`extract message ${message.id}`);
        let extractedFeatures = {};
        extractedFeatures.label = message.labelIds.some(label => ["CATEGORY_PROMOTIONS", "SPAM"].includes(label)) ? "SPAM" : "NON-SPAM";
        extractBody(extractedFeatures, message.payload);
        if (!('raw' in extractedFeatures)) {
            extractedFeatures.raw = extractedFeatures.normalized;
            extractedFeatures.numOfImage = countImage(extractedFeatures.raw);
            extractedFeatures.numOfLink = countLink(extractedFeatures.raw);
        }
        if (!('normalized' in extractedFeatures)) {
            extractedFeatures.normalized = extractedFeatures.raw;
        }
        message.extractedFeatures = extractedFeatures;
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
        extractedFeatures.numOfImage = countImage(extractedFeatures.raw);
        extractedFeatures.numOfLink = countLink(extractedFeatures.raw);
    }
}

function countImage(html) {
    return (html.match(/<img[^>]*\/?>/g) || []).length;
}

function countLink(html) {
    return (html.match(/https?:\/\/[^ ]+/g) || []).length;
}

async function toFile() {
    let messages = await Message.find({"extractedFeatures": {"$exists": true}});
    messages = messages.map(m => m.extractedFeatures);
    let json = JSON.stringify(messages);
    fs.writeFile("extracted.json", json, function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
}

export default run