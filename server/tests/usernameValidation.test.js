const assert = require('assert');

// Username validation logic matching Woomegle strict requirements
const validateUsername = (username) => {
  const regex = /^[A-Za-z]{3,20}$/;
  if (!regex.test(username)) {
    return { success: false, message: 'Username can contain only letters.' };
  }
  return { success: true };
};

describe('Strict Username Validation Tests', () => {
  it('should allow valid usernames with only English letters (3-20 chars)', () => {
    const validExamples = ['Rahul', 'Aman', 'John', 'Woomegle', 'Tanishk'];
    validExamples.forEach((username) => {
      const res = validateUsername(username);
      assert.strictEqual(res.success, true, `Expected ${username} to be valid`);
    });
  });

  it('should reject usernames containing numbers, spaces, special chars, or invalid length', () => {
    const invalidExamples = [
      'Rahul123', '123Rahul', 'John99', 'Aman_01', 
      'Rahul@', 'John Doe', 'Rahul-123', 'Ab', 
      'ThisUsernameIsWayTooLongToBeValid'
    ];
    invalidExamples.forEach((username) => {
      const res = validateUsername(username);
      assert.strictEqual(res.success, false, `Expected ${username} to be invalid`);
      assert.strictEqual(res.message, 'Username can contain only letters.');
    });
  });
});
