const Discord = require("discord.js")
const fs = require("fs");

module.exports = {
  name: "skin",
  description: "Pesquise skins no estoque",
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'campeão',
      description: 'Escolha um campeão',
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
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

    function readChampionsData(filePath) {
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

    async function getChampionNames() {
      try {
        const championsData = await readChampionsData('./databases/champions.json');
        const championNames = championsData.map(champion => champion.name);
        return championNames;
      } catch (error) {
        console.error(error);
        return [];
      }
    }

    async function getChampionIdByName(championName) {
      try {
        const championsData = await readChampionsData('./databases/champions.json');
        const champion = championsData.find(champion => champion.name === championName);
        if (champion) {
          return champion.id;
        } else {
          return null; 
        }
      } catch (error) {
        console.error(error);
        return null;
      }
    }
    
    const championsData = await getChampionNames();
    //console.log(championsData)

    const userInput = interaction.options.getString('campeão');

    if (!championsData.includes(userInput)) {

      interaction.reply({
        content: `Esse campeão não existe no League of Legends!`,
        ephemeral: true
      });
   

    }else{

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

      const championName = userInput;


      const skinsArray = [];
      const valoresArray = [];
      
      estoqueData.forEach(accounts => {
        accounts.skins.forEach(skin => {
          if (skin.includes(championName)) {
            const skinValue = accounts.valor;
            const existingIndex = skinsArray.indexOf(skin);
      
            if (existingIndex === -1) {
              skinsArray.push(skin);
              valoresArray.push(skinValue);
            } else if (skinValue < valoresArray[existingIndex]) {
              valoresArray[existingIndex] = skinValue;
            }
          }
        });
      });
      
      function readSplashData(filePath) {
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

      const splashData = await readSplashData('./databases/champions.json');
      const splashArray = [];

      skinsArray.forEach(skin => {
        splashData.forEach(champion => {
          const skinIndex = champion.skins.name.indexOf(skin);
          if (skinIndex !== -1) {
            const skinImage = champion.skins.image[skinIndex];
            splashArray.push(skinImage);
          }
        });
      });
      
      //console.log(skinsArray);
      //console.log(valoresArray);
      //console.log(splashArray)

      const skinsWithValues = [];
      for (let i = 0; i < skinsArray.length; i++) {
        const skin = skinsArray[i];
        const valor = valoresArray[i];
        skinsWithValues.push(`🧦  ${skin} ➝  **R$ ${valor}**`);
      }
      
      const skinsString = skinsWithValues.join('\n');

      if(skinsArray.length === 0){

        const championId = await getChampionIdByName(userInput);
        const embed = new Discord.EmbedBuilder()
        .setTitle('Skins em nosso estoque:')
        .setDescription(`\n\nNão foi encontrado skins para esse campeão em nosso estoque`)
        .setColor('#ca00fa')
        .setImage(`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championId}_0.jpg`);

        interaction.reply({ content: `Você fez uma pesquisa do campeão: ${userInput}`, ephemeral: true })
        const embedMessage = await interaction.channel.send({ embeds: [embed] })
        setTimeout(() => {
          embedMessage.delete();
        }, 10000);

      }else{

          const randomIndex = Math.floor(Math.random() * splashArray.length);
          const randomSplash = splashArray[randomIndex];
          //console.log(randomSplash)
            const embed = new Discord.EmbedBuilder()
              .setTitle('Skins em nosso estoque:')
              .setDescription(`\n\n${skinsString}`)
              .setColor('#ca00fa')
              .setImage(randomSplash);
    
              interaction.reply({ content: `Você fez uma pesquisa do campeão: ${userInput}`, ephemeral: true })
              const embedMessage = await interaction.channel.send({ embeds: [embed] })
              setTimeout(() => {
                embedMessage.delete();
              }, 10000);

      }


    }

  }

}
