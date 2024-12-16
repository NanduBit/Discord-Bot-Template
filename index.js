const { Client, GatewayIntentBits, Collection } = require("discord.js");
const config = require("./config");
const fs = require("node:fs");
const path = require("node:path");
//require("./database/connect");
// uncomment this only if u want an mongodb database to work with
require("./server");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    //GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
client.cooldowns = new Collection();

const handlerPath = path.join(__dirname, "handlers");
const handlerFiles = fs
  .readdirSync(handlerPath)
  .filter((file) => file.endsWith(".js"));

for (const file of handlerFiles) {
  const filePath = path.join(handlerPath, file);
  const handler = require(filePath);
  if (handler.execute) {
    handler.execute(client);
  } else {
    console.log(`[❌] ${file} Handler Doesn't Have Execute Function`);
  }
}

process.on("unhandledRejection", (error) => {
  console.error("[❌] Error: ", error);
});

process.on("uncaughtException", (error) => {
  console.error("[❌] Error: ", error);
});

client.login(config.TOKEN);
