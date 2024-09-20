import { ActionRowBuilder, ApplicationCommandType, ButtonBuilder, ButtonStyle, ComponentType, SelectMenuBuilder } from 'discord.js';
import { Command } from '@sapphire/framework';
import { Entry, Server } from '#root/database/mongo';

function parseMessageContent(message) {
	const content = message.content;
	const lines = content.split('\n');

	const linesThatStartWithHash = lines.filter((line) => line.startsWith('#'));
	const title = linesThatStartWithHash[0].slice(1).trim();

	linesThatStartWithHash.forEach((element) => {
		element = element.slice(1);
		element = element.trim();
	});

	const link = message.url;
	const date = message.createdAt;

	return { title, description: message.content, link, date, multipleTitles: linesThatStartWithHash.length > 1, linesThatStartWithHash };
}

// push to rss feed
async function push(data, serverId) {
	const { title, description, link, date } = data;
	const newDescription = description.replaceAll(/\n/g, '&lt;br&gt;');
	console.log(newDescription);
	const server = await Server.findOne({
		serverId
	});

	if (!server) {
		const newServer = new Server({
			serverId,
			entries: [{ title, description: newDescription, link, date }],
		});
		await newServer.save();
	} else {
		const newEntry = new Entry({
			title,
			description: newDescription,
			link,
			date
		});
		server.entries.push(newEntry);
		await server.save();
	}

	return;
}

export class PushCommand extends Command {
	constructor(context, options) {
		super(context, { ...options });
	}

	registerApplicationCommands(registry) {
		registry.registerContextMenuCommand((builder) =>
			builder //
				.setName('push to rss')
				.setType(ApplicationCommandType.Message)
		);
	}

	async contextMenuRun(interaction) {
		const collectorFilter = (i) => {
			i.deferUpdate();
			return i.user.id === interaction.user.id;
		};

		const { title, description, link, date, multipleTitles, linesThatStartWithHash } = parseMessageContent(interaction.targetMessage);

		const confirmButton = new ButtonBuilder().setStyle(ButtonStyle.Primary).setLabel('Confirm').setCustomId('confirm');
		const cancelButton = new ButtonBuilder().setStyle(ButtonStyle.Danger).setLabel('Cancel').setCustomId('cancel');
		const buttonRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

		if (!multipleTitles) {
			const reply = await interaction.reply({
				content: `to confirm, is this what you want to push?\n\ntitle: ${title}\ndesc:\n\`${description}\n\`link: ${link}\ndate: ${date}`,
				ephemeral: true,
				components: [buttonRow]
			});

			reply
				.awaitMessageComponent({ filter: collectorFilter, componentType: ComponentType.Button, time: 60_000 })
				.then(async (buttoninteraction) => {
					if (buttoninteraction.customId === 'confirm') {
						interaction.editReply({ content: 'confirmed. pushing to rss feed...', components: [] });
						await push({ title, description, link, date }, interaction.guildId);
						interaction.editReply({ content: 'pushed to rss feed! view it at https://rss.softmodded.com/rss/' + interaction.guildId });
					} else {
						interaction.editReply({ content: 'user cancelled push', components: [] });
					}
				})
				.catch((err) => console.log(err));
		} else {
			const titleSelectorSelectMenu = new SelectMenuBuilder().setCustomId('titleSelector').setPlaceholder('Select a title');
			titleSelectorSelectMenu.addOptions(
				linesThatStartWithHash.map((line) => {
					return { label: line.slice(2), value: line.slice(2) };
				})
			);

			const row = new ActionRowBuilder().addComponents(titleSelectorSelectMenu);

			const reply = await interaction.reply({
				content: `to confirm which title you want to push, select one from the dropdown`,
				ephemeral: true,
				components: [row]
			});

			reply
				.awaitMessageComponent({ filter: collectorFilter, componentType: ComponentType.StringSelect, time: 60_000 })
				.then(async (select) => {
					const selectedTitle = select.values[0];
					const reply = await interaction.editReply({
						content: `to confirm, is this what you want to push?\n\ntitle: ${selectedTitle}\ndesc:\n\`${description}\n\`link: ${link}\ndate: ${date}`,
						ephemeral: true,
						components: [buttonRow]
					});
		
					reply
						.awaitMessageComponent({ filter: collectorFilter, componentType: ComponentType.Button, time: 60_000 })
						.then(async (buttoninteraction) => {
							if (buttoninteraction.customId === 'confirm') {
								interaction.editReply({ content: 'confirmed. pushing to rss feed...', components: [] });
								await push({ title, description, link, date }, interaction.guildId);
								interaction.editReply({ content: 'pushed to rss feed! view it at https://rss.softmodded.com/rss/' + interaction.guildId });
							} else {
								interaction.editReply({ content: 'user cancelled push', components: [] });
							}
						})
						.catch((err) => console.log(err));
				})
				.catch((err) => console.log(err));
		}
	}
}
