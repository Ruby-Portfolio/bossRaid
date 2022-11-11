import { Repository } from 'typeorm';
import { CustomRepository } from '../../module/typeOrm/customRepository.decorator';
import { BossRaid } from './bossRaid.entity';

@CustomRepository(BossRaid)
export class BossRaidRepository extends Repository<BossRaid> {}
