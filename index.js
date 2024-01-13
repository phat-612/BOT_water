const TelegramBot = require("node-telegram-bot-api");
const schedule = require("node-schedule");
// replace the value below with the Telegram token you receive from @BotFather
const token = "6487478889:AAGAhOxJnZfG_ka91TdX3-g8_GhzdmtslnU";

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });
let users = [];
let idSchedule;
let user;
let chatId;
const strSetup =
  "Cân nặng của bạn (kg)\nLượng nước mỗi lần uống (ml)\nThời gian nhắc nhở (phút)\nVí dụ: 75kg, 100ml, 40 phút -> 75-100-40";
bot.on("callback_query", function onCallbackQuery(callbackQuery) {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const opts = {
    chat_id: msg.chat.id,
    message_id: msg.message_id,
  };
  let text;

  switch (action) {
    case "wake up":
      user.drink = true;
      user.drinked = 0;
      saveUser(user);
      sendNotifi(user);
      break;
    case "sleep":
      clearInterval(idSchedule);
      user.drink = false;
      user.drinked = 0;
      saveUser(user);
      bot.deleteMessage(msg.chat.id, msg.message_id);
      sendFormAction(
        "Đã kết thúc ngày hôm nay, hẹn gặp lại cậu vào ngày mai nhé!"
      );
      break;
    case "check information":
      bot.sendMessage(
        chatId,
        `Cân nặng: ${user.weight}kg\nLượng nước mỗi lần uống: ${user.oneDrink}ml\nThời gian nhắc nhở: ${user.time} phút \nLượng nước cần uống: ${user.water}ml`
      );
      break;
    case "change information":
      bot.sendMessage(chatId, strSetup);
      let newUser = {
        chatId: chatId,
        drink: false,
      };
      saveUser(newUser);
      break;
    default:
      break;
  }
});
bot.on("message", (msg) => {
  chatId = msg.chat.id;
  const message = msg.text.toLowerCase();
  user = users.find((user) => user.chatId === chatId);
  if (user) {
    if (!user.hasOwnProperty("water")) {
      const [weight, oneDrink, time] = message.split("-");
      if (isNaN(oneDrink) || isNaN(weight) || isNaN(time)) {
        bot.sendMessage(chatId, strSetup);
        return false;
      }
      const water = Math.round(weight * 37);
      saveUser({ ...user, weight, oneDrink, water, time });
      sendFormAction(`Bạn cần uống ${water}ml nước mỗi ngày`);
    }
  } else {
    users.push({ chatId: chatId, drink: false });
    bot.sendMessage(chatId, strSetup);
    console.log(`${msg.chat.last_name} ${msg.chat.first_name} đã tham gia`);
    return false;
  }
  switch (message) {
    case "wake up":
      user.drink = true;
      user.drinked = 0;
      saveUser(user);
      sendNotifi(user);
      break;
    case "sleep":
      user.drink = false;
      user.drinked = 0;
      clearInterval(idSchedule);
      saveUser(user);
      break;
    case "check information":
      bot.sendMessage(
        chatId,
        `Cân nặng: ${user.weight}kg\nLượng nước mỗi lần uống: ${user.oneDrink}ml\nThời gian nhắc nhở: ${user.time} phút \nLượng nước cần uống: ${user.water}ml`
      );
      break;
    case "change information":
      bot.sendMessage(chatId, strSetup);
      let newUser = {
        chatId: chatId,
        drink: false,
      };
      saveUser(newUser);
      break;
    case "test":
      sendOptions();
      break;
    default:
      break;
  }
});
function sendFormAction(message = "Action") {
  sendOptions(message, [
    {
      text: "Wake up",
      callback_data: "wake up",
    },
    {
      text: "Check information",
      callback_data: "check information",
    },
    {
      text: "Change information",
      callback_data: "change information",
    },
  ]);
}
function sendNotifi(user) {
  user.drinked = parseInt(user.oneDrink);
  saveUser(user);
  sendOptions(`Ngày mới vui vẻ, nhớ uống nước nhá!`, [
    {
      text: "Kết thúc",
      callback_data: "sleep",
    },
  ]);
  idSchedule = setInterval(function () {
    if (!user.drink) {
      clearInterval(idSchedule);
      return false;
    }
    if (user.drinked >= user.water) {
      sendFormAction("Đây là lần nhắc nhở cuối cùng trong hôm nay!!!!");
      user.drink = false;
      saveUser(user);
      clearInterval(idSchedule);
      return false;
    }
    sendOptions(`Uống nước bạn ơi, bạn đã uống được ${user.drinked}ml`, [
      {
        text: "Kết thúc",
        callback_data: "sleep",
      },
    ]);
    user.drinked += parseInt(user.oneDrink);
    saveUser(user);
  }, Math.round(user.time * 1000 * 60));
}
function sendOptions(
  message,
  options = [
    {
      text: "Edit",
      callback_data: "edit",
    },
  ]
) {
  const opts = {
    reply_markup: {
      inline_keyboard: [options],
    },
  };

  bot.sendMessage(chatId, message, opts);
}
function saveUser(funcUser) {
  user = funcUser;
  users = users.map((tempUser) => {
    if (tempUser.chatId === funcUser.chatId) {
      return funcUser;
    }
    return tempUser;
  });
}
