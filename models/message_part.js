import mongoose from './db'

const messagePartSchema = mongoose.Schema({
    messageId: String,
    raw: String,
    label: String,
    normalized: String,
    is_normalized: Boolean,
});
const MessagePart = mongoose.model('MessagePart', messagePartSchema);

export default MessagePart;