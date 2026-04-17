const { MongoClient } = require('mongodb');

const uri = "mongodb://admin_db:EC45kNGintV2H6Js@ac-gudv1md-shard-00-00.od73g88.mongodb.net:27017,ac-gudv1md-shard-00-01.od73g88.mongodb.net:27017,ac-gudv1md-shard-00-02.od73g88.mongodb.net:27017/?ssl=true&replicaSet=atlas-1305k6-shard-0&authSource=admin&appName=Cluster0ForTHELOOP";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("theloop");
    const coll = db.collection("test_insert");

    const docs = [
      { name: "test1", value: 1 },
      { name: "test2", value: 2 },
      { name: "test3", value: 3 }
    ];

    const result = await coll.insertMany(docs);
    console.log("Insert result:", result);
  } catch (err) {
    console.error("MongoDB error:", err);
  } finally {
    await client.close();
  }
}

run();