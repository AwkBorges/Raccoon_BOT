const Discord = require("discord.js")

module.exports = {
  name: "prime",
  description: "Painel cápsulas",
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {

    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
        interaction.reply({ content: `Você não possui permissão para utilzar este comando!`, ephemeral: true })
    } else {
        let embed = new Discord.EmbedBuilder()
        .setTitle("Capsula Prime - Prime Gaming")
        .setColor("Purple")
        .setImage ('https://media.discordapp.net/attachments/1103084458170650694/1104823284756914267/Purple_and_Blue_Illustration_Gaming_Channel_YouTube_Intro_Video_1.gif')
        .setDescription('Com a Raccoon, você economiza ao máximo! Fuja dos preços de R$14,90 e aproveite conosco o incrível valor da Prime Gaming, que é mega barato! Além disso, quanto mais você comprar, mais barato fica! Com a possibilidade de resgatar em diversas contas, você pagará muito pouco por esse serviço de qualidade.\n\nValor por capsula\n🔮 1 Capsula = **6,50**\n🔮 2 Capsulas = **6,00**\n\n_A conta prime gaming pode durar de 3 a 30 dias. Resgate antes dos 3 dias por segurança!_\n\n **Clique no botão abaixo e aguarde o atendimento.**');
        
        const button = new Discord.ActionRowBuilder().addComponents(
            new Discord.ButtonBuilder()
            .setCustomId("prime")
            .setLabel("Comprar")
            .setEmoji("💵")
            .setStyle(Discord.ButtonStyle.Primary),
        );

        interaction.reply({ content: `✅ Mensagem enviada!`, ephemeral: true })
        interaction.channel.send({ embeds: [embed], components: [button] })
    }


  },
}
