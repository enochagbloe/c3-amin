import { PrismaClient } from '@/lib/generated/prisma'
import { withAccelerate } from '@prisma/extension-accelerate'
import logger from './logger'

const globalForPrisma = global as unknown as { 
    prisma: ReturnType<typeof createPrismaClient> | undefined
}

function createPrismaClient() {
    logger.info('Creating new Prisma client instance')
    return new PrismaClient().$extends(withAccelerate())
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
    logger.info('Using cached Prisma client (development mode)')
} else {
    logger.info('Prisma client initialized (production mode)')
}

// Wrap common operations with logging
const proxiedPrisma = new Proxy(prisma, {
    get(target, prop) {
        const value = Reflect.get(target, prop)
        
        // Log model access
        if (typeof prop === 'string' && !prop.startsWith('$') && !prop.startsWith('_')) {
            logger.info(`Prisma: Accessing model '${prop}'`)
        }
        
        return value
    }
})

export default proxiedPrisma