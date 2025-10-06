const {
    registerCommands
} = require('../handlers/commandHandler');


module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`${client.user.tag} is ready`);


        try {
            // register commands (use GUILD_ID in .env for fast dev registration)
            await registerCommands(client, process.env.GUILD_ID);
            console.log('Commands registered successfully');
        } catch (err) {
            console.error('Failed to register commands:', err);
        }
    }
};