import {
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateResult,
} from 'typeorm';
import { RaidRecord } from '../raidRecord/raidRecord.entity';

@Entity()
export class BossRaid {
  @PrimaryGeneratedColumn()
  bossRaidId: number;

  @OneToOne(() => RaidRecord, { nullable: true })
  @JoinColumn({ name: 'raidRecordId' })
  raidRecord: RaidRecord;

  static isUpdateResult(updateResult: UpdateResult) {
    return !!updateResult.affected;
  }
}
