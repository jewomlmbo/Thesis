const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://jerome:jerome@thesis.ags8rwk.mongodb.net/?retryWrites=true&w=majority&appName=Thesis", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('countdown MongoDB connected');
  })
  .catch((e) => {
    console.log('countdown MongoDB connection failed');
  });

const countdownSchema = new mongoose.Schema({
  expectedDate: {
    type: String,
    required: true,
  }
});

const countdown_mongodb = mongoose.model('harvest_date', countdownSchema);

module.exports = { countdown_mongodb }; // Wrap the countdown_mongodb in an object before exporting
