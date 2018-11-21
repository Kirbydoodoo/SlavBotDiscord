const command = require("discord.js-commando");
var IndexRef = require("../../index.js")
var firebase = require("firebase");
var signedIntoFirebase = false;
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        signedIntoFirebase = true;
    } 
    else
    {
        signedIntoFirebase = false;
    }
  });
const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const DBL = require("dblapi.js");
const dbl = new DBL(process.env.DBL_TOKEN);

var userSpins = []

class DailySpinCommand extends command.Command
 {
    constructor(client)
    {
        super(client, {
            name: "dailyspin",
            group: "games",
            memberName: "dailyspin",
            description: "Spin the prize wheel once a day for War Tokens! You can only spin the wheel if you have voted for the bot. Patreon supporters get a chance to win the Golden Prize.",
            examples: ["`!dailyspin`"]
        });
    }

    async run(message, args)
    {
        if(!signedIntoFirebase)
            return;
            
        IndexRef.addCommandCounter(message.author.id);
        
        var existingData = false;
        for(var i = 0; i < userSpins.length; i++)
        {
            if(userSpins[i].userID == message.author.id)
            {
                existingData = true;
            }
        }

        var promises = []

        if(!existingData)
        {
            promises.push(firebase.database().ref("usersettings/" + message.author.id + "/dailyspin").once('value').then(function(snapshot){
                if(snapshot.val() == null)
                {
                    userSpins.push({userID: message.author.id, dailyspin: JSON.stringify((((new Date()).setHours(0, 0, 0, 0)).toJSON()))})
                }
                else
                {
                    userSpins.push({userID: message.author.id, dailyspin: snapshot.val()})
                }
            }))
        }

        var hasVoted = false;
        promises.push(dbl.hasVoted(message.author.id).then(voted => {
            hasVoted = voted;
        }))

        var isPatron = false;
        promises.push(message.client.shard.broadcastEval("var guilds = this.guilds.array(); for(var i = 0; i < guilds.length; i++){if(guilds[i].id == \"465522025440739328\"){return guilds[i]}}").then(res => {
            console.los(res);
        }).catch(console.error));

        setImmediate(() => {
            Promise.all(promises).then(() => {
                for(var i = 0; i < userSpins.length; i++)
                {
                    if(userSpins[i].userID == message.author.id)
                    {
                        var date = new Date(JSON.parse(userSpins[i].dailyspin))
                        var today = (new Date()).setHours(0, 0, 0, 0)

                        if(today.getTime() >= date.getTime())
                        {
                            if(hasVoted)
                            {
                                message.channel.send("***Spinning The Wheel***", {files: ["wheel.png"]})
                                setTimeout(() => {
                                    var chance = Math.random()
                                    var prize = 0;

                                    if(chance >= 0.9)
                                    {
                                        if(chance >= 0.95 && isPatron)
                                        {
                                            prize = 75000
                                        }
                                        else
                                        {
                                            prize = 50000
                                        }
                                    }
                                    else if(chance >= 0.85)
                                    {
                                        prize = 45000
                                    }
                                    else if(chance >= 0.8)
                                    {
                                        prize = 40000
                                    }
                                    else if(chance >= 0.75)
                                    {
                                        prize = 35000
                                    }
                                    else if(chance >= 0.7)
                                    {
                                        prize = 30000
                                    }
                                    else if(chance >= 0.65)
                                    {
                                        prize = 25000
                                    }
                                    else if(chance >= 0.6)
                                    {
                                        prize = 20000
                                    }
                                    else if(chance >= 0.45)
                                    {
                                        prize = 15000
                                    }
                                    else if(chance >= 0.2)
                                    {
                                        prize = 10000
                                    }
                                    else 
                                    {
                                        prize = 5000
                                    }

                                    IndexRef.addTokens(message.author.id, prize)
                                    var nextDay = (new Date(today.getTime() + (24*60*60*1000))).setHours(0, 0, 0, 0).toJSON()
                                    userSpins[i].dailyspin = JSON.stringify(nextDay)
                                    firebase.database().ref("usersettings/" + message.author.id + "/dailyspin").set(JSON.stringify(nextDay))
                                    setTimeout(() => {
                                        message.channel.send("", {embed: {title: "***Daily Spin***", description: "Congrats! :tada:\n\nYou have won " + numberWithCommas(prize) + " War Tokens! Remember to spin the wheel again on the next day.", color: 16761856, timestamp: nextDay, footer: {icon_url: message.client.user.avatarURL, text: "Next Spin on"}}}).catch(error => console.log("Send Error - " + error));
                                        if(!isPatron)
                                        {
                                            message.channel.send("", {embed: {title: "***Daily Spin Golden Prize***", description: "You can get a chance to win the Golden Prize by ***[supporting us on Patreon](https://www.patreon.com/merriemweebster)***.", color: 16761856, timestamp: (new Date()).toJSON(), footer: {icon_url: message.client.user.avatarURL, text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                        }
                                    }, 500)
                                }, 2000)
                            }
                            else
                            {
                                message.channel.send("", {embed: {title: "***Daily Spin***", description: "You have no yet voted for a daily spin.\n\n***[Vote here to spin the wheel!](https://discordbots.org/bot/319533843482673152/vote)***", color: 16761856, timestamp: (new Date()).toJSON(), footer: {icon_url: message.client.user.avatarURL, text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                            }
                        }
                        else
                        {
                            message.channel.send("", {embed: {title: "***Daily Spin***", description: "You have already spinned the wheel today.", color: 16761856, timestamp: date, footer: {icon_url: message.client.user.avatarURL, text: "Next Spin on"}}}).catch(error => console.log("Send Error - " + error));
                        }
                    }
                }
            })
        })
    }
}

module.exports = DailySpinCommand;