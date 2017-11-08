import Message from './models/message';

import gmailApi from './gmail-api';

function run() {
    gmailApi.load().then(auth => {
        gmailApi.listMessages(auth, processMessages).then(done);
        crawlMessageCycle(auth).then(done);
    });
}

function done() {
    console.log("done");
}

async function crawlMessageCycle(auth) {
    const message = await Message.findOne({snippet: null});
    if (!message) {
        return Promise.resolve();
    } else {
        await processMessage(auth, message);
        return crawlMessageCycle(auth);
    }
}

async function processMessage(auth, m) {
    let message = await gmailApi.getMessage(auth, m.id);
    Object.keys(message).forEach(k => {
        m[k] = message[k];
    });
    return m.save();
}

function processMessages(messages) {
    messages.forEach(message => {
        Message.create(message).then(() => {});
    });
}

export default run