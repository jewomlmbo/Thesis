// sensor1.js

const axios = require('axios');
const { MongoClient } = require('mongodb');

// ThingSpeak API endpoint and channel ID
const thingspeakUrl = "https://api.thingspeak.com/channels/2357301/feeds.json";
const apiKey = "9C9EWD0HC4WSXRCZ";

// MongoDB connection settings
const mongoUrl = "mongodb+srv://jerome:jerome@thesis.ags8rwk.mongodb.net/?retryWrites=true&w=majority&appName=Thesis";
const dbName = "Thesis";
const collectionName = "drip_sensor_data";

// Function to fetch data from ThingSpeak and save it to MongoDB
async function save_drip_mongodb() {
    try {
        // Connect to MongoDB
        const client = await MongoClient.connect(mongoUrl);
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Fetch data from ThingSpeak
        const response = await axios.get(thingspeakUrl, { params: { api_key: apiKey } });
        const data = response.data.feeds;

        // Insert data into MongoDB (avoid duplicates based on timestamp)
        for (const entry of data) {
            const formattedTimestamp = new Date(entry.created_at).toLocaleString();
            const existingEntry = await collection.findOne({ timestamp: formattedTimestamp });

            if (!existingEntry) {
                const entryData = {
                    timestamp: formattedTimestamp,
                    field1: entry.field1,
                    field2: entry.field2,
                    field3: entry.field3,
                    field4: entry.field4,
                    field5: entry.field5,
                    field6: entry.field6,
                    // Add more fields as needed
                };

                await collection.insertOne(entryData);
                // console.log(`Data inserted into MongoDB: ${JSON.stringify(entryData)}`);
            } else {
                // console.log(`Duplicate entry found, skipping: ${JSON.stringify(entry)}`);
            }
        }

        // Indicate that all data has been saved
        // console.log("DALE POGI");

        // Close MongoDB connection
        client.close();
        return data;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}


// Function to continuously update MongoDB with ThingSpeak data
async function update_drip_mongodb() {
    try {
        // Call the save_drip_mongodb function to get the data
        const data = await save_drip_mongodb();
    } catch (error) {
        console.error("Error updating MongoDB with ThingSpeak data:", error);
    }
}

// Export the update_drip_mongodb function directly
module.exports = { update_drip_mongodb, save_drip_mongodb };
