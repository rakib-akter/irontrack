-- CreateTable
CREATE TABLE "BodyWeightGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetWeight" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'lb',
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyWeightGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BodyWeightGoal_userId_key" ON "BodyWeightGoal"("userId");

-- AddForeignKey
ALTER TABLE "BodyWeightGoal" ADD CONSTRAINT "BodyWeightGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
