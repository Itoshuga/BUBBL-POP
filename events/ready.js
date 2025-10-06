const { Events } = require('discord.js');
const { registerCommands } = require('../handlers/commandHandler');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`${client.user.tag} is ready`);

    try {
      await registerCommands(client, process.env.GUILD_ID);
      console.log('Commands registered successfully');
    } catch (err) {
      console.error('Failed to register commands:', err);
    }
  },
};
