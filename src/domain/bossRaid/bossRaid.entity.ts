import { Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RaidRecord } from '../raidRecord/raidRecord.entity';

@Entity()
export class BossRaid {
  @PrimaryGeneratedColumn()
  bossRaidId: number;

  @OneToOne(() => RaidRecord)
  raidRecord: RaidRecord;
}
