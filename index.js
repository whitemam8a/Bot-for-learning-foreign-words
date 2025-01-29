require("dotenv").config();
const { Bot, GrammyError, HttpError, Keyboard, session } = require("grammy");
const {
  conversations,
  createConversation,
} = require("@grammyjs/conversations");
const {
  startLearningWords,
} = require("./Adding words to the DB/startLearningWords");
const Database = require("better-sqlite3");
const db = new Database("words.db");

const bot = new Bot(process.env.BOT_API_KEY);
bot.use(session({ initial: () => ({}) }));
bot.use(conversations());

function cancelKeyboard() {
  return new Keyboard().text("❌ Отмена").resized().oneTime();
}

const startkeyboard = new Keyboard()
  .text("Учить слова")
  .text("Добавить слово")
  .resized();

bot.use(createConversation(addWordConversation));

bot.hears("Добавить слово", async (ctx) => {
  await ctx.conversation.enter("addWordConversation");
});

async function addWordConversation(conversation, ctx) {
  // Функция для шагов с обработкой отмены
  async function getInput(question) {
    await ctx.reply(question, {
      reply_markup: cancelKeyboard(),
    });

    const input = await conversation.waitFor(":text");
    if (input.msg.text === "❌ Отмена") {
      await ctx.reply("Добавление отменено!");
      return null; // Сигнал отмены
    }
    return input.msg.text.trim();
  }

  // Шаг 1: Латышское слово
  const lvWord = await getInput("Введите слово на латышском:");
  if (!lvWord) return;

  // Шаг 2: Правильный перевод
  const ruCorrect = await getInput("Введите правильный перевод:");
  if (!ruCorrect) return;

  // Шаг 3: Первый неправильный
  const ruWrong1 = await getInput("Введите первый неправильный вариант:");
  if (!ruWrong1) return;

  // Шаг 4: Второй неправильный
  const ruWrong2 = await getInput("Введите второй неправильный вариант:");
  if (!ruWrong2) return;

  // Сохранение в БД
  try {
    // Начинаем транзакцию
    const insert = db.transaction(() => {
      // 1. Добавляем слово в таблицу words
      const wordInsert = db
        .prepare(
          `
        INSERT INTO words (word) 
        VALUES (?)
      `
        )
        .run(lvWord);

      // 2. Получаем ID добавленного слова
      const wordId = wordInsert.lastInsertRowid;

      // 3. Добавляем варианты перевода в options
      const options = [
        { translateWord: ruCorrect, isCorrect: 1 },
        { translateWord: ruWrong1, isCorrect: 0 },
        { translateWord: ruWrong2, isCorrect: 0 },
      ];

      const optionInsert = db.prepare(`
        INSERT INTO options (word_id, translate_word, is_correct)
        VALUES (?, ?, ?)
      `);

      options.forEach((opt) => {
        optionInsert.run(wordId, opt.translateWord, opt.isCorrect);
      });
    });

    insert();

    await ctx.reply("✅ Слово успешно добавлено!", {
      reply_markup: startkeyboard,
    });
  } catch (e) {
    await ctx.reply("❌ Ошибка при сохранении: " + e.message);
  }
}

bot.command("start", async (ctx) => {
  // const startkeyboard = new Keyboard()
  //   .text("Учить слова")
  //   .text("Добавить слово")
  //   .resized();
  await ctx.reply("Привет, давай поучим слова на Латышском! ");
  await ctx.reply("Выберите, что вы хотите сделать?👇", {
    reply_markup: startkeyboard,
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
  // if (callBackData.isCorrect) {
  //   await ctx.reply("Верно ✅");
  //   await ctx.answerCallbackQuery();
  //   return;
  // }

  // const answer = getCorrectAnswer(callBackData.wordId);

  // await ctx.reply(`Неверно ❌ Правильный ответ: ${answer}`);
  // await ctx.answerCallbackQuery();
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
