import MessagePart from './models/message_part'
import Message from './models/message'
const fs = require('fs');
const sanitizeHtml = require('sanitize-html');

function run() {
    // clearExtract().then(done);
    // extractMessageCycle(10).then(done);
    // clearNormalize().then(done);
    // normalizeCycle().then(done);
    toFile().then(done);
}

function done() {
    console.log("done");
}

async function clearNormalize() {
    let parts = await MessagePart.find({"is_normalized": true});
    let promises = parts.map(m => {
        m["is_normalized"] = false;
        return m.save();
    });
    await Promise.all(promises);
    console.log("clear");
}

async function normalizeCycle() {
    const part = await MessagePart.findOne({"is_normalized": {"$nin": [true]}});
    if (!part) {
        return Promise.resolve();
    }
    await processNormalize(part);
    return normalizeCycle();
}

async function processNormalize(part) {
    console.log(part._id);
    part["normalized"] = normalizeContent(part.raw);
    part["is_normalized"] = true;
    await part.save();
}

async function toFile() {
    let parts = await MessagePart.find();
    parts = parts.map(p => {return {
        raw: p.raw,
        normalized: p.normalized,
        label: p.label,
    }});
    let json = JSON.stringify(parts);
    fs.unlink("extracted.json", function(err) {
        if(err && err.code == 'ENOENT') {
            // file doens't exist
            console.info("File doesn't exist, won't remove it.");
        } else if (err) {
            // other errors, e.g. maybe we don't have enough permission
            console.error("Error occurred while trying to remove file");
        } else {
            console.info(`removed`);
        }

        fs.writeFile("extracted.json", json, function(err) {
            if(err) {
                return console.log(err);
            }

            console.log("The file was saved!");
        });
    });
}

/**
 *
 * @param {String} content
 * @returns {String}
 */
function normalizeContent(content) {
    content = content
        .replace(/<style[^>]*>[^<]*<\/style>/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/(https?|mailto)[^ ]+/ig, " ")
        .replace(/&(nbsp|copy|lt|gt);/g, " ")
        .replace(/[=><]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    return content;
}

async function clearExtract() {
    let messages = await Message.find({"extracted": true});
    let promises = messages.map(m => {
        m.extracted = false;
        return m.save();
    });
    await Promise.all(promises);
    console.log("clear");
}

async function extractMessageCycle(perCycle) {
    const messages = await Message.find({"extracted": {"$nin": [true]}}).limit(10);
    if (!messages.length) {
        return Promise.resolve();
    }
    const promises = messages.map(processMessage);
    await Promise.all(promises);
    return extractMessageCycle(perCycle);
}

async function processMessage(m) {
    return new Promise(async (resolve, reject) => {
        console.log(`message ${m.id}`);
        let label = m.labelIds.some(l => l == "SPAM" || l == "CATEGORY_PROMOTIONS") ? "SPAM" : "NON-SPAM";
        try {
            await MessagePart.remove({messageId: m.id});
            const promises = m.payload.parts.map(p => processPart(m, p, label));
            await Promise.all(promises);
            m.extracted = true;
            await m.save();
            resolve();
        } catch(e) {
            console.log(e);
            await MessagePart.remove({messageId: m.id});
            m.extracted = false;
            await m.save();
            reject(e);
        }
    });
}

async function processPart(m, part, label) {
    if ("parts" in part) {
        const promises = part.parts.map(p => processPart(m, p, label));
        return Promise.all(promises);
    } else if("data" in part.body) {
        let data = new Buffer(part.body.data, "base64").toString();
        return MessagePart.create({
            messageId: m.id,
            raw: data,
            label: label,
        })
    }
}

export default run