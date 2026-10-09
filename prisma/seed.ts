import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const stacks = [
  { slug: 'backend', name: 'Backend' },
  { slug: 'frontend', name: 'Frontend' },
  { slug: 'fullstack', name: 'Fullstack' },
  { slug: 'mobile', name: 'Mobile' },
  { slug: 'data', name: 'Dados & IA' },
];

const frameworks = [
  {
    slug: 'nestjs',
    name: 'NestJS',
    language: 'TypeScript',
    stacks: ['backend'],
  },
  {
    slug: 'express',
    name: 'Express',
    language: 'JavaScript/TypeScript',
    stacks: ['backend'],
  },
  {
    slug: 'spring-boot',
    name: 'Spring Boot',
    language: 'Java',
    stacks: ['backend'],
  },
  {
    slug: 'fastapi',
    name: 'FastAPI',
    language: 'Python',
    stacks: ['backend', 'data'],
  },
  {
    slug: 'django',
    name: 'Django',
    language: 'Python',
    stacks: ['backend', 'fullstack'],
  },
  {
    slug: 'laravel',
    name: 'Laravel',
    language: 'PHP',
    stacks: ['backend', 'fullstack'],
  },
  {
    slug: 'aspnet-core',
    name: 'ASP.NET Core',
    language: 'C#',
    stacks: ['backend'],
  },
  {
    slug: 'rails',
    name: 'Ruby on Rails',
    language: 'Ruby',
    stacks: ['backend', 'fullstack'],
  },
  { slug: 'gin', name: 'Gin', language: 'Go', stacks: ['backend'] },
  {
    slug: 'react',
    name: 'React',
    language: 'TypeScript',
    stacks: ['frontend'],
  },
  { slug: 'vue', name: 'Vue', language: 'TypeScript', stacks: ['frontend'] },
  {
    slug: 'angular',
    name: 'Angular',
    language: 'TypeScript',
    stacks: ['frontend'],
  },
  {
    slug: 'svelte',
    name: 'Svelte',
    language: 'TypeScript',
    stacks: ['frontend'],
  },
  {
    slug: 'nextjs',
    name: 'Next.js',
    language: 'TypeScript',
    stacks: ['frontend', 'fullstack'],
  },
  {
    slug: 'nuxt',
    name: 'Nuxt',
    language: 'TypeScript',
    stacks: ['frontend', 'fullstack'],
  },
  {
    slug: 'sveltekit',
    name: 'SvelteKit',
    language: 'TypeScript',
    stacks: ['fullstack'],
  },
  {
    slug: 'react-native',
    name: 'React Native',
    language: 'TypeScript',
    stacks: ['mobile'],
  },
  { slug: 'flutter', name: 'Flutter', language: 'Dart', stacks: ['mobile'] },
  {
    slug: 'jetpack-compose',
    name: 'Jetpack Compose',
    language: 'Kotlin',
    stacks: ['mobile'],
  },
  { slug: 'swiftui', name: 'SwiftUI', language: 'Swift', stacks: ['mobile'] },
  { slug: 'pandas', name: 'Pandas', language: 'Python', stacks: ['data'] },
  { slug: 'pytorch', name: 'PyTorch', language: 'Python', stacks: ['data'] },
  {
    slug: 'langchain',
    name: 'LangChain',
    language: 'Python',
    stacks: ['data'],
  },
];

async function main() {
  for (const stack of stacks) {
    await prisma.stack.upsert({
      where: { slug: stack.slug },
      update: { name: stack.name },
      create: stack,
    });
  }

  for (const { stacks: stackSlugs, ...framework } of frameworks) {
    const connect = stackSlugs.map((slug) => ({ slug }));
    await prisma.framework.upsert({
      where: { slug: framework.slug },
      update: { ...framework, stacks: { set: connect } },
      create: { ...framework, stacks: { connect } },
    });
  }

  console.log(
    `Seeded ${stacks.length} stacks and ${frameworks.length} frameworks`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
