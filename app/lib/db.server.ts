import { PrismaClient } from "@prisma/client";
import { singleton } from "./utils.server";

export const prisma = singleton("prisma", () => {
    const client = new PrismaClient({
        log: [
            { level: "query", emit: "event" },
            { level: "error", emit: "stdout" },
            { level: "warn", emit: "stdout" },
        ],
    });

    client.$connect();
    return client;
});
