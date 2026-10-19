import 'dotenv/config';
import { randomInt } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { PrismaClient, type User } from 'generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

// ---------- Данные ----------

const tags = [
  { slug: 'romance', name: 'Romance' },
  { slug: 'loneliness', name: 'Loneliness' },
  { slug: 'nature', name: 'Nature' },
  { slug: 'philosophy', name: 'Philosophy' },
  { slug: 'nostalgia', name: 'Nostalgia' },
  { slug: 'war', name: 'War' },
  { slug: 'city', name: 'City' },
];

const users = [
  { username: 'mira', email: 'mira@test.dev', displayName: 'Мира Вале', bio: 'Пишу о доме и тех, кто в нём был.' },
  { username: 'eli', email: 'eli@test.dev', displayName: 'Эли Браун', bio: 'Дороги, радио, ночные заправки.' },
  { username: 'hana', email: 'hana@test.dev', displayName: 'Хана Соррель', bio: 'Хайку по утрам.' },
  // displayName нет — проверяем, что на карточке покажется username
  { username: 'tomas', email: 'tomas@test.dev', displayName: null, bio: null },
];

type SeedPoem = {
  title: string;
  content: string;
  author: string;
  tags: string[];
  status: 'PUBLISHED' | 'DRAFT';
  daysAgo: number;
};

const poems: SeedPoem[] = [
  {
    title: 'Лампа в коридоре',
    author: 'mira',
    tags: ['loneliness', 'nostalgia'],
    status: 'PUBLISHED',
    daysAgo: 3,
    content: `Ты оставил одну лампу —
она горит до утра,
как маленький жёлтый зверь,
что стережёт коридор.
Я не гашу её. Пусть ждёт
вместе со мной.`,
  },
  {
    title: 'Рецепт долгой дороги',
    author: 'eli',
    tags: ['romance', 'philosophy'],
    status: 'PUBLISHED',
    daysAgo: 5,
    content: `Возьми одно шоссе, слегка посоли. Добавь радио, которое спорит с погодой. Мешай, пока город за спиной не станет точкой, а ты — тем, кем был до всех адресов.`,
  },
  {
    title: 'Мотыльки у окна',
    author: 'hana',
    tags: ['nature', 'loneliness'],
    status: 'PUBLISHED',
    daysAgo: 6,
    content: `всю ночь мягкие
кулачки мотыльков —
кто-то просится в дом`,
  },
  {
    title: 'Ночная смена',
    author: 'eli',
    tags: ['city'],
    status: 'PUBLISHED',
    daysAgo: 1,
    content: `Хвала тем, кто держит город открытым,
когда остальные уже уснули:
водителям, медсёстрам, пекарям,
всем, чьё утро начинается в полночь.`,
  },
  {
    title: 'Кухонный псалом',
    author: 'mira',
    tags: ['nostalgia'],
    status: 'PUBLISHED',
    daysAgo: 8,
    content: `Благословен лук, терпеливый в ящике.
Благословенна сковорода,
что хранит нашу историю в масле.
Благословен стол — на нём всё ещё
хватает места для всех.`,
  },
  {
    title: 'Письма с ветром',
    author: 'tomas',
    tags: ['nostalgia', 'loneliness'],
    status: 'PUBLISHED',
    daysAgo: 10,
    content: `Ветер приносит чужую пыль
и просит её перевести
на язык, который простила бы мама.
Я пробую. Выходит только
её имя.`,
  },
  {
    title: 'Сад после дождя',
    author: 'hana',
    tags: ['nature'],
    status: 'PUBLISHED',
    daysAgo: 0,
    content: `после дождя
каждый лист держит
своё маленькое небо`,
  },
  {
    title: 'Остановка',
    author: 'tomas',
    tags: ['city', 'romance'],
    status: 'PUBLISHED',
    daysAgo: 14,
    content: `Мы ждали один автобус
и сели в разные.
С тех пор я всегда
смотрю в окна встречных.`,
  },
  // Проверка обрезки: длинный заголовок, длинный текст, все теги сразу
  {
    title: 'Очень длинное название стихотворения, которое не должно ломать карточку',
    author: 'mira',
    tags: tags.map((t) => t.slug),
    status: 'PUBLISHED',
    daysAgo: 2,
    content: Array.from({ length: 30 }, (_, i) => `Строка ${i + 1}: проверяем, что текст обрезается`).join('\n'),
  },
  // Черновик — НЕ должен появиться в ленте
  {
    title: 'Черновик (не должен быть виден)',
    author: 'mira',
    tags: ['philosophy'],
    status: 'DRAFT',
    daysAgo: 0,
    content: 'Если вы видите это на главной — фильтр по статусу не работает.',
  },
];

const commentPool = [
  'Последняя строка — как удар.',
  'Перечитала три раза.',
  'Очень тихо и очень точно.',
  'Хочу продолжение!',
  'Это про меня.',
];

// ---------- Заполнение ----------

async function seedTags() {
  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name },
      create: tag,
    });
  }
  const all = await prisma.tag.findMany({ where: { slug: { in: tags.map((t) => t.slug) } } });
  return new Map(all.map((t) => [t.slug, t]));
}

async function seedUsers() {
  const passwordHash = await argon2.hash('password123');
  const created:User[] = [];
  for (const u of users) {
    created.push(
      await prisma.user.upsert({
        where: { email: u.email },
        update: { displayName: u.displayName, bio: u.bio, passwordHash },
        create: { ...u, passwordHash },
      }),
    );
  }
  return created;
}

async function main() {
  console.log('Теги...');
  const tagBySlug = await seedTags();

  console.log('Тестовые пользователи...');
  const seedUsersList = await seedUsers();
  const userByName = new Map(seedUsersList.map((u) => [u.username, u]));

  console.log('Удаляем старые стихи тестовых пользователей...');
  await prisma.poem.deleteMany({
    where: { authorId: { in: seedUsersList.map((u) => u.id) } },
  });

  console.log('Стихи, лайки, комментарии...');
  for (const p of poems) {
    const author = userByName.get(p.author)!;
    const isPublished = p.status === 'PUBLISHED';

    const poem = await prisma.poem.create({
      data: {
        title: p.title,
        content: p.content,
        status: p.status,
        viewCount: isPublished ? randomInt(20, 500) : 0,
        publishedAt: isPublished ? daysAgo(p.daysAgo) : null,
        createdAt: daysAgo(p.daysAgo + 1),
        authorId: author.id,
        tags: {
          create: p.tags.map((slug) => ({ tagId: tagBySlug.get(slug)!.id })),
        },
      },
    });

    if (!isPublished) continue;

    const others = seedUsersList.filter((u) => u.id !== author.id);

    // Лайки: каждый другой пользователь лайкает с вероятностью ~60%
    const likers = others.filter(() => Math.random() < 0.6);
    await prisma.like.createMany({
      data: likers.map((u) => ({ poemId: poem.id, userId: u.id })),
    });

    // Комментарии: 0–3 штуки
    const commentCount = randomInt(0, 4);
    for (let i = 0; i < commentCount; i++) {
      await prisma.comment.create({
        data: {
          content: commentPool[randomInt(0, commentPool.length)],
          authorId: others[randomInt(0, others.length)].id,
          poemId: poem.id,
        },
      });
    }
  }

  console.log('Подписки...');
  const mira = userByName.get('mira')!;
  await prisma.follow.createMany({
    data: seedUsersList
      .filter((u) => u.id !== mira.id)
      .map((u) => ({ followerId: u.id, followingId: mira.id })),
    skipDuplicates: true,
  });

  console.log('Готово! Вход: mira@test.dev / password123 (и eli, hana, tomas)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());