import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { NotFoundRaidScoreInformationException } from './bossRaid.exception';

@Injectable()
export class RaidScoreStore {
  constructor(private readonly httpService: HttpService) {}

  private raidScore: {
    bossRaidLimitSeconds: number;
    levels: {
      level: number;
      score: number;
    }[];
  };

  async cachingRaidScore() {
    const { data } = await firstValueFrom(
      this.httpService.get(process.env.RAID_SCORE_URL).pipe(
        catchError(() => {
          throw new NotFoundRaidScoreInformationException();
        }),
      ),
    );

    this.raidScore = data?.bossRaids[0];
  }

  async getLimitTime() {
    if (!this.raidScore) {
      await this.cachingRaidScore();
    }

    return this.raidScore.bossRaidLimitSeconds * 1000;
  }

  async getScore(level: number) {
    if (!this.raidScore) {
      await this.cachingRaidScore();
    }

    const levelAndScore = this.raidScore.levels.find(
      (item) => item.level === level,
    );
    return levelAndScore.score;
  }

  async isRaidClear(enterTime: Date, endTime: Date) {
    const LimitSeconds = await this.getLimitTime();

    return endTime.getTime() - enterTime.getTime() <= LimitSeconds;
  }
}
