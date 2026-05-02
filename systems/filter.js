const { SlashCommandBuilder, REST, Routes, PermissionsBitField, EmbedBuilder } = require("discord.js");

// ================== BAD WORDS ==================
const badWords = [
  "مص","كس","زب","امك","خواتك","قحبه","خالاتك",
  "شرموط","شرمطه","قواد","كواد",
  "كسمك","كسختك","يبن القحبه","القحبه",
  "نياجك","سكس","انيك","الكحبه","كحبه",
  "عير","بلاعه","نيجك","العريض",
  "مناويج","بيدوفيلي","قاصر","قاصره",
  "اعرض","كسي","كسك"
];

// ================== CONFIG ==================
let config = {
  logChannel: null,
  mentionRole: null
};

// ================== SLASH COMMAND ==================
const commands = [
  new SlashCommandBuilder()
    .setName("setfilter")
    .setDescription("تحديد لوق الفلتر والرتبة")
    .addChannelOption(o =>
      o.setName("log")
        .setDescription("روم اللوق")
        .setRequired(true)
    )
    .addRoleOption(o =>
      o.setName("role")
        .setDescription("الرتبة اللي تنمنشن")
        .setRequired(true)
    )
];

// ================== REGISTER ==================
async function registerFilter(clientId, guildId, token) {
  const rest = new REST({ version: "10" }).setToken(token);

  try {
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log("✅ Filter command registered");
  } catch (e) {
    console.log("❌ Filter register error:", e);
  }
}

// ================== CLEAN TEXT ==================
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, " ") // يشيل الرموز
    .split(/\s+/); // يقسم كلمات
}

// ================== FILTER SYSTEM ==================
async function filterSystem(message, client) {
  if (!message || message.author.bot) return;

  const words = normalize(message.content);

  // تطابق كلمة كاملة فقط
  const found = badWords.some(bad =>
    words.includes(bad)
  );

  if (!found) return;

  try {
    await message.delete();

    const member = message.member;
    await member.timeout(5 * 60 * 1000, "Bad word detected");

    // ================== LOG ==================
    if (config.logChannel) {
      const log = message.guild.channels.cache.get(config.logChannel);

      if (log) {
        const embed = new EmbedBuilder()
          .setTitle("🚨 فلتر كلمة مسيئة")
          .setColor(0xff0000)
          .setDescription(
            `**العضو:** <@${message.author.id}>\n` +
            `**الرسالة:** ${message.content}\n` +
            `**العقوبة:** تايم 5 دقائق`
          )
          .setTimestamp();

        log.send({
          content: `<@&${config.mentionRole}>`,
          embeds: [embed]
        });
      }
    }

  } catch (e) {
    console.log(e);
  }
}

// ================== SET CONFIG ==================
function setConfig(logChannel, role) {
  config.logChannel = logChannel;
  config.mentionRole = role;
}

module.exports = {
  filterSystem,
  registerFilter,
  setConfig
};
