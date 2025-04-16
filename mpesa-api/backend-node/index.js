import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';

// Load environment variables to the application
dotenv.config();

const app = express(); // Initialize the Express application

// Middleware
app.use(bodyParser.json()); // Parse incoming JSON request bodies
app.use(cors()); // Enable CORS for cross-origin requests

// Function to generate an access token
const getAccessToken = async () => {
    try {
        const credentials = Buffer.from(
            `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
        ).toString('base64');

        // console.log('Authorization Header:', `Basic ${credentials}`); // Debugging log

        const response = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            {
                headers: {
                    Authorization: `Basic ${credentials}`, 
                    // Correct syntax
                },
            }
        );

        console.log('Access Token Response:', response.data); // Log the response

        return response.data.access_token; // Return the access token
    } catch (error) {
        console.error('Error generating access token:', error.response?.data || error.message);
        throw new Error('Failed to generate access token');
    }
};

// Function to generate password for STK push
const generatePassword = () => {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14); // Format timestamp
    const passkey = process.env.MPESA_PASSKEY; // Default passkey for sandbox
    const password = Buffer.from(
        `${process.env.MPESA_SHORTCODE}${passkey}${timestamp}`
    ).toString('base64');

    return { password, timestamp }; // Return password and timestamp
};

// Main STK Push endpoint
app.post('/api/stkpush', async (req, res) => {
    const { amount, phone, reference, description } = req.body; // Destructure request body

    // Validate input data
    if (!amount || !phone || !reference || !description) {
        return res.status(400).json({ error: 'All fields (amount, phone, reference, description) are required' });
    }
    if (!/^2547\d{8}$/.test(phone)) { // Check if phone number matches "2547XXXXXXXX" format
        return res.status(400).json({ error: 'Invalid phone number format. Use 2547XXXXXXXX.' });
    }


    try {
        const accessToken = await getAccessToken(); // Fetch access token
        const { password, timestamp } = generatePassword(); // Generate password and timestamp

        // Prepare payload for STK Push API
        const payload = {
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: phone,
            PartyB: process.env.MPESA_SHORTCODE,
            PhoneNumber: phone,
            CallBackURL: process.env.CALLBACK_URL,
            AccountReference: reference,
            TransactionDesc: description,
        };

        // Make STK Push request to Safaricom's API
        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            payload,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        // Send success response back to the frontend
        res.json({ message: 'STK Push initiated successfully', response: response.data });
    } catch (error) {
        console.error('Error during STK Push:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to initiate STK Push',
            details: error.response?.data || error.message,
        });
    }
});

// Callback Endpoint for M-Pesa
app.post('/api/callback', (req, res) => {
    console.log('Callback received:', req.body); // Log callback data for debugging
    res.status(200).json({ message: 'Callback processed successfully!' }); // Send acknowledgment response
});


// Start the server
const PORT = process.env.PORT || 5000; // Use environment-defined port or default to 3000
app.listen(PORT, () => {
    console.log(`Node.js backend running on http://localhost:${PORT}`);
});