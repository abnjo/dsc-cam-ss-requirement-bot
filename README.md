# dsc-cam-ss-requirement-bot
Self-hosted Discord bot that Checks if the members in the channel have enabled video or screenshare or both(configurable), in the channels mentioned by thier id or having a matching keyword
### features:
* checks if the members have enabled thier camera/ss/either for configured cam only/ss only/"either works" channels and kicks them out of the channel if they havent
* configurable time of action 
* warnings to the user in the chat to do the recommended action
* restarts the warnings and timeouts if the user turns off the recommended action
* supports warnings only without kicking

### configuration
dsc-cam-ss-requirement-bot relies strictly on environment variables. Use the `.env` file in the root directory or inject these keys via your hosting dashboard.

```env
DISCORD_TOKEN=your_bot_token_here
GRACE_PERIOD_SECONDS=20
TARGET_RULES="1234567890123456789:1:0,study:0:1,stream:1:2"
```
How to deploy 

for local hosting:

1: clone the repo:
``` bash
git clone https://github.com/abnjo/dsc-cam-ss-requirement-bot.git
```

install node for your operating system 

[![Node.js Installation](https://img.shields.io/badge/Node.js-Install_via_Package_Manager-339933?logo=nodedotjs)](https://nodejs.org/en/download/package-manager)

