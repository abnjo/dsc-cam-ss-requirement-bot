# dsc-cam-ss-requirement-bot
Self-hosted Discord bot that Checks if the members in the channel have enabled video or screenshare or both(configurable), in the channels mentioned by thier id or having a matching keyword
### features:
* checks if the members have enabled thier camera/ss/either for configured cam only/ss only/"either works" channels and kicks them out of the channel if they havent
* configurable time of action 
* warnings to the user in the chat to do the recommended action
* restarts the warnings and timeouts if the user turns off the recommended action
* supports warnings only without kicking

### prerequisites

1. **Node.js**: v20.0.0 or higher

[![Node.js Installation](https://img.shields.io/badge/Node.js-Install_via_Package_Manager-339933?logo=nodedotjs)](https://nodejs.org/en/download/package-manager)

3. **Discord Bot Token**: Create an application in the [Discord Developer Portal](https://discord.com/developers/applications).
4. **Bot Privileged Intents**: Enable **Voice State Intent** in the Discord Developer Portal under your bot's settings.

### discord Permissions
For DSCDSRB to function, it must have the following permissions in the targeted voice channels (configurable via Server Settings > Roles, or right-clicking a specific channel > Edit > Permissions):

* View Channel (Required to detect joins)

* Connect (Required by Discord API to interact with Voice States)

* Send Messages (Required to send warnings in the Voice Channel Chat)

* Move Members (Required to execute the disconnect/kick command)

### configuration
dsc-cam-ss-requirement-bot relies on environment variables.use the `.env` file in the root directory or inject these keys via your hosting dashboard.

```env
DISCORD_TOKEN=your_bot_token_here
GRACE_PERIOD_SECONDS=20
TARGET_RULES="1234567890123456789:1:0,study:0:1,stream:1:2"
```

target rules syntax
the taget rules accept a comma seperated list of numeric strings with three parts 
`channeid_or_keyword:enforcement:mode`
1. channel id or keyword(case-insensetive,will check if the word is included in the channel name)
2. enforcemennt mode
3. media mode

second part syntax:

    0:x=warning only (literally enforcive, but it will not actually kick anyone)

    1:x=enforcive 

third part syntax
    Second part

    x:0=keyword or channel id should be monitered for cam or ss(either or both are valid)

    x:1= // shoudl be monitered for cam only

    x:2=// shoudl be monitered for ss only 


 example=TARGET_RULES="1506910626134622371:1:0,study:0:1,stream:1:2" 
 1537568208582606948
How to deploy 

for local hosting:

1: clone the repo:
``` bash
git clone https://github.com/abnjo/dsc-cam-ss-requirement-bot.git
```

install node for your operating system 

[![Node.js Installation](https://img.shields.io/badge/Node.js-Install_via_Package_Manager-339933?logo=nodedotjs)](https://nodejs.org/en/download/package-manager)

