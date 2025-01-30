import "dotenv/config";
import { Bot, GrammyError, HttpError, Keyboard, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
import { startLearningWords } from "./Interaction with DB/startLearningWords.js";
import { addWordConversation } from "./Interaction with DB/addWordToDB.js";

const bot = new Bot(process.env.BOT_API_KEY);
bot.use(session({ initial: () => ({}) }));
bot.use(conversations());

function getStartKeyboard() {
  return new Keyboard().text("Учить слова").text("Добавить слово").resized();
}

bot.use(createConversation(addWordConversation));

bot.hears("Добавить слово", async (ctx) => {
  await ctx.conversation.enter("addWordConversation");
});

bot.command("start", async (ctx) => {
  await ctx.reply("Привет, давай поучим слова на Латышском! ");
  await ctx.reply("Выберите, что вы хотите сделать?👇", {
    reply_markup: getStartKeyboard(),
  });
  // console.log(ctx);
});

bot.hears("Учить слова", async (ctx) => {
  await startLearningWords(ctx);
});

bot.on("callback_query:data", async (ctx) => {
  const data = JSON.parse(ctx.callbackQuery.data);

  if (data.type === "check_answer") {
    await ctx.answerCallbackQuery(
      data.isCorrect ? "✅ Правильно!" : "❌ Неверно! Попробуйте еще раз"
    );

    if (data.isCorrect) {
      await ctx.deleteMessage();
      await startLearningWords(ctx);
    }
  }
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
