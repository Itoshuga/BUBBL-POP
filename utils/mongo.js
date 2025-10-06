const mongoose = require('mongoose');


async function connect() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.warn('MONGO_URI not set in .env — skipping MongoDB connection');
        return;
    }


    await mongoose.connect(uri, {
        // options can be tuned
    });


    console.log('Connected to MongoDB');
}


module.exports = {
    connect
};