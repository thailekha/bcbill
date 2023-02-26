// if error instanceof CustomException
class CustomException extends Error {
  constructor(statusCode) {
    super(statusCode);
    this.statusCode = statusCode;
  }
}

module.exports = CustomException;