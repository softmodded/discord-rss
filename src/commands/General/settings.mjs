import { Server } from '#root/database/mongo';
import { Subcommand } from '@sapphire/plugin-subcommands';

// Extend `Subcommand` instead of `Command`
export class UserCommand extends Subcommand {
	constructor(context, options) {
		super(context, {
			...options,
			name: 'settings',
			subcommands: [
				{
					name: 'title',
					chatInputRun: 'changeTitle'
				},
				{
					name: 'link',
					chatInputRun: 'changeLink'
				},
				{
					name: 'description',
					chatInputRun: 'changeDescription'
				}
			]
		});
	}

	registerApplicationCommands(registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('settings')
				.setDescription('settings config')
				.addSubcommand((command) =>
					command
						.setName('title')
						.setDescription('change the title of your rss feed')
						.addStringOption((option) => option.setName('title').setDescription('title to change your rss feed').setRequired(true))
				)
				.addSubcommand((command) =>
					command
						.setName('description')
						.setDescription('change the description of your rss feed')
						.addStringOption((option) =>
							option.setName('description').setDescription('description to change your rss feed').setRequired(true)
						)
				)
				.addSubcommand((command) =>
					command
						.setName('link')
						.setDescription('change the link of your rss feed')
						.addStringOption((option) => option.setName('link').setDescription('link to change your rss feed').setRequired(true))
				)
		);
	}

	async changeTitle(interaction) {
		const title = interaction.options.getString('title');
		const serverId = interaction.guild.id;

		const server = await Server.findOne({
			serverId
		});

		if (!server) {
			const newServer = new Server({
				serverId,
				title
			});
			await newServer.save();
		} else {
			server.title = title;
			await server.save();
		}

		return interaction.reply({ content: `changed title to \`${title}\``, ephemeral: true });
	}

	async changeLink(interaction) {
        const link = interaction.options.getString('link');
        const serverId = interaction.guild.id;

        const linkRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

        if (!linkRegex.test(link)) {
            return interaction.reply({ content: 'invalid link', ephemeral: true });
        }

        const server = await Server.findOne({
            serverId
        });

        if (!server) {
            const newServer = new Server({
                serverId,
                url: link
            });
            await newServer.save();
        } else {
            server.url = link;
            await server.save();
        }

        return interaction.reply({ content: `changed link to \`${link}\``, ephemeral: true });
    }

	async changeDescription(interaction) {
		const desc = interaction.options.getString('description');
		const serverId = interaction.guild.id;

		const server = await Server.findOne({
			serverId
		});

		if (!server) {
			const newServer = new Server({
				serverId,
				description: desc
			});
			await newServer.save();
		} else {
			server.description = desc;
			await server.save();
		}

		return interaction.reply({ content: `changed description to \`${desc}\``, ephemeral: true });
	}
}
