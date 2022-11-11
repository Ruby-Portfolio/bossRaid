import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { HttpStatus } from '@nestjs/common';

export enum UserErrorMessage {
  NOT_FOUND = '해당 유저 정보를 찾을 수 없습니다.',
}

export class NotFoundUserException extends HttpException {
  constructor() {
    super(UserErrorMessage.NOT_FOUND, HttpStatus.NOT_FOUND);
  }
}
