const mongoose = require('mongoose');
const Service = require('./models/serviceSchema');

mongoose.connect('mongodb+srv://neeraj645:neeraj645@neeraj-test.lbnipbd.mongodb.net/clubtyl').then(async () => {
  await Service.deleteMany({ icon: { $in: ['mobile', 'tv', 'bolt'] } });
  console.log('Deleted old seed services');
  process.exit(0);
});
