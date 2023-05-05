import { isValidEventName } from '../is-valid-event-name';

describe('UTIL "isValidEventName"', () => {
  it('should return "false" if name has " "', () => {
    const name = 'user created';

    expect(isValidEventName(name)).toBeFalsy();
  });

  it('should return "true" if name does not have any of banned symbols', () => {
    const name = 'user_created';

    expect(isValidEventName(name)).toBeTruthy();
  });
});
