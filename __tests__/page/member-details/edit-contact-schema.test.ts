import { buildEditContactSchema } from '@/components/page/member-details/ContactDetails/components/EditContactForm/formSchema';

async function errorFor(schema: ReturnType<typeof buildEditContactSchema>, field: string, value: unknown) {
  try {
    await schema.validateAt(field, { [field]: value });
    return null;
  } catch (error) {
    return (error as { message: string }).message;
  }
}

const optionalLinkedin = buildEditContactSchema(false);
const requiredLinkedin = buildEditContactSchema(true);

describe('buildEditContactSchema', () => {
  it('applies the same shared shapes as the team form', async () => {
    await expect(errorFor(optionalLinkedin, 'github', 'username')).resolves.toBeNull();
    await expect(errorFor(optionalLinkedin, 'twitter', '@protocollabs')).resolves.toBeNull();
    await expect(errorFor(optionalLinkedin, 'bluesky', 'https://bsky.app/profile/protocol.ai')).resolves.toBeNull();

    await expect(errorFor(optionalLinkedin, 'github', '@username')).resolves.toMatch(/without the "@"/);
    await expect(errorFor(optionalLinkedin, 'telegram', 'username')).resolves.toMatch(/starting with "@"/);
    await expect(errorFor(optionalLinkedin, 'bluesky', 'https://example.com/x')).resolves.toMatch(/Bluesky URL/);
  });

  it('makes LinkedIn required only when the form asks for it', async () => {
    await expect(errorFor(optionalLinkedin, 'linkedin', '')).resolves.toBeNull();
    await expect(errorFor(requiredLinkedin, 'linkedin', '')).resolves.toMatch(/LinkedIn is required/);
    await expect(errorFor(requiredLinkedin, 'linkedin', 'johndoe')).resolves.toBeNull();
  });

  it('leaves discord and email unvalidated, as before', async () => {
    await expect(errorFor(optionalLinkedin, 'discord', 'name#1234')).resolves.toBeNull();
    await expect(errorFor(optionalLinkedin, 'email', 'anything at all')).resolves.toBeNull();
  });

  it('keeps the share-contacts toggle a boolean', async () => {
    await expect(errorFor(optionalLinkedin, 'shareContacts', true)).resolves.toBeNull();
  });
});
