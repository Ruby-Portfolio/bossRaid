import { registerDecorator, ValidationOptions } from 'class-validator';

export enum ValidationMessage {
  INVALID_ID = 'ID 값이 올바르지 않습니다.',
  INVALID_LEVEL = 'LEVEL 값이 올바르지 않습니다.',
}

/**
 * Id 검증 Validator
 * @param validationOptions
 */
export const IsId: Function = (
  validationOptions?: ValidationOptions,
): Function => {
  const isNumber: Function = (value): boolean => {
    return typeof value === 'number' && !isNaN(value);
  };

  return (object: Object, propertyName: string): void => {
    registerDecorator({
      name: 'isId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any): boolean | Promise<boolean> {
          if (isNumber(value)) {
            return value > 0;
          }

          return false;
        },
      },
    });
  };
};

/**
 * Level 검증 Validator
 * @param validationOptions
 */
export const IsLevel: Function = (
  validationOptions?: ValidationOptions,
): Function => {
  const isNumber: Function = (value): boolean => {
    return typeof value === 'number' && !isNaN(value);
  };

  return (object: Object, propertyName: string): void => {
    registerDecorator({
      name: 'isLevel',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any): boolean | Promise<boolean> {
          if (isNumber(value)) {
            return value >= 0;
          }

          return false;
        },
      },
    });
  };
};
