import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { BossRaidRepository } from './bossRaid.repository';
import { RaidRecordRepository } from '../raidRecord/raidRecord.repository';
import { BossRaidState, EnterBossRaid, RankingInfo } from './bossRaid.response';
import { BossRaidInfo, EndBossRaid } from './bossRaid.request';
import { isUpdateState } from '../../common/typeorm/typeorm.function';
import { NotFoundRaidRecordException } from '../raidRecord/raidRecord.exception';
import { UpdateResult } from 'typeorm';
import { RaidScoreStore } from './bossRaid.store';
import { FailBossRaidException } from './bossRaid.exception';
import { Cache } from 'cache-manager';

@Injectable()
export class BossRaidService {
  constructor(
    private readonly bossRaidRepository: BossRaidRepository,
    private readonly raidRecordRepository: RaidRecordRepository,
    private readonly raidScoreStore: RaidScoreStore,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getBossRaidState(): Promise<BossRaidState> {
    const raidRecord =
      await this.raidRecordRepository.getRaidRecordByBossRaid();
    const limitTime = await this.raidScoreStore.getLimitTime();

    // 진행중인 보스레이드가 있다면 제한시간이 초과되지 않았는지 확인
    if (raidRecord?.isProceedingState(limitTime)) {
      return new BossRaidState(raidRecord.userId);
    }

    return new BossRaidState();
  }

  async enterBossRaid({ level, userId }: BossRaidInfo): Promise<EnterBossRaid> {
    const raidRecord =
      await this.raidRecordRepository.getRaidRecordByBossRaid();
    const limitTime = await this.raidScoreStore.getLimitTime();

    // 진행중인 보스레이드가 있다면 제한시간이 초과되지 않았는지 확인
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
    const endTime = new Date();
    const raidRecord = await this.raidRecordRepository.findOneBy({
      raidRecordId,
      userId,
    });

    if (!raidRecord) {
      throw new NotFoundRaidRecordException();
    }

    const enterTime = raidRecord.enterTime;
    const isClear = await this.raidScoreStore.isRaidClear(enterTime, endTime);

    if (!isClear) {
      throw new FailBossRaidException();
    }

    const updateResult = await this.raidRecordRepository.update(
      { userId, raidRecordId },
      { endTime },
    );

    const myRankingInfo: RankingInfo =
      await this.raidRecordRepository.getRankRaidRecordByUserId(userId);
    const topRankerInfoList: RankingInfo[] =
      await this.raidRecordRepository.getTopRankRaidRecord();

    // 업데이트 된 유저와 탑랭크 기록을 캐시에 저장
    await this.cacheManager.set(userId.toString(), myRankingInfo);
    await this.cacheManager.set(process.env.TOP_RANK_KEY, topRankerInfoList);

    return updateResult;
  }
}
