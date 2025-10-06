// commands/help.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  MessageFlags,
} = require('discord.js');

/**
 * 👉 Personnalise ici les labels + emojis par catégorie.
 * La clé = valeur de `command.category`.
 */
const CATEGORY_META = {
  fun:         { label: 'Fun',         emoji: '🎉' },
  moderation:  { label: 'Modération',  emoji: '🛡️' },
  admin:       { label: 'Admin',       emoji: '👑' },
  utils:       { label: 'Outils',      emoji: '🧰' },
  other:       { label: 'Autres',      emoji: '📦' }, // fallback
};

function getCatMeta(key) {
  const k = (key || 'other').toLowerCase();
  return CATEGORY_META[k] ?? { label: key || 'Autres', emoji: '📦' };
}

// Regroupe les commandes par catégorie (enabled uniquement)
function groupByCategory(client) {
  const all = [...client.commands?.values?.() || []]
    .filter(c => c?.data && c?.enabled !== false);

  const map = new Map();
  for (const cmd of all) {
    const catKey = (cmd.category || 'other').toLowerCase();
    if (!map.has(catKey)) map.set(catKey, []);
    map.get(catKey).push(cmd);
  }

  // tri par label visible puis par nom
  return new Map(
    [...map.entries()]
      .sort(([a], [b]) => getCatMeta(a).label.localeCompare(getCatMeta(b).label, 'fr'))
      .map(([key, arr]) => [key, arr.sort((x, y) => x.data.name.localeCompare(y.data.name))]),
  );
}

function formatLines(cmds) {
  return cmds.map(c => `• \`/${c.data.name}\` — ${c.data.description || ''}`);
}

// Coupe en morceaux pour respecter ~1024 chars par field
function chunkText(lines, max = 1024) {
  const chunks = [];
  let buf = '';
  for (const line of lines) {
    const next = buf ? `${buf}\n${line}` : line;
    if (next.length > max) {
      if (buf) chunks.push(buf);
      if (line.length > max) {
        chunks.push(line.slice(0, max - 1) + '…');
        buf = '';
      } else {
        buf = line;
      }
    } else {
      buf = next;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

function buildIntroEmbed() {
  return new EmbedBuilder()
    .setColor(0x11ACD8)
    .setTitle('📚 Aide')
    .setDescription('Utilisez le **menu déroulant** ci-dessous pour afficher les commandes d’une catégorie.\nAstuce : vous pouvez aussi faire `/help <commandName>` pour la fiche d’une commande précise.');
}

function buildCategoryEmbed(catKey, list, totalCats) {
  const { label, emoji } = getCatMeta(catKey);
  const lines = formatLines(list);
  const chunks = chunkText(lines);

  const embed = new EmbedBuilder()
    .setColor(0x11ACD8)
    .setTitle(`📚 ${emoji} ${label}`)
    .setDescription(`Catégorie **${label}** — ${list.length} commande(s) • ${totalCats} catégorie(s)`)
    .setFooter({ text: 'Vous pouvez changer de catégorie via le menu déroulant.' });

  if (chunks.length === 1) {
    embed.addFields({ name: 'Commandes', value: chunks[0] || '_Aucune_' });
  } else {
    chunks.forEach((c, i) => embed.addFields({ name: i === 0 ? 'Commandes' : `Commandes (suite ${i})`, value: c }));
  }
  return embed;
}

// Menu déroulant avec emoji DANS la case de gauche (comme "Toutes les catégories")
function buildSelect(map) {
  const options = [
    { label: 'Toutes les catégories', value: 'all', description: 'Voir tout', emoji: '📚' },
    ...[...map.keys()].map((key) => {
      const { label, emoji } = getCatMeta(key);
      return {
        label,                // on laisse le label "propre"
        value: `cat:${key}`,
        description: `Voir ${label}`,
        emoji,                // l’emoji s’affiche à gauche, comme "Toutes les catégories"
      };
    }),
  ].slice(0, 25); // Discord limite à 25 options

  const menu = new StringSelectMenuBuilder()
    .setCustomId('help:category')
    .setPlaceholder('Choisissez une catégorie…')
    .addOptions(options)
    .setMinValues(1)
    .setMaxValues(1);

  return new ActionRowBuilder().addComponents(menu);
}

// Fiche d’une commande précise
function buildCommandEmbed(cmd) {
  const json = typeof cmd.data.toJSON === 'function' ? cmd.data.toJSON() : cmd.data;
  const { label, emoji } = getCatMeta(cmd.category);

  const embed = new EmbedBuilder()
    .setColor(0x11ACD8)
    .setTitle(`ℹ️ /${json.name}`)
    .setDescription(json.description || '—')
    .addFields(
      { name: 'Catégorie', value: `${emoji} ${label}`, inline: true },
      { name: 'Statut', value: cmd.enabled === false ? '❌ Désactivée' : '✅ Activée', inline: true },
    );

  if (Array.isArray(json.options) && json.options.length) {
    const opts = json.options.map(o => {
      const req = o.required ? ' (requis)' : '';
      return `• \`${o.name}\`${req} — ${o.description || ''}`;
    });
    const chunks = chunkText(opts);
    chunks.forEach((c, i) => embed.addFields({ name: i === 0 ? 'Options' : `Options (suite ${i})`, value: c }));
  }

  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Aide des commandes, avec menu par catégorie.')
    .addStringOption(opt =>
      opt
        .setName('command')
        .setDescription('Nom exact de la commande (ex: ping)')
        .setRequired(false),
    )
    .setDMPermission(true),

  enabled: true,
  category: 'utils',

  async execute(interaction) {
    const name = interaction.options.getString('command');
    const client = interaction.client;

    // Si l’utilisateur demande une commande précise
    if (name) {
      const cmd = client.commands?.get?.(name.toLowerCase());
      if (!cmd || cmd.enabled === false) {
        return interaction.reply({
          content: `❔ Commande \`/${name}\` introuvable ou désactivée.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      const embed = buildCommandEmbed(cmd);
      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    // Sinon, on affiche juste l’intro + le menu
    const map = groupByCategory(client);
    const hasAny = [...map.values()].some(arr => arr.length);
    if (!hasAny) {
      return interaction.reply({
        content: 'Aucune commande disponible.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const intro = buildIntroEmbed();
    const row = buildSelect(map);

    await interaction.reply({
      embeds: [intro],           // 👈 minimaliste par défaut
      components: [row],
      flags: MessageFlags.Ephemeral,
    });

    const msg = await interaction.fetchReply();

    // Collector: 2 minutes, réservé à l’auteur
    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 120_000,
      filter: (i) => i.customId === 'help:category' && i.user.id === interaction.user.id,
    });

    collector.on('collect', async (i) => {
      const value = i.values[0];

      if (value === 'all') {
        // Petite vue "toutes catégories" (optionnelle). Ici, on réutilise l’intro + on ajoute une synthèse simple.
        const synth = new EmbedBuilder()
          .setColor(0x11ACD8)
          .setTitle('📚 Toutes les catégories')
          .setDescription('Sélectionnez une catégorie pour voir les commandes correspondantes.')
          .addFields(
            ...[...map.entries()].map(([key, list]) => {
              const { label, emoji } = getCatMeta(key);
              return {
                name: `${emoji} ${label}`,
                value: list.length ? list.map(c => `\`/${c.data.name}\``).join(' • ') : '_Aucune_',
              };
            }),
          );
        const newRow = buildSelect(map);
        return i.update({ embeds: [synth], components: [newRow] });
      }

      const catKey = value.replace(/^cat:/, '');
      const list = map.get(catKey) || [];
      const catEmbed = buildCategoryEmbed(catKey, list, map.size);
      const newRow = buildSelect(map);
      await i.update({ embeds: [catEmbed], components: [newRow] });
    });

    collector.on('end', async () => {
      try {
        const disabled = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('help:category:disabled')
            .setPlaceholder('Sélection expirée')
            .setDisabled(true)
            .addOptions([{ label: '—', value: 'none' }]),
        );
        await interaction.editReply({ components: [disabled] });
      } catch (_) {}
    });
  },
};
