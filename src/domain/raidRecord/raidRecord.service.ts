import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { RaidRecordRepository } from './raidRecord.repository';
import { RaidRecord } from './raidRecord.entity';
import { NotFoundUserException } from '../user/user.exception';
import { UserRepository } from '../user/user.repository';
import { RankingInfo, RankList } from '../bossRaid/bossRaid.response';
import { User } from '../user/user.entity';
import { GetTopRankList } from '../bossRaid/bossRaid.request';
import { Cache } from 'cache-manager';

@Injectable()
export class RaidRecordService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly raidRecordRepository: RaidRecordRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getRaidRecordByUser(userId: number): Promise<RaidRecord[]> {
    const user: User = await this.userRepository.findOneBy({ userId });

    if (!user) {
      throw new NotFoundUserException();
    }

    return this.raidRecordRepository.findBy({ userId });
  }

  async getTopRankList({ userId }: GetTopRankList): Promise<RankList> {
    let myRankingInfo: RankingInfo = await this.cacheManager.get(
      userId.toString(),
    );
    let topRankerInfoList: RankingInfo[] = await this.cacheManager.get(
      process.env.TOP_RANK_KEY,
    );

    // 유저의 랭킹 정보가 캐시에 없다면 DB 에서 조회
    if (!myRankingInfo) {
      myRankingInfo = await this.raidRecordRepository.getRankRaidRecordByUserId(
        userId,
      );
      await this.cacheManager.set(userId.toString(), myRankingInfo);
    }

    // 탑랭크 기록 정보가 캐시에 없다면 DB 에서 조회
    if (!topRankerInfoList) {
      topRankerInfoList =
        await this.raidRecordRepository.getTopRankRaidRecord();
      await this.cacheManager.set(process.env.TOP_RANK_KEY, myRankingInfo);
    }

    return { myRankingInfo, topRankerInfoList };
  }
}
