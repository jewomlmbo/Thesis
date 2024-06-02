
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


app.post('/select_date_drip', async (req, res) => {
    try {
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);

        // Adjust the date formats for console logging
        const formattedStartDate = startDate.toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        const formattedEndDate = endDate.toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

        // Log start and end dates
        console.log('Start Date:', formattedStartDate);
        console.log('End Date:', formattedEndDate);

        // Connect to MongoDB
        const client = await MongoClient.connect(mongo_link);
        const db = client.db("Thesis");
        const collection = db.collection("drip_sensor_data");

        // Convert start and end dates to timestamps
        const startTimestamp = startDate.getTime();
        const endTimestamp = endDate.getTime();

        // Fetch data from MongoDB
        const data = await collection.find().toArray();

        // Filter data based on the timestamp range
        const filteredData = data.filter(item => {
            const itemTimestamp = new Date(item.timestamp).getTime();
            return itemTimestamp >= startTimestamp && itemTimestamp <= endTimestamp;
        });

        // Log the fetched data
        //console.log('Fetched Data:', filteredData);

        // Close MongoDB connection
        client.close();

        // Render the HTML template with the fetched data
        res.render('partials/drip_selectdate', { data: filteredData, selectedData: filteredData });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send('Internal Server Error');
    }
});



app.post('/download_drip', async (req, res) => {
    try {
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);

        // Adjust the date formats for console logging
        const formattedStartDate = startDate.toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        const formattedEndDate = endDate.toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

        // Log start and end dates
        console.log('Start Date download:', formattedStartDate);
        console.log('End Date download:', formattedEndDate);

        // Connect to MongoDB
        const client = await MongoClient.connect(mongo_link);
        const db = client.db("Thesis");
        const collection = db.collection("drip_sensor_data");

        // Convert start and end dates to timestamps
        const startTimestamp = startDate.getTime();
        const endTimestamp = endDate.getTime();

        // Fetch data from MongoDB
        const data = await collection.find().toArray();

        // Filter data based on the timestamp range
        const filteredData = data.filter(item => {
            const itemTimestamp = new Date(item.timestamp).getTime();
            return itemTimestamp >= startTimestamp && itemTimestamp <= endTimestamp;
        });

        // Log the fetched data
        console.log('Filtered Data:', filteredData);

        // Close MongoDB connection
        client.close();

        // Create a new PDF document
        const doc = new PDFDocument();

        // Set response headers for the PDF
        const filename = `DripData_${formattedStartDate}_to_${formattedEndDate}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe the PDF document directly to the response
        doc.pipe(res);

        // Add content to the PDF document
        doc.fontSize(20).text(`Drip Irrigation Data (${formattedStartDate} to ${formattedEndDate})`, { align: 'center' });
        doc.moveDown();

        // Add table header
       // Add table header
doc.fontSize(11).font('Helvetica-Bold');
doc.text('Timestamp', { width: 200, align: 'left' });
doc.moveUp(); // Move the cursor up to align with the previous line
doc.text('temperature', { width: 300, align: 'center' });
doc.moveUp(); // Move the cursor up to align with the previous line
doc.text('humidity', { width: 425, align: 'center' });
doc.moveUp(); // Move the cursor up to align with the previous line
doc.text('Sensor 1', { width: 550, align: 'center' });
doc.moveUp(); // Move the cursor up to align with the previous line
doc.text('Sensor 2', { width: 675, align: 'center' });
doc.moveUp(); // Move the cursor up to align with the previous line
doc.text('Sensor 3', { width: 800, align: 'center' });
doc.moveUp(); // Move the cursor up to align with the previous line
doc.text('Sensor 4', { width: 925, align: 'center' });
doc.moveDown(); // Move the cursor down to leave space after the header

// Add data rows
doc.font('Helvetica').fontSize(10);
filteredData.forEach((data, index) => {
    // Add data to PDF document, handling undefined values gracefully
    doc.text(data.timestamp || '', { width: 200, align: 'left' });
    doc.moveUp(); // Move the cursor up to align with the previous line
    doc.text(data.field1 ? data.field1.toString() : 'Nan', { width: 300, align: 'center' }); // Map field3 to Sensor 1
    doc.moveUp(); // Move the cursor up to align with the previous line
    doc.text(data.field2 ? data.field2.toString() : 'Nan', { width: 425, align: 'center' }); // Map field3 to Sensor 1
    doc.moveUp(); // Move the cursor up to align with the previous line
    doc.text(data.field3 ? data.field3.toString() : 'Nan', { width: 550, align: 'center' }); // Map field3 to Sensor 1
    doc.moveUp(); 
    doc.text(data.field4 ? data.field4.toString() : 'Nan', {  width: 675, align: 'center'}); // Map field4 to Sensor 2
    doc.moveUp(); 
    doc.text(data.field5 ? data.field5.toString() : 'Nan', { width: 800, align: 'center' }); // Map field5 to Sensor 3
    doc.moveUp(); 
    doc.text(data.field6 ? data.field6.toString() : 'Nan', {  width: 925, align: 'center'}); // Map field6 to Sensor 4
    doc.moveDown();

    const lineLength = 490; // Adjust the length of the line as needed
    const startY = doc.y - 10; // Move up slightly to draw the line above the text
    const endY = startY + 1; // Set the end Y coordinate of the line
    doc.moveTo(65, startY).lineTo(65 + lineLength, startY).stroke(); // Adjust the starting and ending X coordinates based on your table width
    
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


app.post('/select_date_sprinkler', async (req, res) => {
    try {
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);

        // Adjust the date formats for console logging
        const formattedStartDate = startDate.toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        const formattedEndDate = endDate.toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

        // Log start and end dates
        console.log('Start Date:', formattedStartDate);
        console.log('End Date:', formattedEndDate);

        // Connect to MongoDB
        const client = await MongoClient.connect(mongo_link);
        const db = client.db("Thesis");
        const collection = db.collection("sprinkler_sensor_data");

        // Convert start and end dates to timestamps
        const startTimestamp = startDate.getTime();
        const endTimestamp = endDate.getTime();

        // Fetch data from MongoDB
        const data = await collection.find().toArray();

        // Filter data based on the timestamp range
        const filteredData = data.filter(item => {
            const itemTimestamp = new Date(item.timestamp).getTime();
            return itemTimestamp >= startTimestamp && itemTimestamp <= endTimestamp;
        });

        // Log the fetched data
        //console.log('Fetched Data:', filteredData);

        // Close MongoDB connection
        client.close();

        // Render the HTML template with the fetched data
        res.render('partials/sprinkler_selectdate', { data: filteredData, selectedData: filteredData });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/download_sprinkler', async (req, res) => {
    try {
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);

        // Adjust the date formats for console logging
        const formattedStartDate = startDate.toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        const formattedEndDate = endDate.toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

        // Log start and end dates
        console.log('Start Date download:', formattedStartDate);
        console.log('End Date download:', formattedEndDate);

        // Connect to MongoDB
        const client = await MongoClient.connect(mongo_link);
        const db = client.db("Thesis");
        const collection = db.collection("sprinkler_sensor_data");

        // Convert start and end dates to timestamps
        const startTimestamp = startDate.getTime();
        const endTimestamp = endDate.getTime();

        // Fetch data from MongoDB
        const data = await collection.find().toArray();

        // Filter data based on the timestamp range
        const filteredData = data.filter(item => {
            const itemTimestamp = new Date(item.timestamp).getTime();
            return itemTimestamp >= startTimestamp && itemTimestamp <= endTimestamp;
        });

        // Log the fetched data
        console.log('Filtered Data:', filteredData);

        // Close MongoDB connection
        client.close();

        // Create a new PDF document
        const doc = new PDFDocument();

        // Set response headers for the PDF
        const filename = `SprinklerData\\\_${formattedStartDate}_to_${formattedEndDate}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe the PDF document directly to the response
        doc.pipe(res);

        // Add content to the PDF document
        doc.fontSize(20).text(`Sprinkler Irrigation Data (${formattedStartDate} to ${formattedEndDate})`, { align: 'center' });
        doc.moveDown();

        // Add table header
       // Add table header
doc.fontSize(12).font('Helvetica-Bold');
doc.text('Timestamp', { width: 200, align: 'left' });
doc.moveUp(); // Move the cursor up to align with the previous line
doc.text('Sensor 1', { width: 375, align: 'center' });
doc.moveUp(); // Move the cursor up to align with the previous line
doc.text('Sensor 2', { width: 550, align: 'center' });
doc.moveUp(); // Move the cursor up to align with the previous line
doc.text('Sensor 3', { width: 725, align: 'center' });
doc.moveUp(); // Move the cursor up to align with the previous line
doc.text('Sensor 4', { width: 900, align: 'center' });
doc.moveDown(); // Move the cursor down to leave space after the header

// Add data rows
doc.font('Helvetica').fontSize(10);
filteredData.forEach((data, index) => {
    // Add data to PDF document, handling undefined values gracefully
    doc.text(data.timestamp || '', { width: 200, align: 'left' });
    doc.moveUp(); // Move the cursor up to align with the previous line
    doc.text(data.field3 ? data.field3.toString() : 'Nan', { width: 375, align: 'center' }); // Map field3 to Sensor 1
    doc.moveUp(); 
    doc.text(data.field4 ? data.field4.toString() : 'Nan', {  width: 550, align: 'center'}); // Map field4 to Sensor 2
    doc.moveUp(); 
    doc.text(data.field5 ? data.field5.toString() : 'Nan', { width: 725, align: 'center' }); // Map field5 to Sensor 3
    doc.moveUp(); 
    doc.text(data.field6 ? data.field6.toString() : 'Nan', {  width: 900, align: 'center'}); // Map field6 to Sensor 4
    doc.moveDown();

    const lineLength = 490; // Adjust the length of the line as needed
    const startY = doc.y - 10; // Move up slightly to draw the line above the text
    const endY = startY + 1; // Set the end Y coordinate of the line
    doc.moveTo(65, startY).lineTo(65 + lineLength, startY).stroke(); // Adjust the starting and ending X coordinates based on your table width
    
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
      const { input1, input2 } = req.body;

  
      // Convert the entered date to a localized string
  
      // Log the entered date, pre-selected cooldown, and the two inputs

      console.log('Input 1:', input1);
      console.log('Input 2:', input2);
  
      // Save the data to MongoDB
      const journalEntry = new journal_mongodb({
        input1,
        input2,
      });
      await journalEntry.save();
  
      res.status(200).send('Journal entry saved successfully');
    } catch (error) {
      console.error('Error handling countdown form submission:', error);
      res.status(500).send('Internal Server Error');
    }
});






////////////////////////countdown///////////////////////////////////////////////////
app.post('/countdown', async (req, res) => {
    try {
        const { expectedDate } = req.body;

        // Log the received date
        console.log('Received Date:', expectedDate);

        // Convert the inputted date to a JavaScript Date object
        const formattedExpectedDate = new Date(expectedDate);

        // Log the formatted date
        console.log('Inputted Date:', formattedExpectedDate);

        // Update or insert the countdown data into MongoDB
        await countdown_mongodb.updateOne({}, { expectedDate: formattedExpectedDate }, { upsert: true });

        // Send the updated date back to the client
        res.json({ expectedDate: formattedExpectedDate });
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
        //console.log('Fetched Countdown Data:', countdown);

        // Render the countdown page with the last expected date
        renderTemplate(res, 'partials/countdown', { lastExpectedDate });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});




  

/////////////////////////////////////////////////////////////////////////////////////////
// Additional routes

const additionalRoutes = ['/about_us','/update-date','/settings','/countdown','/countdown_display','/monitor_drip', '/graph_monitor_drip','/monitor_sprinkler' ,'/graph_monitor_sprinkler','/graph_drip_full','/home', '/login','/drip_selectdate','/sprinkler_selectdate','/download','/journal'];
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
