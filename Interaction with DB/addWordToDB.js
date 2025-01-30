const { Keyboard } = require("grammy");
const Database = require("better-sqlite3");
const db = new Database("words.db");

function getStartKeyboard() {
  return new Keyboard().text("Учить слова").text("Добавить слово").resized();
}

function cancelKeyboard() {
  return new Keyboard().text("❌ Отмена").resized().oneTime();
}

async function addWordConversation(conversation, ctx) {
  async function getInput(question) {
    await ctx.reply(question, {
      reply_markup: cancelKeyboard(),
    });

    const input = await conversation.waitFor(":text");
    if (input.msg.text === "❌ Отмена") {
      await ctx.reply("Добавление отменено!", {
        reply_markup: { remove_keyboard: true },
      });

      await ctx.reply("Выберите, что вы хотите сделать?👇", {
        reply_markup: getStartKeyboard(),
      });

      return null;
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
    const insert = db.transaction(() => {
      const wordInsert = db
        .prepare(
          `
        INSERT INTO words (word) 
        VALUES (?)
      `
        )
        .run(lvWord);

      const wordId = wordInsert.lastInsertRowid;

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
      reply_markup: getStartKeyboard(),
    });
  } catch (e) {
    await ctx.reply("❌ Ошибка при сохранении: " + e.message);
  }
}

module.exports = { addWordConversation };
