import { Injectable } from '@nestjs/common';
import { RaidRecordRepository } from './raidRecord.repository';
import { RaidRecord } from './raidRecord.entity';
import { NotFoundUserException } from '../user/user.exception';
import { UserRepository } from '../user/user.repository';
import { RankingInfo, RankList } from '../bossRaid/bossRaid.response';
import { User } from '../user/user.entity';
import { GetTopRankList } from '../bossRaid/bossRaid.request';

@Injectable()
export class RaidRecordService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly raidRecordRepository: RaidRecordRepository,
  ) {}

  async getRaidRecordByUser(userId: number): Promise<RaidRecord[]> {
    const user: User = await this.userRepository.findOneBy({ userId });

    if (!user) {
      throw new NotFoundUserException();
    }

    return this.raidRecordRepository.findBy({ userId });
  }

  async getTopRankList({ userId }: GetTopRankList): Promise<RankList> {
    const myRankingInfo: RankingInfo =
      await this.raidRecordRepository.getRankRaidRecordByUserId(userId);

    const topRankerInfoList: RankingInfo[] =
      await this.raidRecordRepository.getTopRankRaidRecord();

    return { myRankingInfo, topRankerInfoList };
  }
}
