const { Telegraf } = require('telegraf');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();


const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const bot = new Telegraf(BOT_TOKEN);
const app = express();
const PORT = 3000;

app.use(bodyParser.json());


const DATA_FILE = './users.json';
const SETTINGS_FILE = './settings.json';


let users = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) : {};
let settings = fs.existsSync(SETTINGS_FILE) ? JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) : { WEATHER_API_KEY: 'default_key' };


const saveData = () => fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
const saveSettings = () => fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));


bot.start((ctx) => {
    const chatId = ctx.chat.id;
    if (!users[chatId]) {
        users[chatId] = { subscribed: false, city: '', blocked: false };
        saveData();
    }
    ctx.reply('Welcome! Use /subscribe <city> to subscribe to weather updates.');
});


bot.command('subscribe', (ctx) => {
    const chatId = ctx.chat.id;
    const city = ctx.message.text.split(' ')[1];

    if (!city) {
        return ctx.reply('Please specify a city. Example: /subscribe London');
    }

    if (users[chatId]?.blocked) {
        return ctx.reply('You are blocked from using this bot.');
    }

    users[chatId] = { subscribed: true, city, blocked: false };
    saveData();
    ctx.reply(`You have subscribed to weather updates for ${city}.`);
});


bot.command('unsubscribe', (ctx) => {
    const chatId = ctx.chat.id;

    if (users[chatId]) {
        users[chatId].subscribed = false;
        saveData();
        ctx.reply('You have unsubscribed from weather updates.');
    } else {
        ctx.reply('You are not subscribed yet.');
    }
});


app.get('/', (req, res) => {
    res.status(200).send(`
        <h1>Welcome to the Admin Panel</h1>
        <p>Use the following API endpoints to manage the bot:</p>
        <ul>
            <li><strong>POST /admin/update-settings</strong> - Update API keys.</li>
            <li><strong>GET /admin/users</strong> - View subscribed users.</li>
            <li><strong>POST /admin/block-user</strong> - Block a user by chat ID.</li>
            <li><strong>POST /admin/delete-user</strong> - Delete a user by chat ID.</li>
        </ul>
    `);
});


app.post('/admin/update-settings', (req, res) => {
    const { WEATHER_API_KEY } = req.body;

    if (WEATHER_API_KEY) {
        settings.WEATHER_API_KEY = WEATHER_API_KEY;
        saveSettings();
        return res.status(200).json({ message: 'Settings updated successfully.' });
    }

    res.status(400).json({ message: 'Invalid input.' });
});

app.get('/admin/users', (req, res) => {
    res.status(200).json(users);
});

app.post('/admin/block-user', (req, res) => {
    const { chatId } = req.body;

    if (users[chatId]) {
        users[chatId].blocked = true;
        saveData();
        return res.status(200).json({ message: `User ${chatId} blocked successfully.` });
    }

    res.status(404).json({ message: 'User not found.' });
});


app.post('/admin/delete-user', (req, res) => {
    const { chatId } = req.body;

    if (users[chatId]) {
        delete users[chatId];
        saveData();
        return res.status(200).json({ message: `User ${chatId} deleted successfully.` });
    }

    res.status(404).json({ message: 'User not found.' });
});


const fetchWeather = async (city) => {
    try {
        const apiKey = settings.WEATHER_API_KEY;
        const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
        const response = await axios.get(url);
        const data = response.data;
        return `Weather in ${data.name}: ${data.weather[0].description}, Temperature: ${data.main.temp}°C.`;
    } catch (error) {
        console.error(error.message);
        return 'Failed to fetch weather data. Please check the city name.';
    }
};

const sendWeatherUpdates = async () => {
    for (const chatId in users) {
        if (users[chatId].subscribed && users[chatId].city && !users[chatId].blocked) {
            const weather = await fetchWeather(users[chatId].city);
            bot.telegram.sendMessage(chatId, weather);
        }
    }
};

setInterval(sendWeatherUpdates, 3600000); 


bot.launch().then(() => console.log('Bot is running...'));


app.listen(PORT, () => {
    console.log(`Admin panel running at http://localhost:${PORT}`);
});
