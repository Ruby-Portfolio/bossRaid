import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { HttpStatus } from '@nestjs/common';

export enum BossRaidErrorMessage {
  NOT_FOUND = '보스 레이드 정보를 찾을 수 없습니다.',
}

export class NotFoundBossRaidException extends HttpException {
  constructor() {
    super(BossRaidErrorMessage.NOT_FOUND, HttpStatus.NOT_FOUND);
  }
}
