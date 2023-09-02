const { Client, GatewayIntentBits, ActionRowBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const axios = require('axios');
const Discord = require("discord.js");
require('dotenv').config()
const fs = require('fs');

const client = new Discord.Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});

module.exports = client

client.on('interactionCreate', (interaction) => {

  if(interaction.type === Discord.InteractionType.ApplicationCommand){

      const cmd = client.slashCommands.get(interaction.commandName);

      if (!cmd) return interaction.reply(Error);

      interaction["member"] = interaction.guild.members.cache.get(interaction.user.id);

      cmd.run(client, interaction)

   }
})

client.slashCommands = new Discord.Collection()
require('./handler')(client)
client.login(process.env.TOKEN)

async function verificarPagamentosAprovados(pagamentos) {
  const pagamentosAprovados = [];

  for (const pagamento of pagamentos) {
    try {
      const response = await axios.get(`https://api.mercadopago.com/v1/payments/${pagamento.mp_id}`, {
        headers: {
          Authorization: `Bearer ${process.env.MPTOKEN}`,
        },
      });

      if (response.data.status === 'approved') {
        pagamentosAprovados.push(pagamento.mp_id);
      }
    } catch (error) {
      console.error(`Erro ao verificar pagamento ${pagamento.mp_id}:`, error.message);
    }
  }

  return pagamentosAprovados;
}

function lerPagamentosAtivos() {
  const jsonPagAtivosData = fs.readFileSync('./databases/pagAtivos.json', 'utf8');
  return JSON.parse(jsonPagAtivosData);
}

async function main() {
  setInterval(async () => {
    const pagamentosAtivos = lerPagamentosAtivos();
    const pagamentosAprovados = await verificarPagamentosAprovados(pagamentosAtivos);

    const jsonPagAtivosData = fs.readFileSync('./databases/pagAtivos.json', 'utf8');
    const pagAtivos = JSON.parse(jsonPagAtivosData);

    for (const mp_id of pagamentosAprovados) {
      const pagamentoAprovado = pagAtivos.find((pagamento) => pagamento.mp_id === mp_id);
    
      if (pagamentoAprovado) {
        const { user_id, ...rest } = pagamentoAprovado;
    
        const dadosConta = pagAtivos.find((pagamento) => pagamento.user_id === user_id);
    
        if (dadosConta) {
          const user = await client.users.fetch(user_id);
          const embed = new Discord.EmbedBuilder()
            .setColor("Purple")
            .setThumbnail(user.avatarURL())
            .setDescription(`
            **Login:** ${dadosConta.login} | **Senha:** ${dadosConta.password}\n
            **Level:** ${dadosConta.level} | **EA:** ${dadosConta.essencia}\n
            **Nickname:** ${dadosConta.nickname}\n
            **Email:** ${dadosConta.email}\n
            **Nascimento:** ${dadosConta.nascimento} | **Criação:** ${dadosConta.criacao}\n
            **Provedor:** ${dadosConta.provedor}\n
            **Informações de Pagamento:**\n
            **Identificador:** ${dadosConta.uuid}
            **Data:** ${dadosConta.data_compra}\n
            Salve suas informações e por favor nos avalie em nosso Discord.
            
            `)
            .setFooter({ text:`Obrigado por comprar com a ${process.env.NAME}!  🦝🖤`})
            try{

              user.send({ embeds: [embed]});

              const channel = client.channels.cache.get(dadosConta.channel_id);
              channel.send('Compra aprovada, iremos enviar sua conta na DM e excluir esse canal em 5 segundos!')

              const embedLog = new Discord.EmbedBuilder()
              .setColor("Purple")
              .setTitle(`Venda Realizada`)
              .setDescription(`**Compra:** ${dadosConta.uuid}\n**User:** ${user_id}\n **Login:** ${dadosConta.login}\n`)

              const channelLOG = client.channels.cache.get(process.env.LOGVENDAS)
              channelLOG.send({ embeds: [embedLog]})

              fs.appendFile(
                './databases/vendas.txt',
                `${dadosConta.uuid};${dadosConta.user_id};${dadosConta.data_compra};${dadosConta.login};${dadosConta.password};${dadosConta.valorAtualizado};${dadosConta.cupom}\n`,
                (error) => {
                  if (error) {
                    console.error(error);
                  }
                }
              );
              
              setTimeout(() => {
                channel.delete()
              }, 5000);
              

            }catch(error){
              console.log(error)
              const channel = client.channels.cache.get(dadosConta.channel_id);
              channel.send('Sua DM está fechada então mandaremos a mensagem por aqui, por favor, salve sua conta pois o canal será fechado em breve!')
              channel.send({ embeds: [embed] });

              const embedLog = new Discord.EmbedBuilder()
              .setColor("Purple")
              .setTitle(`Venda Realizada`)
              .setDescription(`**Compra:** ${dadosConta.uuid}\n**User:** ${user_id}\n **Login:** ${dadosConta.login}\n`)

              const channelLOG = client.channels.cache.get(process.env.LOGVENDAS)
              channelLOG.send({ embeds: [embedLog]})


              fs.appendFile(
                './databases/vendas.txt',
                `${dadosConta.uuid};${dadosConta.user_id};${dadosConta.data_compra};${dadosConta.login};${dadosConta.password};${dadosConta.valorAtualizado};${dadosConta.cupom}\n`,
                (error) => {
                  if (error) {
                    console.error(error);
                  }
                }
              );

            }            
        }
    
        const novoPagAtivos = pagAtivos.filter((pagamento) => pagamento.mp_id !== mp_id);
        fs.writeFileSync('./databases/pagAtivos.json', JSON.stringify(novoPagAtivos, null, 2));
      }
    }

    //console.log('Pagamentos Aprovados:', pagamentosAprovados);

  }, 5000);
}


client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
  main().catch((error) => {
    console.error('Ocorreu um erro:', error);
  });
})


client.on("interactionCreate", (interaction) => {

 if (interaction.isButton()) {
      if (interaction.customId === "close") {

        userID = interaction.user.id

        const jsonPagAtivosData = fs.readFileSync('./databases/pagAtivos.json', 'utf8');
        const originalData = JSON.parse(jsonPagAtivosData);

        const removedObject = originalData.find(obj => obj.user_id === userID);

        if (removedObject) {

          const { mp_id, user_id, uuid, data_compra, cupom, pix, channel_id, valorAtualizado, ...newObject } = removedObject;
        
          const updatedData = originalData.filter(obj => obj.user_id !== userID);

          const jsonEstoqueData = fs.readFileSync('./databases/estoque.json', 'utf8');
          const estoqueData = JSON.parse(jsonEstoqueData);
          estoqueData.push(newObject);

          fs.writeFileSync('./databases/pagAtivos.json', JSON.stringify(updatedData, null, 2));
        
          fs.writeFileSync('./databases/estoque.json', JSON.stringify(estoqueData, null, 2));

          const embedLog = new Discord.EmbedBuilder()
          .setColor("Purple")
          .setTitle(`Compra cancelada`)
          .setDescription(`**Compra:** ${uuid}\n**User:** ${user_id}\n **Login:** ${newObject.login}\n`)
    
          const channelLOG = interaction.guild.channels.cache.get(process.env.LOGCARRINHOS)
          channelLOG.send({ embeds: [embedLog]})

        } else {

          //console.log('Nenhum objeto encontrado com o user_id fornecido.');

        }

        interaction.reply('Compra cancelada, o canal fechará em 3 segundos!')

        setTimeout ( () => {
        try { 
          interaction.channel.delete()
        } catch (e) {
          return;
        }
      }, 3000)




    }

    if(interaction.customId === "pix"){


      const pagAtivosData = fs.readFileSync('./databases/pagAtivos.json');
      const pagAtivos = JSON.parse(pagAtivosData);

      const userID = interaction.user.id;
      const usuarioEncontrado = pagAtivos.find((pagAtivo) => pagAtivo.user_id === userID);

      if (usuarioEncontrado) {

        
        const pix = usuarioEncontrado.pix;
        interaction.reply(pix)
        
        
      } else {
        //console.log('Usuário não encontrado.');
        
      }
        
    }

    if(interaction.customId === "help"){
      interaction.reply(`Fomos notificados! por favor aguarde e alguém com o cargo <@&${process.env.ADM}> irá lhe atender.`)
    }

  if(interaction.customId === "info"){
    interaction.reply('Funcionalidade em manutenção')
    }

  if(interaction.customId === "encomenda"){

    const modal = new ModalBuilder()
      .setCustomId('encomendaModal')
      .setTitle('Skin desejada');

      const encomendaInput = new TextInputBuilder()
			.setCustomId('encomendainput')
			.setLabel("Qual skin você deseja?")
			.setStyle(TextInputStyle.Short);

      const firstActionRow = new ActionRowBuilder().addComponents(encomendaInput);

      modal.addComponents(firstActionRow);

      interaction.showModal(modal);
  }

  }

  if (interaction.isModalSubmit()){
    if (interaction.customId === 'encomendaModal') {
      const skinDesejada = interaction.fields.getTextInputValue('encomendainput');
      
      const channel_name = `✨encomenda-${interaction.user.username}`;
      const text_category_id = process.env.TICKET 
     
      if (!interaction.guild.channels.cache.get(text_category_id)) text_category_id = null;

      if (interaction.guild.channels.cache.find(c => c.name === channel_name)) {
        interaction.reply({ content: `❌ Você já possui uma encomenda aberta em ${interaction.guild.channels.cache.find(c => c.name === channel_name)}!`, ephemeral: true })
      } else {
        interaction.guild.channels.create({
        name: channel_name,
        type: Discord.ChannelType.GuildText,
        parent: text_category_id,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [
              Discord.PermissionFlagsBits.ViewChannel
            ]
          },
          {
            id: interaction.user.id,
            allow: [
              Discord.PermissionFlagsBits.ViewChannel,
              Discord.PermissionFlagsBits.SendMessages,
              Discord.PermissionFlagsBits.AttachFiles,
              Discord.PermissionFlagsBits.EmbedLinks,
              Discord.PermissionFlagsBits.AddReactions
            ]
          }
        ]
      }).then( (ch) => {
         const user = interaction.user.id
         const embed = new Discord.EmbedBuilder()
         .setTitle(`Olá ${interaction.user.username}`)
         .setColor("Purple")
         .setDescription(`Você está perguntando pela skin: **${skinDesejada}**\n Aguarde e iremos lhe mostrar as opções existentes!\n\n🔒 ➝ Fechar Ticket\n💶 ➝ Chave Pix`);
         const button = new Discord.ActionRowBuilder().addComponents(
         new Discord.ButtonBuilder()
          .setCustomId("close_ticket")
          .setEmoji("🔒")
          .setStyle(Discord.ButtonStyle.Danger),
        new Discord.ButtonBuilder()
          .setCustomId("pix_raccoon")
          .setEmoji("💶")
          .setStyle(Discord.ButtonStyle.Primary)
         );
          
         ch.send(`<@&${process.env.ADM}>`)
         ch.send({ embeds: [embed], components: [button] })
         interaction.reply({ content: `Olá ${interaction.user}, seu ticket foi aberto em ${ch}!`, ephemeral: true })

      })
      }

   } 
  }

  if(interaction.customId === "prime"){

    const channel_name = `✨prime-${interaction.user.username}`;
      const text_category_id = process.env.TICKET 
     
      if (!interaction.guild.channels.cache.get(text_category_id)) text_category_id = null;

      if (interaction.guild.channels.cache.find(c => c.name === channel_name)) {
        interaction.reply({ content: `❌ Você já possui uma encomenda aberta em ${interaction.guild.channels.cache.find(c => c.name === channel_name)}!`, ephemeral: true })
      } else {
        interaction.guild.channels.create({
        name: channel_name,
        type: Discord.ChannelType.GuildText,
        parent: text_category_id,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [
              Discord.PermissionFlagsBits.ViewChannel
            ]
          },
          {
            id: interaction.user.id,
            allow: [
              Discord.PermissionFlagsBits.ViewChannel,
              Discord.PermissionFlagsBits.SendMessages,
              Discord.PermissionFlagsBits.AttachFiles,
              Discord.PermissionFlagsBits.EmbedLinks,
              Discord.PermissionFlagsBits.AddReactions
            ]
          },
          {
            id: process.env.PARCEIRO1,
            allow: [
              Discord.PermissionFlagsBits.ViewChannel,
              Discord.PermissionFlagsBits.SendMessages,
              Discord.PermissionFlagsBits.AttachFiles,
              Discord.PermissionFlagsBits.EmbedLinks,
              Discord.PermissionFlagsBits.AddReactions
            ]
          }
        ]
      }).then( (ch) => {
        const user = interaction.user.id
        const embed = new Discord.EmbedBuilder()
        .setTitle(`Olá ${interaction.user.username}`)
        .setColor("Purple")
        .setDescription(`Você está perguntando sobre: **Cápsula PRIME**\n Aguarde e iremos lhe atender!\nNão realize o pagamento até confirmarmos o estoque do produto.\n\n🔒 ➝ Fechar Ticket\n💶 ➝ Chave Pix`);
        const button = new Discord.ActionRowBuilder().addComponents(
        new Discord.ButtonBuilder()
         .setCustomId("close_ticket")
         .setEmoji("🔒")
         .setStyle(Discord.ButtonStyle.Danger),
       new Discord.ButtonBuilder()
         .setCustomId("pix_prime")
         .setEmoji("💶")
         .setStyle(Discord.ButtonStyle.Primary)
        );
         
        ch.send(`<@&${process.env.PARCEIRO1}>`)
        ch.send({ embeds: [embed], components: [button] })
        interaction.reply({ content: `Olá ${interaction.user}, seu ticket foi aberto em ${ch}!`, ephemeral: true })

      })
      }

  }

  if (interaction.customId === "close_ticket") {
    interaction.reply('Até logo guaxinim! seu ticket será fechado em 10s, muito obrigado.')

    setTimeout ( () => {
      try { 
        interaction.channel.delete()
      } catch (e) {
        return;
      }
    }, 10000)
  }

  if(interaction.customId === "faq"){
    const embed = new Discord.EmbedBuilder()
    .setColor("Purple")
    .setImage('https://media.discordapp.net/attachments/902172978165452810/1090502388365922314/Captura_de_Tela_2023-03-29_as_02.05.29.png?width=2160&height=604')
    .setDescription(`coe`)
    interaction.reply({ embeds: [embed]})
  }

  if(interaction.customId === "pix_raccoon"){
    interaction.reply("servicesraccoon@gmail.com")
  }

  if(interaction.customId === "pix_prime"){
    interaction.reply("00020101021126580014br.gov.bcb.pix0136fe9e25da-24b6-4578-bec3-bf92636efc9f5204000053039865802BR5921MATHEUS B X MUSSARELI6007MARILIA62070503***6304F225")
  }

  if(interaction.customId === "handlevel"){

    const channel_name = `✨handlevel-${interaction.user.username}`;
      const text_category_id = process.env.TICKET 
     
      if (!interaction.guild.channels.cache.get(text_category_id)) text_category_id = null;

      if (interaction.guild.channels.cache.find(c => c.name === channel_name)) {
        interaction.reply({ content: `❌ Você já possui uma encomenda aberta em ${interaction.guild.channels.cache.find(c => c.name === channel_name)}!`, ephemeral: true })
      } else {
        interaction.guild.channels.create({
        name: channel_name,
        type: Discord.ChannelType.GuildText,
        parent: text_category_id,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [
              Discord.PermissionFlagsBits.ViewChannel
            ]
          },
          {
            id: interaction.user.id,
            allow: [
              Discord.PermissionFlagsBits.ViewChannel,
              Discord.PermissionFlagsBits.SendMessages,
              Discord.PermissionFlagsBits.AttachFiles,
              Discord.PermissionFlagsBits.EmbedLinks,
              Discord.PermissionFlagsBits.AddReactions
            ]
          },
          {
            id: process.env.PARCEIRO1,
            allow: [
              Discord.PermissionFlagsBits.ViewChannel,
              Discord.PermissionFlagsBits.SendMessages,
              Discord.PermissionFlagsBits.AttachFiles,
              Discord.PermissionFlagsBits.EmbedLinks,
              Discord.PermissionFlagsBits.AddReactions
            ]
          }
        ]
      }).then( (ch) => {
        const user = interaction.user.id
        const embed = new Discord.EmbedBuilder()
        .setTitle(`Olá ${interaction.user.username}`)
        .setColor("Purple")
        .setDescription(`Você está perguntando sobre: **Handlevel**\n Aguarde e iremos lhe atender!\n\n🔒 ➝ Fechar Ticket\n💶 ➝ Chave Pix`);
        const button = new Discord.ActionRowBuilder().addComponents(
        new Discord.ButtonBuilder()
         .setCustomId("close_ticket")
         .setEmoji("🔒")
         .setStyle(Discord.ButtonStyle.Danger),
       new Discord.ButtonBuilder()
         .setCustomId("pix_raccoon")
         .setEmoji("💶")
         .setStyle(Discord.ButtonStyle.Primary)
        );
         
        ch.send(`<@&${process.env.ADM}> <@&${process.env.PARCEIRO1}>`)
        ch.send({ embeds: [embed], components: [button] })
        interaction.reply({ content: `Olá ${interaction.user}, seu ticket foi aberto em ${ch}!`, ephemeral: true })

      })
      }

  }

})

