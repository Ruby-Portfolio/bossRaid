import {
  IsId,
  IsLevel,
  ValidationMessage,
} from '../../common/validation/validation.decorator';

export class BossRaidInfo {
  @IsId({ message: ValidationMessage.INVALID_ID })
  userId: number;
  @IsLevel({ message: ValidationMessage.INVALID_LEVEL })
  level: number;
}
