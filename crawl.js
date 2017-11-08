import Message from './models/message';

import gmailApi from './gmail-api';

// Cần bước nào thì comment các bước còn lại, chỉ để lại 1 bước cần chạy
function run() {
    gmailApi.load().then(auth => {
        // List tất cả messages ra, lúc này mới chỉ biết id của message
        gmailApi.listMessages(auth, processMessages).then(done);

        // Lấy thông tin message từ id đã có
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
    Message.insertMany(messages).then(() => {console.log(`inserted ${messages.length}`)});
    // messages.forEach(message => {
    //     Message.create(message).then(() => {});
    // });
}

export default run