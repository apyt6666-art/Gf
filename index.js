require("dotenv").config();

const { Client, GatewayIntentBits, Partials } = require("discord.js");
const mongoose = require("mongoose");

// ================== SYSTEMS ==================
const { buildReply } = require("./ai/ghazal");

const { filterSystem, registerFilter } = require("./systems/filter");
const { registerWarnCommands, handleReaction } = require("./systems/warn");

// ================== ENV ==================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const MONGO_URI = process.env.MONGO_URI;

// ================== CLIENT ==================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// ================== MONGO ==================
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Mongo Connected"))
  .catch(err => console.log(err));

// ================== READY (IMPORTANT FIX) ==================
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    console.log("⏳ Registering slash commands...");

    await registerFilter(CLIENT_ID, GUILD_ID, TOKEN);
    await registerWarnCommands(CLIENT_ID, GUILD_ID, TOKEN);

    console.log("✅ Slash Commands Registered");
  } catch (e) {
    console.log("❌ Slash Register Error:", e);
  }
});

// ================== MESSAGE ==================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  // ================== GHAZAL AI ==================
  if (content.includes("غزل")) {
    const reply = await buildReply(message);
    return message.reply(reply);
  }

  // ================== FILTER ==================
  await filterSystem(message, client);
});

// ================== REACTIONS ==================
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  await handleReaction(reaction, user, client);
});

// ================== LOGIN ==================
client.login(TOKEN);
