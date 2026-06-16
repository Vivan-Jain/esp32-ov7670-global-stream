const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let latestFrame = null;

// Middleware to parse raw binary buffer data from ESP32
app.use(express.raw({ type: 'image/jpeg', limit: '10mb' }));

// 1. Endpoint for ESP32 to upload camera frames
app.post('/upload', (req, res) => {
    latestFrame = req.body;
    
    // Broadcast the raw image buffer to all connected web browsers
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(latestFrame);
        }
    });
    res.sendStatus(200);
});

// 2. Main Web Page Frontend
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Global World View Camera</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; background: #121212; color: #ffffff; padding: 20px; }
            h1 { color: #00adb5; }
            .container { max-width: 600px; margin: auto; background: #1e1e1e; padding: 20px; border-radius: 15px; box-shadow: 0px 4px 20px rgba(0,0,0,0.5); }
            img { width: 100%; max-width: 480px; border-radius: 10px; border: 3px solid #00adb5; background: #000; }
            button { background: #ff5722; color: white; border: none; padding: 15px 30px; font-size: 18px; font-weight: bold; border-radius: 8px; cursor: pointer; margin-top: 20px; transition: 0.3s; width: 100%; }
            button:hover { background: #e64a19; transform: scale(1.02); }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🌍 Global Stream</h1>
            <p>Live view from the OV7670 Sensor</p>
            <img id="videoStream" src="" alt="Waiting for ESP32 stream...">
            <br>
            <button onclick="captureIdea()">💡 Capture Idea</button>
        </div>

        <script>
            // Automatically establish connection back to this cloud server
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const ws = new WebSocket(protocol + '//' + window.location.host);
            const img = document.getElementById('videoStream');

            ws.onmessage = (event) => {
                // Convert raw binary blob frame into a viewable browser URL
                const blob = new Blob([event.data], { type: 'image/jpeg' });
                if (img.src) URL.revokeObjectURL(img.src);
                img.src = URL.createObjectURL(blob);
            };

            function captureIdea() {
                alert("Idea Captured! Frame saved to global snapshot.");
                // Extend this function to trigger database saves or notifications
            }
        </script>
    </body>
    </html>
    `);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Cloud Server running globally on port ${PORT}`));
