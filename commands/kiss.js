// commands/kiss.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { fetchActionImage } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kiss')
    .setDescription('Fais un bisou à quelqu’un 😘')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('La personne à embrasser')
        .setRequired(false)
    ),
  enabled: true,
  category: 'social',

  async execute(interaction) {
    await interaction.deferReply();
    const target = interaction.options.getUser('user');

    try {
      const imageUrl = await fetchActionImage('kiss');
      const description = target
        ? `${interaction.user} embrasse ${target} 😘`
        : `${interaction.user} envoie des bisous à tout le monde 😚`;

      const embed = new EmbedBuilder().setDescription(description).setImage(imageUrl);
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply('🥺 Impossible de récupérer un GIF de bisou.');
    }
  },
};
