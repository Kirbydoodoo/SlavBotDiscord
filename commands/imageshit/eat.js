const command = require("discord.js-commando");
const Jimp = require("jimp");
const shortid = require("shortid");
const fs = require('fs-extra');
var resultHandler = function(err) { 
    if(err) {
       console.log("unlink failed", err);
    } else {
       console.log("file deleted");
    }
}
var CommandCounter = require("../../index.js")

const selfResponses = [", they won't find your body once I digest it",  " I know where you live", " can' you do *anything* properly'?", " you're not eating me, *I'm* eating you"," you have just turned all of the gopniks against you, blyat", " you will hear hardbass in your sleep"];

class EatCommand extends command.Command
 {
    constructor(client)
    {
        super(client, {
            name: "eat",
            group: "imageshit",
            memberName: "eat",
            description: "Eat another user.",
            examples: ["`!eat`", "`!eat @User`"]
        });
    }

    async run(message, args)
    {
        
        CommandCounter.addCommandCounter(message.author.id)
        var otherUser = false;
        var userID = "";

        var commandPrefix= "!"
        if(message.guild != null)
        {
            commandPrefix = message.guild.commandPrefix
        }

        if(args.length > 0)
        {
            console.log("args are present");
            var getUser = false;
            for(var i = 0; i < args.length; i++)
            {
                if(getUser)
                {
                    if(args[i].toString() == ">")
                    {
                        i = args.length;
                        otherUser = true;
                    }
                    else
                    {
                        if(args[i].toString() != "@" && !isNaN(args[i].toString()))
                        {
                            userID = userID + args[i].toString();
                        }
                    }
                }
                else
                {
                    if(args[i].toString() == "<")
                    {
                         getUser = true;
                    } 
                }
            }
        }
        
        var promises = []
        var url = "";
        if(otherUser && userID != message.author.id)
        {
            console.log(userID);

            promises.push(message.channel.client.fetchUser(userID)
                .then(user => {
                    if(user.avatarURL != undefined && user.avatarURL != null)
                       url = user.avatarURL;
                   else
                       url = "no user"
                }, rejection => {
                       console.log(rejection.message);
                       url = "no user";
                }))

                
            Jimp.read("eat.jpg").then(function (eatImage) {
                console.log("got image");
                if(message.author.avatarURL == undefined || message.author.avatarURL == null)
                {
                    message.channel.send("<@" + message.author.id + "> No avatar found.").catch(error => {console.log("Send Error - " + error); });
                    return;
                }
                
                Jimp.read(message.author.avatarURL).then(function (authorImage) {
                    
                    Promise.all(promises).then(() => {
                        Jimp.read(url).then(function (userImage) {
                        
                            console.log("got avatar");
                            userImage.resize(145, 145);
                            authorImage.resize(110, 110);
                            var xAuthor = 120
                            var yAuthor = 30
                            var x = 235
                            var y = 115
                            var mergedImageEat = eatImage.composite(authorImage, xAuthor, yAuthor );
                            var mergedImage = mergedImageEat.composite(userImage, x, y);
                            const file = "TempStorage/" + shortid.generate() + ".png"
                            mergedImage.write(file, function(error){
                                if(error) { console.log(error); return;};
                                console.log("got merged image");
                                console.log(file);
                                message.channel.send("<@" + message.author.id+ "> ***ate*** <@" + userID + ">", {
                                    files: [file]
                                }).then(function(){
                                    if(userID == message.client.user.id)
                                    {
                                        message.channel.send("<@" + message.author.id + ">" + selfResponses[Math.floor(Math.random() * (selfResponses.length))]).catch(error => {console.log("Send Error - " + error); });
                                    }
                                    fs.remove(file, resultHandler);
                                }).catch(function (err) {
                                    message.channel.send("Error - " + err.message).catch(error => {console.log("Send Error - " + error); });
                                    console.log(err.message);
                                    
                                    fs.remove(file, resultHandler);
                                });
                                console.log("Message Sent");
                            });
                        }).catch(function (err) {
                            if(url == "no user")
                            {
                                message.channel.send("<@" + message.author.id + "> No avatar found.").catch(error => {console.log("Send Error - " + error); });
                            }
                            else
                                message.channel.send("Error - " + err.message).catch(error => {console.log("Send Error - " + error); });
                            console.log(err.message);
                        });
                    }).catch((e) => {
                        console.log("User Data Error - " + e.message);
                        message.channel.send("User data not found").catch(error => console.log("Send Error - " + error));
                    });
                }).catch(function (err) {
                    message.channel.send("Error - " + err.message).catch(error => {console.log("Send Error - " + error); });
                    console.log(err.message);
                    
                });
            }).catch(function (err) {
                console.log(err.message);
                
            });
        }
        else
        {
            message.channel.send("<@" + message.author.id + "> Please tag another user. Use `" + commandPrefix + "help eat` for more info.").catch(error => {console.log("Send Error - " + error); });  
        }
    }
}

module.exports = EatCommand;
