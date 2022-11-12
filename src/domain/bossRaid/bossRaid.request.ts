import {
  IsId,
  IsLevel,
  ValidationMessage,
} from '../../common/validation/validation.decorator';

export class BossRaidInfo {
  @IsId({ message: ValidationMessage.INVALID_USER_ID })
  userId: number;
  @IsLevel({ message: ValidationMessage.INVALID_LEVEL })
  level: number;
}

export class EndBossRaid {
  @IsId({ message: ValidationMessage.INVALID_USER_ID })
  userId: number;
  @IsId({ message: ValidationMessage.INVALID_RAID_RECORD_ID })
  raidRecordId: number;
}
