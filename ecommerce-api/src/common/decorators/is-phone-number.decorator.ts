import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsPhoneNumber(
  countryCode: string = 'VN',
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [countryCode],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          const country = args.constraints[0];

          // Remove all non-digit characters
          const cleaned = value.replace(/\D/g, '');

          // Vietnam phone number validation
          if (country === 'VN') {
            // Must be 10 digits and start with 0
            if (!/^0\d{9}$/.test(cleaned)) return false;

            // Valid prefixes for Vietnam mobile numbers
            const validPrefixes = [
              '03',
              '05',
              '07',
              '08',
              '09', // Old format
              '032',
              '033',
              '034',
              '035',
              '036',
              '037',
              '038',
              '039', // Viettel
              '052',
              '056',
              '058',
              '059', // Vietnamobile
              '070',
              '076',
              '077',
              '078',
              '079', // Mobifone
              '081',
              '082',
              '083',
              '084',
              '085',
              '088', // Vinaphone
              '086',
              '096',
              '097',
              '098',
              '089', // Mobifone
            ];

            return validPrefixes.some((prefix) => cleaned.startsWith(prefix));
          }

          // Default: basic international format
          // Must be between 8-15 digits
          return cleaned.length >= 8 && cleaned.length <= 15;
        },
        defaultMessage(args: ValidationArguments) {
          const country = args.constraints[0];
          if (country === 'VN') {
            return 'Phone number must be a valid Vietnamese phone number (e.g., 0912345678)';
          }
          return 'Phone number must be a valid phone number';
        },
      },
    });
  };
}
