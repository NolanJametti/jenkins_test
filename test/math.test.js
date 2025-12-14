const { addition } = require('./math');

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message} | attendu: ${expected}, reçu: ${actual}`);
  }
}

// Tests
assertEqual(addition(1, 2), 3, '1 + 2 doit faire 3');
console.log('1 + 2 = 3      : OK');
assertEqual(addition(5, 7), 12, '5 + 7 doit faire 12');
console.log('5 + 7 = 12     : OK');
assertEqual(addition(-1, 1), 0, '-1 + 1 doit faire 0');
console.log('-1 + 1 = 0     : OK');

console.log('✅ Tous les tests sont bien passés');
