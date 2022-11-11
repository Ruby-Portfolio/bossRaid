import { Repository } from 'typeorm';
import { CustomRepository } from '../../module/typeOrm/customRepository.decorator';
import { RaidRecord } from './raidRecord.entity';

@CustomRepository(RaidRecord)
export class RaidRecordRepository extends Repository<RaidRecord> {}
