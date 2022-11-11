export class BossRaidState {
  constructor(canEnter: boolean = true, enteredUserId?: number | null) {
    this.canEnter = canEnter;
    this.enteredUserId = canEnter ? null : enteredUserId;
  }

  canEnter: boolean;
  enteredUserId: number | null;
}
