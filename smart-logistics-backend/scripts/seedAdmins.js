require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User"); // Adjust path if needed

const seedAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding admins...");

    const admins = [
      { name: "Suyog Punde", email: "suyogpunde69@gmail.com", password: "12345678", phone: "0000000001" },
      { name: "Aayush Pardeshi", email: "aayushpardeshi69@gmail.com", password: "12345678", phone: "0000000002" }
    ];

    for (const adminData of admins) {
      const existingUser = await User.findOne({ email: adminData.email });
      if (existingUser) {
        console.log(`User ${adminData.email} already exists. Updating role to admin...`);
        existingUser.role = "admin";
        
        // Also update password if we want to ensure it is 12345678
        const salt = await bcrypt.genSalt(10);
        existingUser.password = await bcrypt.hash(adminData.password, salt);
        
        await existingUser.save();
      } else {
        console.log(`Creating admin user ${adminData.email}...`);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminData.password, salt);
        
        await User.create({
          name: adminData.name,
          email: adminData.email,
          phone: adminData.phone,
          password: hashedPassword,
          role: "admin"
        });
      }
    }

    console.log("Admin seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding admins:", err);
    process.exit(1);
  }
};

seedAdmins();
