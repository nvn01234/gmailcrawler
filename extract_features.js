import MessagePart from './models/message_part'
import Message from './models/message'

function run() {
    // clear().then(() => {})
    extractMessageCycle(10).then(() => {});
}

async function clear() {
    let messages = await Message.find({"extracted": true});
    let promises = messages.map(m => {
        m.extracted = false;
        return m.save();
    });
    await Promise.all(promises);
    console.log("clear");
}

async function extractMessageCycle(perCycle) {
    const messages = await Message.find({"extracted": {"$nin": [true]}, "labelIds": {"$in": ["SPAM", "CATEGORY_PROMOTIONS"]}}).limit(10);
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
        try {
            await MessagePart.remove({messageId: m.id});
            const promises = m.payload.parts.map(p => processPart(m, p));
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

async function processPart(m, part) {
    if ("parts" in part) {
        const promises = part.parts.map(p => processPart(m, p));
        return Promise.all(promises);
    } else if("data" in part.body) {
        let data = new Buffer(part.body.data, "base64").toString();
        return MessagePart.create({
            messageId: m.id,
            data: data,
        })
    }
}

export default run