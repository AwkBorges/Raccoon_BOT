const Discord = require("discord.js")

module.exports = {
  name: "handlevel",
  description: "Painel handlevel",
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {

    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
        interaction.reply({ content: `Você não possui permissão para utilzar este comando!`, ephemeral: true })
    } else {
        let embed = new Discord.EmbedBuilder()
        .setTitle("Compre sua conta handlevel")
        .setColor("Purple")
        .setImage ('https://media.discordapp.net/attachments/902172978165452810/1133142323405013042/Group_1_-_copia_3.png')
        .setDescription('_Mas o que são contas handlevel?_\n\n contas upadas a mão pela equipe da Raccoon Services com zero risco de banimento por botting!\n\n<:forward:1118340631341830224> Contas level 30\n<:forward:1118340631341830224> Todos os espólios fechados\n<:forward:1118340631341830224> Nenhuma EA gasta\n<:forward:1118340631341830224> MMR 100% zerado \n<:forward:1118340631341830224> Todos os dados de criação \n<:forward:1118340631341830224> Garantia vitalícia**\n\n Clique no botão abaixo e aguarde o atendimento.**');
        
        const button = new Discord.ActionRowBuilder().addComponents(
            new Discord.ButtonBuilder()
            .setCustomId("handlevel")
            .setLabel("Comprar - R$ 80,00")
            .setEmoji("💶")
            .setStyle(Discord.ButtonStyle.Primary),
        );

        interaction.reply({ content: `✅ Mensagem enviada!`, ephemeral: true })
        interaction.channel.send({ embeds: [embed], components: [button] })
    }
  },
}
