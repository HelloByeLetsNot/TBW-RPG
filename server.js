const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/leaderboard', (req, res) => {
    fs.readFile('leaderboard.json', (err, data) => {
        if (err) {
            res.status(500).send('Error reading leaderboard data');
            return;
        }
        try {
            const leaderboard = JSON.parse(data);
            res.json(leaderboard);
        } catch (parseErr) {
            res.status(500).send('Error parsing leaderboard data');
        }
    });
});

app.post('/leaderboard', (req, res) => {
    const newEntry = req.body;
    fs.readFile('leaderboard.json', (err, data) => {
        if (err) {
            res.status(500).send('Error reading leaderboard data');
            return;
        }
        let leaderboard;
        try {
            leaderboard = JSON.parse(data);
        } catch (parseErr) {
            res.status(500).send('Error parsing leaderboard data');
            return;
        }
        leaderboard.push(newEntry);
        fs.writeFile('leaderboard.json', JSON.stringify(leaderboard, null, 2), err => {
            if (err) {
                res.status(500).send('Error saving leaderboard data');
                return;
            }
            res.send('Leaderboard updated successfully');
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});