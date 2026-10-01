require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');

const BOT_TOKEN = process.env.DISCORD_TOKEN 
  ? process.env.DISCORD_TOKEN.trim().replace(/['"]/g, '') 
  : undefined;

const TARGET_RULES_RAW = process.env.TARGET_RULES 
  ? process.env.TARGET_RULES.trim().replace(/['"]/g, '') 
  : undefined;

const GRACE_PERIOD_MS = (parseInt(process.env.GRACE_PERIOD_SECONDS, 10) || 90) * 1000;

if (!BOT_TOKEN || BOT_TOKEN.length < 50) {
  console.error(`[FATAL] Invalid Token.`);
  process.exit(1);
}
if (!TARGET_RULES_RAW) {
  console.error("[FATAL] TARGET_RULES is undefined in your .env file.");
  process.exit(1);
}

// ---------------------------------------------------------
// RULE PARSER 
// ---------------------------------------------------------
const rules = [];
const ruleStrings = TARGET_RULES_RAW.split(',');

for (const ruleStr of ruleStrings) {
  if (!ruleStr.trim()) continue;
  
  const parts = ruleStr.trim().split(':');
  
  if (parts.length < 3) {
    console.warn(`[WARNING] Skipping invalid rule: "${ruleStr}". Expected format -> TARGET:KICK_MODE:MEDIA_MODE`);
    continue;
  }
  
  const mode = parseInt(parts.pop().trim(), 10);
  const enforce = parseInt(parts.pop().trim(), 10);
  const target = parts.join(':').trim(); 

  if (isNaN(enforce) || isNaN(mode)) {
    console.warn(`[WARNING] Rule "${ruleStr}" has non-numeric modes. Skipping.`);
    continue;
  }
  
  rules.push({
    target: target,
    enforce: enforce === 1, // true = Kick, false = Warn
    mode: mode              // 0 = Both, 1 = Cam, 2 = SS
  });
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const pendingKicks = new Map();

// ---------------------------------------------------------
// EVALUATION PRIMITIVES
// ---------------------------------------------------------
const getRuleForChannel = (channel) => {
  if (!channel) return null;
  let match = rules.find(r => r.target === channel.id);
  if (match) return match;
  match = rules.find(r => channel.name.toLowerCase().includes(r.target.toLowerCase()));
  return match;
};

const hasRequiredMedia = (voiceState, mode) => {
  const cam = voiceState.selfVideo;
  const ss = voiceState.streaming;
  if (mode === 0) return cam || ss;
  if (mode === 1) return cam;
  if (mode === 2) return ss;
  return false;
};

const getMediaString = (mode) => {
  if (mode === 0) return '**camera** or **screenshare**';
  if (mode === 1) return '**camera**';
  if (mode === 2) return '**screenshare**';
  return 'media';
};

// ---------------------------------------------------------
// ENFORCEMENT ENGINE
// ---------------------------------------------------------
const enforceVoiceState = (member) => {
  if (!member || member.user.bot) return;

  const currentVoiceChannel = member.voice.channel;
  const activeRule = getRuleForChannel(currentVoiceChannel);
  
  const isInViolation = activeRule !== null && !hasRequiredMedia(member.voice, activeRule.mode);

  if (activeRule && !pendingKicks.has(member.id)) {
      console.log(`[EVAL] ${member.user.tag} in "${currentVoiceChannel.name}" -> Rule matched. Kick enabled: ${activeRule.enforce}, Mode: ${activeRule.mode}`);
  }

  if (isInViolation) {
    if (pendingKicks.has(member.id)) return; 

    if (currentVoiceChannel) {
      currentVoiceChannel.send({
        content: `${member}, please enable ${getMediaString(activeRule.mode)}. Action will be taken in **${GRACE_PERIOD_MS / 1000}s**.`
      }).catch(() => {});
    }

    const timer = setTimeout(async () => {
      pendingKicks.delete(member.id);
      
      const freshMember = await currentVoiceChannel.guild.members.fetch(member.id).catch(() => null);
      const freshChannel = freshMember?.voice?.channel;
      const freshRule = getRuleForChannel(freshChannel);
      
      if (freshRule && !hasRequiredMedia(freshMember.voice, freshRule.mode)) {
        if (freshRule.enforce) {
          // Rule E=1 (Kick)
          try {
            await freshMember.voice.disconnect('Failed media requirement.');
            freshChannel.send({ content: `${freshMember.user.tag} disconnected (timeout).` }).catch(() => {});
          } catch (err) {
            console.error(`[EXEC ERROR] Failed to kick ${freshMember.user.tag}: ${err.message}`);
            freshChannel.send({ content: `**Error:** I tried to disconnect ${member}, but Discord blocked me. Check my channel permissions.` }).catch(() => {});
          }
        } else {
          // Rule E=0 (Warn Only)
          freshChannel.send({ content: `**Warning:** ${member} is still in violation of channel rules (Missing ${getMediaString(freshRule.mode)}).` }).catch(() => {});
        }
      }
    }, GRACE_PERIOD_MS);

    pendingKicks.set(member.id, timer);

  } else {
    if (pendingKicks.has(member.id)) {
      clearTimeout(pendingKicks.get(member.id));
      pendingKicks.delete(member.id);
      
      if (activeRule && currentVoiceChannel) {
        currentVoiceChannel.send({
          content: `Stream detected. Thanks ${member}!`
        }).catch(() => {});
      }
    }
  }
};

client.once(Events.ClientReady, async () => {
  console.log(`[ONLINE] Logged in as ${client.user.tag}`);
  console.log(`[CONFIG] Loaded ${rules.length} rule(s) from .env:`);
  console.table(rules); // <--- This will visually prove what it read from the config
  
  for (const guild of client.guilds.cache.values()) {
    for (const channel of guild.channels.cache.values()) {
      if (channel.isVoiceBased() && getRuleForChannel(channel)) {
        channel.members.forEach(member => enforceVoiceState(member));
      }
    }
  }
});

client.on('voiceStateUpdate', (oldState, newState) => {
  enforceVoiceState(newState.member);
});

const handleShutdown = () => {
  for (const timer of pendingKicks.values()) clearTimeout(timer);
  pendingKicks.clear();
  client.destroy();
  process.exit(0);
};
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

client.login(BOT_TOKEN);