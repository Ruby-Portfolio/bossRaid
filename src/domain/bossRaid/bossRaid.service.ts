import { Injectable } from '@nestjs/common';
import { BossRaidRepository } from './bossRaid.repository';
import { RaidRecordRepository } from '../raidRecord/raidRecord.repository';
import { BossRaidState, EnterBossRaid } from './bossRaid.response';
import { BossRaidInfo } from './bossRaid.request';

@Injectable()
export class BossRaidService {
  constructor(
    private readonly bossRaidRepository: BossRaidRepository,
    private readonly raidRecordRepository: RaidRecordRepository,
  ) {}

  private readonly LIMIT_TIME = 180 * 1000; // TODO - S3 에서 조회한 값을 적용해야함
  private readonly scores = [20, 47, 85];

  async getBossRaidState(): Promise<BossRaidState> {
    const raidRecord =
      await this.raidRecordRepository.getRaidRecordByBossRaid();

    if (raidRecord?.isProceedingState(this.LIMIT_TIME)) {
      return new BossRaidState(raidRecord.userId);
    }

    return new BossRaidState();
  }

  async enterBossRaid({ level, userId }: BossRaidInfo): Promise<EnterBossRaid> {
    // 보스레이드 입장 가능 상태인지 확인해야함
    const raidRecord =
      await this.raidRecordRepository.getRaidRecordByBossRaid();

    if (raidRecord?.isProceedingState(this.LIMIT_TIME)) {
      return new EnterBossRaid();
    }

    // TODO - 레벨별 점수를 S3 에서 조회해야함
    const newRaidRecord = await this.raidRecordRepository.save({
      score: this.scores[level],
      userId,
    });

    await this.bossRaidRepository.update({}, { raidRecord: newRaidRecord });

    return new EnterBossRaid(newRaidRecord.raidRecordId);
  }
}
