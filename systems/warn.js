const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, REST, Routes } = require("discord.js");
const fs = require("fs");

// ================== DATA ==================
let data = {
  warnEmoji: "🍥",
  modRoles: [],
  logChannel: null,
  messages: [],
  warns: {},
  usedMessages: {}
};

if (fs.existsSync("./data.json")) {
  data = JSON.parse(fs.readFileSync("./data.json"));
}

function save() {
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
}

// ================== SLASH COMMANDS ==================
const commands = [
  new SlashCommandBuilder()
    .setName("setwarnemoji")
    .setDescription("تحديد ايموجي التحذير")
    .addStringOption(o =>
      o.setName("emoji")
        .setDescription("الايموجي")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("setmodroles")
    .setDescription("تحديد رتب المود")
    .addRoleOption(o => o.setName("role1").setDescription("رتبة 1").setRequired(true))
    .addRoleOption(o => o.setName("role2").setDescription("رتبة 2"))
    .addRoleOption(o => o.setName("role3").setDescription("رتبة 3"))
    .addRoleOption(o => o.setName("role4").setDescription("رتبة 4"))
    .addRoleOption(o => o.setName("role5").setDescription("رتبة 5"))
    .addRoleOption(o => o.setName("role6").setDescription("رتبة 6")),

  new SlashCommandBuilder()
    .setName("setlogchannel")
    .setDescription("تحديد روم اللوق")
    .addChannelOption(o =>
      o.setName("channel")
        .setDescription("روم اللوق")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("setmessages")
    .setDescription("تحديد رسائل التحذير")
    .addStringOption(o => o.setName("m1").setDescription("رسالة 1").setRequired(true))
    .addStringOption(o => o.setName("m2").setDescription("رسالة 2").setRequired(true))
    .addStringOption(o => o.setName("m3").setDescription("رسالة 3").setRequired(true))
    .addStringOption(o => o.setName("m4").setDescription("رسالة 4").setRequired(true))
    .addStringOption(o => o.setName("m5").setDescription("رسالة 5").setRequired(true)),

  new SlashCommandBuilder()
    .setName("clearwarns")
    .setDescription("مسح التحذيرات")
    .addUserOption(o =>
      o.setName("user")
        .setDescription("المستخدم")
        .setRequired(true)
    )
];

// ================== REGISTER ==================
async function registerWarnCommands(clientId, guildId, token) {
  const rest = new REST({ version: "10" }).setToken(token);

  try {
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log("✅ Warn commands registered");
  } catch (e) {
    console.log("❌ Warn register error:", e);
  }
}

// ================== SYSTEM ==================
function warnSystem(message, client) {
  return new Promise(async (resolve) => {
    if (!message?.author || message.author.bot) return resolve(false);

    const emoji = data.warnEmoji;

    // هنا فقط منطقك الحقيقي يكون (لو عندك reaction system لاحقاً)
    resolve(false);
  });
}

// ================== REACTION SYSTEM ==================
async function handleReaction(reaction, user, client) {
  try {
    if (user.bot) return;

    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    if (reaction.emoji.name !== data.warnEmoji) return;

    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id);

    const hasPermission =
      member.permissions.has(PermissionsBitField.Flags.Administrator) ||
      data.modRoles.some(r => member.roles.cache.has(r));

    if (!hasPermission) {
      await reaction.users.remove(user.id);
      return;
    }

    const msg = reaction.message;
    const target = msg.author;

    if (!data.usedMessages[msg.id]) data.usedMessages[msg.id] = [];
    if (data.usedMessages[msg.id].includes(user.id)) return;

    data.usedMessages[msg.id].push(user.id);

    await msg.delete();

    if (!data.warns[target.id]) data.warns[target.id] = 0;
    data.warns[target.id]++;

    const count = data.warns[target.id];
    const remaining = 3 - count;

    const randomMsg =
      data.messages[Math.floor(Math.random() * (data.messages.length || 1))] ||
      "تم تحذيرك";

    msg.channel.send(`<@${target.id}> ${randomMsg} (${count}/3) باقي ${remaining}`);

    // LOG
    if (data.logChannel) {
      const ch = guild.channels.cache.get(data.logChannel);

      if (ch) {
        const embed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("Warn Log")
          .setDescription(
            `المخالف: <@${target.id}>\n` +
            `المحذر: <@${user.id}>\n` +
            `التحذيرات: ${count}/3`
          )
          .setTimestamp();

        ch.send({ embeds: [embed] });
      }
    }

    if (count >= 3) {
      const targetMember = await guild.members.fetch(target.id);
      await targetMember.timeout(2 * 60 * 60 * 1000, "3 warns");

      data.warns[target.id] = 0;
    }

    save();
    resolve(true);

  } catch (e) {
    console.log(e);
    resolve(false);
  }
}

module.exports = {
  warnSystem,
  registerWarnCommands,
  handleReaction,
  data
};
