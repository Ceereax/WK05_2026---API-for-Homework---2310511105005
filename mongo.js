const mongofunc = require('./mongofunc');

async function runMongo() {
    try {
        const insertResult = await mongofunc.insert(
            'testDB',              // was 'testdb'
            'test',
            [{ a: 1 }, { a: 2 }, { a: 3 }]
        );
        console.log('Insert result:', insertResult);

        const updResult = await mongofunc.update(
            'testDB',              // was 'testdb'
            'test',
            { a: 3 },
            { $set: { a: 4, name: "Golf" } }
        );
        console.log('Update result:', updResult);

        const remResult = await mongofunc.remove(
            'testDB',              // was 'testdb'
            'test',
            { a: 2 }
        );
        console.log('Remove result:', remResult);

        const result = await mongofunc.find(
            'testDB',              // was 'testdb'
            'test',
            {}
        );
        console.log('Find result:');
        for (const doc of result) {
            console.log(doc);
        }
    } catch (err) {
        console.error('runMongo error:', err);
    }
}

runMongo();