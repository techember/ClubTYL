
const mongoose = require('mongoose');
const Service = require('./models/serviceSchema');

mongoose.connect('mongodb+srv://neeraj645:neeraj645@neeraj-test.lbnipbd.mongodb.net/clubtyl').then(async () => {
  const stockServices = [
    { name: 'Stock Report', icon: 'uploads/stock_icons/stock_report_icon.png', type: 'Discount', section: 'stock' },
    { name: 'My Purchase', icon: 'uploads/stock_icons/my_purchase_icon.png', type: 'Discount', section: 'stock' },
    { name: 'Search Recharge', icon: 'uploads/stock_icons/search_recharge_icon.png', type: 'Discount', section: 'stock' },
    { name: 'Stock Transfer', icon: 'uploads/stock_icons/stock_transfer_icon.png', type: 'Discount', section: 'stock' },
    { name: 'Check Status', icon: 'uploads/stock_icons/check_status_icon.png', type: 'Discount', section: 'stock' },
    { name: 'Payment Request', icon: 'uploads/stock_icons/payment_request_icon.png', type: 'Discount', section: 'stock' },
    { name: 'DMR', icon: 'uploads/stock_icons/dmr_icon.png', type: 'Discount', section: 'stock' },
    { name: 'DMR Transfer', icon: 'uploads/stock_icons/dmr_transfer_icon.png', type: 'Discount', section: 'stock' },
    { name: 'DMR Stock Report', icon: 'uploads/stock_icons/dmr_icon.png', type: 'Discount', section: 'stock' },
    { name: 'DMR Report', icon: 'uploads/stock_icons/dmr_icon.png', type: 'Discount', section: 'stock' }
  ];

  for (const s of stockServices) {
    await Service.findOneAndUpdate({ name: s.name }, s, { upsert: true, new: true });
  }
  console.log('Inserted stock services successfully.');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});

