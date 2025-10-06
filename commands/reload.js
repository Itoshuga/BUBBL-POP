// commands/reload.js
const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
  } = require('discord.js');
  const path = require('node:path');
  const fs = require('node:fs');
  
  async function upsertSlashCommand(client, data, guildId) {
    const json = data.toJSON();
  
    // Priorité au enregistrement GUILD pour un dev cycle rapide
    if (guildId) {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) throw new Error(`Guild introuvable: ${guildId}`);
  
      const existing = await guild.commands.fetch();
      const found = existing.find(c => c.name === json.name);
      if (found) {
        return guild.commands.edit(found.id, json);
      } else {
        return guild.commands.create(json);
      }
    }
  
    // Sinon enregistrement GLOBAL
    const existing = await client.application.commands.fetch();
    const found = existing.find(c => c.name === json.name);
    if (found) {
      return client.application.commands.edit(found.id, json);
    } else {
      return client.application.commands.create(json);
    }
  }
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('reload')
      .setDescription('Recharge une commande sans redémarrer le bot.')
      .addStringOption(opt =>
        opt
          .setName('name')
          .setDescription('Nom de la commande à recharger (ex: ping)')
          .setRequired(true),
      )
      .addBooleanOption(opt =>
        opt
          .setName('sync')
          .setDescription('Mettre à jour la commande slash auprès de Discord (guild si GUILD_ID, sinon global)')
          .setRequired(false),
      )
      .setDMPermission(false),
  
    enabled: true,
    category: 'admin',
  
    async execute(interaction) {
      // ---- Guard: OWNER seulement
      const ownerId = process.env.OWNER_ID;
      if (!ownerId || interaction.user.id !== ownerId) {
        return interaction.reply({
          content: '❌ Seul le propriétaire du bot peut utiliser cette commande.',
          flags: MessageFlags.Ephemeral,
        });
      }
  
      const nameInput = interaction.options.getString('name', true).trim().toLowerCase();
      const sync = interaction.options.getBoolean('sync') ?? false;
  
      // On envoie un accusé de réception éphémère
      await interaction.reply({
        content: `♻️ Rechargement de \`${nameInput}\`…`,
        flags: MessageFlags.Ephemeral,
      });
  
      // Résolution du chemin du fichier de commande
      // Hypothèse: commands/<name>.js
      const fileName = nameInput.endsWith('.js') ? nameInput : `${nameInput}.js`;
      const filePath = path.join(__dirname, fileName);
  
      if (!fs.existsSync(filePath)) {
        return interaction.followUp({
          content: `❗ Fichier introuvable: \`commands/${fileName}\``,
          flags: MessageFlags.Ephemeral,
        });
      }
  
      try {
        // 1) Retire l’ancienne commande de la Collection
        interaction.client.commands.delete(nameInput);
  
        // 2) Purge du cache require
        const resolved = require.resolve(filePath);
        delete require.cache[resolved];
  
        // 3) Re-require du module
        const fresh = require(filePath);
  
        // Sanity checks
        if (!fresh || !fresh.data || typeof fresh.execute !== 'function') {
          throw new Error('Le module ne semble pas exporter { data, execute }');
        }
  
        const cmdName = fresh.data.name?.toLowerCase?.();
        if (!cmdName) {
          throw new Error('data.name est manquant');
        }
  
        // 4) (Re)range dans la Collection des commandes
        interaction.client.commands.set(cmdName, fresh);
  
        // 5) Optionnel: upsert slash auprès de Discord
        if (sync) {
          await upsertSlashCommand(interaction.client, fresh.data, process.env.GUILD_ID);
        }
  
        // 6) Réponse OK
        const embed = new EmbedBuilder()
          .setColor(0x57F287) // vert "succès"
          .setDescription(
            `✅ **Commande rechargée**: \`${cmdName}\`${sync ? ' • 🔁 synchronisée' : ''}`,
          );
  
        await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
      } catch (err) {
        const embed = new EmbedBuilder()
          .setColor(0xED4245)
          .setDescription(
            `❌ Échec du rechargement de \`${nameInput}\`\n\`\`\`${(err && err.message) || err}\`\`\``,
          );
  
        await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
      }
    },
  };
  