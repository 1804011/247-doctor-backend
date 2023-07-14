const { MongoClient } = require('mongodb');

const seedPlayerIDToUsers = async () => {
    const uri = process.env.MONGO_DB_URL;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('test'); // Replace with your MongoDB database name
        const userCollection = db.collection('users'); // Replace with the name of your User collection

        const users = await userCollection.find({}).toArray();

        for (const user of users) {
            await userCollection.updateOne(
                { _id: user._id },
                { $set: { playerID: '' } }
            );
        }

        console.log('Player ID seeded to all users');
    } catch (err) {
        console.error('Failed to seed player ID to users:', err);
    } finally {
        await client.close();
    }
};

seedPlayerIDToUsers();
