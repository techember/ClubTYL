
const mongoose = require('mongoose');
const { adminCommission } = require('./controllers/newControllers/commission');

mongoose.connect('mongodb+srv://neeraj645:neeraj645@neeraj-test.lbnipbd.mongodb.net/clubtyl').then(async () => {
  try {
    const req = {};
    const res = {
      status: (code) => { console.log('Status', code); return res; },
      json: (data) => console.log('JSON', data),
    };
    await adminCommission(req, res);
  } catch(err) {
    console.error('CAUGHT ERROR:', err);
  } finally {
    process.exit();
  }
});

