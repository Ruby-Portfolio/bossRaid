import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { BossRaid } from '../bossRaid/bossRaid.entity';

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

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToOne(() => BossRaid)
  bossRaid: BossRaid;

  isEndState(limitTime: number): boolean {
    if (this.endTime) {
      return true;
    }

    const now = new Date();
    return now.getTime() - this.enterTime.getTime() > limitTime;
  }
}
