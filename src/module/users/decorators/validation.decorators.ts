import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  USER_REGEX_PATTERNS,
  USER_VALIDATION_CONSTANTS,
  USER_VALIDATION_MESSAGES,
} from '../constants/validation.constants';

/**
 * Custom decorator for full name validation
 */
export function IsFullName() {
  return applyDecorators(
    ApiProperty({
      description: 'Full name of the user',
      example: 'John Doe',
      minLength: USER_VALIDATION_CONSTANTS.FULL_NAME.MIN_LENGTH,
      maxLength: USER_VALIDATION_CONSTANTS.FULL_NAME.MAX_LENGTH,
    }),
    IsNotEmpty({ message: USER_VALIDATION_MESSAGES.FULL_NAME.REQUIRED }),
    IsString({ message: USER_VALIDATION_MESSAGES.FULL_NAME.STRING }),
    MinLength(USER_VALIDATION_CONSTANTS.FULL_NAME.MIN_LENGTH, {
      message: USER_VALIDATION_MESSAGES.FULL_NAME.MIN_LENGTH,
    }),
    MaxLength(USER_VALIDATION_CONSTANTS.FULL_NAME.MAX_LENGTH, {
      message: USER_VALIDATION_MESSAGES.FULL_NAME.MAX_LENGTH,
    }),
  );
}

/**
 * Custom decorator for email validation
 */
export function IsUserEmail() {
  return applyDecorators(
    ApiProperty({
      description: 'Email address of the user',
      example: 'john.doe@example.com',
      format: 'email',
      maxLength: USER_VALIDATION_CONSTANTS.EMAIL.MAX_LENGTH,
    }),
    IsNotEmpty({ message: USER_VALIDATION_MESSAGES.EMAIL.REQUIRED }),
    IsEmail({}, { message: USER_VALIDATION_MESSAGES.EMAIL.INVALID }),
    MaxLength(USER_VALIDATION_CONSTANTS.EMAIL.MAX_LENGTH, {
      message: USER_VALIDATION_MESSAGES.EMAIL.MAX_LENGTH,
    }),
  );
}

/**
 * Custom decorator for password validation
 */
export function IsUserPassword() {
  return applyDecorators(
    ApiProperty({
      description: 'Password for the user account',
      example: 'SecurePassword123!',
      minLength: USER_VALIDATION_CONSTANTS.PASSWORD.MIN_LENGTH,
      maxLength: USER_VALIDATION_CONSTANTS.PASSWORD.MAX_LENGTH,
      format: 'password',
    }),
    IsNotEmpty({ message: USER_VALIDATION_MESSAGES.PASSWORD.REQUIRED }),
    IsString({ message: USER_VALIDATION_MESSAGES.PASSWORD.STRING }),
    MinLength(USER_VALIDATION_CONSTANTS.PASSWORD.MIN_LENGTH, {
      message: USER_VALIDATION_MESSAGES.PASSWORD.MIN_LENGTH,
    }),
    MaxLength(USER_VALIDATION_CONSTANTS.PASSWORD.MAX_LENGTH, {
      message: USER_VALIDATION_MESSAGES.PASSWORD.MAX_LENGTH,
    }),
    Matches(USER_REGEX_PATTERNS.PASSWORD, {
      message: USER_VALIDATION_MESSAGES.PASSWORD.PATTERN,
    }),
  );
}

/**
 * Custom decorator for optional phone number validation
 */
export function IsOptionalPhone() {
  return applyDecorators(
    ApiProperty({
      description: 'Phone number of the user',
      example: '+1234567890',
      required: false,
      pattern: USER_REGEX_PATTERNS.PHONE.source,
    }),
    IsOptional(),
    IsString({ message: USER_VALIDATION_MESSAGES.PHONE.STRING }),
    Matches(USER_REGEX_PATTERNS.PHONE, {
      message: USER_VALIDATION_MESSAGES.PHONE.PATTERN,
    }),
  );
}
