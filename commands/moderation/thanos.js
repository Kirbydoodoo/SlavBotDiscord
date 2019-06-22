const command = require("discord.js-commando");
var CommandCounter = require("../../index.js")

function getRandom(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

class ThanosCommand extends command.Command
 {
    constructor(client)
    {
        super(client, {
            name: "thanos",
            group: "moderation",
            memberName: "thanos",
            description: "Perfectly balanced, as all servers should be. Kicks half the members of a server. Only available to the server owner.",
            examples: ["`!thanos`"]
        });
    }

    async run(message, args)
    {
        if(message.guild == null)
        {
            return;
        }
        
        if(message.author.id == message.guild.ownerID)
        {
            CommandCounter.addCommandCounter(message.author.id)
            var users = [];
    
            message.guild.fetchMembers().then(() => {
                var allMembers = message.guild.members.array()
                for(var i = 0; i < allMembers.length; i++)
                {
                    if(allMembers[i].id != message.guild.ownerID && !allMembers[i].bot)
                    {
                        users.push(allMembers[i])
                    }
                }
    
                var victimsAmount = Math.floor(users.length / 2)

                if(victimsAmount > 0)
                {
                    for(var i = 0; i < 11; i++)
                    {
                        if(i == 10)
                        {
                            setTimeout(() => {
                                users = getRandom(users, victimsAmount)
    
                                for(var i = 0; i < users.length; i++)
                                {
                                    users[i].kick("To preserve the balance of the server.").catch(function(error){
                                        console.log(error.message);
                                    })
                                }
                    
                                message.channel.send("<@" + message.author.id + "> " + numberWithCommas(victimsAmount) + " user(s) have been kicked. Perfectly balanced, as all servers should be.", {files: ["thanos.gif"]}).catch(error => console.log("Send Error - " + error));
                            }, i * 1000)
                        }
                        else
                        {
                            if(i == 0)
                            {
                                message.channel.send("Balancing server in 10 second(s)").catch(error => console.log("Send Error - " + error));
                            }
                            else
                            {
                                setTimeout(() => {
                                    message.channel.send("Balancing server in " + (10 - i) + " second(s)").catch(error => console.log("Send Error - " + error));
                                }, i * 1000) 
                            }
                        }
                       
                    }
                }
                else
                {
                    message.channel.send("<@" + message.author.id + "> No users to kick.").catch(error => console.log("Send Error - " + error));
                } 
            })
        }
        else
        {
            message.channel.send("<@" + message.author.id + "> This command is only available to the server owner.").catch(error => console.log("Send Error - " + error));
        }
    }
}

module.exports = ThanosCommand;
