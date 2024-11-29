# Telegram-Weather-Bot
 Telegram Bot to get Weather Updates


## Overview
A Telegram bot that provides real-time weather updates using the OpenWeatherMap API. Users can subscribe to daily weather updates for their city, and admins can manage users with commands like block, delete, and view.

## Features

**1. Clone the Repository**


```bash
git clone https://github.com/your-username/telegram-weather-bot.git
cd telegram-weather-bot
```

**2. Install Dependencies**

Navigate to the src directory and install the required packages:

```bash
npm install
```

**3. Create a .env file in the root directory with the following keys:**

```bash
BOT_TOKEN=your_telegram_bot_token
WEATHER_API_KEY=your_openweathermap_api_key
```
### Running the bot

Start the bot:

```bash
node bot.js
```

### Automatic Updates:
- Sends hourly weather updates to subscribed users.

### User Commands
| Command               | Description                                  |
|-----------------------|----------------------------------------------|
| \`/start\`              | Initialize the bot.                         |
| \`/subscribe <city>\`   | Subscribe to weather updates for a city.     |
| \`/unsubscribe\`        | Unsubscribe from weather updates.            |
| \`/weather <city>\`     | Get current weather for a city.              |
| \`/help\`               | Display help information.                    |

### Admin Commands
| Command                  | Description                                         |
|--------------------------|-----------------------------------------------------|
| \`/view_users\`            | View a list of all users and their details.         |
| \`/block_user <chat_id>\`  | Block a user by their Telegram chat ID.             |
| \`/delete_user <chat_id>\` | Delete a user from the database by their chat ID.   |

---


>Note : 
License
This project is licensed under the MIT License. See the LICENSE file for details.

Feel free to modify any sections to better fit the specifics of your project or additional instructions!
