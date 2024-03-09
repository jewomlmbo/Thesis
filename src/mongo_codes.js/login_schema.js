const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/Thesis")
    .then(() => {
        console.log('login mongoose connected');
    })
    .catch((e) => {
        console.log('failed');
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