
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://neeraj645:neeraj645@neeraj-test.lbnipbd.mongodb.net/clubtyl').then(async () => {
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log(collections.map(c => c.name));
  process.exit(0);
});

