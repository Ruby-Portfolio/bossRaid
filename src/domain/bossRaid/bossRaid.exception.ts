import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { HttpStatus } from '@nestjs/common';

export enum BossRaidErrorMessage {
  NOT_FOUND_RAID_SCORE_INFORMATION = '보스레이드 점수 정보를 찾을 수 없습니다..',
  FAIL_RAID = '보스레이드에 실패하였습니다.',
}

export class NotFoundRaidScoreInformationException extends HttpException {
  constructor() {
    super(
      BossRaidErrorMessage.NOT_FOUND_RAID_SCORE_INFORMATION,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class FailBossRaidException extends HttpException {
  constructor() {
    super(BossRaidErrorMessage.FAIL_RAID, HttpStatus.OK);
  }
}
