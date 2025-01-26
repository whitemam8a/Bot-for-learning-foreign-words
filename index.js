require("dotenv").config();
const {
  Bot,
  GrammyError,
  HttpError,
  Keyboard,
  InlineKeyboard,
} = require("grammy");
const { getRandomWord, getCorrectAnswer } = require("./utils");

const bot = new Bot(process.env.BOT_API_KEY);

bot.command("start", async (ctx) => {
  const startkeyboard = new Keyboard()
    .text("Учить слова")
    .text("Добавить слово")
    .resized();
  await ctx.reply("Привет, давай поучим слова на Латышском! ");
  await ctx.reply("Выберите, что вы хотите сделать?👇", {
    reply_markup: startkeyboard,
  });
  // console.log(ctx);
});

bot.hears("Учить слова", async (ctx) => {
  const word = getRandomWord();
  console.log(word);

  const buttonRows = word.options.map((option) => [
    InlineKeyboard.text(
      option.rusWord,
      JSON.stringify({
        wordId: word.id,
        isCorrect: option.isCorrect,
      })
    ),
  ]);

  inlineKeyBoard = InlineKeyboard.from(buttonRows);

  await ctx.reply(`Как переводится слово ${word.latWord}`, {
    reply_markup: inlineKeyBoard,
  });
});

bot.on("callback_query:data", async (ctx) => {
  const callBackData = JSON.parse(ctx.callbackQuery.data);

  if (callBackData.isCorrect) {
    await ctx.reply("Верно ✅");
    await ctx.answerCallbackQuery();
    return;
  }

  const answer = getCorrectAnswer(callBackData.wordId);

  await ctx.reply(`Неверно ❌ Правильный ответ: ${answer}`);
  await ctx.answerCallbackQuery();
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

bot.start();
