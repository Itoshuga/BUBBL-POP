// commands/hug.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { fetchActionImage } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hug')
    .setDescription('Fais un câlin à quelqu’un 💞')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('La personne à câliner')
        .setRequired(false)
    ),
  enabled: true,
  category: 'social',

  async execute(interaction) {
    await interaction.deferReply(); // au cas où l’API soit un peu lente
    const target = interaction.options.getUser('user');

    try {
      const imageUrl = await fetchActionImage('hug');

      const description = target
        ? `${interaction.user} fait un câlin à ${target} 🥰`
        : `${interaction.user} a besoin d’un câlin 🤗`;

      const embed = new EmbedBuilder()
        .setDescription(description)
        .setImage(imageUrl)
        .setFooter({ text: 'Source: Waifu.pics / Nekos.best / Nekos.life (fallback)' });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply('😿 Impossible de récupérer un GIF de câlin pour le moment. Réessaie plus tard !');
    }
  },
};
