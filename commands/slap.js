// commands/slap.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { fetchActionImage } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slap')
    .setDescription('Gifler (gentiment) quelqu’un 💢')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('La personne à gifler')
        .setRequired(false)
    ),
  enabled: true,
  category: 'social',

  async execute(interaction) {
    await interaction.deferReply();
    const target = interaction.options.getUser('user');

    try {
      const imageUrl = await fetchActionImage('slap');
      const description = target
        ? `${interaction.user} gifle ${target} (avec amour) 😤`
        : `${interaction.user} gifle… l’air ? 😅`;

      const embed = new EmbedBuilder().setDescription(description).setImage(imageUrl);
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply('😵 Impossible de récupérer un GIF de gifle.');
    }
  },
};
