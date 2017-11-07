import mongoose from './db'

const messagePartSchema = mongoose.Schema({
    messageId: String,
    data: String,
});
const MessagePart = mongoose.model('MessagePart', messagePartSchema);

export default MessagePart;