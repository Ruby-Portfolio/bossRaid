import { RaidRecord } from '../raidRecord/raidRecord.entity';

export class UserInfo {
  constructor(private readonly raidRecords: RaidRecord[]) {
    this.totalScore = raidRecords
      .map((raidRecord) => raidRecord.score)
      .reduce((sum: number, score: number) => sum + score, 0);
    this.bossRaidHistory = raidRecords.map((raidRecord) => {
      const enterTime = raidRecord.enterTime?.toLocaleTimeString();
      const endTime = raidRecord.endTime?.toLocaleTimeString();
      return { ...raidRecord, enterTime, endTime };
    });
  }

  totalScore: number;
  bossRaidHistory: {
    raidRecordId: number;
    score: number;
    enterTime: string;
    endTime: string;
  }[];
}
