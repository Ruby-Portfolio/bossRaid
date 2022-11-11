import { Repository } from 'typeorm';
import { CustomRepository } from '../../module/typeOrm/customRepository.decorator';
import { RaidRecord } from './raidRecord.entity';
import { BossRaid } from '../bossRaid/bossRaid.entity';

@CustomRepository(RaidRecord)
export class RaidRecordRepository extends Repository<RaidRecord> {
  async getRaidRecordByBossRaid(): Promise<RaidRecord> {
    return this.createQueryBuilder('raidRecord')
      .leftJoin(BossRaid, 'bossRaid', 'bossRaid.raidRecordId')
      .getOne();
  }
}
