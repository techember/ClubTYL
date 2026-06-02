
const mongoose = require('mongoose');
const { userSignUp } = require('./controllers/auth');
const User = require('./models/userSchema');

mongoose.connect('mongodb+srv://neeraj645:neeraj645@neeraj-test.lbnipbd.mongodb.net/clubtyl').then(async () => {
  try {
    const req = {
      body: { phone: '1122334455', firstName: 'Updated', lastName: 'Stub', email: 'teststub@gmail.com', ResponseStatus: 1 },
      headers: {},
      connection: { remoteAddress: '127.0.0.1' }
    };
    const res = {
      status: (code) => { console.log('Status', code); return res; },
      json: (data) => console.log('JSON', data),
    };
    await userSignUp(req, res);
    
    // Check if it's updated in DB
    const u = await User.findOne({ phone: '1122334455' });
    console.log('User isStub:', u.isStub, 'firstName:', u.firstName);
  } catch(err) {
    console.error('CAUGHT ERROR:', err);
  } finally {
    process.exit();
  }
});

