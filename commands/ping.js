const {
    SlashCommandBuilder
} = require('discord.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Répond pong'),
    enabled: true,
    async execute(interaction) {
        await interaction.reply('Pong!');
    }
};