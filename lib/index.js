"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.Config  = exports.name = void 0;
const koishi_1 = require("koishi");
exports.name = 'freegames-subscribe';
const axios = require('axios');
exports.Config = koishi_1.Schema.intersect([
    koishi_1.Schema.object({
    steaminfo: koishi_1.Schema.boolean().description('是否与Steaminfo插件展开联动？你可以使“epic”命令测试插件是否有效。注：使用本插件时可能需要科学上网环境，你可以访问以下链接测试https://rsshub.app/epicgames/freegames/zh-CN.json').default(false),
    }).description('基础设置'),
    koishi_1.Schema.object({
    epic_subscribe: koishi_1.Schema.boolean().description('启用EPIC喜+1上新订阅？当内容更新时，会自动推送至指定群组').default(true),
     news_subscribe: koishi_1.Schema.boolean().description('启用自定义新闻订阅？注：启用新闻订阅需要填写筛选关键词！当内容更新时，会自动推送至指定群组').default(false),
    keywords: koishi_1.Schema.array(String).description('筛选订阅的关键词，订阅的原理是从新闻条目中筛选包含指定关键词的条目，你可以查询“二柄APP”中想要订阅的关键词，例如添加“会免游戏公布”以订阅PS+每月会免；添加“旬XGP/PGP新增”以订阅XGP入库通知。'),
    authors: koishi_1.Schema.array(String).description('筛选你想订阅的作者，例如“涟漪”'),
    botplatform: koishi_1.Schema.string().description('平台名称。').required(),
    guildId: koishi_1.Schema.string().description('群组 ID。'),
    selfId: koishi_1.Schema.string().description('机器人 ID。').required(),
    filter_time: koishi_1.Schema.number().default(7200).description('RSS间隔 (秒)。请注意！修改这项配置之前，你需要了解无数据库订阅的原理：filter_time代表了RSS信息发布与当前时间的间隔，当间隔超出设定值时，RSS就会返回空值。interval代表了程序向RSS链接发送的请求间隔，当程序检测到RSS返回的数据为空时，程序将自动退出，否则将进行关键词过滤并判断数据是否有效，最终发送的订阅信息。你需要合理地配置filter_time与interval才能实现订阅功能，如果不了解它们的含义，请使用默认值！'),
    interval: koishi_1.Schema.number().default(7200000).description('轮询间隔 (毫秒)。'),
    }).description('订阅设置'),
])



async function getmessage(url,config) {
    
    const response = await axios.get(url);
        const data = response.data;
        const items = data.items;
        
        
        if (items.length === 0) {
            return;
        } else {
        let message = '';
        items.forEach(item => {
          message += `游戏名称：${item.title}\n`;
          message += `介绍：${item.content_html.replace(/<img[^>]*>/g, '')}\n`;
          message += `领取链接：${item.url}\n`;
         if(config.steaminfo){
          message += `\n使用以下指令获取详细信息：查询 ${item.title.replace(/[^a-zA-Z0-9]/g, ' ')}\n`;
          }
          // 提取 description 中的图片链接
         const imageUrl = extractImageUrl(item.content_html);
if (imageUrl) {
  // 使用 koishi_1.segment.image 方法拼接图片
  message += koishi_1.segment.image(imageUrl);
}
          message += '\n';
        });
        return message;
        }
        
    
}

async function getnews(url, config) {
  const response = await axios.get(url);
  const data = response.data;
  const items = data.items;

  if (items.length === 0) {
    return;
  } else {
    let message = '';
  items.forEach(item => {
      if ((config.authors.length === 0 || config.authors.some(author => item.authors[0].name.includes(author)))
  && (config.keywords.length === 0 || config.keywords.some(keyword => item.content_html.includes(keyword)))) {
        message += `订阅提醒：${item.content_html.replace(/<img[^>]*>/g, '').replace(/<br\/?>/g, '\n')}\n`;
        message += `作者：${item.authors[0].name}\n`;

        // 提取 description 中的图片链接
        const imageUrl = extractImageUrl(item.content_html);
        if (imageUrl) {
          // 使用 koishi_1.segment.image 方法拼接图片
          message += koishi_1.segment.image(imageUrl);
        }
        message += '\n';
      }
      });
    return message;
  }
}

function apply(ctx, config) {
 
         ctx.on('ready', async () => {
        ctx.setInterval(async () => {
            
            const message = await getmessage(`https://rsshub.app/epicgames/freegames/zh-CN.json?filter_time=${config.filter_time}`,config);
            const news = await getnews(`https://rsshub.app/diershoubing/news.json?filter_time=${config.filter_time}`,config);
            
            
                const bot = ctx.bots[`${config.botplatform}:${config.selfId}`];
                if(message && config.epic_subscribe){
                bot.sendMessage(`${config.guildId}`, `Epic喜+1上新！\n\n${message}`)
                }
                if(news && config.news_subscribe){
                    bot.sendMessage(`${config.guildId}`, `${news}`)
                }
        
        }, config.interval);
    });
        
        
        
        
        
  ctx.command('epic', "查询epic免费游戏")
    .action(async ({ session, options }) => {
      try {
        const response = await axios.get('https://rsshub.app/epicgames/freegames/zh-CN.json');
        const data = response.data;
        const items = data.items;
        let message = '';
        items.forEach(item => {
          message += `游戏名称：${item.title}\n`;
          message += `介绍：${item.content_html.replace(/<img[^>]*>/g, '')}\n`;
          message += `领取链接：${item.url}\n`;
          if(config.steaminfo){
          message += `\n使用以下指令获取详细信息：查询 ${item.title.replace(/[^a-zA-Z0-9]/g, ' ')}\n`;
          }
          // 提取 description 中的图片链接
         const imageUrl = extractImageUrl(item.content_html);
if (imageUrl) {
  // 使用 koishi_1.segment.image 方法拼接图片
  message += koishi_1.segment.image(imageUrl);
}
          message += '\n';
        });
        session.send(message);
      } catch (error) {
        console.error(error);
        session.send('出错了！');
      }
    });
    

}
function extractImageUrl(description) {
  // 此处假设图片链接位于 description 中的第一个 img 标签中
  const imgTag = description.match(/<img[^>]*>/g)[0];
  const srcAttr = imgTag.match(/src="[^"]*"/g)[0];
  return srcAttr.slice(5, -1);
}

exports.apply = apply;