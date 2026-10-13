import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "generated/prisma/client";

const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL})
const prisma = new PrismaClient({adapter});

const  tags = [
  { slug: 'romance', name: 'Романтика' },
  { slug: 'loneliness', name: 'Одиночество' },
  { slug: 'nature', name: 'Природа' },
  { slug: 'philosophy', name: 'Философия' },
  { slug: 'nostalgia', name: 'Ностальгия' },
  { slug: 'war', name: 'Война' },
  { slug: 'city', name: 'Город' }, 
];

async function main() {
    for(const tag of tags){
        await prisma.tag.upsert({
            where: {slug: tag.slug},
            update: { name: tag.name},
            create: tag,
        })
    }
}

main()
.catch((e)=> {
    console.error(e)
    process.exit(1)
})
.finally(()=>prisma.$disconnect());