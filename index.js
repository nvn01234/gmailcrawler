import Message from './models/message';

import gmailApi from './gmail-api';

gmailApi.load().then(async (auth) => {
    await gmailApi.listMessages(auth, processMessage);
    await crawlMessageCycle(10, auth);
});

async function crawlMessageCycle(perCycle, auth) {
    const messages = await Message.find({snippet: null}).limit(perCycle);
    if (!messages.length) {
        return Promise.resolve();
    }
    const promises = messages.map(m => processMessage(auth, m));
    await Promise.all(promises);
    return crawlMessageCycle(perCycle, auth);
}

function processMessage(auth, m) {
    return new Promise(async (resolve, reject) => {
        let message = await gmailApi.getMessage(auth, m.id);
        Object.keys(message).forEach(k => {
            m[k] = message[k];
        });
        await m.save();
        resolve();
    });
}

function processMessages(messages) {
    messages.forEach(message => {
        Message.create(message).then(() => {});
    });
}

