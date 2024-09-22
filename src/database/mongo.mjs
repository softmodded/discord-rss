import mongoose, { Mongoose } from 'mongoose';
import config from '#rootJson/config' assert { type: 'json' };

// mongo kind of sucks but it's late at night and i don't want to deal with prisma and postgres
// i will regret this
const url = config.mongo

export const connect = async () => {
	await mongoose.connect(url);
};

export const disconnect = async () => {
	await mongoose.disconnect();
};

export const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', console.log.bind(console, 'connected to db'));

// schemas
const entrySchema = new mongoose.Schema({
	title: String,
	link: String,
	description: String,
	date: Date,
	images: [String],
});

const serverSchema = new mongoose.Schema({
	serverId: String,
	entries: [entrySchema],
	title: {
		type: String,
		default: 'rss feed'
	},
	description: {
		type: String,
		default: 'discord-rss feed created by push-rss'
	},
	url: {
		type: String,
		default: 'https://discord.com'
	},
});

export const Entry = mongoose.model('Entry', entrySchema);
export const Server = mongoose.model('Server', serverSchema);