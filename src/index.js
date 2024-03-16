
const express = require("express");
const path = require("path");
const exphbs = require('express-handlebars');
const app = express();
const { networkInterfaces } = require("os");

const LoginData = require("./mongo_codes.js/login_schema");
const { update_drip_mongodb, save_drip_mongodb } = require("./mongo_codes.js/drip_sensors");
const { update_sprinkler_mongodb, save_sprinkler_mongodb } = require("./mongo_codes.js/sprinkler_sensors");
const { journal_mongodb } = require('./mongo_codes.js/journal'); // Import the Countdown model
const { countdown_mongodb } = require('./mongo_codes.js/countdown_db'); // Import the Countdown model
const { MongoClient } = require('mongodb');
const port = process.env.PORT || 3000;
const PDFDocument = require('pdfkit');
const fs = require('fs');
const mongo_link = ("mongodb+srv://jerome:jerome@thesis.ags8rwk.mongodb.net/?retryWrites=true&w=majority&appName=Thesis");

// Configure Express to use JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Define paths for templates, CSS, and images
const templatePath = path.join(__dirname, '../templates');
const cssPath = path.join(__dirname, '../css');
const imagesPath = path.join(__dirname, '../images');

// Configure Handlebars as the view engine
const hbs = exphbs.create({
    extname: '.hbs',
    partialsDir: [path.join(__dirname, '../templates/partials')],
    layoutsDir: path.join(__dirname, '../templates/layout')
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');  // Use 'hbs' as the view engine
app.set('views', templatePath);

// Serve static files (CSS and images)
app.use(express.static(templatePath));
app.use('/css', express.static(cssPath));
app.use('/images', express.static(imagesPath));
app.use('/src', express.static(path.join(__dirname, '../src')));

app.use('/css/light', express.static(path.join(cssPath, 'light'))); // Serve files from 'css/light' subdirectory
app.use('/css/dark', express.static(path.join(cssPath, 'dark'))); // Serve files from 'css/dark' subdirectory


// Function to handle rendering templates with layout
const renderTemplate = (res, template, data = {}, layout = 'main') => {
    try {
        // Check if the template is for login, signup, or sign-in and use alternative layout
        if (template.includes('partials/login') || template.includes('partials/signup') ) {
            res.render(template, { layout: 'alternative', ...data });
        } else {
            res.render(template, { layout, ...data });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};


///////////////////////////login and sign up////////////////////////////////////////////////////
//login and sign up

app.get('/signup', (req, res) => renderTemplate(res, 'partials/signup'));

// Render the login page without specifying layout (defaults to 'main')
app.get('/', (req, res) => renderTemplate(res, 'partials/login'));

// Handle signup form submission
app.post('/signup', async (req, res) => {
    const data = {
        username: req.body.username,
        password: req.body.password
    };

    try {
        const checking = await LoginData.findOne({ username: req.body.username });

        if (checking) {
            res.send("User details already exist");
        } else {
            await LoginData.insertMany([data]);
            renderTemplate(res, 'partials/home', { naming: req.body.username });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// Handle login form submission
app.post('/login', async (req, res) => {
    try {
        const check = await LoginData.findOne({ username: req.body.username });

        if (check && check.password === req.body.password) {
            renderTemplate(res, 'partials/home', { naming: `${req.body.password}+${req.body.username}` });
        } else {
            res.send("Incorrect password or username");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

///////////////////////////////////////////////////////////////////////////////////////////
//display selected date

app.get('/select_date_drip', async (req, res) => {
    try {
        // Connect to MongoDB
        const client = await MongoClient.connect(mongo_link);
        const db = client.db("Thesis");
        const collection = db.collection("drip_sensor_data");

        // Fetch data from MongoDB
        const data = await collection.find().toArray();

        // Close MongoDB connection
        client.close();

        // Render the HTML template with the fetched data
        res.render('partials/drip_selectdate', { data });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/select_date_drip', async (req, res) => {
    try {
        const selectedDate = req.body.selectedDate;
        console.log('Selected Date:', selectedDate);

        // Connect to MongoDB
        const client = await MongoClient.connect(mongo_link);
        const db = client.db("Thesis");
        const collection = db.collection("drip_sensor_data");

        // Convert the selected date to the format used in the database
        const formattedSelectedDate = new Date(selectedDate).toLocaleDateString();

        // Build the regular expression to match the selected date
        const regex = new RegExp(`^${formattedSelectedDate.replace(/[.,: ]/g, "\\$&")}`);

        // Construct the query to find data for the selected date
        const query = {
            timestamp: { $regex: regex }
        };
        //console.log('MongoDB Query:', query);

        // Fetch data from MongoDB based on the selected date
        const data = await collection.find(query).toArray();

        // Log the data to the console
        //console.log('Data for Selected Date:', data);

        // Close MongoDB connection
        client.close();

        // Render the HTML template with the fetched data
        res.render('partials/drip_selectdate', { data, selectedData: data, selectedDate });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/download_drip', async (req, res) => {
    try {
        const selectedDate = req.body.date;

        // Connect to MongoDB
        const client = await MongoClient.connect(mongo_link);
        const db = client.db("Thesis");
        const collection = db.collection("drip_sensor_data");

        // Convert the selected date to the format used in the database
        const formattedSelectedDate = new Date(selectedDate).toLocaleDateString();

        // Build the regular expression to match the selected date
        const regex = new RegExp(`^${formattedSelectedDate.replace(/[.,: ]/g, "\\$&")}`);

        // Construct the query to find data for the selected date
        const query = {
            timestamp: { $regex: regex }
        };

        // Fetch data from MongoDB based on the selected date
        const data = await collection.find(query).toArray();

        // Close MongoDB connection
        client.close();

        // Create a PDF document
        const doc = new PDFDocument();

        // Set content type and disposition for the response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Drip_Data_${formattedSelectedDate}.pdf`);

        // Pipe the PDF directly to the response
        doc.pipe(res);

        // Add a header to the PDF
        doc.font('Helvetica-Bold').fontSize(24).text(`Drip Irrigation Data for ${formattedSelectedDate}`, {
            align: 'left'
        });

        // Reset font settings for regular text
        doc.font('Helvetica').fontSize(12);

        // Move down to leave space after the header
        doc.moveDown();

        // Adjust left and right margins
        const leftMargin = 70;
        const rightMargin = 550; // Adjust this value for the right margin

        // Add each data item to the PDF
        data.forEach((item, index) => {
            // Bold the timestamp text and add small spacing
            doc.font('Helvetica-Bold').text(`Timestamp: ${item.timestamp}`).moveDown(0.5);

            doc.font('Helvetica').text(`Humidity: ${item.field1}`);
            doc.font('Helvetica').text(`Temperature: ${item.field2}`);
            doc.font('Helvetica').text(`Soil MOisture 1: ${item.field3}`);
            doc.font('Helvetica').text(`Soil Moisture 2: ${item.field4}`);

            // Draw a border after each timestamp and its data
            doc.moveTo(leftMargin, doc.y + 5).lineTo(rightMargin, doc.y + 5).stroke();

            // Move down for the next timestamp
            if (index < data.length - 1) {
                doc.moveDown();
            }
        });

        // Finalize the PDF
        doc.end();
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send('Internal Server Error');
    }
});


function formatNumber(value) {
    if (typeof value === 'number' && !isNaN(value)) {
        return value.toFixed(2);
    }
    return '';
}

///////////////////////////////////////////////////////////////////////////////////////////
//sprinkler display selected date and download
app.get('/select_date_sprinkler', async (req, res) => {
    try {
        // Connect to MongoDB
        const client = await MongoClient.connect(mongo_link);
        const db = client.db("Thesis");
        const collection = db.collection("sprinkler_sensor_data");

        // Fetch data from MongoDB
        const data = await collection.find().toArray();

        // Close MongoDB connection
        client.close();

        // Render the HTML template with the fetched data
        res.render('partials/sprinkler_selectdate', { data });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/select_date_sprinkler', async (req, res) => {
    try {
        const selectedDate = req.body.selectedDate;
        console.log('Selected Date:', selectedDate);

        // Connect to MongoDB
        const client = await MongoClient.connect(mongo_link);
        const db = client.db("Thesis");
        const collection = db.collection("sprinkler_sensor_data");

        // Convert the selected date to the format used in the database
        const formattedSelectedDate = new Date(selectedDate).toLocaleDateString();

        // Build the regular expression to match the selected date
        const regex = new RegExp(`^${formattedSelectedDate.replace(/[.,: ]/g, "\\$&")}`);

        // Construct the query to find data for the selected date
        const query = {
            timestamp: { $regex: regex }
        };
        //console.log('MongoDB Query:', query);

        // Fetch data from MongoDB based on the selected date
        const data = await collection.find(query).toArray();

        // Log the data to the console
        console.log('Data for Selected Date:', data);

        // Close MongoDB connection
        client.close();

        // Render the HTML template with the fetched data
        res.render('partials/sprinkler_selectdate', { data, selectedData: data, selectedDate });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/download_sprinkler', async (req, res) => {
    try {
        const selectedDate = req.body.date;

        // Connect to MongoDB
        const client = await MongoClient.connect(mongo_link);
        const db = client.db("Thesis");
        const collection = db.collection("sprinkler_sensor_data");

        // Convert the selected date to the format used in the database
        const formattedSelectedDate = new Date(selectedDate).toLocaleDateString();

        // Build the regular expression to match the selected date
        const regex = new RegExp(`^${formattedSelectedDate.replace(/[.,: ]/g, "\\$&")}`);

        // Construct the query to find data for the selected date
        const query = {
            timestamp: { $regex: regex }
        };

        // Fetch data from MongoDB based on the selected date
        const data = await collection.find(query).toArray();

        // Close MongoDB connection
        client.close();

        // Create a PDF document
        const doc = new PDFDocument();

        // Set content type and disposition for the response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=sprinkler_Data_${formattedSelectedDate}.pdf`);

        // Pipe the PDF directly to the response
        doc.pipe(res);

        // Add a header to the PDF
        doc.font('Helvetica-Bold').fontSize(24).text(`Sprinkler Irrigation Data for ${formattedSelectedDate}`, {
            align: 'left'
        });

        // Reset font settings for regular text
        doc.font('Helvetica').fontSize(12);

        // Move down to leave space after the header
        doc.moveDown();

        // Adjust left and right margins
        const leftMargin = 70;
        const rightMargin = 550; // Adjust this value for the right margin

        // Add each data item to the PDF
        data.forEach((item, index) => {
            // Bold the timestamp text and add small spacing
            doc.font('Helvetica-Bold').text(`Timestamp: ${item.timestamp}`).moveDown(0.5);
            doc.font('Helvetica').text(`Soil Moisture1: ${item.field3}`);
            doc.font('Helvetica').text(`Soil Moisture2: ${item.field4}`);

            // Draw a border after each timestamp and its data
            doc.moveTo(leftMargin, doc.y + 5).lineTo(rightMargin, doc.y + 5).stroke();

            // Move down for the next timestamp
            if (index < data.length - 1) {
                doc.moveDown();
            }
        });

        // Finalize the PDF
        doc.end();
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send('Internal Server Error');
    }
});
///////////////////////////////////////////////////////////////////////////////////////
//for ip address
const getLocalIpAddress = () => {
    const nets = networkInterfaces();
    const results = Object.create(null); // or just '{}', an empty object

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 addresses and internal (i.e., 127.0.0.1) addresses
            if (net.family === "IPv4" && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }

    return results;
};

//////////////////////////////////journal/////////////////////////////////////////////////////
app.post('/journal', async (req, res) => {
    try {
      const { input1, input2, seconds } = req.body;
  
      const startDate = new Date();
  
      // Convert the entered date to a localized string
      const enteredDateStr = startDate.toLocaleString();
  
      // Log the entered date, pre-selected cooldown, and the two inputs
      console.log('Entered Date:', enteredDateStr);
      console.log('Input 1:', input1);
      console.log('Input 2:', input2);
  
      // Save the data to MongoDB
      const journalEntry = new journal_mongodb({
        input1,
        input2,

        enteredDateStr, // Save as Date object
      });
      await journalEntry.save();
  
      renderTemplate(res, 'partials/journal');
    } catch (error) {
      console.error('Error handling countdown form submission:', error);
      res.status(500).send('Internal Server Error');
    }
});






////////////////////////countdown///////////////////////////////////////////////////
app.post('/countdown', async (req, res) => {
    try {
        const { expectedDate } = req.body;

        // Convert the inputted date to a localized string
        const formattedExpectedDate = new Date(expectedDate).toLocaleString();

        // Log the formatted date
        console.log('Inputted Date:', formattedExpectedDate);

        // Update or insert the countdown data into MongoDB
        await countdown_mongodb.updateOne({}, { expectedDate: formattedExpectedDate }, { upsert: true });

        res.send('Countdown updated successfully');
    } catch (error) {
        console.error('Error updating countdown:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/countdown', async (req, res) => {
    try {
        const countdown = await countdown_mongodb.findOne();

        // Get the last expected date from the database
        const lastExpectedDate = countdown ? countdown.expectedDate : null;

        // Log the fetched data to the terminal
        console.log('Fetched Countdown Data:', countdown);

        // Render the countdown page with the last expected date
        renderTemplate(res, 'partials/countdown', { lastExpectedDate });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});




  

/////////////////////////////////////////////////////////////////////////////////////////
// Additional routes

const additionalRoutes = ['/settings','/countdown','/countdown_display','/monitor_drip', '/graph_monitor_drip','/monitor_sprinkler' ,'/graph_monitor_sprinkler','/graph_drip_full','/home', '/login','/drip_selectdate','/sprinkler_selectdate','/download','/journal'];
additionalRoutes.forEach(route => {
    // Render additional pages based on the route
    app.get(route, (req, res) => renderTemplate(res, `partials/${route.substring(1)}`));
});

// Start the server
app.listen(port, () => {
    const serverIp = getLocalIpAddress();
    console.log('Server is running on:');
   
    console.log(serverIp);
    console.log(`Server is running on http://localhost:${port}`);
   

    // Fetch and save ThingSpeak data when the server starts
    const intervalMilliseconds = 10000; // 5 seconds
    setInterval(update_drip_mongodb, intervalMilliseconds);
    setInterval(update_sprinkler_mongodb, intervalMilliseconds);

    // Initial execution of the function
    update_drip_mongodb();
    update_sprinkler_mongodb();
});