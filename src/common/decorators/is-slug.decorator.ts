import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsSlug(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSlug',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          // Slug format: lowercase letters, numbers, and hyphens only
          // Cannot start or end with hyphen
          // Cannot have consecutive hyphens
          const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

          return slugRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'Slug must contain only lowercase letters, numbers, and hyphens (cannot start/end with hyphen or have consecutive hyphens)';
        },
      },
    });
  };
}
