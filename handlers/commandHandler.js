const fs = require('fs');
const path = require('path');


function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);


    arrayOfFiles = arrayOfFiles || [];


    files.forEach(function (file) {
        const full = path.join(dirPath, file);
        if (fs.statSync(full).isDirectory()) {
            arrayOfFiles = getAllFiles(full, arrayOfFiles);
        } else if (file.endsWith('.js')) {
            arrayOfFiles.push(full);
        }
    });


    return arrayOfFiles;
}


function loadCommands(client) {
    const commandsPath = path.join(__dirname, '..', 'commands');
    if (!fs.existsSync(commandsPath)) return;
    const commandFiles = getAllFiles(commandsPath);


    for (const filePath of commandFiles) {
        const command = require(filePath);

        // Vérifier si la commande est activée
        if (command.enabled === false) {
            console.log(`Skipped disabled command: ${command.data?.name || filePath}`);
            continue;
        }

        if (!command?.data || !command?.execute) continue;
        client.commands.set(command.data.name, command);
        console.log(`Loaded command: ${command.data.name}`);
    }
}


async function registerCommands(client, guildId) {
    const commands = [...client.commands.values()]
      .filter(cmd => cmd.enabled !== false) // ignorer disabled
      .map(cmd => cmd.data.toJSON());


    if (!client.application) {
        throw new Error('client.application is not available yet. Call registerCommands after ready.');
    }


    if (guildId) {
        // register to a single guild (fast for dev)
        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (guild) {
            await guild.commands.set(commands);
            console.log('Registered commands to guild', guildId);
            return;
        }
        console.warn('GUILD_ID set but guild fetch failed — registering globally instead');
    }


    // global registration (may take up to 1 hour to propagate)
    await client.application.commands.set(commands);
    console.log('Registered global commands');
}


module.exports = {
    loadCommands,
    registerCommands
};