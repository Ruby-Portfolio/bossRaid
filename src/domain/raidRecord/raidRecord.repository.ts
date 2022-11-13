import { Repository } from 'typeorm';
import { CustomRepository } from '../../module/typeOrm/customRepository.decorator';
import { RaidRecord } from './raidRecord.entity';
import { BossRaid } from '../bossRaid/bossRaid.entity';
import { RankingInfo } from '../bossRaid/bossRaid.response';

@CustomRepository(RaidRecord)
export class RaidRecordRepository extends Repository<RaidRecord> {
  private readonly TOP_RANK: number = 10;

  async getRaidRecordByBossRaid(): Promise<RaidRecord> {
    return this.createQueryBuilder('raidRecord')
      .leftJoin(
        BossRaid,
        'bossRaid',
        'bossRaid.raidRecordId = raidRecord.raidRecordId',
      )
      .where('bossRaid.bossRaidId is NOT NULL')
      .getOne();
  }

  async getRankRaidRecordByUserId(userId: number): Promise<RankingInfo> {
    const rankingInfo = await this.manager
      .createQueryBuilder()
      .select('rankRaidRecord.*')
      .from((subQuery) => {
        return subQuery
          .select([
            'raidRecord.userId as userId',
            'SUM(raidRecord.score) as totalScore',
            '(rank() over (order by SUM(raidRecord.score) desc) - 1) as ranking',
          ])
          .from(RaidRecord, 'raidRecord')
          .groupBy('raidRecord.userId');
      }, 'rankRaidRecord')
      .where('rankRaidRecord.userId = :userId', { userId })
      .getRawOne();

    if (!rankingInfo) {
      return rankingInfo;
    }

    return {
      userId: +rankingInfo.userId,
      ranking: +rankingInfo.ranking,
      totalScore: +rankingInfo.totalScore,
    };
  }

  async getTopRankRaidRecord(): Promise<RankingInfo[]> {
    return this.manager
      .createQueryBuilder()
      .select('rankRaidRecord.*')
      .from((subQuery) => {
        return subQuery
          .select([
            'raidRecord.userId as userId',
            'SUM(raidRecord.score) as totalScore',
            '(rank() over (order by totalScore desc) - 1) as ranking',
          ])
          .from(RaidRecord, 'raidRecord')
          .groupBy('raidRecord.userId');
      }, 'rankRaidRecord')
      .where('rankRaidRecord.ranking < :topRank', { topRank: this.TOP_RANK })
      .getRawMany();
  }
}
