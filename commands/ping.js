// commands/ping_simple_embed_alt.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Retourne un Pong simple dans un embed (nouveau message + suppression de l’ancien).')
    .setDMPermission(true),
  enabled: true,
  category: 'utils',

  async execute(interaction) {
    // 1) Premier message "Pinging…" (non éphémère pour pouvoir le supprimer)
    await interaction.reply({ content: 'Pinging…' });

    // Récupération du message SANS utiliser fetchReply dans les options
    const first = await interaction.fetchReply();

    // 2) Calcul de la latence aller/retour
    const latency = Math.max(0, first.createdTimestamp - interaction.createdTimestamp);

    // 3) Second message : embed simple
    const embed = new EmbedBuilder()
      .setColor(0x11ACD8) // #11ACD8
      .setDescription(`⏱️ Pong! **${latency}ms** Latency!`);

    await interaction.followUp({ embeds: [embed] });

    // 4) Suppression du premier message
    try {
      await first.delete();
    } catch (_) {
      /* Permissions / timing — on ignore si non supprimable */
    }
  },
};
