-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "authId" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" SERIAL NOT NULL,
    "data" TEXT NOT NULL,
    "userAuthId" TEXT NOT NULL,
    "credentialID" TEXT NOT NULL,
    "credentialPublicKey" TEXT NOT NULL,
    "transports" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_authId_key" ON "User"("authId");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_userAuthId_fkey" FOREIGN KEY ("userAuthId") REFERENCES "User"("authId") ON DELETE RESTRICT ON UPDATE CASCADE;
