import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class RaidRecord {
  @PrimaryGeneratedColumn()
  raidRecordId: number;

  @Column()
  score: number;

  @CreateDateColumn()
  enterTime: Date;

  @Column()
  endTime: Date;

  @ManyToOne(() => User, (user) => user.raidRecords)
  user: User;
}
