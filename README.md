# Screenshot Share Chrome Extension

A Chrome extension that allows you to take screenshots of webpages and share them via URLs.

## Features

- Capture full-page screenshots with a right-click
- Generate shareable links for screenshots
- Copy screenshots directly to clipboard
- Save screenshots to your device
- Upload screenshots to a local server

## Installation

1. Clone this repository
2. Go to chrome://extensions/ in your Chrome browser
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

## Server Setup

1. Navigate to the server directory
2. Install dependencies: `npm install`
3. Start the server: `node server.js`
4. Server will run at http://localhost:3000

## Usage

1. Right-click anywhere on a webpage and select "Share screenshot"
2. Click the extension icon to view, copy, or share the screenshot
3. Click "Upload to Server" to generate a shareable link

## Technologies Used

- Chrome Extension APIs
- JavaScript
- Node.js
- Express

## License

[MIT](LICENSE)
