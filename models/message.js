import mongoose from './db'

const messageSchema = mongoose.Schema({
    id: String,
    threadId: String,
    labelIds: [String],
    snippet: String,
    historyId: Number,
    internalDate: Number,
    payload: {
        partId: String,
        mimeType: String,
        filename: String,
        headers: [{
            name: String,
            value: String,
        }],
        body: {
            attachmentId: String,
            size: Number,
            data: String,
        },
        parts: Array
    },
    sizeEstimate: Number,
    raw: String,
    extractedFeatures: {
        raw: String,
        normalized: String,
        label: String,
        numOfImage: Number,
        numOfLink: Number,
    },
});
const Message = mongoose.model('Message', messageSchema);

export default Message;