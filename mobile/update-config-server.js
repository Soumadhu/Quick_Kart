const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();

const CONFIG_FILE = path.join(__dirname, 'src', 'services', 'apiConfig.js');
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Endpoint to update the config file
app.post('/api/update-config', (req, res) => {
    const { ip, port = '5000' } = req.body;
    
    if (!ip) {
        return res.status(400).json({ error: 'IP address is required' });
    }

    try {
        // Read the current config file
        let content = fs.readFileSync(CONFIG_FILE, 'utf8');
        
        // Update the hardcoded IP and port
        content = content.replace(
            /const metroIp = '\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}';/,
            `const metroIp = '${ip}';`
        );
        
        // Write the updated content back to the file
        fs.writeFileSync(CONFIG_FILE, content, 'utf8');
        
        console.log(`Updated API config with IP: ${ip} and port: ${port}`);
        res.json({ success: true, message: 'Configuration updated successfully' });
    } catch (error) {
        console.error('Error updating config file:', error);
        res.status(500).json({ error: 'Failed to update configuration' });
    }
});

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'ip-config.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Configuration server running at http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
