const { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getContentType } = require("@whiskeysockets/baileys");
const fs = require("fs");
const util = require("util");
const chalk = require("chalk");
const axios = require("axios");
const apiKey = "1e46400d492bac924edf6e610f20db23";

const slboostingAPI = axios.create({
  baseURL: "https://slboosting.store/api/v2",
  headers: { "Content-Type": "application/json" }
});

// Only respond to the owner
const ownerNumber = "94771227821@s.whatsapp.net";

module.exports = itzmzn = async (client, m, chatUpdate) => {
  try {
    if (m.sender !== ownerNumber) return;

    var body = m.mtype === "conversation" ? m.message.conversation :
           m.mtype == "imageMessage" ? m.message.imageMessage.caption :
           m.mtype == "videoMessage" ? m.message.videoMessage.caption :
           m.mtype == "extendedTextMessage" ? m.message.extendedTextMessage.text :
           m.mtype == "buttonsResponseMessage" ? m.message.buttonsResponseMessage.selectedButtonId :
           m.mtype == "listResponseMessage" ? m.message.listResponseMessage.singleSelectReply.selectedRowId :
           m.mtype == "templateButtonReplyMessage" ? m.message.templateButtonReplyMessage.selectedId :
           m.mtype === "messageContextInfo" ? m.message.buttonsResponseMessage?.selectedButtonId || 
           m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text :
           "";
    if (m.mtype === "viewOnceMessageV2") return
    var budy = typeof m.text == "string" ? m.text : "";
    var prefix = /^[\\/!#.]/gi.test(body) ? body.match(/^[\\/!#.]/gi) : "/";
    const isCmd2 = body.startsWith(prefix);
    const command = body.replace(prefix, "").trim().split(/ +/).shift().toLowerCase();
    const args = body.trim().split(/ +/).slice(1);
    const pushname = m.pushName || "No Name";
    const from = m.chat;
    const reply = m.reply;

    if (isCmd2) {
      switch (command) {
        case "help": case "menu":
          m.reply(`📋 *SMM Bot Menu - Mazo LK*

✨ *Commands:*

🚀 *Services:* _Lists available services_
    ⌨️ Cmd: ${prefix}services

🛒 *Order:* _Creates a new order_
    ⌨️ Cmd: ${prefix}order [service_id] [link] [quantity]

🔍 *Order Status:* _Checks status of an order_
    ⌨️ Cmd: ${prefix}status [order_id]

💰 *Balance:* _Checks account balance_
    ⌨️ Cmd: ${prefix}balance

♻️ *Refill:* _Requests a refill_
    ⌨️ Cmd: ${prefix}refill [order_id]

🚫 *Cancel:* _Cancels orders_
    ⌨️ Cmd: ${prefix}cancel [order_ids]

🗃 *Multi Order Status:* _Checks status of multiple orders_
    ⌨️ Cmd: ${prefix}multistatus [order_ids]

📦 *Multi Refill Status:* _Checks refill status of multiple orders_
    ⌨️ Cmd: ${prefix}multirefillstatus [refill_ids]`);
          break;

        case "services":
          try {
            const response = await slboostingAPI.post("/", {
              key: apiKey,
              action: "services"
            });
            const services = response.data;
            let servicesText = "📋 *Available Services:*\n\n";
            services.forEach(service => {
              servicesText += `✨ *${service.name}*\n📂 Category: ${service.category}\n💸 Rate: $${service.rate}\n📉 Min: ${service.min}, Max: ${service.max}\n\n`;
            });
            m.reply(servicesText);
          } catch (error) {
            console.error(error);
            m.reply("⚠️ *Error fetching services.* Please try again.");
          }
          break;

        case "order":
          if (args.length < 3) return m.reply(`Usage: ${prefix}order [service_id] [link] [quantity]`);
          const [serviceId, link, quantity] = args;
          try {
            const response = await slboostingAPI.post("/", {
              key: apiKey,
              action: "add",
              service: serviceId,
              link,
              quantity
            });
            m.reply(`✅ *Order Created!*\n🆔 Order ID: ${response.data.order}`);
          } catch (error) {
            console.error(error);
            m.reply("⚠️ *Failed to create order.* Please check your parameters.");
          }
          break;

        case "status":
          if (args.length < 1) return m.reply(`Usage: ${prefix}status [order_id]`);
          const orderId = args[0];
          try {
            const response = await slboostingAPI.post("/", {
              key: apiKey,
              action: "status",
              order: orderId
            });
            const { charge, start_count, status, remains, currency } = response.data;
            m.reply(`📊 *Order Status:*\n🔹 Status: ${status}\n💰 Charge: ${charge} ${currency}\n📈 Start Count: ${start_count}\n🔻 Remains: ${remains}`);
          } catch (error) {
            console.error(error);
            m.reply("⚠️ *Error retrieving order status.*");
          }
          break;

        case "balance":
          try {
            const response = await slboostingAPI.post("/", {
              key: apiKey,
              action: "balance"
            });
            const { balance, currency } = response.data;
            m.reply(`💰 *Account Balance:*\n💵 Balance: ${balance} ${currency}`);
          } catch (error) {
            console.error(error);
            m.reply("⚠️ *Error fetching balance.*");
          }
          break;

        case "refill":
          if (args.length < 1) return m.reply(`Usage: ${prefix}refill [order_id]`);
          try {
            const response = await slboostingAPI.post("/", {
              key: apiKey,
              action: "refill",
              order: args[0]
            });
            m.reply(response.data.refill ? `🔄 *Refill requested successfully!*` : "⚠️ *Refill request failed.*");
          } catch (error) {
            console.error(error);
            m.reply("⚠️ *Error requesting refill.*");
          }
          break;

        case "cancel":
          if (args.length < 1) return m.reply(`Usage: ${prefix}cancel [order_ids]`);
          try {
            const response = await slboostingAPI.post("/", {
              key: apiKey,
              action: "cancel",
              orders: args.join(",")
            });
            m.reply("🚫 *Order cancellation processed.*");
          } catch (error) {
            console.error(error);
            m.reply("⚠️ *Error cancelling orders.*");
          }
          break;

        case "multistatus":
          if (args.length < 1) return m.reply(`Usage: ${prefix}multistatus [order_ids]`);
          try {
            const response = await slboostingAPI.post("/", {
              key: apiKey,
              action: "status",
              orders: args.join(",")
            });
            m.reply(`📊 *Multi Order Status:* ${JSON.stringify(response.data, null, 2)}`);
          } catch (error) {
            console.error(error);
            m.reply("⚠️ *Error retrieving multiple statuses.*");
          }
          break;

        case "multirefillstatus":
          if (args.length < 1) return m.reply(`Usage: ${prefix}multirefillstatus [refill_ids]`);
          try {
            const response = await slboostingAPI.post("/", {
              key: apiKey,
              action: "refill_status",
              refills: args.join(",")
            });
            m.reply(`🔄 *Multi Refill Status:* ${JSON.stringify(response.data, null, 2)}`);
          } catch (error) {
            console.error(error);
            m.reply("⚠️ *Error retrieving multiple refill statuses.*");
          }
          break;

        default:
          m.reply("🤔 *Unknown command.* Use /help to see available commands.");
      }
    }
  } catch (err) {
    m.reply(util.format(err));
  }
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});
