const { InlineKeyboard } = require("grammy");
const { getRandomWord } = require("../utils");

async function startLearningWords(ctx) {
  const word = getRandomWord();
  console.log(word);

  if (!word?.options?.length) {
    return ctx.reply("Словарь пуст! Добавьте слова через меню.");
  }

  const buttonRows = word.options.map((option) => [
    InlineKeyboard.text(
      option.translate_word,
      JSON.stringify({
        type: "check_answer",
        wordId: word.id,
        isCorrect: option.is_correct,
      })
    ),
  ]);

  const inlineKeyBoard = InlineKeyboard.from(buttonRows);

  await ctx.reply(`Как переводится слово ${word.word}`, {
    reply_markup: inlineKeyBoard,
  });
}

module.exports = { startLearningWords };
