import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
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

  @Column({ nullable: true })
  endTime: Date;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  isProceedingState(limitTime: number): boolean {
    if (this.endTime) {
      return false;
    }

    const now = new Date();
    return now.getTime() - this.enterTime.getTime() < limitTime;
  }
}
