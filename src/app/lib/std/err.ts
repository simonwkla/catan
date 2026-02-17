export abstract class Exception {
  abstract readonly kind: string;
  readonly message: string;

  constructor(message: string) {
    this.message = message;
  }
}
