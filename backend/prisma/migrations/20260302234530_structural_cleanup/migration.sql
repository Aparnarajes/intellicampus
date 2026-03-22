-- CreateTable
CREATE TABLE "PreRegisteredStudent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usn" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "branch" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "section" TEXT,
    "batch" TEXT,
    "admissionYear" INTEGER,
    "isRegistered" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PreRegisteredFaculty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facultyId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "department" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "specialization" TEXT,
    "isRegistered" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PreRegisteredStudent_usn_key" ON "PreRegisteredStudent"("usn");

-- CreateIndex
CREATE UNIQUE INDEX "PreRegisteredStudent_email_key" ON "PreRegisteredStudent"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PreRegisteredStudent_userId_key" ON "PreRegisteredStudent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PreRegisteredFaculty_facultyId_key" ON "PreRegisteredFaculty"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "PreRegisteredFaculty_email_key" ON "PreRegisteredFaculty"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PreRegisteredFaculty_userId_key" ON "PreRegisteredFaculty"("userId");
