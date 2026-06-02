const mongoose = require('mongoose');

const SOURCE_URI = 'mongodb+srv://neeraj645:neeraj645@neeraj-test.lbnipbd.mongodb.net/yaarapay';
const TARGET_URI = 'mongodb+srv://neeraj645:neeraj645@neeraj-test.lbnipbd.mongodb.net/clubtyl';

const serviceSchema = new mongoose.Schema(
  {
    percent: { type: Number, min: 0, default: 0 },
    icon: { type: String, required: true },
    isCoupon: { type: Boolean, default: false },
    name: { type: String, required: true, unique: true },
    status: { type: Boolean, required: true, default: true },
    isShow: { type: Boolean, required: true, default: true },
    type: { type: String, required: true },
    route: { type: String, default: "" },
    section: { type: String },
  },
  { timestamps: true }
);

async function copyServices() {
  try {
    console.log('Connecting to Source DB...');
    const sourceDb = await mongoose.createConnection(SOURCE_URI).asPromise();
    const SourceService = sourceDb.model('Service', serviceSchema);

    console.log('Connecting to Target DB...');
    const targetDb = await mongoose.createConnection(TARGET_URI).asPromise();
    const TargetService = targetDb.model('Service', serviceSchema);

    console.log('Fetching services from Source DB...');
    const services = await SourceService.find({}).lean();
    console.log(`Found ${services.length} services.`);

    for (let svc of services) {
      delete svc._id; // Remove the existing _id to let mongoose create it or use name as unique key
      await TargetService.updateOne(
        { name: svc.name },
        { $set: svc },
        { upsert: true }
      );
      console.log(`Copied service: ${svc.name}`);
    }

    console.log('All services copied successfully.');

    await sourceDb.close();
    await targetDb.close();
    process.exit(0);
  } catch (error) {
    console.error('Error copying services:', error);
    process.exit(1);
  }
}

copyServices();
