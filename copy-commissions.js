const mongoose = require('mongoose');

const SOURCE_URI = 'mongodb+srv://neeraj645:neeraj645@neeraj-test.lbnipbd.mongodb.net/yaarapay';
const TARGET_URI = 'mongodb+srv://neeraj645:neeraj645@neeraj-test.lbnipbd.mongodb.net/clubtyl';

const commissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    operatorType: { type: String, enum: ['mobile', 'dth', 'bbps'], required: true },
    commission: { type: Number, required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    icon: { type: String, required: true },
    symbol: { type: String, enum: ['%', '₹'] },
    status: { type: Boolean, default: true }
  },
  { timestamps: true }
);

async function copyCommissions() {
  try {
    console.log('Connecting to Source DB...');
    const sourceDb = await mongoose.createConnection(SOURCE_URI).asPromise();
    const SourceCommission = sourceDb.model('Commission', commissionSchema);

    console.log('Connecting to Target DB...');
    const targetDb = await mongoose.createConnection(TARGET_URI).asPromise();
    const TargetCommission = targetDb.model('Commission', commissionSchema);

    console.log('Fetching commissions from Source DB...');
    const commissions = await SourceCommission.find({}).lean();
    console.log(`Found ${commissions.length} commissions.`);

    for (let comm of commissions) {
      delete comm._id; // Let mongoose create a new _id
      await TargetCommission.updateOne(
        { name: comm.name, operatorType: comm.operatorType },
        { $set: comm },
        { upsert: true }
      );
      console.log(`Copied commission: ${comm.name}`);
    }

    console.log('All commissions copied successfully.');

    await sourceDb.close();
    await targetDb.close();
    process.exit(0);
  } catch (error) {
    console.error('Error copying commissions:', error);
    process.exit(1);
  }
}

copyCommissions();
