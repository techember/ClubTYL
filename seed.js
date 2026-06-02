const mongoose = require('mongoose');
require('dotenv').config();

const Service = require('./models/serviceSchema');
const AppSetting = require('./models/appSetting');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('Connected to DB. Seeding data...');

    // 1. Create Essential Services
    const services = [
        { name: 'SIGNUP', icon: 'user-plus', type: 'Discount', status: true, isShow: false },
        { name: 'LOGIN', icon: 'sign-in', type: 'Discount', status: true, isShow: false },
        { name: 'Mobile Recharge', icon: 'mobile', type: 'Cashback', status: true, isShow: true, section: 'recharge', route: '/recharge' },
        { name: 'DTH', icon: 'tv', type: 'Cashback', status: true, isShow: true, section: 'recharge', route: '/dth' },
        { name: 'Electricity', icon: 'bolt', type: 'Cashback', status: true, isShow: true, section: 'recharge', route: '/electricity' }
    ];

    for (let svc of services) {
        await Service.updateOne({ name: svc.name }, { $set: svc }, { upsert: true });
    }
    console.log('Services seeded successfully.');

    // 2. Create AppSettings
    const settings = {
        name: 'ClubTyl',
        serviceCharge: 0,
        isMaintenance: false,
        customerPhone: '8871265906',
        version: '1.0',
        status: true
    };
    await AppSetting.updateOne({}, { $set: settings }, { upsert: true });
    console.log('App settings seeded successfully.');

    console.log('Database Seeding Complete!');
    mongoose.disconnect();
}).catch(console.error);
