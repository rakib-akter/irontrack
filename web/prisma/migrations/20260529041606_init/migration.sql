-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiftEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exercise" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'lb',
    "notes" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiftEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exercise" TEXT NOT NULL,
    "targetWeight" DOUBLE PRECISION NOT NULL,
    "targetReps" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'lb',
    "targetDate" TIMESTAMP(3),
    "achieved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "LiftEntry_userId_exercise_performedAt_idx" ON "LiftEntry"("userId", "exercise", "performedAt");

-- CreateIndex
CREATE INDEX "Goal_userId_exercise_idx" ON "Goal"("userId", "exercise");

-- AddForeignKey
ALTER TABLE "LiftEntry" ADD CONSTRAINT "LiftEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
