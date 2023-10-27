export async function add(operandA: number, operandB: number): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const result = operandA + operandB;
    resolve(result);
  });
}
