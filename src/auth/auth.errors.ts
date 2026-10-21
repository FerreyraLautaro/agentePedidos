export class EmailAlreadyRegisteredError extends Error {
  constructor(readonly email: string) {
    super(`Email ${email} is already registered`);
    this.name = 'EmailAlreadyRegisteredError';
  }
}

/** One error for unknown email and wrong password, so the API does not reveal which emails exist. */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}
