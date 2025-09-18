import { onePieceCards, findOnePieceByCodeOrName, guessOnePieceFromFilename } from "./onepiece.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function run() {
  // Basic dataset sanity
  assert(onePieceCards.length >= 5, "Expected at least 5 sample cards");

  // Exact code search
  let res = findOnePieceByCodeOrName("OP01-025");
  assert(res.length >= 1 && res[0].name.toLowerCase().includes("zoro"), "Code OP01-025 should return Zoro");

  // Case-insensitive and normalized code
  res = findOnePieceByCodeOrName("op01 025");
  assert(res.length >= 1 && res[0].card_code === "OP01-025", "Normalized code should match OP01-025");

  // Name search
  res = findOnePieceByCodeOrName("luffy");
  assert(res.some((c) => c.name.toLowerCase().includes("luffy")), "Name search for luffy should return Luffy");

  // Filename guess with hyphen
  let guess = guessOnePieceFromFilename("IMG_OP01-001.jpg");
  assert(guess && guess.card_code === "OP01-001", "Filename with OP01-001 should be detected");

  // Filename guess without hyphen
  guess = guessOnePieceFromFilename("scan_OP01025.png");
  assert(guess && guess.card_code === "OP01-025", "Filename OP01025 should be normalized to OP01-025");

  // Filename by name
  guess = guessOnePieceFromFilename("my_roronoa_zoro_pull.jpeg");
  assert(guess && guess.name.toLowerCase().includes("zoro"), "Filename containing zoro should match");

  console.log("All One Piece matching tests passed.");
}

run();


