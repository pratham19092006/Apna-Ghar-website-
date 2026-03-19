const axios = require('axios');
const mongoose = require('mongoose');

async function testRegistration() {
  try {
    // We can't really register via API easily because of OTP verification.
    // OTP verification requires a valid emailVerificationToken.
    // But we know how login works. We just need to check if userController.js has the right code.
    console.log("Reading userController.js...");
    const fs = require('fs');
    const content = fs.readFileSync('./controllers/userController.js', 'utf8');
    
    // Check if token generation is correct
    if (content.includes('const authToken = jwt.sign({ id: createdUser._id }, process.env.JWT_KEY')) {
      console.log('Token generation code found.');
    } else {
      console.log('Token generation NOT found.');
    }
    
    if (content.includes('user: createdUser')) {
      console.log('User response code found.');
    } else {
      console.log('User response NOT found.');
    }

  } catch (err) {
    console.error(err);
  }
}

testRegistration();
