const { Events } = require('discord.js');
const { saveMessage } = require('../services/messageStore');
const { generateMarkov } = require('../services/markovGenerator');

const TRIGGER_WORDS = ['佐野', 'ようた', 'おうた', 'さの', 'ゲイ', '黒人', 'ユダヤ教'];
const RANDOM_REPLY_RATE = 1.00;
const TARGET_CHANNEL_ID = '1504786234390872174';

module.exports = {
    name: Events.MessageCreate,

    async execute(message) {
        if (message.author.bot) return;
        if (!message.content.trim()) return;
        // さののおへや
        if (message.channel.id != TARGET_CHANNEL_ID) return;

        try {
            await saveMessage(message);
        } catch (error) {
            console.error('Failed to save message:', error);
        }

        const mentioned =
            message.mentions.has(message.client.user);

        const hasTriggerWord =
            TRIGGER_WORDS.some(word =>
                message.content.includes(word)
            );

        const forced =
            mentioned || hasTriggerWord;

        const random =
            Math.random() < RANDOM_REPLY_RATE;

        if (!forced && !random) {
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
