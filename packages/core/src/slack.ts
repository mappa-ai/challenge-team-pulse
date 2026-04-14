import { WebClient } from "@slack/web-api";
import type { ActivityItem } from "./types";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function fetchSlackMessages(
	channels: string[],
	hoursBack = 48,
): Promise<ActivityItem[]> {
	const oldest = String(Math.floor((Date.now() - hoursBack * 60 * 60 * 1000) / 1000));
	const items: ActivityItem[] = [];

	for (const channel of channels) {
		try {
			const channelId = await resolveChannelId(channel);
			if (!channelId) continue;

			const result = await slack.conversations.history({
				channel: channelId,
				oldest,
				limit: 50,
			});

			for (const msg of result.messages ?? []) {
				if (msg.subtype === "channel_join" || !msg.text) continue;

				const username = await resolveUsername(msg.user);
				items.push({
					source: "slack",
					type: "message",
					title: msg.text.slice(0, 200),
					author: username,
					timestamp: new Date(Number(msg.ts) * 1000).toISOString(),
					url: `https://slack.com/archives/${channelId}/p${msg.ts?.replace(".", "")}`,
				});
			}
		} catch (err) {
			console.error(`Error fetching Slack channel "${channel}":`, err);
		}
	}

	return items;
}

async function resolveChannelId(channelName: string): Promise<string | undefined> {
	try {
		const result = await slack.conversations.list({
			types: "public_channel,private_channel",
			limit: 200,
		});
		const ch = result.channels?.find((c) => c.name === channelName);
		return ch?.id;
	} catch {
		return undefined;
	}
}

const userCache = new Map<string, string>();

async function resolveUsername(userId?: string): Promise<string> {
	if (!userId) return "unknown";
	if (userCache.has(userId)) return userCache.get(userId)!;
	try {
		const result = await slack.users.info({ user: userId });
		const name = result.user?.real_name || result.user?.name || userId;
		userCache.set(userId, name);
		return name;
	} catch {
		return userId;
	}
}
