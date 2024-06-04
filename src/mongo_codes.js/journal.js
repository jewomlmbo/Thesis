const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://jerome:jerome@thesis.ags8rwk.mongodb.net/?retryWrites=true&w=majority&appName=Thesis", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Journal MongoDB connected');
  })
  .catch((e) => {
    console.log('Journal MongoDB connection failed');
  });

const journalSchema = new mongoose.Schema({
  input1: String,
  input2: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const journal_mongodb = mongoose.model('journal', journalSchema);

module.exports = { mongoose, journal_mongodb };
