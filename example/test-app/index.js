const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Log middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Generate some test logs every few seconds
setInterval(() => {
    const random = Math.random();
    if (random < 0.3) {
        console.error('Error: Something went wrong!');
    } else if (random < 0.6) {
        console.warn('Warning: Resource usage is high');
    } else {
        console.log('Info: System is running normally');
    }
}, 3000);

// Routes
app.get('/', (req, res) => {
    console.log('Handling root request');
    res.send('Hello from NodeRoll test app!');
});

app.get('/error', (req, res) => {
    console.error('Error endpoint called');
    res.status(500).send('Test error endpoint');
});

// Start server
app.listen(port, () => {
    console.log(`Test app listening at http://localhost:${port}`);
});
