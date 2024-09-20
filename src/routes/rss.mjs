import { Server } from '#root/database/mongo';
import { methods, Route } from '@sapphire/plugin-api';

function formatXML(data) {
	const entries = data.entries.map((entry) => {
		return `
		<item>
			<title>${entry.title}</title>
			<link>${entry.link}</link>
			<description>${entry.description}</description>
			<pubDate>${entry.date}</pubDate>
		</item>
		`;
	});

	return `
	<rss version="2.0">
		<channel>
			<title>${data.title}</title>
			<link>${data.url}</link>
			<description>${data.description}</description>
			${entries.join('')}
		</channel>
	</rss>
	`;
}

export class UserRoute extends Route {
	constructor(context, options) {
		super(context, {
			...options,
			route: '/rss/:id'
		});
	}

	async [methods.GET](_request, response) {
		const id = _request.params.id;
		if (!id) {
			return response.status(400).json({ message: 'Invalid ID' });
		}

		const server = await Server.findOne({
			serverId: id
		});

		if (!server) {
			return response.status(404).json({ message: 'Server not found' });
		}


		response.setHeader('Content-Type', 'application/xml');
		return response.text(formatXML(server));
	}

	[methods.POST](_request, response) {
		response.json({ message: 'Landing Page!' });
	}
}
