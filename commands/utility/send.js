const { SlashCommandBuilder, MessageFlags } = require("discord.js");

const { generateMarkov } = require("../../services/markovGenerator");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("send")
        .setDescription("Send a Markov-generated message to this channel."),

    async execute(interaction) {
        try {
            await interaction.deferReply({
                flags: MessageFlags.Ephemeral,
            });

            const text = await generateMarkov();

            if (!text) {
                await interaction.editReply(
                    "Failed to generate a message.",
                );
                return;
            }

            await interaction.channel.send({
                content: text,
                allowedMentions: {
                    parse: [],
                },
            });

            await interaction.editReply(
                "Message sent successfully.",
            );
        } catch (error) {
            console.error(
                "Failed to generate or send Markov message:",
                error,
            );

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(
                    "Failed to send the message.",
                );
            } else {
                await interaction.reply({
                    content: "Failed to send the message.",
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
    },
};
