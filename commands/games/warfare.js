const command = require("discord.js-commando");
var IndexRef = require("../../index.js")
var warfare = [{key: "", players: [{id: "", level: 1, xp: 0, hp: 1000, weapon: {name: "", rank: 0, damage: 100, accuracy: 100, melee: true, uses: 3}}]}];
var firebase = require("firebase");
var signedIntoFirebase = false;
var listening = false;
var patrons = [{userID: "", type: 0}];
const rankEmojis = [":first_place:", ":second_place:", ":third_place:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":nine:", ":poop:"]
const meleeWeapons = [":hammer:", ":pick:", ":dagger:"], rangedWeapons = [":gun:", ":bow_and_arrow:", ":bomb:"]
const commonPrice = 1000, rarePrice = 10000, legendaryPrice = 100000;
const {uniqueNamesGenerator} = require('unique-names-generator');

function rankAscending(a, b)
{
    if (a.level < b.level)
        return 1;
    if (a.level > b.level)
        return -1;
    return 0;
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}


firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        signedIntoFirebase = true;

        if(!listening)
        {
            firebase.database().ref("patrons").on("child_added", function(snapshot){
                var added = false;
                for(var i = 0; i < patrons.length; i++)
                {
                    if(patrons[i] == snapshot.key)
                    {
                        added = true;
                        patrons[i].type = snapshot.val()
                    }
                }

                if(!added)
                    patrons.push({userID: snapshot.key, type: snapshot.val()})
            })
            
            firebase.database().ref("patrons").on("child_removed", function(snapshot){
                for(var i = 0; i < patrons.length; i++)
                {
                    if(patrons[i] == snapshot.key)
                    {
                        patrons[i].userID = ""
                    }
                }
            })

            firebase.database().ref("patrons").on("child_changed", function(snapshot){
                for(var i = 0; i < patrons.length; i++)
                {
                    if(patrons[i] == snapshot.key)
                    {
                        patrons[i].type = snapshot.val()
                    }
                }
            })

            listening = true;
        }
    } 
    else
    {
        signedIntoFirebase = false;
    }
  });
const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

class WarfareCommand extends command.Command
 {
    constructor(client)
    {
        super(client, {
            name: "warfare",
            group: "games",
            memberName: "warfare",
            description: "Warfare is a PvP Game where you find weapons and use them to kill other players in order to gain XP. XP allows you to level up your character and increase your stats. These tokens can also be earned by voting for Slav Bot on discordbots.org or by participating in token giveaways on the support server. You can also earn tokens by buying roles on the support server or becoming a patreon supporter and get tokens weekly.",
            examples: ["`!warfare profile [@User (optional)]` (Check your stats, or another user's stats)", "`!warfare collect` (Gather Warfare Resources)", "`!warfare ranks` (Check Local Leaderboards)", "`!warfare buy` (Check all available weapon packs)", "`!warfare buy <package>` (Buy a weapon pack)", "`!warfare drop` (Drop your current weapon)", "`!warfare attack @User` (Attack a user with your weapon)", "`!warfare heal <amount-to-heal>` (Restore your HP, 1 HP costs 1 War Token)", "`!warfare give <amount> @User1 @User2` (Give your tokens to another user)", "`!warfare reset` (Reset the game. Can only be used by server owners.)"]
        });
    }

    async run(message, args)
    {
        if(!signedIntoFirebase || message.guild == null)
            return;
            
        IndexRef.addCommandCounter(message.author.id);
        
        var existingData = false;
        for(var i = 0; i < warfare.length; i++)
        {
            if(warfare[i].key == message.guild.id)
            {
                existingData = true;
            }
        }

        var promises = []

        if(!existingData)
        {
            promises.push(message.guild.fetchMembers())   

            promises.push(firebase.database().ref("serversettings/" + message.guild.id + "/warfare").once('value').then(function(snapshot){
                if(snapshot.val() == null)
                {
                    var battle = {key: message.guild.id, players: []}
                    warfare.push(battle);
                    firebase.database().ref("serversettings/" + message.guild.id + "/warfare").set(JSON.stringify(battle))
                }
                else
                {
                    var battle = JSON.parse(snapshot.val())
                   
                    if(battle.key != message.guild.id)
                    {
                        battle.key = message.guild.id;
                        firebase.database().ref("serversettings/" + message.guild.id + "/warfare").set(JSON.stringify(battle))
                    }

                    warfare.push(battle)
                }
            }))               
        }

        var commandPrefix= "!"
        if(message.guild != null)
        {
            commandPrefix = message.guild.commandPrefix
        }

        setImmediate(() => {
            Promise.all(promises).then(() => {
                for(var i = 0; i < warfare.length; i++)
                {
                    if(warfare[i].key == message.guild.id)
                    {
                        if((message.author.id == message.client.owners[0].id || message.author.id == message.client.owners[1].id || message.author.id == message.client.owners[2].id) && args.toLowerCase().startsWith("generate"))
                        {
                            var endIndex = -1;
                            var users = []
                            var getUser = false;
                            var userID = "";
                            for(var index = 0; index < args.length; index++)
                            {
                                if(getUser)
                                {
                                    if(args[index].toString() == ">")
                                    {
                                        users.push(userID);
                                        userID = "";
                                        getUser = false;
                                    }
                                    else
                                    {
                                        if(args[index].toString() != "@" && !isNaN(args[index].toString()))
                                        {
                                            userID = userID + args[index].toString();
                                        }
                                    }
                                }
                                else
                                {
                                    if(args[index].toString() == "<")
                                    {
                                        getUser = true;
                                        if(endIndex == -1)
                                            endIndex = index 
                                    } 
                                }
                            }
    
                            var options = ""
    
                            for(var index = 0; index < endIndex; index++)
                            {
                                options = options + args[index];
                            }
    
                            options = options.replace(/,/g, "")
                            var amountText = options.match(/\d+/g);
                            var amount = []
                            if(amountText != null)
                            {
                                amount = amountText.map(Number);
                            }
                            
                            if(amount.length > 0)
                            {
                                amount = amount[0]
                                if(users.length > 0)
                                {
                                    for(var userIndex = 0; userIndex < users.length; userIndex++)
                                    {
                                        IndexRef.addTokens(users[userIndex], amount)
                                        message.channel.send("<@" + users[userIndex] + "> has been given " + numberWithCommas(amount) + " tokens").catch(error => {console.log("Send Error - " + error); });   
                                    }
                                }
                                else
                                {
                                    message.channel.send("<@" + message.author.id + "> No users mentioned.").catch(error => {console.log("Send Error - " + error); });   
                                }
                            }
                            else
                            {
                                message.channel.send("<@" + message.author.id + "> No amount given.").catch(error => {console.log("Send Error - " + error); });   
                            }
    
                            
                            return;
                        }
                        else if((message.author.id == message.client.owners[0].id || message.author.id == message.client.owners[1].id || message.author.id == message.client.owners[2].id) && args.toLowerCase().startsWith("remove"))
                        {
                            var endIndex = -1;
                            var users = []
                            var getUser = false;
                            var userID = "";
                            for(var index = 0; index < args.length; index++)
                            {
                                if(getUser)
                                {
                                    if(args[index].toString() == ">")
                                    {
                                        users.push(userID);
                                        userID = "";
                                        getUser = false;
                                    }
                                    else
                                    {
                                        if(args[index].toString() != "@" && !isNaN(args[index].toString()))
                                        {
                                            userID = userID + args[index].toString();
                                        }
                                    }
                                }
                                else
                                {
                                    if(args[index].toString() == "<")
                                    {
                                        getUser = true;
                                        if(endIndex == -1)
                                            endIndex = index 
                                    } 
                                }
                            }
    
                            var options = ""
    
                            for(var index = 0; index < endIndex; index++)
                            {
                                options = options + args[index];
                            }
                            options = options.replace(/,/g, "")
                            var amountText = options.match(/\d+/g);
                            var amount = []
                            if(amountText != null)
                            {
                                amount = amountText.map(Number);
                            }

                            if(amount.length > 0)
                            {
                                amount = amount[0]
                                if(users.length > 0)
                                {
                                    for(var userIndex = 0; userIndex < users.length; userIndex++)
                                    {
                                        if(IndexRef.getTokens(users[userIndex]) < amount)
                                        {
                                            IndexRef.subtractTokens(users[userIndex], IndexRef.getTokens(users[userIndex]))
                                        }
                                        else
                                        {
                                            IndexRef.subtractTokens(users[userIndex], amount)
                                        }
        
                                        message.channel.send(numberWithCommas(amount) + " tokens have been removed from " + "<@" + users[userIndex] + ">").catch(error => {console.log("Send Error - " + error); });   
                                    }
                                }
                                else
                                {
                                    message.channel.send("<@" + message.author.id + "> No users mentioned.").catch(error => {console.log("Send Error - " + error); });   
                                }
                            }
                            else
                            {
                                message.channel.send("<@" + message.author.id + "> No amount given.").catch(error => {console.log("Send Error - " + error); });   
                            }
                            
                            return;
                        }
                        
                        if(args.toLowerCase().startsWith("collect"))
                        {  
                            var cooldown = IndexRef.getCooldown(message.author.id)
                            var date = new Date(IndexRef.getCooldown(message.author.id))

                            if(cooldown == null || cooldown == undefined || cooldown == "")
                            {
                                date = new Date()
                            }

                            if(date.getTime() <= (new Date()).getTime())
                            {
                                var maxValue = 2000;
                                var maxPercInc = 0;
                                var collectedValInc = 0;

                                for(var index = 0; index < warfare[i].players.length; index++)
                                {
                                    if(warfare[i].players[index].id == message.author.id)
                                    {
                                        maxPercInc = warfare[i].players[index].level
                                    }
                                }

                                for(var index = 0; index < patrons.length; index++)
                                {
                                    if(patrons[index].userID == message.author.id)
                                    {
                                        if(patrons[index].type == 0)
                                        {
                                            collectedValInc = 50;
                                        }
                                        else if(patrons[index].type == 1)
                                        {
                                            collectedValInc = 100;
                                        }
                                    }
                                }

                                if(maxPercInc > 1000)
                                    maxPercInc = 1000;

                                maxValue = Math.floor(2000 * ((maxPercInc/100) + 1))

                                var collected = Math.floor(Math.random() * maxValue) + 1
                                collected = Math.floor(collected * ((collectedValInc/100) + 1))

                                var timestamp = (new Date(Date.now()).toJSON());

                                IndexRef.addTokens(message.author.id, collected)
                                IndexRef.setCooldown(message.author.id, (new Date((new Date).getTime() + 120000)))

                                message.channel.send("", {embed: {title: "***Warfare Resources Collected***", description: "<@" + message.author.id + "> You have collected ***" + numberWithCommas(collected) + " tokens***\n\n***Max value increase of " + numberWithCommas(maxPercInc) + "%*** _(current max value: " + numberWithCommas(maxValue) + " tokens)_ - Increase the max amount of tokens you can collect by increasing your level.\n\n***Collected Value Increase of " + collectedValInc + "%*** - You can increase the value of tokens you have collected. This is only available to those ***[supporting us on Patreon](https://www.patreon.com/merriemweebster)***.\n\n\n***[Patreon supporters get weekly tokens.](https://www.patreon.com/merriemweebster)***\n\n***[You can also purchase war tokens on our website. Special Weekend Sales for War Tokens every Friday, Saturday and Sunday.](https://slavbot.com/shop)***", color: 65339, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Collected on"}}}).catch(error => console.log("Send Error - " + error));
                            }
                            else
                            {
                                message.channel.send("", {embed: {title: "***Cooldown***", description: "<@" + message.author.id + "> You cannot collect more warfare resources until the 2 minute cooldown is over.", color: 65339, timestamp: IndexRef.getCooldown(message.author.id), footer: {icon_url: message.client.user.avatarURL,text: "Cooldown until"}}}).catch(error => console.log("Send Error - " + error));
                            }   
                        }
                        else if(args.toLowerCase().startsWith("give"))
                        {
                            var endIndex = -1;
                            var users = []
                            var getUser = false;
                            var userID = "";
                            for(var index = 0; index < args.length; index++)
                            {
                                if(getUser)
                                {
                                    if(args[index].toString() == ">")
                                    {
                                        users.push(userID);
                                        userID = "";
                                        getUser = false;
                                    }
                                    else
                                    {
                                        if(args[index].toString() != "@" && !isNaN(args[index].toString()))
                                        {
                                            userID = userID + args[index].toString();
                                        }
                                    }
                                }
                                else
                                {
                                    if(args[index].toString() == "<")
                                    {
                                        getUser = true;
                                        if(endIndex == -1)
                                            endIndex = index 
                                    } 
                                }
                            }
    
                            var options = ""
    
                            for(var index = 0; index < endIndex; index++)
                            {
                                options = options + args[index];
                            }
                            options = options.replace(/,/g, "")
                            var amountText = options.match(/\d+/g);
                            var amount = []
                            if(amountText != null)
                            {
                                amount = amountText.map(Number);
                            }

                            if(amount.length > 0)
                            {
                                amount = amount[0]

                                if(amount > 0)
                                {
                                    if(users.length > 0)
                                    {
                                        for(var userIndex = 0; userIndex < users.length; userIndex++)
                                        {
                                            if(IndexRef.getTokens(message.author.id) < amount)
                                            {
                                                message.channel.send("<@" + message.author.id + "> You do not have " + numberWithCommas(amount) + " tokens to give to another user.").catch(error => {console.log("Send Error - " + error); });   
                                            }
                                            else
                                            {
                                                var mentions = message.mentions.users.array()
                                                var isBot = false, notValid = true;
                                                for(var mentionIndex = 0; mentionIndex < mentions.length; mentionIndex++)
                                                {
                                                    if(mentions[mentionIndex].id == users[userIndex])
                                                    {
                                                        isBot = mentions[mentionIndex].bot
                                                        notValid = false;
                                                    }
                                                }
    
                                                if(users[userIndex] == message.author.id || isBot || notValid)
                                                {
                                                    message.channel.send("<@" + message.author.id + "> tag another user.").catch(error => {console.log("Send Error - " + error); });   
                                                }
                                                else
                                                {
                                                    IndexRef.subtractTokens(message.author.id, amount)
                                                    IndexRef.addTokens(users[userIndex], amount)
                                                    message.channel.send("<@" + message.author.id + "> has given " + numberWithCommas(amount) + " token(s) to <@" + users[userIndex] + ">").catch(error => {console.log("Send Error - " + error); });   
                                                }
                                            }
                                            
                                        }
                                    }
                                    else
                                    {
                                        message.channel.send("<@" + message.author.id + "> No users mentioned.").catch(error => {console.log("Send Error - " + error); });   
                                    }
                                }
                                else
                                {
                                    message.channel.send("<@" + message.author.id + "> Amount should be greater than 0.").catch(error => {console.log("Send Error - " + error); });   
                                }
                            }
                            else
                            {
                                message.channel.send("<@" + message.author.id + "> No amount given.").catch(error => {console.log("Send Error - " + error); });   
                            }
                        }
                        else if (args.toLowerCase() == "buy 1")
                        {
                            var playerFound = false
                            for(var index = 0; index < warfare[i].players.length; index++)
                            {
                                if(warfare[i].players[index].id == message.author.id)
                                {
                                    playerFound = true
                                    var fail = false;
                                    if(warfare[i].players[index].purchaseCooldown != null && warfare[i].players[index].purchaseCooldown != undefined)
                                    {
                                        if((new Date(warfare[i].players[index].purchaseCooldown)).getTime() > (new Date()).getTime())
                                        {
                                            fail = true;
                                        }
                                    }

                                    if(fail)
                                    {
                                        message.channel.send("", {embed: {title: "***Purchase Cooldown***", description: "<@" + message.author.id + "> You must wait for at least 1 minute before you can purchase another weapon pack.", color: 16711680, timestamp: warfare[i].players[index].purchaseCooldown, footer: {icon_url: message.client.user.avatarURL,text: "Cooldown until"}}}).catch(error => console.log("Send Error - " + error));
                                    }
                                    else
                                    {
                                        var timestamp = (new Date(Date.now()).toJSON());

                                        if(warfare[i].players[index].weapon == null || warfare[i].players[index].weapon == undefined)
                                        {
                                            if(!IndexRef.subtractTokens(message.author.id, commonPrice))
                                            {
                                                message.channel.send("", {embed: {title: "***Failed To Purchase Common Weapon Pack***", description: "<@" + message.author.id + "> You do not have enough tokens to purchase a common weapon pack. You need " + numberWithCommas(commonPrice) + " tokens, while you only have " + numberWithCommas(IndexRef.getTokens(message.author.id)) + " tokens.", color: 16711680, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                            }
                                            else
                                            { 
                                                var melee = false
                                                var emoji = ""
                                                var accuracy = 0;
                                                var weaponType = ""
    
                                                if(Math.random() >= 0.5)
                                                    melee = true
    
                                                if(melee)
                                                {
                                                    weaponType = "Melee"
                                                    emoji = meleeWeapons[Math.floor(Math.random() * meleeWeapons.length)]
                                                    accuracy = Math.floor(Math.random() * 100) + 1
    
                                                    if(accuracy < 50)
                                                        accuracy = 50;
                                                }
                                                else
                                                {
                                                    weaponType = "Ranged"
                                                    emoji = rangedWeapons[Math.floor(Math.random() * rangedWeapons.length)]
                                                    accuracy = Math.floor(Math.random() * 100)
                                                }
                                                var weaponName = toTitleCase(uniqueNamesGenerator({length: 2, separator: " "}))
                                                var weapon = {name: weaponName + " " + emoji,  rank: 0, damage: Math.floor(Math.random() * 500) + 1, accuracy: accuracy, melee: melee, uses: Math.floor(Math.random() * 5) + 1}
                                                warfare[i].players[index].weapon = weapon
                                                message.channel.send("", {embed: {title: "***Purchased Common Weapon Pack***", description: "<@" + message.author.id + "> has purchased a common weapon pack.\n\n***Weapon Name:*** " + weapon.name + "\n***Weapon Type:*** " + weaponType + "\n***Weapon Rank:*** Common\n***Max Damage:*** " + numberWithCommas(weapon.damage) + "\n***Weapon Accuracy:*** " + numberWithCommas(weapon.accuracy) + "\n***Uses:*** " + weapon.uses, color: 65339, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));                               
                                                warfare[i].players[index].purchaseCooldown = (new Date((new Date).getTime() + 60000)).toJSON()
                                            }  
                                        }
                                        else
                                        {
                                            message.channel.send("", {embed: {title: "***Failed To Purchase Common Weapon Pack***", description: "<@" + message.author.id + "> You already have a weapon. Either use your weapon until it breaks or drop the weapon using `" + commandPrefix + "warfare drop`.", color: 16711680, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                        }   
                                    }
                                }
                            }  

                            if(!playerFound)
                            {
                                var playerData = {id: message.author.id, level: 1, xp: 0, hp: 1000, weapon: null}
                                var timestamp = (new Date(Date.now()).toJSON());

                                if(!IndexRef.subtractTokens(message.author.id, commonPrice))
                                {
                                    message.channel.send("", {embed: {title: "***Failed To Purchase Common Weapon Pack***", description: "<@" + message.author.id + "> You do not have enough tokens to purchase a common weapon pack. You need " + numberWithCommas(commonPrice) + " tokens, while you only have " + numberWithCommas(IndexRef.getTokens(message.author.id)) + " tokens.", color: 16711680, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                }
                                else
                                { 
                                    var melee = false
                                    var emoji = ""
                                    var accuracy = 0;
                                    var weaponType = ""

                                    if(Math.random() >= 0.5)
                                        melee = true

                                    if(melee)
                                    {
                                        weaponType = "Melee"
                                        emoji = meleeWeapons[Math.floor(Math.random() * meleeWeapons.length)]
                                        accuracy = Math.floor(Math.random() * 100) + 1

                                        if(accuracy < 50)
                                            accuracy = 50;
                                    }
                                    else
                                    {
                                        weaponType = "Ranged"
                                        emoji = rangedWeapons[Math.floor(Math.random() * rangedWeapons.length)]
                                        accuracy = Math.floor(Math.random() * 100)
                                    }
                                    var weaponName = toTitleCase(uniqueNamesGenerator({length: 2, separator: " "}))
                                    var weapon = {name: weaponName + " " + emoji,  rank: 0, damage: Math.floor(Math.random() * 500) + 1, accuracy: accuracy, melee: melee, uses: Math.floor(Math.random() * 5) + 1}
                                    playerData.weapon = weapon
                                    message.channel.send("", {embed: {title: "***Purchased Common Weapon Pack***", description: "<@" + message.author.id + "> has purchased a common weapon pack.\n\n***Weapon Name:*** " + weapon.name + "\n***Weapon Type:*** " + weaponType + "\n***Weapon Rank:*** Common\n***Max Damage:*** " + numberWithCommas(weapon.damage) + "\n***Weapon Accuracy:*** " + numberWithCommas(weapon.accuracy) + "\n***Uses:*** " + weapon.uses, color: 65339, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));                               
                                    playerData.purchaseCooldown = (new Date((new Date).getTime() + 60000)).toJSON()
                                } 
                                
                                warfare[i].players.push(playerData)
                            }
                        }
                        else if (args.toLowerCase() == "buy 2")
                        {
                            var playerFound = false
                            for(var index = 0; index < warfare[i].players.length; index++)
                            {
                                if(warfare[i].players[index].id == message.author.id)
                                {
                                    playerFound = true
                                    var fail = false;
                                    if(warfare[i].players[index].purchaseCooldown != null && warfare[i].players[index].purchaseCooldown != undefined)
                                    {
                                        if((new Date(warfare[i].players[index].purchaseCooldown)).getTime() > (new Date()).getTime())
                                        {
                                            fail = true;
                                        }
                                    }

                                    if(fail)
                                    {
                                        message.channel.send("", {embed: {title: "***Purchase Cooldown***", description: "<@" + message.author.id + "> You must wait for at least 1 minute before you can purchase another weapon pack.", color: 16711680, timestamp: warfare[i].players[index].purchaseCooldown, footer: {icon_url: message.client.user.avatarURL,text: "Cooldown until"}}}).catch(error => console.log("Send Error - " + error));
                                    }
                                    else
                                    {
                                        var timestamp = (new Date(Date.now()).toJSON());

                                        if(warfare[i].players[index].weapon == null || warfare[i].players[index].weapon == undefined)
                                        {
                                            if(!IndexRef.subtractTokens(message.author.id, rarePrice))
                                            {
                                                message.channel.send("", {embed: {title: "***Failed To Purchase Rare Weapon Pack***", description: "<@" + message.author.id + "> You do not have enough tokens to purchase a rare weapon pack. You need " + numberWithCommas(rarePrice) + " tokens, while you only have " + numberWithCommas(IndexRef.getTokens(message.author.id)) + " tokens.", color: 16711680, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                            }
                                            else
                                            { 
                                                var melee = false
                                                var emoji = ""
                                                var accuracy = 0;
                                                var weaponType = ""
    
                                                if(Math.random() >= 0.5)
                                                    melee = true
    
                                                if(melee)
                                                {
                                                    weaponType = "Melee"
                                                    emoji = meleeWeapons[Math.floor(Math.random() * meleeWeapons.length)]
                                                    accuracy = Math.floor(Math.random() * 100) + 1
    
                                                    if(accuracy < 75)
                                                        accuracy = 75;
                                                }
                                                else
                                                {
                                                    weaponType = "Ranged"
                                                    emoji = rangedWeapons[Math.floor(Math.random() * rangedWeapons.length)]
                                                    accuracy = Math.floor(Math.random() * 100)
    
                                                    if(accuracy < 25)
                                                        accuracy = 25
                                                }
                                                var weaponName = toTitleCase(uniqueNamesGenerator({length: 2, separator: " "}))
                                                var weapon = {name: weaponName + " " + emoji, rank: 1, damage: Math.floor(Math.random() * 5000) + 1, accuracy: accuracy, melee: melee, uses: Math.floor(Math.random() * 10) + 1}
                                                warfare[i].players[index].weapon = weapon
                                                message.channel.send("", {embed: {title: "***Purchased Rare Weapon Pack***", description: "<@" + message.author.id + "> has purchased a rare weapon pack.\n\n***Weapon Name:*** " + weapon.name + "\n***Weapon Type:*** " + weaponType + "\n***Weapon Rank:*** Rare\n***Max Damage:*** " + numberWithCommas(weapon.damage) + "\n***Weapon Accuracy:*** " + numberWithCommas(weapon.accuracy) + "\n***Uses:*** " + weapon.uses, color: 65339, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));                               
                                                warfare[i].players[index].purchaseCooldown = (new Date((new Date).getTime() + 60000)).toJSON()
                                            }  
                                        }
                                        else
                                        {
                                            message.channel.send("", {embed: {title: "***Failed To Purchase Rare Weapon Pack***", description: "<@" + message.author.id + "> You already have a weapon. Either use your weapon until it breaks or drop the weapon using `" + commandPrefix + "warfare drop`.", color: 16711680, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                        }   
                                    }
                                }
                            }

                            if(!playerFound)
                            {
                                var playerData = {id: message.author.id, level: 1, xp: 0, hp: 1000, weapon: null}
                                var timestamp = (new Date(Date.now()).toJSON());

                                if(!IndexRef.subtractTokens(message.author.id, rarePrice))
                                {
                                    message.channel.send("", {embed: {title: "***Failed To Purchase Rare Weapon Pack***", description: "<@" + message.author.id + "> You do not have enough tokens to purchase a rare weapon pack. You need " + numberWithCommas(rarePrice) + " tokens, while you only have " + numberWithCommas(IndexRef.getTokens(message.author.id)) + " tokens.", color: 16711680, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                }
                                else
                                { 
                                    var melee = false
                                    var emoji = ""
                                    var accuracy = 0;
                                    var weaponType = ""

                                    if(Math.random() >= 0.5)
                                        melee = true

                                    if(melee)
                                    {
                                        weaponType = "Melee"
                                        emoji = meleeWeapons[Math.floor(Math.random() * meleeWeapons.length)]
                                        accuracy = Math.floor(Math.random() * 100) + 1

                                        if(accuracy < 75)
                                            accuracy = 75;
                                    }
                                    else
                                    {
                                        weaponType = "Ranged"
                                        emoji = rangedWeapons[Math.floor(Math.random() * rangedWeapons.length)]
                                        accuracy = Math.floor(Math.random() * 100)

                                        if(accuracy < 25)
                                            accuracy = 25
                                    }
                                    var weaponName = toTitleCase(uniqueNamesGenerator({length: 2, separator: " "}))
                                    var weapon = {name: weaponName + " " + emoji,  rank: 1, damage: Math.floor(Math.random() * 5000) + 1, accuracy: accuracy, melee: melee, uses: Math.floor(Math.random() * 10) + 1}
                                    playerData.weapon = weapon
                                    message.channel.send("", {embed: {title: "***Purchased Rare Weapon Pack***", description: "<@" + message.author.id + "> has purchased a rare weapon pack.\n\n***Weapon Name:*** " + weapon.name + "\n***Weapon Type:*** " + weaponType + "\n***Weapon Rank:*** Rare\n***Max Damage:*** " + numberWithCommas(weapon.damage) + "\n***Weapon Accuracy:*** " + numberWithCommas(weapon.accuracy) + "\n***Uses:*** " + weapon.uses, color: 65339, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));                               
                                    playerData.purchaseCooldown = (new Date((new Date).getTime() + 60000)).toJSON()
                                }  

                                warfare[i].players.push(playerData)
                            }
                        }
                        else if (args.toLowerCase() == "buy 3")
                        {
                            var playerFound = false
                            for(var index = 0; index < warfare[i].players.length; index++)
                            {
                                if(warfare[i].players[index].id == message.author.id)
                                {
                                    playerFound = true
                                    var fail = false;
                                    if(warfare[i].players[index].purchaseCooldown != null && warfare[i].players[index].purchaseCooldown != undefined)
                                    {
                                        if((new Date(warfare[i].players[index].purchaseCooldown)).getTime() > (new Date()).getTime())
                                        {
                                            fail = true;
                                        }
                                    }

                                    if(fail)
                                    {
                                        message.channel.send("", {embed: {title: "***Purchase Cooldown***", description: "<@" + message.author.id + "> You must wait for at least 1 minute before you can purchase another weapon pack.", color: 16711680, timestamp: warfare[i].players[index].purchaseCooldown, footer: {icon_url: message.client.user.avatarURL,text: "Cooldown until"}}}).catch(error => console.log("Send Error - " + error));
                                    }
                                    else
                                    {
                                        if(warfare[i].players[index].weapon == null || warfare[i].players[index].weapon == undefined)
                                        {
                                            var timestamp = (new Date(Date.now()).toJSON());
    
                                            if(!IndexRef.subtractTokens(message.author.id, legendaryPrice))
                                            {
                                                message.channel.send("", {embed: {title: "***Failed To Purchase Legendary Weapon Pack***", description: "<@" + message.author.id + "> You do not have enough tokens to purchase a legendary weapon pack. You need " + numberWithCommas(legendaryPrice) + " tokens, while you only have " + numberWithCommas(IndexRef.getTokens(message.author.id)) + " tokens.", color: 16711680, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                            }
                                            else
                                            { 
                                                var melee = false
                                                var emoji = ""
                                                var accuracy = 0;
                                                var weaponType = ""
    
                                                if(Math.random() >= 0.5)
                                                    melee = true
    
                                                if(melee)
                                                {
                                                    weaponType = "Melee"
                                                    emoji = meleeWeapons[Math.floor(Math.random() * meleeWeapons.length)]
                                                    accuracy = 100
                                                }
                                                else
                                                {
                                                    weaponType = "Ranged"
                                                    emoji = rangedWeapons[Math.floor(Math.random() * rangedWeapons.length)]
                                                    accuracy = Math.floor(Math.random() * 100)
    
                                                    if(accuracy < 50)
                                                        accuracy = 50
                                                }
                                                var weaponName = toTitleCase(uniqueNamesGenerator({length: 2, separator: " "}))
                                                var weapon = {name: weaponName + " " + emoji,  rank: 2, damage: Math.floor(Math.random() * 50000) + 1, accuracy: accuracy, melee: melee, uses: Math.floor(Math.random() * 15) + 1}
                                                warfare[i].players[index].weapon = weapon
                                                message.channel.send("", {embed: {title: "***Purchased Legendary Weapon Pack***", description: "<@" + message.author.id + "> has purchased a legendary weapon pack.\n\n***Weapon Name:*** " + weapon.name + "\n***Weapon Type:*** " + weaponType + "\n***Weapon Rank:*** Legendary\n***Max Damage:*** " + numberWithCommas(weapon.damage) + "\n***Weapon Accuracy:*** " + numberWithCommas(weapon.accuracy) + "\n***Uses:*** " + weapon.uses, color: 65339, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));                               
                                                warfare[i].players[index].purchaseCooldown = (new Date((new Date).getTime() + 60000)).toJSON()
                                            }  
                                        }
                                        else
                                        {
                                            message.channel.send("", {embed: {title: "***Failed To Purchase Legendary Weapon Pack***", description: "<@" + message.author.id + "> You already have a weapon. Either use your weapon until it breaks or drop the weapon using `" + commandPrefix + "warfare drop`.", color: 16711680, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                        }   
                                    }
                                }
                            }

                            if(!playerFound)
                            {
                                var playerData = {id: message.author.id, level: 1, xp: 0, hp: 1000, weapon: null}
                                var timestamp = (new Date(Date.now()).toJSON());
    
                                if(!IndexRef.subtractTokens(message.author.id, legendaryPrice))
                                {
                                    message.channel.send("", {embed: {title: "***Failed To Purchase Legendary Weapon Pack***", description: "<@" + message.author.id + "> You do not have enough tokens to purchase a legendary weapon pack. You need " + numberWithCommas(legendaryPrice) + " tokens, while you only have " + numberWithCommas(IndexRef.getTokens(message.author.id)) + " tokens.", color: 16711680, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                }
                                else
                                { 
                                    var melee = false
                                    var emoji = ""
                                    var accuracy = 0;
                                    var weaponType = ""

                                    if(Math.random() >= 0.5)
                                        melee = true

                                    if(melee)
                                    {
                                        weaponType = "Melee"
                                        emoji = meleeWeapons[Math.floor(Math.random() * meleeWeapons.length)]
                                        accuracy = 100
                                    }
                                    else
                                    {
                                        weaponType = "Ranged"
                                        emoji = rangedWeapons[Math.floor(Math.random() * rangedWeapons.length)]
                                        accuracy = Math.floor(Math.random() * 100)

                                        if(accuracy < 50)
                                            accuracy = 50
                                    }

                                    var weaponName = toTitleCase(uniqueNamesGenerator({length: 2, separator: " "}))
                                    var weapon = {name: weaponName + " " + emoji,  rank: 2, damage: Math.floor(Math.random() * 50000) + 1, accuracy: accuracy, melee: melee, uses: Math.floor(Math.random() * 15) + 1}
                                    playerData.weapon = weapon
                                    message.channel.send("", {embed: {title: "***Purchased Legendary Weapon Pack***", description: "<@" + message.author.id + "> has purchased a legendary weapon pack.\n\n***Weapon Name:*** " + weapon.name + "\n***Weapon Type:*** " + weaponType + "\n***Weapon Rank:*** Legendary\n***Max Damage:*** " + numberWithCommas(weapon.damage) + "\n***Weapon Accuracy:*** " + numberWithCommas(weapon.accuracy) + "\n***Uses:*** " + weapon.uses, color: 65339, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));                               
                                    playerData.purchaseCooldown = (new Date((new Date).getTime() + 60000)).toJSON()
                                }  
                                warfare[i].players.push(playerData)
                            }
                        }
                        else if (args.toLowerCase().startsWith("buy"))
                        {
                            var timestamp = (new Date(Date.now()).toJSON());
                            message.channel.send("", {embed: {title: "***Purchase Weapon Pack***", description: "<@" + message.author.id + "> Purchasing a weapon pack will give you a random weapon of the rank you chose. You can have only 1 weapon at hand until its uses are over, or you drop the weapon using `" + commandPrefix + "warfare drop`.\n\n***__Weapon Packs:__***\n`" + commandPrefix + "warfare buy 1` Buy a common weapon pack. (1,000 War Tokens)\n`" + commandPrefix + "warfare buy 2` Buy a rare weapon pack. (10,000 War Tokens)\n`" + commandPrefix + "warfare buy 3` Buy a legendary weapon pack. (100,000 War Tokens)", color: 16711680, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                        }
                        else if (args.toLowerCase().startsWith("reset"))
                        {
                            var timestamp = (new Date(Date.now()).toJSON());
                            if(message.author.id == message.guild.ownerID)
                            {
                                message.channel.send("Game Reset", {embed: {title: "***Game Reset***", description: "<@" + message.author.id + "> has reset the game. All stats have been reset.", color: 16711680, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                warfare[i].players = []
                            }
                            else
                            {
                                message.channel.send("", {embed: {title: "***You Are Not The Owner***", description: "<@" + message.author.id + "> Only the server owner can reset the game.", color: 16711680, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                            }
                        }
                        else if (args.toLowerCase().startsWith("drop"))
                        {
                            for(var index = 0; index < warfare[i].players.length; index++)
                            {
                                if(warfare[i].players[index].id == message.author.id)
                                {
                                    var timestamp = (new Date(Date.now()).toJSON());

                                    if(warfare[i].players[index].weapon == null || warfare[i].players[index].weapon == undefined)
                                    {
                                        message.channel.send("", {embed: {title: "***No Weapon To Drop***", description: "<@" + message.author.id + "> You have no weapon to drop.", color: 16711680, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                    }
                                    else
                                    {
                                        warfare[i].players[index].weapon = null
                                        message.channel.send("", {embed: {title: "***Weapon Dropped***", description: "<@" + message.author.id + "> You no longer have a weapon at hand.", color: 16711680, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                    }
                                }
                            }
                        }
                        else if(args.toLowerCase().startsWith("ranks"))
                        {
                            var ranks = []

                            for(var warfareIndex = 0; warfareIndex < warfare[i].players.length; warfareIndex++)
                            {
                                ranks.push({id: warfare[i].players[warfareIndex].id, level: warfare[i].players[warfareIndex].level})
                            }

                            if(ranks.length == 0)
                            {
                                var timestamp = (new Date(Date.now()).toJSON());
                                message.channel.send("", {embed: {title: "**Local Warfare Leaderboard for _" + message.guild.name + "_ - Top 10 players :trophy:**",
                                description: "No players found.",
                                color: 16757505,
                                timestamp: timestamp,
                                footer: {
                                    icon_url: message.client.user.avatarURL,
                                    text: "Sent on"
                                }}}).catch(error => console.log("Send Error - " + error));
                            }
                            else
                            {
                                ranks.sort(rankAscending);
                                var members = message.guild.members.array();
                                var names = [];
                    
                                for(var userIndex = 0; userIndex < ranks.length; userIndex++)
                                {
                                    for(var index = 0; index < members.length; index++)
                                    {
                                        if(members[index].id == ranks[userIndex].id)
                                        {
                                            names.push(members[index].user.username);
                                        }
                                    }
                                }
                                
                                var descriptionList = "";
                    
                                var length = ranks.length;

                                if(length > 10)
                                {
                                    length = 10;
                                }

                                for(var rankIndex = 0; rankIndex < length; rankIndex++)
                                {
                                    descriptionList = descriptionList + (rankEmojis[rankIndex] + "``" + numberWithCommas(ranks[rankIndex].level) + "`` - **" + names[rankIndex] + "**\n");
                                }
                    
                                var timestamp = (new Date(Date.now()).toJSON());
                                message.channel.send("", {embed: {title: "**Local Warfare Leaderboard for _" + message.guild.name + "_ - Top 10 players :trophy:**",
                                description: "**Rank** - Level - Name\n" + descriptionList,
                                color: 16757505,
                                timestamp: timestamp,
                                footer: {
                                    icon_url: message.client.user.avatarURL,
                                    text: "Sent on"
                                }}}).catch(error => console.log("Send Error - " + error));
                            }
                        }
                        else if(args.toLowerCase().startsWith("profile"))
                        {
                            var timestamp = (new Date(Date.now()).toJSON());
                            var otherUser = false;
                            var userID = "";
                            var getUser = false;
                            for(var index = 0; index < args.length; index++)
                            {
                                if(getUser)
                                {
                                    if(args[index].toString() == ">")
                                    {
                                        index = args.length;
                                        otherUser = true;
                                    }
                                    else
                                    {
                                        if(args[index].toString() != "@" && (!isNaN(args[index].toString()) || args[index] == "&"))
                                        {
                                            userID = userID + args[index].toString();
                                        }
                                    }
                                }
                                else
                                {
                                    if(args[index].toString() == "<")
                                    {
                                        getUser = true;
                                    } 
                                }
                            }
                            
        
                            if(otherUser)
                            {
                                var playerFound = false;
                                var user;
                                var mentions = message.mentions.users.array()

                                for(var mentionIndex = 0; mentionIndex < mentions.length; mentionIndex++)
                                {
                                    if(mentions[mentionIndex].id == userID)
                                    {
                                        user = mentions[mentionIndex];
                                    }
                                }

                                if(user != undefined && user != null)
                                {
                                    var thumbnail = "";
    
                                    if(user.avatarURL != undefined && user.avatarURL != null)
                                        thumbnail = user.avatarURL
    
                                    for(var warfareIndex = 0; warfareIndex < warfare[i].players.length; warfareIndex++)
                                    {
                                        if(warfare[i].players[warfareIndex].id == userID)
                                        {
                                            playerFound = true
                                            var weaponText = ""

                                            if(warfare[i].players[warfareIndex].weapon == null || warfare[i].players[warfareIndex].weapon == undefined)
                                            {
                                                weaponText = user.username + " has no weapon."
                                            }
                                            else
                                            {
                                                var weaponType = "", weaponRank = ""

                                                if(warfare[i].players[warfareIndex].weapon.melee == true)
                                                    weaponType = "Melee"
                                                else
                                                    weaponType = "Ranged"

                                                if(warfare[i].players[warfareIndex].weapon.rank == 0)
                                                    weaponRank = "Common"
                                                else if(warfare[i].players[warfareIndex].weapon == 1)
                                                    weaponRank = "Rare"
                                                else
                                                    weaponRank = "Legendary"

                                                weaponText = "***Weapon Name:*** " + warfare[i].players[warfareIndex].weapon.name + "\n***Weapon Type:*** " + weaponType + "\n***Weapon Rank:*** " + weaponRank + "\n***Max Damage:*** " + numberWithCommas(warfare[i].players[warfareIndex].weapon.damage) + "\n***Weapon Accuracy:*** " + numberWithCommas(warfare[i].players[warfareIndex].weapon.accuracy) + "\n***Uses Left:*** " + warfare[i].players[warfareIndex].weapon.uses
                                            }

                                            message.channel.send("", {embed: {title: "***Warfare Profile for " + user.username + "***", description: user.username + " currently has " + numberWithCommas(IndexRef.getTokens(user.id)) + " tokens.\n" + user.username + " is at Level " + numberWithCommas(warfare[i].players[warfareIndex].level) +".\n\n***__XP__***\n" + numberWithCommas(warfare[i].players[warfareIndex].xp) + " / " + numberWithCommas(100 * (Math.pow(warfare[i].players[warfareIndex].level + 1, 2))) + " (XP Required To Reach Level " + numberWithCommas(warfare[i].players[warfareIndex].level + 1) + ")\n\n***__HP__***\n" + numberWithCommas(warfare[i].players[warfareIndex].hp) + " / " + numberWithCommas(warfare[i].players[warfareIndex].level * 1000) + " (Max HP)\n\n***__Weapon__***\n" + weaponText, color: 16711680, thumbnail: {"url": thumbnail}, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                        }
                                    }
    
                                    if(!playerFound)
                                    {
                                        warfare[i].players.push({id: user.id, level: 1, xp: 0, hp: 1000, weapon: null})
                                        message.channel.send("", {embed: {title: "***Warfare Profile for " + user.username + "***", description: user.username + " currently has " + numberWithCommas(IndexRef.getTokens(user.id)) + " tokens.\n" + user.username + " is at Level 1.\n\n***__XP__***\n0 / " + numberWithCommas(100 * (Math.pow(2, 2))) + " (XP Required To Reach Level 2)\n\n***__HP__***\n1,000 / 1,000 (Max HP)\n\n***__Weapon__***\n"+ user.username + " has no weapon.", color: 16711680, thumbnail: {"url": thumbnail}, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                    }
                                }
                                else
                                {
                                    message.channel.send("<@" + message.author.id + "> User not found on this server.").catch(error => console.log("Send Error - " + error));
                                }
                            }
                            else
                            {
                                var thumbnail = "";
                                var playerFound = false;

                                if(message.author.avatarURL != undefined && message.author.avatarURL != null)
                                    thumbnail = message.author.avatarURL

                                for(var warfareIndex = 0; warfareIndex < warfare[i].players.length; warfareIndex++)
                                {
                                    if(warfare[i].players[warfareIndex].id == message.author.id)
                                    {
                                        playerFound = true
                                        var weaponText = ""

                                        if(warfare[i].players[warfareIndex].weapon == null || warfare[i].players[warfareIndex].weapon == undefined)
                                        {
                                            weaponText = message.author.username + " has no weapon."
                                        }
                                        else
                                        {
                                            var weaponType = "", weaponRank = ""

                                            if(warfare[i].players[warfareIndex].weapon.melee == true)
                                                weaponType = "Melee"
                                            else
                                                weaponType = "Ranged"

                                            if(warfare[i].players[warfareIndex].weapon.rank == 0)
                                                weaponRank = "Common"
                                            else if(warfare[i].players[warfareIndex].weapon == 1)
                                                weaponRank = "Rare"
                                            else
                                                weaponRank = "Legendary"

                                            weaponText = "***Weapon Name:*** " + warfare[i].players[warfareIndex].weapon.name + "\n***Weapon Type:*** " + weaponType + "\n***Weapon Rank:*** " + weaponRank + "\n***Max Damage:*** " + numberWithCommas(warfare[i].players[warfareIndex].weapon.damage) + "\n***Weapon Accuracy:*** " + numberWithCommas(warfare[i].players[warfareIndex].weapon.accuracy) + "\n***Uses Left:*** " + warfare[i].players[warfareIndex].weapon.uses
                                        }

                                        message.channel.send("", {embed: {title: "***Warfare Profile for " + message.author.username + "***", description: message.author.username + " currently has " + numberWithCommas(IndexRef.getTokens(message.author.id)) + " tokens.\n" + message.author.username + " is at Level " + numberWithCommas(warfare[i].players[warfareIndex].level) +".\n\n***__XP__***\n" + numberWithCommas(warfare[i].players[warfareIndex].xp) + " / " + numberWithCommas(100 * (Math.pow(warfare[i].players[warfareIndex].level + 1, 2))) + " (XP Required To Reach Level " + numberWithCommas(warfare[i].players[warfareIndex].level + 1) + ")\n\n***__HP__***\n" + numberWithCommas(warfare[i].players[warfareIndex].hp) + " / " + numberWithCommas(warfare[i].players[warfareIndex].level * 1000) + " (Max HP)\n\n***__Weapon__***\n" + weaponText, color: 16711680, thumbnail: {"url": thumbnail}, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                    }
                                }

                                if(!playerFound)
                                {
                                    warfare[i].players.push({id: message.author.id, level: 1, xp: 0, hp: 1000, weapon: null})
                                    message.channel.send("", {embed: {title: "***Warfare Profile for " + message.author.username + "***", description: message.author.username + " currently has " + numberWithCommas(IndexRef.getTokens(message.author.id)) + " tokens.\n" + message.author.username + " is at Level 1.\n\n***__XP__***\n0 / " + numberWithCommas(100 * (Math.pow(2, 2))) + " (XP Required To Reach Level 2)\n\n***__HP__***\n1,000 / 1,000 (Max HP)\n\n***__Weapon__***\n"+ message.author.username + " has no weapon.", color: 16711680, thumbnail: {"url": thumbnail}, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                }
                            }
                        }
                        else if(args.toLowerCase().startsWith("attack"))
                        {
                            var timestamp = (new Date(Date.now()).toJSON());
                            var otherUser = false;
                            var userID = "";
                            var getUser = false;
                            for(var index = 0; index < args.length; index++)
                            {
                                if(getUser)
                                {
                                    if(args[index].toString() == ">")
                                    {
                                        index = args.length;
                                        otherUser = true;
                                    }
                                    else
                                    {
                                        if(args[index].toString() != "@" && (!isNaN(args[index].toString()) || args[index] == "&"))
                                        {
                                            userID = userID + args[index].toString();
                                        }
                                    }
                                }
                                else
                                {
                                    if(args[index].toString() == "<")
                                    {
                                        getUser = true;
                                    } 
                                }
                            }
                            
        
                            if(otherUser)
                            {
                                var playerFound = false;
                                var user;
                                var mentions = message.mentions.users.array()

                                for(var mentionIndex = 0; mentionIndex < mentions.length; mentionIndex++)
                                {
                                    if(mentions[mentionIndex].id == userID)
                                    {
                                        user = mentions[mentionIndex];
                                    }
                                }

                                if(user != undefined && user != null)
                                {    
                                    for(var warfareIndex = 0; warfareIndex < warfare[i].players.length; warfareIndex++)
                                    {
                                        if(warfare[i].players[warfareIndex].id == message.author.id)
                                        {
                                            playerFound = true
                                            var attackCooldown = new Date()

                                            if(warfare[i].players[warfareIndex].attackCooldown != null && warfare[i].players[warfareIndex].attackCooldown != undefined)
                                            {
                                                attackCooldown = new Date(warfare[i].players[warfareIndex].attackCooldown)
                                            }

                                            if(attackCooldown.getTime() <= (new Date()).getTime())
                                            {
                                                var weaponText = ""

                                                if(warfare[i].players[warfareIndex].weapon == null || warfare[i].players[warfareIndex].weapon == undefined)
                                                {
                                                    message.channel.send("<@" + message.author.id + "> Your attack failed", {embed: {title: "***Attack Failed***", description: "<@" + message.author.id + "> You have no weapon to attack with. Use `" + commandPrefix + "warfare buy` to purchase a weapon pack.", color: 16711680, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                                }
                                                else
                                                {
                                                    var enemyFound = false;
                                                    var weaponType = "", weaponRank = ""
    
                                                    if(warfare[i].players[warfareIndex].weapon.melee == true)
                                                        weaponType = "Melee"
                                                    else
                                                        weaponType = "Ranged"
        
                                                    if(warfare[i].players[warfareIndex].weapon.rank == 0)
                                                        weaponRank = "Common"
                                                    else if(warfare[i].players[warfareIndex].weapon == 1)
                                                        weaponRank = "Rare"
                                                    else
                                                        weaponRank = "Legendary"
        

                                                    warfare[i].players[warfareIndex].weapon.uses = warfare[i].players[warfareIndex].weapon.uses - 1
                                                    weaponText = "***__Weapon Details__***\n***Weapon Name:*** " + warfare[i].players[warfareIndex].weapon.name + "\n***Weapon Type***: " + weaponType + "\n***Weapon Rank:*** " + weaponRank + "\n***Max Damage:*** " + numberWithCommas(warfare[i].players[warfareIndex].weapon.damage) + "\n***Weapon Accuracy:*** " + numberWithCommas(warfare[i].players[warfareIndex].weapon.accuracy) + "\n***Uses Left:*** " + warfare[i].players[warfareIndex].weapon.uses
    
                                                    for(var enemyIndex = 0; enemyIndex < warfare[i].players.length; enemyIndex++)
                                                    {
                                                        if(warfare[i].players[enemyIndex].id == user.id)
                                                        {
                                                            enemyFound = true;
                                                            
                                                            var damageToDo = Math.floor(Math.random() * warfare[i].players[warfareIndex].weapon.damage) + 1
                                                            damageToDo = Math.floor(damageToDo * (warfare[i].players[warfareIndex].weapon.accuracy/100))
    
                                                            warfare[i].players[enemyIndex].hp = warfare[i].players[enemyIndex].hp - damageToDo
    
                                                            if(warfare[i].players[enemyIndex].hp < 0)
                                                            {
                                                                warfare[i].players[enemyIndex].hp = 0
    
                                                                var xpCal = warfare[i].players[enemyIndex].xp * 0.25

                                                                if(xpCal < 500)
                                                                    xpCal = 500

                                                                const xpChange = xpCal * (warfare[i].players[enemyIndex].level/warfare[i].players[warfareIndex].level)
    
                                                                warfare[i].players[warfareIndex].xp = warfare[i].players[warfareIndex].xp + xpChange
                                                                warfare[i].players[enemyIndex].xp = warfare[i].players[enemyIndex].xp - xpChange
                                                             
                                                                message.channel.send("<@" + message.author.id + "> has killed <@" + user.id + ">", {embed: {title: "***Attack Successful - Player Killed***", description: "<@" + message.author.id + "> has killed <@" + user.id + "> and has done " + numberWithCommas(damageToDo) + " damage!\n\n<@" + user.id + "> now has 0 HP. HP will now be restored.\n\n<@" + message.author.id + "> has gained " + numberWithCommas(xpChange) + " XP.\n<@" + user.id + "> has lost " + numberWithCommas(xpChange) + " XP.\n\n" + weaponText, color: 8388863, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));

                                                                if(warfare[i].players[enemyIndex].xp < 0)
                                                                    warfare[i].players[enemyIndex].xp = 0
    
                                                                const oldLevel = parseInt(warfare[i].players[enemyIndex].level);
                                                                var newLevel = 1;
                                                                var levelFound = false;
                                                                while(!levelFound)
                                                                {
                                                                    if(warfare[i].players[enemyIndex].xp < 100 * Math.pow(newLevel + 1, 2))
                                                                    {
                                                                        levelFound = true;
                                                                    }
                                                                    else
                                                                    {
                                                                        newLevel++;
                                                                    }
                                                                }
    
                                                                if(newLevel < oldLevel)
                                                                {
                                                                    warfare[i].players[enemyIndex].level = newLevel;
                                                                    var thumbnail = "";
        
                                                                    if(user.avatarURL != undefined && user.avatarURL != null)
                                                                        thumbnail = user.avatarURL
        
                                                                    message.channel.send("<@" + user.id + "> you have levelled down", {embed: {title: "***" + user.username + " Has Levelled Down***", description: "<@" + user.id + "> you have levelled down from Level " + numberWithCommas(oldLevel) + " to Level " + numberWithCommas(newLevel) + ".", color: 16711680, thumbnail: {"url": thumbnail}, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                                                    warfare[i].players[enemyIndex].hp = 1000 * warfare[i].players[enemyIndex].level
                                                                }
                                                            }
                                                            else
                                                            {
                                                                message.channel.send("<@" + message.author.id + "> has attacked <@" + user.id + ">", {embed: {title: "***Attack Successful***", description: "<@" + message.author.id + "> has attacked <@" + user.id + "> and has done " + numberWithCommas(damageToDo) + " damage!\n\n<@" + user.id + "> now has " + numberWithCommas(warfare[i].players[enemyIndex].hp) + " HP (Use `" + commandPrefix +"warfare heal <amount-to-heal>` to heal).\n\n" + weaponText, color: 8388863, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                                            }
                                                        }
                                                    }
    
                                                    if(!enemyFound)
                                                    {
                                                        var enemyPlayer = {id: user.id, level: 1, xp: 0, hp: 1000, weapon: null}
    
                                                        var damageToDo = Math.floor(Math.random() * warfare[i].players[warfareIndex].weapon.damage) + 1
                                                        damageToDo = Math.floor(damageToDo * (warfare[i].players[warfareIndex].weapon.accuracy/100))
    
                                                        enemyPlayer.hp = enemyPlayer.hp - damageToDo
    
                                                        if(enemyPlayer.hp < 0)
                                                        {
                                                            enemyPlayer.hp = 0
    
                                                            const xpChange = 500 * (enemyPlayer.level/warfare[i].players[warfareIndex].level)
    
                                                            warfare[i].players[warfareIndex].xp = warfare[i].players[warfareIndex].xp + xpChange
                                                            
                                                            message.channel.send("<@" + message.author.id + "> has killed <@" + user.id + ">", {embed: {title: "***Attack Successful - Player Killed***", description: "<@" + message.author.id + "> has killed <@" + user.id + "> and has done " + numberWithCommas(damageToDo) + " damage!\n\n<@" + user.id + "> now has 0 HP. HP will now be restored.\n\n<@" + message.author.id + "> has gained " + numberWithCommas(xpChange) + " XP.\n<@" + user.id + "> has lost " + numberWithCommas(xpChange) + " XP.\n\n" + weaponText, color: 8388863, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));                                                     
                                                        }
                                                        else
                                                        {
                                                            message.channel.send("<@" + message.author.id + "> has attacked <@" + user.id + ">", {embed: {title: "***Attack Successful***", description: "<@" + message.author.id + "> has attacked <@" + user.id + "> and has done " + numberWithCommas(damageToDo) + " damage!\n\n<@" + user.id + "> now has " + numberWithCommas(enemyPlayer.hp) + " HP (Use `" + commandPrefix +"warfare heal <amount-to-heal>` to heal).\n\n" + weaponText, color: 8388863, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                                        }  
    
                                                        warfare[i].players.push(enemyPlayer)
                                                    }

                                                    if(warfare[i].players[warfareIndex].weapon.uses <= 0)
                                                    {
                                                        warfare[i].players[warfareIndex].weapon = null
                                                        message.channel.send("<@" + message.author.id + "> Your weapon broke", {embed: {title: "***Your Weapon Broke***", description: "<@" + message.author.id + "> You have exceeded the number of uses for your current weapon. You must purchase a new weapon to attack again.", color: 16711680, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                                    }

                                                    warfare[i].players[warfareIndex].attackCooldown = (new Date((new Date).getTime() + 30000)).toJSON()
                                                }   
                                            } 
                                            else
                                            {
                                                message.channel.send("", {embed: {title: "***Attack Cooldown***", description: "<@" + message.author.id + "> You must wait for at least 30 seconds before you can attack another user again.", color: 16711680, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                            }
                                        }
                                    }
    
                                    if(!playerFound)
                                    {
                                        message.channel.send("<@" + message.author.id + "> Your attack failed", {embed: {title: "***Attack Failed***", description: "<@" + message.author.id + "> You have no weapon to attack with. Use `" + commandPrefix + "warfare buy` to purchase a weapon pack.", color: 16711680, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                    }
                                }
                                else
                                {
                                    message.channel.send("<@" + message.author.id + "> User not found on this server.").catch(error => console.log("Send Error - " + error));
                                }
                            }
                            else
                            {
                                message.channel.send("<@" + message.author.id + "> Your attack failed", {embed: {title: "***Attack Failed***", description: "<@" + message.author.id + "> Please select another player to attack.", color: 16711680, thumbnail: {"url": thumbnail}, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                            }
                        }
                        else if(args.toLowerCase().startsWith("heal"))
                        {
                            var options = args.replace(/,/g, "")
                            var amountText = options.match(/\d+/g);
                            var amount = []
                            if(amountText != null)
                            {
                                amount = amountText.map(Number);
                            }

                            if(amount.length > 0)
                            {
                                amount = amount[0]

                                if(amount > 0)
                                {
                                    var playerFound = false
                                    for(var warfareIndex = 0; warfareIndex < warfare[i].players.length; warfareIndex++)
                                    {
                                        if(warfare[i].players[warfareIndex].id == message.author.id)
                                        {
                                            playerFound = true
                                            var maxHP = 1000 * warfare[i].players[warfareIndex].level

                                            if(warfare[i].players[warfareIndex].hp == maxHP)
                                            {
                                                message.channel.send("<@" + message.author.id + "> Your HP is full.").catch(error => {console.log("Send Error - " + error); });   
                                            }
                                            else
                                            {
                                                if(maxHP - warfare[i].players[warfareIndex].hp < amount)
                                                {
                                                    amount = maxHP - warfare[i].players[warfareIndex].hp
                                                }

                                                if(!IndexRef.subtractTokens(message.author.id, amount))
                                                {
                                                    message.channel.send("<@" + message.author.id + "> You do not have enough tokens to restore " + numberWithCommas(amount) + " HP.").catch(error => {console.log("Send Error - " + error); });   
                                                }
                                                else
                                                {
                                                    warfare[i].players[warfareIndex].hp = warfare[i].players[warfareIndex].hp + amount
                                                    message.channel.send("<@" + message.author.id + "> You have restored " + numberWithCommas(amount) + " HP. You now have " + numberWithCommas(warfare[i].players[warfareIndex].hp) + " HP.").catch(error => {console.log("Send Error - " + error); });   

                                                    if(warfare[i].players[warfareIndex].hp == maxHP)
                                                    {
                                                        message.channel.send("<@" + message.author.id + "> You have fully restored your HP.").catch(error => {console.log("Send Error - " + error); });   
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    if(!playerFound)
                                    {
                                        warfare[i].players.push({id: message.author.id, level: 1, xp: 0, hp: 1000, weapon: null})
                                        message.channel.send("<@" + message.author.id + "> Your HP is full.").catch(error => {console.log("Send Error - " + error); });   
                                    }
                                }
                                else
                                {
                                    message.channel.send("<@" + message.author.id + "> Amount should be greater than 0. 1 HP costs 1 War Token.").catch(error => {console.log("Send Error - " + error); });   
                                }
                            }
                            else
                            {
                                message.channel.send("<@" + message.author.id + "> No amount of HP given to restore. 1 HP costs 1 War Token.").catch(error => {console.log("Send Error - " + error); });   
                            }
                        }
                        else
                        {
                            message.channel.send("<@" + message.author.id + "> No parameter given. Use `" + commandPrefix + "help warfare` for help.").catch(error => {console.log("Send Error - " + error); });
                        }

                        for(var playerIndex = 0; playerIndex < warfare[i].players.length; playerIndex++)
                        {
                            if(warfare[i].players[playerIndex].id == message.author.id)
                            {
                                const oldLevel = parseInt(warfare[i].players[playerIndex].level);
                                if(warfare[i].players[playerIndex].xp >= 100 * Math.pow(warfare[i].players[playerIndex].level + 1, 2) || warfare[i].players[playerIndex].xp < 100 * Math.pow(warfare[i].players[playerIndex].level, 2))
                                {
                                    var newLevel = 1;
                                    var levelFound = false;
                                    while(!levelFound)
                                    {
                                        if(warfare[i].players[playerIndex].xp < 100 * Math.pow(newLevel + 1, 2))
                                        {
                                            levelFound = true;
                                        }
                                        else
                                        {
                                            newLevel++;
                                        }
                                    }

                                    warfare[i].players[playerIndex].level = newLevel;
                                }

                                if(warfare[i].players[playerIndex].level > oldLevel)
                                {
                                    var thumbnail = "";

                                    if(message.author.avatarURL != undefined && message.author.avatarURL != null)
                                        thumbnail = message.author.avatarURL
                                        
                                    message.channel.send("<@" + message.author.id + "> you have levelled up", {embed: {title: "***" + message.author.username + " Has Levelled Up***", description: "<@" + message.author.id + "> you have levelled up from Level " + numberWithCommas(oldLevel) + " to Level " + numberWithCommas(warfare[i].players[playerIndex].level) + ".", color: 65339, thumbnail: {"url": thumbnail}, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                }
                                else if(warfare[i].players[playerIndex].level < oldLevel)
                                {
                                    var thumbnail = "";

                                    if(message.author.avatarURL != undefined && message.author.avatarURL != null)
                                        thumbnail = message.author.avatarURL

                                    message.channel.send("<@" + message.author.id + "> you have levelled down", {embed: {title: "***" + message.author.username + " Has Levelled Down***", description: "<@" + message.author.id + "> you have levelled down from Level " + numberWithCommas(oldLevel) + " to Level " + numberWithCommas(warfare[i].players[playerIndex].level) + ".", color: 16711680, thumbnail: {"url": thumbnail}, timestamp: timestamp, footer: {icon_url: message.client.user.avatarURL,text: "Sent on"}}}).catch(error => console.log("Send Error - " + error));
                                }
                            }
                        }
                    
                        firebase.database().ref("serversettings/" + message.guild.id + "/warfare").set(JSON.stringify(warfare[i]))
                        return;
                    }
                }
            })
        })
    }
}

module.exports = WarfareCommand;