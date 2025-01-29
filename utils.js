// const words = require("./words.json");
const Database = require("better-sqlite3");
const db = new Database("words.db");
// const { Random } = require("random-js");

// const getRandomWord = () => {
//   const random = new Random();
//   const randomWordIndex = random.integer(0, words.length - 1);

//   return words[randomWordIndex];
// };

// const getCorrectAnswer = (id) => {
//   const word = words.find((word) => word.id === id);

//   return word.options.find((option) => option.isCorrect).rusWord;
// };

const getRandomWordStmt = db.prepare(`
  SELECT words.id, words.word 
  FROM words 
  ORDER BY RANDOM() 
  LIMIT 1
`);

const getOptionsStmt = db.prepare(`
  SELECT translate_word , is_correct  
  FROM options 
  WHERE word_id = ?
`);

// Функция для получения случайного слова с вариантами
const getRandomWord = () => {
  try {
    const word = getRandomWordStmt.get();
    if (!word) return null;

    word.options = getOptionsStmt.all(word.id);
    return word;
  } catch (error) {
    console.error("Database error:", error);
    return null;
  }
};

module.exports = { getRandomWord };
