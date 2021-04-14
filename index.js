const {
    Client,
    MessageEmbed
} = require('discord.js')
const client = new Client
const {
    prefix,
    token
} = require('./config.json')

client.on('ready', () => {
    console.clear()
    console.log(`${client.user.tag} is online!`)
})

let backupCache = {

}

client.on('message', async message => {
    if (!message.content.startsWith(prefix) || (message.author.bot && message.content.startsWith(prefix))) return;

    let args = message.content.slice(prefix.length).trim().split(/\s+/g)
    let command = args.shift().toLowerCase()

    if (command === "backup") {
        let channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0])
        if (!channel) return message.channel.send("Please mention a channel to backup")

        if (backupCache[channel.id]) return message.channel.send("A backup for this channel already exists")
        let limit = parseInt(args[1])
        if (isNaN(limit)) return message.channel.send("Invalid number or no number provided")

        let msgs = await channel.messages.fetch({
            limit: limit
        })

        msgs.sort((a, b) => a.createdTimestamp - b.createdTimestamp)

        backupCache[channel.id] = []
        msgs.forEach(c => {
            let data = {
                jump: c.url,
                username: c.author.username,
                avatar: c.author.displayAvatarURL({
                    dynamic: true
                }),
                content: c.attachments.size ? c.attachments.first().proxyURL : c.embeds.length !== 0 ? c.embeds[0] : c.content
            }
            backupCache[channel.id].push(data)
        })

        await message.channel.send("Successfully backed up " + channel.toString() + "'s messages")
    }

    if (command === "load") {

        let channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0])
        let channelID = args[1]
        if (!channel) return message.channel.send("Please mention a channel for me to load backup messages")
        if (!channelID) return message.channel.send("Please provide a channel id for me to retrieve backups")
        if (!backupCache[channelID]) return message.channel.send("Please provide a valid backup id")

        let webhook = await channel.createWebhook('Message backup', {
            avatar: "https://image.shutterstock.com/image-vector/talk-bubble-speech-icon-blank-260nw-1415472902.jpg",
            reason: "A message backup was called"
        })

        for (const c of backupCache[channelID]) {
            if (c.content instanceof Object) {
                await webhook.send('', {
                    avatarURL: c.avatar,
                    username: c.username,
                    embeds: [c.content]
                })
            } else {
                await webhook.send(c.content, {
                    avatarURL: c.avatar,
                    username: c.username
                })
            }

        }

        await webhook.delete().catch(e => message.channel.send("Failed to delete webhook, please manually delete"))
    }
})

client.login(token)