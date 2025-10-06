require('dotenv').config();
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const mongo = require('./utils/mongo');


async function main() {
    // Connect to MongoDB
    await mongo.connect();


    // Create client
    const client = new Client({
        intents: [GatewayIntentBits.Guilds]
    });
    client.commands = new Collection();


    // Load commands & events
    loadCommands(client);
    loadEvents(client);

    // Login
    client.login(process.env.DISCORD_TOKEN);
}


main().catch(err => {
    console.error('Erreur au démarrage :', err);
    process.exit(1);
});