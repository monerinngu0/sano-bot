const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("send")
		.setDescription("Sending message."),
	async execute(interaction) {
        try {
            const text = await generateMarkov();

            if (!text) return;

            await interaction.reply({
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
	}
}

