const { MongoClient } = require('mongodb');

// Uses working Atlas URI (non-SRV)
const db_url = "mongodb://admin_db:EC45kNGintV2H6Js@ac-gudv1md-shard-00-00.od73g88.mongodb.net:27017,ac-gudv1md-shard-00-01.od73g88.mongodb.net:27017,ac-gudv1md-shard-00-02.od73g88.mongodb.net:27017/?ssl=true&replicaSet=atlas-1305k6-shard-0&authSource=admin&appName=Cluster0ForTHELOOP";

const options = {
    // keep it simple; URI already includes authSource and host info
};

// -------------------------------------------------------------------
async function connect() {
    return await MongoClient.connect(db_url, options);
}

async function disconnect(dbconn) {
    await dbconn.close();
}

function getCollection(dbconn, dbname, colname) {
    const db = dbconn.db(dbname);
    return db.collection(colname);
}

// -------------------------------------------------------------------
async function insert(dbname, colname, queryobj) {
    let result = [];
    const dbconn = await connect();
    const collection = getCollection(dbconn, dbname, colname);

    if (Array.isArray(queryobj)) {
        result = await collection.insertMany(queryobj);
    } else {
        // modern driver prefers insertOne
        result = await collection.insertOne(queryobj);
    }

    await disconnect(dbconn);
    return result;
}

async function find(dbname, colname, filter) {
    let result = [];
    const dbconn = await connect();
    const collection = getCollection(dbconn, dbname, colname);

    result = await collection.find(filter).toArray();

    await disconnect(dbconn);
    return result;
}

async function update(dbname, colname, filter, updateobj) {
    let result = [];
    const dbconn = await connect();
    const collection = getCollection(dbconn, dbname, colname);

    result = await collection.updateMany(filter, updateobj);

    await disconnect(dbconn);
    return result;
}

async function remove(dbname, colname, filter) {
    let result = [];
    const dbconn = await connect();
    const collection = getCollection(dbconn, dbname, colname);

    result = await collection.deleteMany(filter);

    await disconnect(dbconn);
    return result;
}

module.exports = { remove, find, insert, update };