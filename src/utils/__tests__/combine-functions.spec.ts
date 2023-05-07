import { combinerGenerator } from '../combine-functions';

describe('UTIL combine functions', () => {
  it('should work properly if all functions are sync', () => {
    const combiner = combinerGenerator();

    const f1 = jest.fn();
    const f2 = jest.fn();

    combiner.add(f1, f2);

    combiner.execute();

    expect(f1).toBeCalled();
    expect(f2).toBeCalled();
  });

  it('should work properly if all functions are async', () => {
    const combiner = combinerGenerator();

    let v1 = 1;
    let v2 = 2;

    const expectedValue1 = 2;
    const expectedValue2 = 4;

    const f1 = jest.fn().mockImplementation(async () => (v1 = expectedValue1));
    const f2 = jest.fn().mockImplementation(async () => (v2 = expectedValue2));

    combiner.add(f1, f2);

    combiner.execute();

    expect(f1).toBeCalled();
    expect(f2).toBeCalled();
    expect(v1).toBe(expectedValue1);
    expect(v2).toBe(expectedValue2);
  });

  it('should work properly if functions are mixed', () => {
    const combiner = combinerGenerator();

    let v1 = 1;
    let v2 = 2;

    const expectedValue1 = 2;
    const expectedValue2 = 4;

    const f1 = jest.fn().mockImplementation(async () => (v1 = expectedValue1));
    const f2 = jest.fn().mockImplementation(() => (v2 = expectedValue2));

    combiner.add(f1, f2);

    combiner.execute();

    expect(f1).toBeCalled();
    expect(f2).toBeCalled();
    expect(v1).toBe(expectedValue1);
    expect(v2).toBe(expectedValue2);
  });
});
