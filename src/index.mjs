import '#lib/setup';
import config from '#rootJson/config' assert { type: 'json' };
import { LogLevel, SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits, Partials } from 'discord.js';
import { connect, disconnect } from './database/mongo.mjs';

const client = new SapphireClient({
	defaultPrefix: config.prefix,
	caseInsensitivePrefixes: true,
	caseInsensitiveCommands: true,
	logger: {
		level: LogLevel.Debug
	},
	shards: 'auto',
	intents: [
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent
	],
	partials: [Partials.Channel],
	loadMessageCommandListeners: true,
	api: {
		listenOptions: {
			port: 3000
		}
	}
});

const main = async () => {
	try {
		client.logger.info('Logging in');
		await client.login(config.discord_token);
		client.logger.info('Logged in');
		connect();
	} catch (error) {
		client.logger.fatal(error);
		client.destroy();
		disconnect();
		process.exit(1);
	}
};

main();
