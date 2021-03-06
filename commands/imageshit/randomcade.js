const command = require("discord.js-commando");
const request = require('request')
var CommandCounter = require("../../index.js")

class RandomcadeCommand extends command.Command
 {
    constructor(client)
    {
        super(client, {
            name: "randomcade",
            group: "imageshit",
            memberName: "randomcade",
            description: "Gives an image of a random cade.",
            examples: ["`!randomcade`"]
        });
    }

    async run(message, args)
    {
        CommandCounter.addCommandCounter(message.author.id)
        request('http://thecatapi.com/api/images/get?format=src', { json: false }, (err, res, body) => {
            if (err) { return console.log(err); }
                console.log(res.request.uri.href);
                message.channel.send("", {files: [res.request.uri.href]}).catch(error => {console.log("Send Error - " + error); message.channel.send(res.request.uri.href).catch(error => {console.log("Send Error 2 - " + error); message.channel.send("Error - " + error).catch(error => {console.log("Send Error 3 - " + error);});});})
            });
    }
}

module.exports = RandomcadeCommand;