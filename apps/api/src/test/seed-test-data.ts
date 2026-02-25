import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '@epde/shared';
import { PrismaService } from '../prisma/prisma.service';

export interface TestData {
  admin: { id: string; email: string; password: string };
  client: { id: string; email: string; password: string };
  invited: { id: string; email: string };
  property: { id: string };
  category: { id: string };
}

export async function seedTestData(prisma: PrismaService): Promise<TestData> {
  const password = 'Test1234!';
  const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      name: 'Admin Test',
      passwordHash: hash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const client = await prisma.user.create({
    data: {
      email: 'client@test.com',
      name: 'Client Test',
      passwordHash: hash,
      role: 'CLIENT',
      status: 'ACTIVE',
    },
  });

  const invited = await prisma.user.create({
    data: {
      email: 'invited@test.com',
      name: 'Invited User',
      role: 'CLIENT',
      status: 'INVITED',
    },
  });

  const property = await prisma.property.create({
    data: {
      userId: client.id,
      address: 'Av. Test 123',
      city: 'Buenos Aires',
      type: 'HOUSE',
    },
  });

  const category = await prisma.category.create({
    data: {
      name: 'Test Category',
      description: 'Category for testing',
    },
  });

  return {
    admin: { id: admin.id, email: admin.email, password },
    client: { id: client.id, email: client.email, password },
    invited: { id: invited.id, email: invited.email },
    property: { id: property.id },
    category: { id: category.id },
  };
}
