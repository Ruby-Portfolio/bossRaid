import { Injectable } from '@nestjs/common';
import { BossRaidRepository } from './bossRaid.repository';
import { RaidRecordRepository } from '../raidRecord/raidRecord.repository';
import { BossRaidState, EnterBossRaid } from './bossRaid.response';
import { BossRaidInfo, EndBossRaid } from './bossRaid.request';
import { isUpdateState } from '../../common/typeorm/typeorm.function';
import { NotFoundRaidRecordException } from '../raidRecord/raidRecord.exception';
import { UpdateResult } from 'typeorm';
import { RaidScoreStore } from './bossRaid.store';

@Injectable()
export class BossRaidService {
  constructor(
    private readonly bossRaidRepository: BossRaidRepository,
    private readonly raidRecordRepository: RaidRecordRepository,
    private readonly raidScoreStore: RaidScoreStore,
  ) {}

  async getBossRaidState(): Promise<BossRaidState> {
    const raidRecord =
      await this.raidRecordRepository.getRaidRecordByBossRaid();
    const limitTime = await this.raidScoreStore.getLimitSeconds();

    if (raidRecord?.isProceedingState(limitTime)) {
      return new BossRaidState(raidRecord.userId);
    }

    return new BossRaidState();
  }

  async enterBossRaid({ level, userId }: BossRaidInfo): Promise<EnterBossRaid> {
    const raidRecord =
      await this.raidRecordRepository.getRaidRecordByBossRaid();
    const limitTime = await this.raidScoreStore.getLimitSeconds();

    if (raidRecord?.isProceedingState(limitTime)) {
      return new EnterBossRaid();
    }

    const score = await this.raidScoreStore.getScore(level);
    const newRaidRecord = await this.raidRecordRepository.save({
      score,
      userId,
    });

    const updateResult = await this.bossRaidRepository.update(
      {},
      { raidRecord: newRaidRecord },
    );

    if (!isUpdateState(updateResult)) {
      await this.bossRaidRepository.insert({ raidRecord: newRaidRecord });
    }

    return new EnterBossRaid(newRaidRecord.raidRecordId);
  }

  async endBossRaid({
    userId,
    raidRecordId,
  }: EndBossRaid): Promise<UpdateResult> {
    const updateResult = await this.raidRecordRepository.update(
      { userId, raidRecordId },
      { endTime: new Date() },
    );

    if (!isUpdateState(updateResult)) {
      throw new NotFoundRaidRecordException();
    }

    return updateResult;
  }
}
