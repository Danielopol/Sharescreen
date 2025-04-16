// server.js - A simple Express server for local image hosting
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Enable CORS for your Chrome extension
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Handle base64 image uploads
app.post('/upload', (req, res) => {
  try {
    // Extract the base64 data from the request
    const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
    
    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `screenshot_${timestamp}.png`;
    const filepath = path.join('uploads', filename);
    
    // Write the file
    fs.writeFileSync(filepath, base64Data, { encoding: 'base64' });
    
    // Return the URL (in local development this will be localhost)
    const fileUrl = `http://localhost:${port}/uploads/${filename}`;
    console.log(`New screenshot saved: ${filename}`);
    
    res.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Error saving image:', error);
    res.status(500).json({ success: false, error: 'Failed to save image' });
  }
});

// Simple endpoint to check if the server is running
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Screenshot Service</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          .image-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-top: 20px; }
          .image-item { border: 1px solid #ddd; border-radius: 4px; overflow: hidden; }
          .image-item img { width: 100%; height: auto; display: block; }
          .image-info { padding: 8px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Screenshot Service</h1>
        <p>Your local image hosting server is running!</p>
        <h2>Recent Screenshots</h2>
        <div class="image-grid" id="images">Loading...</div>
        
        <script>
          // Fetch and display images
          fetch('/list')
            .then(response => response.json())
            .then(data => {
              const imagesDiv = document.getElementById('images');
              if (data.images.length === 0) {
                imagesDiv.innerHTML = '<p>No screenshots yet. Use your Chrome extension to take some!</p>';
                return;
              }
              
              let html = '';
              data.images.forEach(image => {
                html += '<div class="image-item">';
                html += '<a href="/uploads/' + image.filename + '" target="_blank">';
                html += '<img src="/uploads/' + image.filename + '" alt="' + image.filename + '" />';
                html += '</a>';
                html += '<div class="image-info">';
                html += new Date(image.timestamp).toLocaleString();
                html += '</div>';
                html += '</div>';
              });
              
              imagesDiv.innerHTML = html;
            });
        </script>
      </body>
    </html>
  `);
});

// Endpoint to list all images
app.get('/list', (req, res) => {
  try {
    const files = fs.readdirSync('uploads');
    const images = files
      .filter(file => file.startsWith('screenshot_'))
      .map(filename => {
        const stats = fs.statSync(path.join('uploads', filename));
        const timestamp = parseInt(filename.replace('screenshot_', '').replace('.png', ''));
        return {
          filename,
          timestamp,
          size: stats.size,
          url: `http://localhost:${port}/uploads/${filename}`
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
    
    res.json({ success: true, images });
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ success: false, error: 'Failed to list images' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Screenshot server running at http://localhost:${port}`);
  console.log(`View your screenshots at http://localhost:${port}`);
});