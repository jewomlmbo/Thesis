const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://jerome:jerome@thesis.ags8rwk.mongodb.net/?retryWrites=true&w=majority&appName=Thesis")
    .then(() => {
        console.log('login mongoose connected');
    })
    .catch((e) => {
        console.log('login mongodb failed');
    });

// Login Schema
const loginSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    }
});

const LoginData = new mongoose.model('LoginData', loginSchema);
module.exports =  LoginData