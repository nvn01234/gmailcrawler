import mongoose from './db'

const featureSchema = mongoose.Schema({
    messageId: String,
    raw: String,
    normalized: String,
    label: String,
    numOfImage: Number,
    numOfLink: Number,
    exported: Boolean,
});
const Feature = mongoose.model('Feature', featureSchema);

export default Feature;