import React, { useState } from "react";
import axios from "axios";

const MpesaPayment = () => {
    const [formData, setFormData] = useState({
        amount: "",
        phone: "",
        reference: "",
        description: "",
    });

    const [loading, setLoading] = useState(false); // For loading state
    const [message, setMessage] = useState(""); // For success or error feedback

    // Handle input change dynamically
    const handleFormData = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        const correctedPhone = formData.phone.replace(/^0/, "254"); // Replace leading '0' with '254'
        const updatedFormData = { ...formData, phone: correctedPhone };

        setLoading(true); // Show loading indicator
        setMessage(""); // Clear previous messages
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_BASE_URL}`, 
                updatedFormData
            );
            setMessage(`Success! ${response.data.message}`);
        } catch (error) {
            setMessage("Error: Could not initiate payment. Please try again.");
            console.error("Error:", error);
        } finally {
            setLoading(false); // Hide loading indicator
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Initiate M-Pesa Payment</h2>
            
            <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={formData.amount}
                onChange={handleFormData}
                required
            />

            <input
                type="tel"
                name="phone"
                placeholder="Phone Number (e.g., 254700123456)"
                value={formData.phone}
                onChange={handleFormData}
                required
            />

            <input
                type="text"
                name="reference"
                placeholder="Reference"
                value={formData.reference}
                onChange={handleFormData}
                required
            />

            <input
                type="text"
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleFormData}
                required
            />

            <button type="submit" disabled={loading}>
                {loading ? "Processing..." : "Initiate Payment"}
            </button>

            {message && <p>{message}</p>} {/* Display success or error messages */}
        </form>
    );
};

export default MpesaPayment;