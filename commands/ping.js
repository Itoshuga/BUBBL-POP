// commands/ping.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Affiche la latence du bot.'),
  enabled: true,
  category: 'utils',

  async execute(interaction) {
    // Envoie un message temporaire
    const msg = await interaction.reply({ content: '⏱️ Calcul de la latence...', fetchReply: true });

    // Calcule la latence
    const latency = msg.createdTimestamp - interaction.createdTimestamp;

    // Édite le message avec le résultat
    await msg.edit(`⏱️ Pong ! **${latency} ms** de latence !`);
  },
};
