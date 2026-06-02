
const mongoose = require('mongoose');
const { addSubUser } = require('./controllers/auth');
const User = require('./models/userSchema');

mongoose.connect('mongodb+srv://neeraj645:neeraj645@neeraj-test.lbnipbd.mongodb.net/clubtyl').then(async () => {
  try {
    const parentUser = await User.findOne({});
    const req = {
      data: parentUser,
      body: { phone: '1122334455', firstName: 'Test', lastName: 'Stub', email: 'teststub@gmail.com' },
      headers: {},
      connection: { remoteAddress: '127.0.0.1' }
    };
    const res = {
      status: (code) => { console.log('Status', code); return res; },
      json: (data) => console.log('JSON', data),
    };
    await addSubUser(req, res);
  } catch(err) {
    console.error('CAUGHT ERROR:', err);
  } finally {
    process.exit();
  }
});

