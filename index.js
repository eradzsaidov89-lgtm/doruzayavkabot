
require('dotenv').config();

const express = require('express');
const { Telegraf, Markup } = require('telegraf');

const app = express();

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = Number(process.env.ADMIN_ID);
const WEB_APP_URL = process.env.WEB_APP_URL;

if (!BOT_TOKEN || !ADMIN_ID || !WEB_APP_URL) {
    throw new Error('BOT_TOKEN, ADMIN_ID ё WEB_APP_URL танзим нашудаанд!');
}

if (!WEB_APP_URL.startsWith('https://')) {
    throw new Error('WEB_APP_URL бояд HTTPS бошад!');
}

const bot = new Telegraf(BOT_TOKEN);

app.use(express.json());

// ===============================
// SERVER
// ===============================

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Подать заявку</title>

<script src="https://telegram.org/js/telegram-web-app.js"></script>

<style>
* {
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    background: #eef3f8;
    padding: 20px;
    margin: 0;
}

.container {
    max-width: 450px;
    margin: 20px auto;
    padding: 25px;
    background: white;
    border-radius: 18px;
    box-shadow: 0 5px 20px rgba(0,0,0,0.08);
}

h2 {
    text-align: center;
    color: #1688e8;
    margin-bottom: 25px;
}

label {
    display: block;
    margin: 16px 0 7px;
    font-weight: bold;
    color: #333;
}

input, textarea {
    display: block;
    width: 100%;
    padding: 14px;
    border: 1px solid #d5dce5;
    border-radius: 10px;
    font-size: 16px;
    outline: none;
}

input:focus, textarea:focus {
    border-color: #1688e8;
}

textarea {
    min-height: 110px;
    resize: vertical;
}

button {
    width: 100%;
    padding: 14px;
    margin-top: 15px;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    cursor: pointer;
}

.submit {
    background: #1688e8;
    color: white;
}

.clear {
    background: #e8edf3;
    color: #333;
}

button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

#status {
    text-align: center;
    margin-top: 15px;
    font-size: 14px;
}
</style>
</head>

<body>

<div class="container">

<h2>📋 Подать заявку</h2>

<form id="orderForm">

<label>👤 Имя</label>
<input
    type="text"
    name="name"
    placeholder="Введите имя"
    maxlength="50"
    required
>

<label>👤 Фамилия</label>
<input
    type="text"
    name="surname"
    placeholder="Введите фамилию"
    maxlength="50"
    required
>

<label>📞 Номер телефона</label>
<input
    type="tel"
    name="phone"
    placeholder="+992XXXXXXXXX"
    maxlength="20"
    required
>

<label>🏢 Заказчик</label>
<input
    type="text"
    name="customer"
    placeholder="Введите заказчика"
    maxlength="100"
    required
>

<label>💊 Дорухо</label>
<textarea
    name="medicines"
    placeholder="Введите список лекарств"
    maxlength="2000"
    required
></textarea>

<button type="submit" class="submit" id="sendBtn">
✅ Отправить заявку
</button>

<button type="reset" class="clear">
🗑 Очистить
</button>

</form>

<div id="status"></div>

</div>

<script>
const tg = window.Telegram.WebApp;

tg.ready();
tg.expand();

const form = document.getElementById('orderForm');
const sendBtn = document.getElementById('sendBtn');
const status = document.getElementById('status');

form.addEventListener('submit', function(e) {

    e.preventDefault();

    if (!tg.initData) {
        status.textContent =
            '❌ Откройте форму через Telegram.';
        return;
    }

    const data = Object.fromEntries(
        new FormData(form).entries()
    );

    sendBtn.disabled = true;
    sendBtn.textContent = 'Отправка...';

    try {
        tg.sendData(JSON.stringify(data));
    } catch (error) {
        status.textContent = '❌ Ошибка отправки.';
        sendBtn.disabled = false;
        sendBtn.textContent = '✅ Отправить заявку';
    }

});

form.addEventListener('reset', function() {
    status.textContent = '';
});

</script>

</body>
</html>
    `);
});

// Санҷиши сервер
app.get('/health', (req, res) => {
    res.status(200).send('Bot server is running!');
});

// ===============================
// TELEGRAM BOT
// ===============================

// START
bot.start(async (ctx) => {

    await ctx.reply(
        'Салом! 👋\n\nБарои фиристодани заявка тугмаро зер кунед.',
        Markup.keyboard([
            [
                Markup.button.webApp(
                    '📋 Подать заявку',
                    WEB_APP_URL
                )
            ]
        ]).resize()
    );

});

// HELP
bot.help(async (ctx) => {
    await ctx.reply(
        'Барои фиристодани заявка тугмаи 📋 Подать заявку-ро зер кунед.'
    );
});

// ===============================
// RECEIVE APPLICATION
// ===============================

bot.on('message', async (ctx) => {

    const data = ctx.message.web_app_data;

    if (!data) return;

    try {

        const order = JSON.parse(data.data);

        const name = String(order.name || '').trim();
        const surname = String(order.surname || '').trim();
        const phone = String(order.phone || '').trim();
        const customer = String(order.customer || '').trim();
        const medicines = String(order.medicines || '').trim();

        if (
            !name ||
            !surname ||
            !phone ||
            !customer ||
            !medicines
        ) {
            return ctx.reply('❌ Лутфан ҳамаи майдонҳоро пур кунед.');
        }

        if (
            name.length > 50 ||
            surname.length > 50 ||
            phone.length > 20 ||
            customer.length > 100 ||
            medicines.length > 2000
        ) {
            return ctx.reply('❌ Маълумоти воридшуда аз ҳад зиёд аст.');
        }

        const message =
            '📋 НОВАЯ ЗАЯВКА\n\n' +
            '👤 Имя: ' + name + '\n' +
            '👤 Фамилия: ' + surname + '\n' +
            '📞 Телефон: ' + phone + '\n' +
            '🏢 Заказчик: ' + customer + '\n' +
            '💊 Дорухо: ' + medicines + '\n\n' +
            '🆔 ID пользователя: ' + ctx.from.id;

        // Фиристодани заявка ба админ
        await bot.telegram.sendMessage(
            ADMIN_ID,
            message
        );

        // Ҷавоб ба истифодабаранда
        await ctx.reply(
            '✅ Ваша заявка успешно отправлена!\n\nСпасибо за обращение.'
        );

        console.log('New application received:', ctx.from.id);

    } catch (error) {

        console.error('APPLICATION ERROR:', error);

        await ctx.reply(
            '❌ Ошибка отправки заявки. Попробуйте ещё раз.'
        );

    }

});

// ===============================
// ERROR HANDLING
// ===============================

bot.catch((error) => {
    console.error('BOT ERROR:', error);
});

// ===============================
// START SERVER AND BOT
// ===============================

const server = app.listen(PORT, '0.0.0.0', async () => {

    console.log('Server started on port ' + PORT);

    try {

        await bot.launch();

        console.log('Telegram bot started successfully!');

    } catch (error) {

        console.error('BOT START ERROR:', error);

    }

});

// ===============================
// STOP CORRECTLY
// ===============================

process.once('SIGINT', () => {
    bot.stop('SIGINT');
    server.close();
});

process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
    server.close();
});