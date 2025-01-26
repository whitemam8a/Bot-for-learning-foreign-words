const words = require("./words.json");
const { Random } = require("random-js");

const getRandomWord = () => {
  const random = new Random();
  const randomWordIndex = random.integer(0, words.length - 1);

  return words[randomWordIndex];
};

const getCorrectAnswer = (id) => {
  const word = words.find((word) => word.id === id);

  return word.options.find((option) => option.isCorrect).rusWord;
};

module.exports = { getRandomWord, getCorrectAnswer };
