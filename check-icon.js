const mongoose = require('mongoose');
const Service = require('./models/serviceSchema');

mongoose.connect('mongodb+srv://neeraj645:neeraj645@neeraj-test.lbnipbd.mongodb.net/clubtyl').then(async () => {
  const s = await Service.find({ name: { $in: ['Mobile Recharge', 'Recharge'] } });
  console.log(s.map(x => x.name + ': ' + x.icon));
  process.exit(0);
});
