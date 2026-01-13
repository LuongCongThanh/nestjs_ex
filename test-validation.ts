import { validate } from 'class-validator';
import { IsPhoneNumber } from './src/common/decorators/is-phone-number.decorator';
import { IsSlug } from './src/common/decorators/is-slug.decorator';
import { IsStrongPassword } from './src/common/decorators/is-strong-password.decorator';

class TestDto {
  @IsStrongPassword()
  password: string;

  @IsPhoneNumber('VN')
  phone: string;

  @IsSlug()
  slug: string;
}

async function testValidation() {
  console.log('🧪 Testing Custom Validation Decorators...\n');

  // Test 1: Valid data
  console.log('✅ Test 1: Valid data');
  const valid = new TestDto();
  valid.password = 'SecurePass123!';
  valid.phone = '0912345678';
  valid.slug = 'my-product-slug';

  const validErrors = await validate(valid);
  console.log('Errors:', validErrors.length === 0 ? 'None ✅' : validErrors);

  // Test 2: Invalid password (no special char)
  console.log('\n❌ Test 2: Invalid password (no special char)');
  const invalidPass = new TestDto();
  invalidPass.password = 'SecurePass123';
  invalidPass.phone = '0912345678';
  invalidPass.slug = 'valid-slug';

  const passErrors = await validate(invalidPass);
  console.log(
    'Errors:',
    passErrors.length > 0
      ? '❌ Validation failed as expected'
      : 'Unexpected success',
  );

  // Test 3: Invalid phone
  console.log('\n❌ Test 3: Invalid Vietnam phone');
  const invalidPhone = new TestDto();
  invalidPhone.password = 'SecurePass123!';
  invalidPhone.phone = '1234567890';
  invalidPhone.slug = 'valid-slug';

  const phoneErrors = await validate(invalidPhone);
  console.log(
    'Errors:',
    phoneErrors.length > 0
      ? '❌ Validation failed as expected'
      : 'Unexpected success',
  );

  // Test 4: Invalid slug (uppercase)
  console.log('\n❌ Test 4: Invalid slug (uppercase)');
  const invalidSlug = new TestDto();
  invalidSlug.password = 'SecurePass123!';
  invalidSlug.phone = '0912345678';
  invalidSlug.slug = 'Invalid-Slug';

  const slugErrors = await validate(invalidSlug);
  console.log(
    'Errors:',
    slugErrors.length > 0
      ? '❌ Validation failed as expected'
      : 'Unexpected success',
  );

  console.log('\n🎉 All validation tests completed!');
}

testValidation().catch(console.error);
