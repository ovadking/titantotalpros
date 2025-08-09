const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let bookings = [];

app.get('/', (req, res) => {
  res.json({ 
    message: 'Titan Booking System API', 
    status: 'running' 
  });
});

app.get('/api/bookings', (req, res) => {
  res.json(bookings);
});

app.post('/api/bookings', (req, res) => {
  const booking = {
    id: Date.now().toString(),
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  bookings.push(booking);
  
  res.status(201).json({ 
    success: true, 
    message: 'Booking submitted successfully',
    bookingId: booking.id 
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
