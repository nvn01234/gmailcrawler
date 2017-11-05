const mongoose = require('mongoose');
const mongoDb = 'mongodb://localhost:27017/gmail';

mongoose.Promise = global.Promise;
mongoose.connect(mongoDb);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log(`connected to ${mongoDb}`);
});

export default mongoose;