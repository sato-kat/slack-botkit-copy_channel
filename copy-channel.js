//bot_userではchannelの作成やinviteが出来ないのでuserのtokenも渡す必要がある。
if (!process.env.token | !process.env.usertoken) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}
var Botkit = require('./lib/Botkit.js');
var os = require('os');

var controller = Botkit.slackbot({
    debug: false,
});

var bot = controller.spawn({
    token: process.env.token,
}).startRTM();
var usertoken = process.env.usertoken;

controller.hears('cpc ([a-z0-9_\-]+)', 'direct_message,direct_mention,mention', function(bot, message) {
    var newChannelName = message.match[1];
    var channelName = message.channel;

    //発言を受けたChannelがpublicかprivateかで呼び出すべきapiのmethodが異なるので、publicで成功したらpublic channelとして複製し
    //失敗したらprivate channelとして複製する。
    bot.api.channels.info({
        channel: channelName
    }, function(err, res) {
        if (err) {
            bot.api.groups.info({
                channel: channelName,
                token: usertoken
            }, function(err, res) {
                if (err) {
                    bot.reply(message, "groups.info:something is wrong... err:" + err);
                } else {
                    var members = res.group.members;
                    bot.api.groups.create({
                        name: newChannelName,
                        token: usertoken
                    }, function(err, res) {
                        if (err) {
                            bot.reply(message, "groups.create:something is wrong... err:" + err);
                        } else {
                            var channelId = res.group.id;
                            for (var x in members) {
                                bot.api.groups.invite({
                                    channel: channelId,
                                    user: members[x],
                                    token: usertoken
                                }, function(err, res) {});
                            }
                            bot.reply(message, "groups.create:success!!");
                        }
                    });
                }
            });
        } else {
            var members = res.channel.members;
            bot.api.channels.create({
                name: newChannelName,
                token: usertoken
            }, function(err, res) {
                if (err) {
                    bot.reply(message, "channels.create:something is wrong... err:" + err);
                } else {
                    var channelId = res.channel.id;
                    for (var x in members) {
                        bot.api.channels.invite({
                            channel: channelId,
                            user: members[x],
                            token: usertoken
                        }, function(err, res) {});
                    }
                    bot.reply(message, "channels.create:success!!");
                }
            });
        }
    });
});
