const Discord = require("discord.js")
const uuid = require('uuid');
const qrcode = require('qrcode');
const { AttachmentBuilder } = require('discord.js');
const fs = require("fs");
require('dotenv').config()

module.exports = {
  
  name: "comprar",
  description: "Abra uma compra",
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'skin',
      description: 'Escolha uma skin',
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
    {
        name: 'cupom',
        description: 'Possui um cupom?',
        type: Discord.ApplicationCommandOptionType.String,
        required: false,
      },
  ],

  run: async (client, interaction) => {

    if (interaction.channelId !== process.env.COMPRA) {
      interaction.reply({
        content: `Você está tentando utilizar o comando no canal errado, por favor utilize no canal <#${process.env.COMPRA}>`,
        ephemeral: true
      });
      return;
    }
        
        const skinInput = interaction.options.getString('skin');
        const cupomInput = interaction.options.getString('cupom');
        const cupons = fs.readFileSync('./databases/cupons.txt', 'utf8').split('\n');


        function readEstoque(filePath) {
            return new Promise((resolve, reject) => {
              fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                  reject(err);
                  return;
                }
                
                const jsonData = JSON.parse(data);
                resolve(jsonData);
              });
            });
          }

        const estoqueData = await readEstoque('./databases/estoque.json')

        let foundSkin = false;
        let lowestValue = Infinity;
        let accountWithLowestValue = null;
        const currentDate = new Date();

        estoqueData.forEach(account => {
        if (account.skins.includes(skinInput)) {
            foundSkin = true;
            if (account.valor < lowestValue) {
            lowestValue = account.valor;
            accountWithLowestValue = {
                uuid: uuid.v4(),
                data_compra: `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`,
                user_id: interaction.user.id,
                ...account
            };
            
            }
        }
        });

        if (foundSkin) {

            if(cupomInput !== null && cupons.includes(cupomInput)){

              const channel_name = `💳-smurf-${interaction.user.username}`;
              const text_category_id = process.env.CARRINHO
              
              if (!interaction.guild.channels.cache.get(text_category_id)) text_category_id = null;
              
              if (interaction.guild.channels.cache.find(c => c.name === channel_name)) {
                interaction.reply({ content:` Você já possui uma compra aberta em ${interaction.guild.channels.cache.find(c => c.name === channel_name)}, por favor, realize uma compra de cada vez!`, ephemeral: true })
              } else{

                const index = estoqueData.findIndex(account => account.skins.includes(skinInput));
                if (index !== -1) {
    
                  const removedAccount = estoqueData.splice(index, 1)[0];
                  fs.writeFileSync('./databases/estoque.json', JSON.stringify(estoqueData, null, 2));
                  //console.log('Conta removida:', removedAccount);
    
                }else{
    
                  interaction.reply({ content:`A skin "${skinInput}" não existe no estoque.`, ephemeral: true});

                }
                
                const { valor } = accountWithLowestValue;
                const transactionAmount = parseFloat((valor - valor * 0.1).toFixed(2))
                const description = `Smurf - ${skinInput}`

                const buyerName = 'Nome do comprador';
                const buyerEmail = 'email@example.com';
                const buyerCPF = '47161952441';

                const accessToken = process.env.MPTOKEN

                const apiUrl = 'https://api.mercadopago.com/v1/payments';
                
                const paymentData = {
                  transaction_amount: transactionAmount,
                  description: description,
                  payment_method_id: 'pix',
                  payer: {
                    email: buyerEmail,
                    identification: {
                      type: 'CPF',
                      number: buyerCPF
                    },
                    first_name: buyerName
                  }
                };

                const headers = {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`
                };

                fetch(apiUrl, {
                  method: 'POST',
                  headers: headers,
                  body: JSON.stringify(paymentData)
                })
                  .then(response => response.json())
                  .then(data => {
                    
                    const paymentID = data.id
                    const pixKey = data.point_of_interaction.transaction_data.qr_code;
                    const ticketUrl = data.point_of_interaction.transaction_data.ticket_url;

                    async function generateQRCode(pixKey) {
                      try {
                        const qrCodeDataUrl = await qrcode.toDataURL(pixKey);
                        const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
                        const qrCodeBuffer = Buffer.from(base64Data, 'base64');

                        fs.writeFileSync('./databases/qrcode.png', qrCodeBuffer);

                        //console.log('QR code gerado com sucesso!');
                      } catch (err) {
                        console.error('Erro ao gerar o QR code:', err);
                      }
                    }

                    generateQRCode(pixKey)
                    const file = new AttachmentBuilder('./databases/qrcode.png');


                                        
                    const { user_id, uuid, data_compra, login, password, valor, server, level, essencia, nickname, email, nascimento, criacao, provedor, skins, skinsRarity } = accountWithLowestValue;
                    const pagAtivosData = JSON.parse(fs.readFileSync('./databases/pagAtivos.json', 'utf8'));

                    const maskedLogin = login.substring(0, 4) + '*'.repeat(login.length - 4);
                    const skinsString = skins.join('\n')
                    const valorAtualizado = parseFloat((valor - valor * 0.1).toFixed(2))
    
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

                      const channelID = ch.id;

                      pagAtivosData.push({
                        
                        mp_id: paymentID,
                        user_id: user_id,
                        uuid: uuid,
                        data_compra: data_compra,
                        cupom: cupomInput,
                        pix: pixKey,
                        channel_id: channelID,
                        server: server,
                        valor: valor,
                        valorAtualizado: valorAtualizado,
                        login: login,
                        password: password,
                        level: level,
                        essencia: essencia,
                        nickname: nickname,
                        email: email,
                        nascimento: nascimento,
                        criacao: criacao,
                        provedor: provedor,
                        skins: skins,
                        skinsRarity: skinsRarity
    
                    });     
    
    
                  fs.writeFileSync('./databases/pagAtivos.json', JSON.stringify(pagAtivosData, null, 2));
                      
                      const embed = new Discord.EmbedBuilder()
                      .setColor("Purple")
                      .setTitle(`ID: ${uuid}`)
                      .setDescription(`**Skin selecionada:** ${skinInput}\n **Login:** ${maskedLogin}\n **Valor:** ${valorAtualizado}\n\n**Skins:** \n${skinsString}\n\n
                      🔒 Cancelar Compra\n
                      💵 Código PIX copia e cola\n
                      📞 Peça ajuda\n
                      ❔ F.A.Q\n
                      `)
                      .setThumbnail('attachment://qrcode.png');
                      const button = new Discord.ActionRowBuilder().addComponents(
                      new Discord.ButtonBuilder()
                      .setCustomId("close")
                      .setEmoji("🔒")
                      .setStyle(Discord.ButtonStyle.Danger),
                      new Discord.ButtonBuilder()
                      .setCustomId("pix")
                      .setEmoji("💵")
                      .setStyle(Discord.ButtonStyle.Success),
                      new Discord.ButtonBuilder()
                      .setCustomId("help")
                      .setEmoji("📞")
                      .setStyle(Discord.ButtonStyle.Primary),
                      new Discord.ButtonBuilder()
                      .setCustomId("info")
                      .setEmoji("❔")
                      .setStyle(Discord.ButtonStyle.Secondary),
                      new Discord.ButtonBuilder()
                      .setLabel('PIX Ticket')
                      .setURL(`${ticketUrl}`)
                      .setStyle(Discord.ButtonStyle.Link),
                      );
                      
                      ch.send({ embeds: [embed], components: [button], files: [file] })
                      interaction.reply({ content: `Sua compra de **${skinInput}** foi aberta no canal: ${ch}, você utilizou o CUPOM: **${cupomInput}** e ganhou 10% de desconto!`, ephemeral: true })
    
                    })

                    const embedLog = new Discord.EmbedBuilder()
                    .setColor("Purple")
                    .setTitle(`Compra aberta`)
                    .setDescription(`**Compra:** ${uuid}\n**User:** ${user_id}\n**Skin selecionada:** ${skinInput}\n **Login:** ${login}\n`)

                    const channelLOG = interaction.guild.channels.cache.get(process.env.LOGCARRINHOS)
                    channelLOG.send({ embeds: [embedLog]})

                    fs.appendFile(
                      './databases/pesquisas.txt',
                      `${user_id};${skinInput}\n`,
                      (error) => {
                        if (error) {
                          console.error(error);
                        }
                      }
                    );
    
                  })
                  .catch(error => {
                    interaction.reply({ content: `Erro ao criar sua compra, por favor abra um ticket de suporte.`, ephemeral: true })
                    console.error('Erro ao criar a preferência de pagamento:', error);
                  });
                    
              }
      
            }else{

              const channel_name = `💳-smurf-${interaction.user.username}`;
              const text_category_id = process.env.CARRINHO
              
              if (!interaction.guild.channels.cache.get(text_category_id)) text_category_id = null;
              
              if (interaction.guild.channels.cache.find(c => c.name === channel_name)) {
                interaction.reply({ content:` Você já possui uma compra aberta em ${interaction.guild.channels.cache.find(c => c.name === channel_name)}, por favor, realize uma compra de cada vez!`, ephemeral: true })
              } else{

                const index = estoqueData.findIndex(account => account.skins.includes(skinInput));
                if (index !== -1) {
    
                  const removedAccount = estoqueData.splice(index, 1)[0];
                  fs.writeFileSync('./databases/estoque.json', JSON.stringify(estoqueData, null, 2));
                  //console.log('Conta removida:', removedAccount);
    
                }else{
    
                  //console.log('A skin não existe no estoque.');

                }
                
                const { valor } = accountWithLowestValue;
                const transactionAmount = valor
                const description = `Smurf - ${skinInput}`

                const buyerName = 'Nome do comprador';
                const buyerEmail = 'email@example.com';
                const buyerCPF = '47843513884';

                const accessToken = process.env.MPTOKEN

                const apiUrl = 'https://api.mercadopago.com/v1/payments';
                
                const paymentData = {
                  transaction_amount: transactionAmount,
                  description: description,
                  payment_method_id: 'pix',
                  payer: {
                    email: buyerEmail,
                    identification: {
                      type: 'CPF',
                      number: buyerCPF
                    },
                    first_name: buyerName
                  }
                };

                const headers = {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`
                };

                fetch(apiUrl, {
                  method: 'POST',
                  headers: headers,
                  body: JSON.stringify(paymentData)
                })
                  .then(response => response.json())
                  .then(data => {
                    
                    const paymentID = data.id
                    const pixKey = data.point_of_interaction.transaction_data.qr_code;
                    const ticketUrl = data.point_of_interaction.transaction_data.ticket_url;

                    async function generateQRCode(pixKey) {
                      try {
                        const qrCodeDataUrl = await qrcode.toDataURL(pixKey);
                        const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
                        const qrCodeBuffer = Buffer.from(base64Data, 'base64');

                        fs.writeFileSync('./databases/qrcode.png', qrCodeBuffer);

                        //console.log('QR code gerado com sucesso!');
                      } catch (err) {
                        console.error('Erro ao gerar o QR code:', err);
                      }
                    }

                    generateQRCode(pixKey)
                    const file = new AttachmentBuilder('./databases/qrcode.png');


                                        
                    const { user_id, uuid, data_compra, login, password, valor, server, level, essencia, nickname, email, nascimento, criacao, provedor, skins, skinsRarity } = accountWithLowestValue;
                    const pagAtivosData = JSON.parse(fs.readFileSync('./databases/pagAtivos.json', 'utf8'));

                    const maskedLogin = login.substring(0, 4) + '*'.repeat(login.length - 4);
                    const skinsString = skins.join('\n')
                    const valorAtualizado = valor 
    
    
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
                      
                      const channelID = ch.id;

                      pagAtivosData.push({
                        
                        mp_id: paymentID,
                        user_id: user_id,
                        uuid: uuid,
                        data_compra: data_compra,
                        cupom: cupomInput,
                        pix: pixKey,
                        channel_id: channelID,
                        server: server,
                        valor: valor,
                        valorAtualizado: valorAtualizado,
                        login: login,
                        password: password,
                        level: level,
                        essencia: essencia,
                        nickname: nickname,
                        email: email,
                        nascimento: nascimento,
                        criacao: criacao,
                        provedor: provedor,
                        skins: skins,
                        skinsRarity: skinsRarity
    
                    });

                    fs.writeFileSync('./databases/pagAtivos.json', JSON.stringify(pagAtivosData, null, 2));

                      const embed = new Discord.EmbedBuilder()
                      .setColor("Purple")
                      .setTitle(`ID: ${uuid}`)
                      .setDescription(`**Skin selecionada:** ${skinInput}\n **Login:** ${maskedLogin}\n **Valor:** ${valorAtualizado}\n\n**Skins:** \n${skinsString}\n\n
                      🔒 Cancelar Compra\n
                      💵 Código PIX copia e cola\n
                      📞 Peça ajuda\n
                      ❔ F.A.Q\n
                      `)
                      .setThumbnail('attachment://qrcode.png');
                      const button = new Discord.ActionRowBuilder().addComponents(
                      new Discord.ButtonBuilder()
                      .setCustomId("close")
                      .setEmoji("🔒")
                      .setStyle(Discord.ButtonStyle.Danger),
                      new Discord.ButtonBuilder()
                      .setCustomId("pix")
                      .setEmoji("💵")
                      .setStyle(Discord.ButtonStyle.Success),
                      new Discord.ButtonBuilder()
                      .setCustomId("help")
                      .setEmoji("📞")
                      .setStyle(Discord.ButtonStyle.Primary),
                      new Discord.ButtonBuilder()
                      .setCustomId("info")
                      .setEmoji("❔")
                      .setStyle(Discord.ButtonStyle.Secondary),
                      new Discord.ButtonBuilder()
                      .setLabel('PIX Ticket')
                      .setURL(`${ticketUrl}`)
                      .setStyle(Discord.ButtonStyle.Link),
                      );
                      
                      ch.send({ embeds: [embed], components: [button], files: [file] })
                      interaction.reply({ content: `Sua compra de **${skinInput}** foi aberta no canal: ${ch}, você não utilizou cupom ou inseriu um cupom inválido!`, ephemeral: true })
      
                    })

                    const embedLog = new Discord.EmbedBuilder()
                    .setColor("Purple")
                    .setTitle(`Compra aberta`)
                    .setDescription(`**Compra:** ${uuid}\n**User:** ${user_id}\n**Skin selecionada:** ${skinInput}\n **Login:** ${login}\n`)

                    const channelLOG = interaction.guild.channels.cache.get(process.env.LOGCARRINHOS)
                    channelLOG.send({ embeds: [embedLog]})

                    fs.appendFile(
                      './databases/pesquisas.txt',
                      `${user_id};${skinInput}\n`,
                      (error) => {
                        if (error) {
                          console.error(error);
                        }
                      }
                    );

                  })
                  .catch(error => {
                    interaction.reply({ content: `Erro ao criar sua compra, por favor abra um ticket de suporte.`, ephemeral: true })
                    console.error('Erro ao criar a preferência de pagamento:', error);
                  });

              }

            }
       

        } else {
    
        interaction.reply({ content:`A skin "${skinInput}" não existe no estoque.`, ephemeral: true});

        }

    }

}


