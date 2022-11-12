import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { HttpStatus } from '@nestjs/common';

export enum RaidRecordErrorMessage {
  NOT_FOUND = '레이드 레코드 정보를 찾을 수 없습니다.',
}

export class NotFoundRaidRecordException extends HttpException {
  constructor() {
    super(RaidRecordErrorMessage.NOT_FOUND, HttpStatus.NOT_FOUND);
  }
}
