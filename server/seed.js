require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Profile = require('./models/EntrepreneurProfile');
const Product = require('./models/Product');

const people = [
  {
    name: 'Sunita Devi', email: 'sunita@example.com', business: 'Sunita Tailors',
    skill: 'Tailor', city: 'Agra', state: 'Uttar Pradesh', years: 12,
    bio: 'Stitching and alterations for women and children, done by hand with care.',
    services: [{ title: 'Blouse stitching', price: 350 }, { title: 'Suit alteration', price: 200 }],
    products: [{ name: 'Cotton kurta', price: 799, stock: 10, description: 'Hand-stitched cotton kurta, sizes S to XL.' }],
  },
  {
    name: 'Mohan Lal', email: 'mohan@example.com', business: 'Mohan Footwear Repair',
    skill: 'Cobbler', city: 'Jaipur', state: 'Rajasthan', years: 20,
    bio: 'Repair, polish and resoling of leather shoes and bags.',
    services: [{ title: 'Shoe resoling', price: 250 }, { title: 'Bag zip repair', price: 120 }],
    products: [{ name: 'Leather belt', price: 450, stock: 15, description: 'Handmade genuine leather belt.' }],
  },
  {
    name: 'Kamla Bai', email: 'kamla@example.com', business: 'Kamla Clay Works',
    skill: 'Potter', city: 'Lucknow', state: 'Uttar Pradesh', years: 18,
    bio: 'Traditional terracotta lamps, pots and planters shaped on the wheel.',
    services: [{ title: 'Custom pottery order', price: 500 }],
    products: [
      { name: 'Terracotta planter', price: 350, stock: 12, description: 'Medium planter with drainage hole.' },
      { name: 'Diya set of 12', price: 180, stock: 40, description: 'Hand-painted clay diyas.' },
    ],
  },
  {
    name: 'Irfan Ali', email: 'irfan@example.com', business: 'Ali Handicrafts',
    skill: 'Artisan', city: 'Agra', state: 'Uttar Pradesh', years: 9,
    bio: 'Wood carving and brass inlay work for homes and gifts.',
    services: [{ title: 'Custom name plate', price: 900 }],
    products: [{ name: 'Carved wooden box', price: 1200, stock: 6, description: 'Sheesham wood box with brass inlay.' }],
  },
  {
    name: 'Geeta Sharma', email: 'geeta@example.com', business: 'Geeta Home Foods',
    skill: 'Small vendor', city: 'Meerut', state: 'Uttar Pradesh', years: 7,
    bio: 'Homemade pickles, papad and spice mixes made in small batches.',
    services: [{ title: 'Bulk festival orders', price: 1500 }],
    products: [
      { name: 'Mango pickle 500 g', price: 220, stock: 30, description: 'Traditional mustard oil pickle.' },
      { name: 'Moong papad pack', price: 120, stock: 50, description: 'Crispy papad, 250 g pack.' },
    ],
  },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  let created = 0;
  for (const p of people) {
    if (await User.findOne({ email: p.email })) {
      console.log(`Skipped ${p.email} (already exists)`);
      continue;
    }
    const user = await User.create({
      name: p.name, email: p.email, password: 'Pass12345', role: 'entrepreneur',
    });
    const profile = await Profile.create({
      user: user._id, businessName: p.business, skillType: p.skill, bio: p.bio,
      experienceYears: p.years, city: p.city, state: p.state,
      services: p.services, status: 'approved',
    });
    await Product.insertMany(p.products.map((x) => ({ ...x, profile: profile._id })));
    created += 1;
    console.log(`Created ${p.business}`);
  }
  console.log(`Done. ${created} new entrepreneurs.`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});