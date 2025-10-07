// /commands/coinflip.js
const { SlashCommandBuilder } = require('discord.js');
const CoinFlip = require('../models/CoinFlip');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Lance une pièce ou affiche les stats globales.')
    .addSubcommand(sub =>
      sub
        .setName('play')
        .setDescription('Lance immédiatement la pièce et affiche Pile ou Face.')
    )
    .addSubcommand(sub =>
      sub
        .setName('stats')
        .setDescription('Affiche le nombre total de Pile et de Face (global, tous serveurs).')
    )
    .setDMPermission(true),

  enabled: true,
  category: 'fun',

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // /coinflip stats — stats globales
    if (sub === 'stats') {
      await interaction.deferReply();

      try {
        const agg = await CoinFlip.aggregate([
          { $group: { _id: '$result', count: { $sum: 1 } } }
        ]);

        const counts = { pile: 0, face: 0 };
        for (const row of agg) {
          if (row._id === 'pile') counts.pile = row.count;
          if (row._id === 'face') counts.face = row.count;
        }

        return interaction.editReply(
          `📊 **Stats globales** — Pile : **${counts.pile}**, Face : **${counts.face}**`
        );
      } catch (e) {
        console.error('[coinflip stats] MongoDB error:', e?.message || e);
        return interaction.editReply('⚠️ Impossible de récupérer les stats pour le moment.');
      }
    }

    // /coinflip play — tirage direct, pas d’édition
    const isPile = Math.random() < 0.5;
    const result = isPile ? 'pile' : 'face';

    // Enregistre sans bloquer la réponse
    CoinFlip.create({
      result,
      userId: interaction.user?.id || null,
      guildId: interaction.guildId || null,
    }).catch(e => console.error('[coinflip play] MongoDB error:', e?.message || e));

    // Réponse immédiate
    await interaction.reply(isPile ? '🪙 **Pile !**' : '🪙 **Face !**');
  },
};
