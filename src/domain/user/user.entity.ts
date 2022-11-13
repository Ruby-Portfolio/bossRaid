import { Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RaidRecord } from '../raidRecord/raidRecord.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  userId: number;

  @OneToMany(() => RaidRecord, (raidRecord) => raidRecord.user)
  raidRecords: RaidRecord[];
}
