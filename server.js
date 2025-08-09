const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Email configuration (replace with your actual credentials)
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Business owner contact
const businessOwner = {
    name: 'Jeffrey Benjamin',
    phone: '(931) 367-7327',
    email: 'jbenjamin@titantotalpros.com'
};

// Technicians data
const technicians = [
    { id: 1, name: 'John Smith', phone: '(931) 555-0101', email: 'john@titantotalpros.com', services: ['tv-mounting', 'audio'] },
    { id: 2, name: 'Mike Johnson', phone: '(931) 555-0102', email: 'mike@titantotalpros.com', services: ['security', 'networking'] },
    { id: 3, name: 'Sarah Wilson', phone: '(931) 555-0103', email: 'sarah@titantotalpros.com', services: ['smart-home', 'lighting'] }
];

// Store bookings in memory (in production, use a database)
let bookings = [];

// API Routes
app.post('/api/bookings', async (req, res) => {
    try {
        const booking = {
            id: Date.now().toString(),
            ...req.body,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        bookings.push(booking);
        
        // Save to file (in production, save to database)
        await saveBookingsToFile();
        
        // Send notifications
        await sendNotifications(booking);
        
        res.json({ 
            success: true, 
            message: 'Booking submitted successfully',
            bookingId: booking.id 
        });
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to submit booking' 
        });
    }
});

// Get all bookings (for admin dashboard)
app.get('/api/bookings', (req, res) => {
    res.json(bookings);
});

// Update booking status
app.put('/api/bookings/:id', (req, res) => {
    const { id } = req.params;
    const { status, technicianId } = req.body;
    
    const bookingIndex = bookings.findIndex(b => b.id === id);
    if (bookingIndex === -1) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    bookings[bookingIndex].status = status;
    if (technicianId) {
        bookings[bookingIndex].technicianId = technicianId;
        bookings[bookingIndex].assignedAt = new Date().toISOString();
    }
    
    saveBookingsToFile();
    res.json({ success: true, booking: bookings[bookingIndex] });
});

// Send notifications to business owner and customer
async function sendNotifications(booking) {
    try {
        // Send email to business owner
        await transporter.sendMail({
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: businessOwner.email,
            subject: `New Booking: ${booking.service}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #003366;">New Service Booking</h2>
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #0099cc; margin-top: 0;">Booking Details</h3>
                        <p><strong>Service:</strong> ${booking.service}</p>
                        <p><strong>Customer:</strong> ${booking.customerName}</p>
                        <p><strong>Phone:</strong> ${booking.customerPhone}</p>
                        <p><strong>Email:</strong> ${booking.customerEmail}</p>
                        <p><strong>Address:</strong> ${booking.serviceAddress}</p>
                        <p><strong>Estimated Total:</strong> ${booking.totalAmount}</p>
                        <p><strong>Notes:</strong> ${booking.notes || 'None'}</p>
                        <p><strong>Booking ID:</strong> ${booking.id}</p>
                        <p><strong>Submitted:</strong> ${new Date(booking.timestamp).toLocaleString()}</p>
                    </div>
                    <p><a href="mailto:${booking.customerEmail}" style="background: #0099cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Contact Customer</a></p>
                    <p><a href="tel:${booking.customerPhone}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-left: 10px;">Call Customer</a></p>
                </div>
            `
        });
        
        // Send confirmation to customer
        await transporter.sendMail({
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: booking.customerEmail,
            subject: 'Booking Confirmation - Titan Total Pros',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #003366;">Thank You for Your Booking!</h2>
                    <p>Dear ${booking.customerName},</p>
                    <p>We've received your request for <strong>${booking.service}</strong> and will contact you within 24 hours to schedule your appointment.</p>
                    
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #0099cc; margin-top: 0;">Booking Summary</h3>
                        <p><strong>Service:</strong> ${booking.service}</p>
                        <p><strong>Estimated Total:</strong> ${booking.totalAmount}</p>
                        <p><strong>Preferred Contact:</strong> ${booking.customerPhone}</p>
                    </div>
                    
                    <p>If you have any questions, please call us at <strong>${businessOwner.phone}</strong>.</p>
                    <p>Best regards,<br><strong>Titan Total Pros Team</strong></p>
                </div>
            `
        });
        
        console.log('Notifications sent successfully');
    } catch (error) {
        console.error('Notification error:', error);
    }
}

// Assign booking to technician
function assignTechnician(serviceType) {
    // Simple assignment logic (in production, use more sophisticated logic)
    const availableTechs = technicians.filter(tech => 
        tech.services.includes(serviceType)
    );
    
    if (availableTechs.length === 0) return null;
    
    // For demo, assign to first available technician
    return availableTechs[0];
}

// Save bookings to file
async function saveBookingsToFile() {
    try {
        await fs.writeFile(
            path.join(__dirname, 'bookings.json'), 
            JSON.stringify(bookings, null, 2)
        );
    } catch (error) {
        console.error('Error saving bookings:', error);
    }
}

// Load bookings from file
async function loadBookingsFromFile() {
    try {
        const data = await fs.readFile(
            path.join(__dirname, 'bookings.json'), 
            'utf8'
        );
        bookings = JSON.parse(data);
    } catch (error) {
        console.log('No existing bookings file found, starting fresh');
        bookings = [];
    }
}

// Initialize
loadBookingsFromFile().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`API endpoint: http://localhost:${PORT}/api/bookings`);
    });
});

// Export for testing
module.exports = app;
