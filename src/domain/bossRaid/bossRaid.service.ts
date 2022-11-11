import { Injectable } from '@nestjs/common';
import { BossRaidRepository } from './bossRaid.repository';
import { BossRaid } from './bossRaid.entity';
import { RaidRecordRepository } from '../raidRecord/raidRecord.repository';
import { BossRaidState } from './bossRaid.response';

@Injectable()
export class BossRaidService {
  constructor(
    private readonly bossRaidRepository: BossRaidRepository,
    private readonly raidRecordRepository: RaidRecordRepository,
  ) {}

  private readonly LIMIT_TIME = 180 * 1000; // TODO - S3 에서 조회한 값을 적용해야함

  async getBossRaidState(): Promise<BossRaidState> {
    const raidRecord = await this.raidRecordRepository
      .createQueryBuilder('raidRecord')
      .leftJoin(BossRaid, 'bossRaid', 'bossRaid.raidRecordId')
      .getOne();

    if (raidRecord) {
      const canEnter = raidRecord.isEndState(this.LIMIT_TIME);
      return new BossRaidState(canEnter, raidRecord.userId);
    }

    return new BossRaidState();
  }
}
