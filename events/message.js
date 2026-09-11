const { Events } = require('discord.js');
const { saveMessage } = require('../services/messageStore');
const { generateMarkov } = require('../services/markovGenerator');
const { isTargetChannel, shouldReply } = require('../services/replyPolicy');

module.exports = {
    name: Events.MessageCreate,

    async execute(message) {
        if (message.author.bot) return;
        if (!message.content.trim()) return;

        try {
            await saveMessage(message);
        } catch (error) {
            console.error('Failed to save message:', error);
        }

        // Replies are limited to specific channels.
        if (!isTargetChannel(message.channel.id)) {
            return;
        }

        const reply = shouldReply({
            mentioned: message.mentions.has(message.client.user),
            content: message.content,
            replyRate: Number(
                process.env.RANDOM_REPLY_RATE ?? 0.15
            )
        });

        if (!reply) {
            return;
        }

        try {
            const text = await generateMarkov();

            if (!text) return;

            await message.channel.send({
                content: text,
                allowedMentions: {
                    parse: [],
                },
            });
        } catch (error) {
            console.error(
                'Failed to generate Markov message:',
                error,
            );
        }
    },
};
