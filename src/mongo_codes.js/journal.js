const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://jerome:jerome@thesis.ags8rwk.mongodb.net/?retryWrites=true&w=majority&appName=Thesis", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log(' journal MongoDB connected');
  })
  .catch((e) => {
    console.log('journal MongoDB connection failed');
  });

const journalSchema = new mongoose.Schema({
  input1: String,
  input2: String,

  enteredDateStr: String, // Change the field name to entryDate
});

const journal_mongodb = mongoose.model('journal_cooldown', journalSchema);

module.exports = { mongoose, journal_mongodb };
