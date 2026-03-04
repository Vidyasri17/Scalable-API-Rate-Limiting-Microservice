db = db.getSiblingDB('ratelimitdb');

db.clients.drop();

db.clients.insertMany([
    {
        "clientId": "test-client-1",
        "hashedApiKey": "$2a$10$w8T9V.b8yQnRJ42U.lY2L.u0H1H8WJ0eY3wX1tC3eO0C2vR1A1PcG",
        "maxRequests": 10,
        "windowSeconds": 60,
        "createdAt": new Date(),
        "updatedAt": new Date()
    },
    {
        "clientId": "test-client-2",
        "hashedApiKey": "$2a$10$w8T9V.b8yQnRJ42U.lY2L.u0H1H8WJ0eY3wX1tC3eO0C2vR1A1PcG",
        "maxRequests": 5,
        "windowSeconds": 10,
        "createdAt": new Date(),
        "updatedAt": new Date()
    },
    {
        "clientId": "test-client-3",
        "hashedApiKey": "$2a$10$w8T9V.b8yQnRJ42U.lY2L.u0H1H8WJ0eY3wX1tC3eO0C2vR1A1PcG",
        "maxRequests": 100,
        "windowSeconds": 3600,
        "createdAt": new Date(),
        "updatedAt": new Date()
    }
]);

print("Database seeded with test clients");
