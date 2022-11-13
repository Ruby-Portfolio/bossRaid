import { Test, TestingModule } from '@nestjs/testing';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigModule } from '@nestjs/config';
import { UserRepository } from '../../../src/domain/user/user.repository';
import { CustomTypeOrmModule } from '../../../src/module/typeOrm/customTypeOrm.module';
import { User } from '../../../src/domain/user/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BossRaid } from '../../../src/domain/bossRaid/bossRaid.entity';
import { RaidRecord } from '../../../src/domain/raidRecord/raidRecord.entity';
import { RaidRecordRepository } from '../../../src/domain/raidRecord/raidRecord.repository';
import { BossRaidRepository } from '../../../src/domain/bossRaid/bossRaid.repository';
import * as request from 'supertest';
import { BossRaidModule } from '../../../src/domain/bossRaid/bossRaid.module';
import { testApp } from '../../testAppInit';
import { ValidationMessage } from '../../../src/common/validation/validation.decorator';
import { RaidRecordErrorMessage } from '../../../src/domain/raidRecord/raidRecord.exception';
import { RankingInfo } from '../../../src/domain/bossRaid/bossRaid.response';

describe('BossRaidController', () => {
  let app: NestFastifyApplication;
  let userRepository: UserRepository;
  let raidRecordRepository: RaidRecordRepository;
  let bossRaidRepository: BossRaidRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
          entities: [User, BossRaid, RaidRecord],
          synchronize: true,
          logging: true,
        }),
        BossRaidModule,
        CustomTypeOrmModule.forCustomRepository([
          UserRepository,
          RaidRecordRepository,
          BossRaidRepository,
        ]),
      ],
    }).compile();

    app = testApp(module);
    await app.init();

    userRepository = module.get<UserRepository>(UserRepository);
    raidRecordRepository =
      module.get<RaidRecordRepository>(RaidRecordRepository);
    bossRaidRepository = module.get<BossRaidRepository>(BossRaidRepository);
  });

  describe('GET /bossRaid - 보스레이드 상태 조회', () => {
    describe('보스레이드 시도 불가능', () => {
      let user: User;
      beforeAll(async () => {
        await bossRaidRepository.delete({});
        await raidRecordRepository.delete({});
        await userRepository.delete({});

        user = await userRepository.save({});

        const now = new Date();
        const raidRecord = await raidRecordRepository.save({
          score: 100,
          enterTime: new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            now.getHours(),
            now.getMinutes() - 2,
          ),
          userId: user.userId,
        });
        await bossRaidRepository.insert({
          raidRecord,
        });
      });

      test('진행중인 보스레이드가 제한시간을 초과하지 않았을 경우', async () => {
        const bossRaidState = await request(app.getHttpServer())
          .get(`/bossRaid`)
          .expect(200);

        expect(bossRaidState.body.canEnter).toBeFalsy();
        expect(bossRaidState.body.enteredUserId).toEqual(user.userId);
      });
    });

    describe('보스레이드 시도 가능', () => {
      describe('보스레이드가 진행중인 경우', () => {
        let user: User;
        beforeAll(async () => {
          await bossRaidRepository.delete({});
          await raidRecordRepository.delete({});
          await userRepository.delete({});

          user = await userRepository.save({});

          const now = new Date();
          const raidRecord = await raidRecordRepository.save({
            score: 100,
            enterTime: new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              now.getHours(),
              now.getMinutes() - 4,
            ),
            userId: user.userId,
          });
          await bossRaidRepository.insert({
            raidRecord,
          });
        });

        test('진행중인 보스레이드가 제한시간을 초과했을 경우', async () => {
          const bossRaidState = await request(app.getHttpServer())
            .get(`/bossRaid`)
            .expect(200);

          expect(bossRaidState.body.canEnter).toBeTruthy();
          expect(bossRaidState.body.enteredUserId).toEqual(undefined);
        });
      });

      describe('보스레이드가 진행중이 아닐 경우', () => {
        let user: User;

        beforeAll(async () => {
          await bossRaidRepository.delete({});
          await raidRecordRepository.delete({});
          await userRepository.delete({});

          user = await userRepository.save({});

          const now = new Date();
          const enterTime = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            now.getHours(),
            now.getMinutes() - 4,
          );

          const raidRecord = await raidRecordRepository.save({
            score: 100,
            enterTime,
            endTime: new Date(
              enterTime.getFullYear(),
              enterTime.getMonth(),
              enterTime.getDate(),
              enterTime.getHours(),
              now.getMinutes() - 2,
            ),
            userId: user.userId,
          });
          await bossRaidRepository.insert({
            raidRecord,
          });
        });

        test('보스레이드가 진행중이 아닐 경우 보스레이드 시도 가능', async () => {
          const bossRaidState = await request(app.getHttpServer())
            .get(`/bossRaid`)
            .expect(200);

          expect(bossRaidState.body.canEnter).toBeTruthy();
          expect(bossRaidState.body.enteredUserId).toEqual(undefined);
        });
      });
    });
  });

  describe('POST /bossRaid/enter - 보스레이드 시작', () => {
    describe('보스레이드 시작 불가능', () => {
      let newUser: User;
      beforeAll(async () => {
        await bossRaidRepository.delete({});
        await raidRecordRepository.delete({});
        await userRepository.delete({});

        const user = await userRepository.save({});

        const now = new Date();
        const enterTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getHours(),
          now.getMinutes() - 2,
        );

        const raidRecord = await raidRecordRepository.save({
          score: 100,
          enterTime,
          userId: user.userId,
        });
        await bossRaidRepository.insert({
          raidRecord,
        });

        newUser = await userRepository.save({});
      });

      test('요청에 필요한 값이 잘못된 경우 400 응답', async () => {
        const err = await request(app.getHttpServer())
          .post(`/bossRaid/enter`)
          .send({
            userId: 0,
            level: '레벨',
          })
          .expect(400);

        expect(err.body.message.length).toEqual(2);
        expect(err.body.message).toContain(ValidationMessage.INVALID_USER_ID);
        expect(err.body.message).toContain(ValidationMessage.INVALID_LEVEL);
      });
      test('다른 유저의 진행중인 보스레이드가 제한 시간을 초과하지 않은 경우 새 레이드 레코드를 생성하지 않고 200 응답', async () => {
        const res = await request(app.getHttpServer())
          .post(`/bossRaid/enter`)
          .send({
            userId: newUser.userId,
            level: 0,
          })
          .expect(200);

        expect(res.body.isEntered).toEqual(false);
        expect(res.body.raidRecordId).toEqual(undefined);
      });
    });

    describe('보스레이드 시작 가능', () => {
      describe('보스레이드가 생성되지 않은 경우', () => {
        let user: User;
        let newUser: User;
        beforeAll(async () => {
          await bossRaidRepository.delete({});
          await raidRecordRepository.delete({});
          await userRepository.delete({});

          user = await userRepository.save({});

          newUser = await userRepository.save({});
        });

        test('새 보스레이드 및 새 레이드 레코드를 생성하여 201 응답', async () => {
          const res = await request(app.getHttpServer())
            .post(`/bossRaid/enter`)
            .send({
              userId: newUser.userId,
              level: 0,
            })
            .expect(201);

          const bossRaids = await bossRaidRepository.find({});
          const raidRecord = await raidRecordRepository.find({});

          expect(res.body.isEntered).toEqual(true);
          expect(bossRaids.length).toEqual(1);
          expect(res.body.raidRecordId).toEqual(raidRecord[0].raidRecordId);
        });
      });

      describe('보스레이드가 생성되어 있는 경우', () => {
        describe('다른 유저의 진행중인 보스레이드가 없는 경우', () => {
          let user: User;
          let newUser: User;
          beforeAll(async () => {
            await bossRaidRepository.delete({});
            await raidRecordRepository.delete({});
            await userRepository.delete({});

            user = await userRepository.save({});

            newUser = await userRepository.save({});

            await bossRaidRepository.insert({});
          });

          test('다른 유저의 진행중인 보스레이드가 없는 경우 새 레이드 레코드를 생성하여 201 응답', async () => {
            const res = await request(app.getHttpServer())
              .post(`/bossRaid/enter`)
              .send({
                userId: newUser.userId,
                level: 0,
              })
              .expect(201);

            const raidRecord = await raidRecordRepository.find({});

            expect(res.body.isEntered).toEqual(true);
            expect(res.body.raidRecordId).toEqual(raidRecord[0].raidRecordId);
          });
        });

        describe('다른 유저의 진행중인 보스레이드가 제한 시간을 초과한 경우', () => {
          let user: User;
          let newUser: User;
          beforeAll(async () => {
            await bossRaidRepository.delete({});
            await raidRecordRepository.delete({});
            await userRepository.delete({});

            user = await userRepository.save({});
            newUser = await userRepository.save({});

            const now = new Date();
            const enterTime = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              now.getHours(),
              now.getMinutes() - 4,
            );

            const raidRecord = await raidRecordRepository.save({
              score: 100,
              enterTime,
              userId: user.userId,
            });
            await bossRaidRepository.insert({
              raidRecord,
            });
          });

          test('다른 유저의 진행중인 보스레이드가 제한 시간을 초과한 경우 새 레이드 레코드를 생성하여 201 응답', async () => {
            const res = await request(app.getHttpServer())
              .post(`/bossRaid/enter`)
              .send({
                userId: newUser.userId,
                level: 0,
              })
              .expect(201);

            const raidRecords = await raidRecordRepository
              .createQueryBuilder('raidRecord')
              .orderBy('raidRecordId', 'DESC')
              .getMany();

            expect(res.body.isEntered).toEqual(true);
            expect(res.body.raidRecordId).toEqual(raidRecords[0].raidRecordId);
          });
        });
      });
    });
  });

  describe('PATCH /bossRaid/end - 보스레이드 종료', () => {
    describe('보스레이드 종료 실패', () => {
      let user: User;
      let newUser: User;
      let raidRecord: RaidRecord;
      beforeAll(async () => {
        await bossRaidRepository.delete({});
        await raidRecordRepository.delete({});
        await userRepository.delete({});

        user = await userRepository.save({});
        newUser = await userRepository.save({});

        const now = new Date();
        const enterTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getHours(),
          now.getMinutes() - 2,
        );

        raidRecord = await raidRecordRepository.save({
          score: 100,
          enterTime,
          userId: user.userId,
        });
        await bossRaidRepository.insert({
          raidRecord,
        });
        await bossRaidRepository.insert({});
      });
      test('요청에 필요한 값이 잘못된 경우 400 응답', async () => {
        const err = await request(app.getHttpServer())
          .patch(`/bossRaid/end`)
          .send({
            userId: '?',
            raidRecordId: -1,
          })
          .expect(400);

        expect(err.body.message.length).toEqual(2);
        expect(err.body.message).toContain(ValidationMessage.INVALID_USER_ID);
        expect(err.body.message).toContain(
          ValidationMessage.INVALID_RAID_RECORD_ID,
        );
      });
      test('종료할 레이드 레코드가 존재하지 않을 경우 404 응답', async () => {
        const err = await request(app.getHttpServer())
          .patch(`/bossRaid/end`)
          .send({
            userId: user.userId,
            raidRecordId: raidRecord.raidRecordId + 99,
          })
          .expect(404);

        expect(err.body.message).toEqual(RaidRecordErrorMessage.NOT_FOUND);
      });

      test('유저에 해당하는 레이드 레코드가 존재하지 않을 경우 404 응답', async () => {
        const err = await request(app.getHttpServer())
          .patch(`/bossRaid/end`)
          .send({
            userId: newUser.userId,
            raidRecordId: raidRecord.raidRecordId,
          })
          .expect(404);

        expect(err.body.message).toEqual(RaidRecordErrorMessage.NOT_FOUND);
      });
    });

    describe('보스레이드 종료 성공', () => {
      let user: User;
      let raidRecord: RaidRecord;
      beforeAll(async () => {
        await bossRaidRepository.delete({});
        await raidRecordRepository.delete({});
        await userRepository.delete({});

        user = await userRepository.save({});

        const now = new Date();
        const enterTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getHours(),
          now.getMinutes() - 2,
        );

        raidRecord = await raidRecordRepository.save({
          score: 100,
          enterTime,
          userId: user.userId,
        });
        await bossRaidRepository.insert({
          raidRecord,
        });
      });
      test('레이드 레코드에 종료 시간을 업데이트 후 200 응답', async () => {
        await request(app.getHttpServer())
          .patch(`/bossRaid/end`)
          .send({
            userId: user.userId,
            raidRecordId: raidRecord.raidRecordId,
          })
          .expect(200);

        const endRaidRecord = await raidRecordRepository.findOneBy({
          raidRecordId: raidRecord.raidRecordId,
        });

        expect(endRaidRecord.endTime).toBeTruthy();
      });
    });
  });

  describe('GET /bossRaid/topRankerList - 보스레이드 랭킹 조회', () => {
    let user: User;
    beforeAll(async () => {
      await bossRaidRepository.delete({});
      await raidRecordRepository.delete({});
      await userRepository.delete({});

      const now = new Date();
      const enterTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        now.getMinutes() - 2,
      );

      for (let i = 0; i < 15; i++) {
        const otherUser = await userRepository.save({});
        if (i === 10) {
          user = otherUser;
        }
        for (let j = 0; j < 10; j++) {
          await raidRecordRepository.save({
            score: i * j * 100,
            enterTime,
            endTime: new Date(),
            user: otherUser,
          });
        }
      }
    });

    describe('랭킹 조회 실패', () => {
      test('요청에 필요한 값이 잘못된 경우 400 응답', async () => {
        const err = await request(app.getHttpServer())
          .get(`/bossRaid/topRankerList`)
          .send({
            userId: 0,
          })
          .expect(400);

        expect(err.body.message[0]).toEqual(ValidationMessage.INVALID_USER_ID);
      });
    });

    describe('랭킹 조회 성공', () => {
      test('유저의 개인 기록 및 topRank 기록 목록 조회 성공시 200 응답', async () => {
        const res = await request(app.getHttpServer())
          .get(`/bossRaid/topRankerList`)
          .send({
            userId: user.userId,
          })
          .expect(200);

        const myRankingInfo: RankingInfo = res.body.myRankingInfo;
        const topRankerInfoList: RankingInfo[] = res.body.topRankerInfoList;

        expect(myRankingInfo.ranking).toEqual(4);
        expect(
          topRankerInfoList.every((rankingInfo) => {
            return rankingInfo.ranking < 10;
          }),
        ).toBeTruthy();
        expect(
          topRankerInfoList.every((rankingInfo, idx) => {
            if (++idx === topRankerInfoList.length) {
              return true;
            }
            return rankingInfo.ranking <= topRankerInfoList[idx].ranking;
          }),
        ).toBeTruthy();
        expect(
          topRankerInfoList.every((rankingInfo, idx) => {
            if (++idx === topRankerInfoList.length) {
              return true;
            }
            return rankingInfo.totalScore >= topRankerInfoList[idx].totalScore;
          }),
        ).toBeTruthy();
      });
    });
  });
});
