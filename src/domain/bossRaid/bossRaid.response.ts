export class BossRaidState {
  constructor(enteredUserId?: number | null) {
    this.canEnter = !enteredUserId;
    this.enteredUserId = enteredUserId;
  }

  canEnter: boolean;
  enteredUserId: number | null;
}

export class EnterBossRaid {
  constructor(raidRecordId?: number | null) {
    this.isEntered = !!raidRecordId;
    this.raidRecordId = raidRecordId;
  }

  isEntered: boolean;
  raidRecordId: number | null;
}

export class RankingInfo {
  ranking: number;
  userId: number;
  totalScore: number;
}

export class RankList {
  topRankerInfoList: RankingInfo[];
  myRankingInfo: RankingInfo;
}
