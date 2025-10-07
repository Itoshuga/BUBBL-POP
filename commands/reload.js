const { SlashCommandBuilder } = require('discord.js');
const path = require('node:path');
const fs = require('node:fs');

// Upsert (guild si GUILD_ID, sinon global)
async function upsertSlash(client, data, guildId) {
  const json = data.toJSON();

  if (guildId) {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) throw new Error(`Guild introuvable: ${guildId}`);
    const existing = await guild.commands.fetch();
    const found = existing.find(c => c.name === json.name);
    return found ? guild.commands.edit(found.id, json) : guild.commands.create(json);
  }

  const existing = await client.application.commands.fetch();
  const found = existing.find(c => c.name === json.name);
  return found ? client.application.commands.edit(found.id, json) : client.application.commands.create(json);
}

// Supprime par nom dans GUILD et GLOBAL (anti-doublon)
async function deleteBothScopes(client, name, guildId) {
  let guildDeleted = false;
  let globalDeleted = false;

  if (guildId) {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (guild) {
      const cmds = await guild.commands.fetch();
      const found = cmds.find(c => c.name === name);
      if (found) { await guild.commands.delete(found.id); guildDeleted = true; }
    }
  }

  const gcmds = await client.application.commands.fetch();
  const foundGlobal = gcmds.find(c => c.name === name);
  if (foundGlobal) { await client.application.commands.delete(foundGlobal.id); globalDeleted = true; }

  return { guildDeleted, globalDeleted };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Recharge une commande sans redémarrer le bot.')
    .addStringOption(o =>
      o.setName('name').setDescription('Nom de la commande (ex: ping)').setRequired(true)
    )
    .addBooleanOption(o =>
      o.setName('sync').setDescription('Sync auprès de Discord (GUILD si GUILD_ID, sinon GLOBAL)')
    )
    .setDMPermission(false),

  enabled: true,
  category: 'admin',

  async execute(interaction) {
    const ownerId = process.env.OWNER_ID;
    if (!ownerId || interaction.user.id !== ownerId) {
      return interaction.reply({ content: '❌ Réservé au propriétaire du bot.', ephemeral: true });
    }

    const name = interaction.options.getString('name', true).trim().toLowerCase();
    const sync = interaction.options.getBoolean('sync') ?? false;
    const guildId = process.env.GUILD_ID;

    // 1️⃣ Envoie un seul message (non éphémère)
    const msg = await interaction.reply({ content: `♻️ Rechargement de \`${name}\` en cours...`, fetchReply: true });

    const file = name.endsWith('.js') ? name : `${name}.js`;
    const filePath = path.join(__dirname, file);

    if (!fs.existsSync(filePath)) {
      return msg.edit(`❗ Fichier introuvable: \`commands/${file}\``);
    }

    try {
      // 2️⃣ Supprime l’ancienne version locale + purge require
      interaction.client.commands.delete(name);
      const resolved = require.resolve(filePath);
      delete require.cache[resolved];

      // 3️⃣ Recharge le module
      const fresh = require(filePath);
      if (!fresh?.data || typeof fresh.execute !== 'function') {
        throw new Error('Le module doit exporter { data, execute }');
      }

      const cmdName = fresh.data.name?.toLowerCase?.();
      if (!cmdName) throw new Error('data.name est manquant');

      // 4️⃣ Enregistre localement
      interaction.client.commands.set(cmdName, fresh);

      // 5️⃣ Gestion du sync
      if (sync) {
        await msg.edit(`🔁 Synchronisation de \`${cmdName}\`...`);

        // Si désactivée → supprime les deux scopes
        if (fresh.enabled === false) {
          const removed = await deleteBothScopes(interaction.client, cmdName, guildId);
          return msg.edit(
            `🚫 \`${cmdName}\` est désactivée et a été supprimée.\n` +
            `• GUILD : ${removed.guildDeleted ? '✅' : '—'}\n` +
            `• GLOBAL : ${removed.globalDeleted ? '✅' : '—'}`
          );
        }

        // Sinon, clean complet + repost
        await deleteBothScopes(interaction.client, cmdName, guildId);
        await upsertSlash(interaction.client, fresh.data, guildId);
        return msg.edit(`✅ \`${cmdName}\` rechargée et synchronisée sans doublons.`);
      }

      // 6️⃣ Pas de sync → reload local
      return msg.edit(`✅ \`${cmdName}\` rechargée localement (sans sync).`);
    } catch (err) {
      return msg.edit(`❌ Erreur lors du reload de \`${name}\` : ${err.message || err}`);
    }
  },
};
