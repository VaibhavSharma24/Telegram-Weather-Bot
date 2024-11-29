const { Telegraf } = require('telegraf');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();


const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || 'default_key';
const bot = new Telegraf(BOT_TOKEN);

const DATA_FILE = './users.json';

let users = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) : {};

// Admin Chat IDs
const ADMIN_IDS = [5628659756]; // Replace with your personal Telegram user ID


const saveData = () => fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));


const isAdmin = (ctx) => ADMIN_IDS.includes(ctx.chat.id);


bot.start((ctx) => {
    const chatId = ctx.chat.id;
    if (!users[chatId]) {
        users[chatId] = { subscribed: false, city: '', blocked: false };
        saveData();
    }
    ctx.reply(`Welcome! Use /subscribe <city> to subscribe to weather updates. For help, type /help.`);
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


bot.command('weather', async (ctx) => {
    const city = ctx.message.text.split(' ')[1];
    if (!city) {
        return ctx.reply('Please provide a city name. Example: /weather Agra');
    }

    try {
        const weather = await fetchWeather(city); 
        ctx.reply(weather); 
    } catch (error) {
        console.error(error);
        ctx.reply('Failed to fetch weather data. Please try again later.');
    }
});


bot.command('view_users', (ctx) => {
    if (!isAdmin(ctx)) return ctx.reply('You are not authorized to use this command.');

    const userList = Object.entries(users)
        .map(([id, data]) => `ID: ${id}, Subscribed: ${data.subscribed}, City: ${data.city}, Blocked: ${data.blocked}`)
        .join('\n');
    ctx.reply(userList || 'No users found.');
});

bot.command('block_user', (ctx) => {
    if (!isAdmin(ctx)) return ctx.reply('You are not authorized to use this command.');

    const chatId = ctx.message.text.split(' ')[1];
    if (!chatId) return ctx.reply('Please provide the chat ID of the user to block. Example: /block_user CHAT_ID');

    if (users[chatId]) {
        users[chatId].blocked = true;
        saveData();
        ctx.reply(`User ${chatId} has been blocked.`);
    } else {
        ctx.reply('User not found.');
    }
});

bot.command('delete_user', (ctx) => {
    if (!isAdmin(ctx)) return ctx.reply('You are not authorized to use this command.');

    const chatId = ctx.message.text.split(' ')[1];
    if (!chatId) return ctx.reply('Please provide the chat ID of the user to delete. Example: /delete_user CHAT_ID');

    if (users[chatId]) {
        delete users[chatId];
        saveData();
        ctx.reply(`User ${chatId} has been deleted.`);
    } else {
        ctx.reply('User not found.');
    }
});


const fetchWeather = async (city) => {
    try {
        const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`;
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

setInterval(sendWeatherUpdates, 3600000); // Send updates every hour

// Launch the Bot
bot.launch().then(() => console.log('Bot is running...'));



