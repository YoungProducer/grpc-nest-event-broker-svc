export type CombinerFunction = (...args: any[]) => void | Promise<void>;

export const combinerGenerator = <
  F extends CombinerFunction = CombinerFunction,
>() => {
  const functions: Array<F> = [];

  const execute = (...args: Parameters<F>) => {
    for (const f of functions) {
      const call = f(...args);

      if (call instanceof Promise) {
        call.then();
      }
    }
  };

  return {
    add: (...fs: F[]) => functions.push(...fs),
    execute,
  };
};

export type CombinerGenerator = typeof combinerGenerator;
