const Discord = require("discord.js")

module.exports = {
  name: "encomenda",
  description: "Painel encomenda",
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {

    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
        interaction.reply({ content: `Você não possui permissão para utilzar este comando!`, ephemeral: true })
    } else {
        let embed = new Discord.EmbedBuilder()
        .setTitle("Sistema de encomendas")
        .setColor("Purple")
        .setImage ('https://media.discordapp.net/attachments/902172978165452810/1132202423562285076/Group_1_-_copia_3.png')
        .setDescription('Não encontrou a skin que gostaria no estoque do nosso BOT?\nNão se preocupe, vamos tentar conseguir para você!\n\n **Clique no botão Encomendar e digite o nome da skin que deseja.**');
        
        const button = new Discord.ActionRowBuilder().addComponents(
            new Discord.ButtonBuilder()
            .setCustomId("encomenda")
            .setLabel("Encomendar")
            .setEmoji("✉️")
            .setStyle(Discord.ButtonStyle.Primary),
        );

        interaction.reply({ content: `✅ Mensagem enviada!`, ephemeral: true })
        interaction.channel.send({ embeds: [embed], components: [button] })
    }
  },
}
