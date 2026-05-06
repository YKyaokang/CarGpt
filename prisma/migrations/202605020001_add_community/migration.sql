-- CreateTable: Post
CREATE TABLE `Post` (
  `id`           VARCHAR(191) NOT NULL,
  `authorId`     VARCHAR(191) NOT NULL,
  `title`        VARCHAR(255) NULL,
  `content`      LONGTEXT     NOT NULL,
  `contentType`  VARCHAR(20)  NOT NULL DEFAULT 'markdown',
  `status`       VARCHAR(20)  NOT NULL DEFAULT 'published',
  `viewCount`    INTEGER      NOT NULL DEFAULT 0,
  `likeCount`    INTEGER      NOT NULL DEFAULT 0,
  `commentCount` INTEGER      NOT NULL DEFAULT 0,
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3)  NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `Post_authorId_idx` (`authorId`),
  INDEX `Post_createdAt_idx` (`createdAt`),
  INDEX `Post_status_createdAt_idx` (`status`, `createdAt`),
  CONSTRAINT `Post_authorId_fkey`
    FOREIGN KEY (`authorId`) REFERENCES `User` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: PostImage
CREATE TABLE `PostImage` (
  `id`        VARCHAR(191) NOT NULL,
  `postId`    VARCHAR(191) NOT NULL,
  `url`       LONGTEXT     NOT NULL,
  `order`     INTEGER      NOT NULL DEFAULT 0,
  `fileName`  VARCHAR(255) NULL,
  `mimeType`  VARCHAR(50)  NULL,
  `size`      INTEGER      NULL,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `PostImage_postId_idx` (`postId`),
  CONSTRAINT `PostImage_postId_fkey`
    FOREIGN KEY (`postId`) REFERENCES `Post` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: PostTag
CREATE TABLE `PostTag` (
  `id`     VARCHAR(191) NOT NULL,
  `postId` VARCHAR(191) NOT NULL,
  `tag`    VARCHAR(50)  NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `PostTag_postId_idx` (`postId`),
  INDEX `PostTag_tag_idx` (`tag`),
  CONSTRAINT `PostTag_postId_fkey`
    FOREIGN KEY (`postId`) REFERENCES `Post` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: PostMention
CREATE TABLE `PostMention` (
  `id`          VARCHAR(191) NOT NULL,
  `postId`      VARCHAR(191) NOT NULL,
  `mentionedId` VARCHAR(191) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `PostMention_postId_mentionedId_key` (`postId`, `mentionedId`),
  INDEX `PostMention_mentionedId_idx` (`mentionedId`),
  CONSTRAINT `PostMention_postId_fkey`
    FOREIGN KEY (`postId`) REFERENCES `Post` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PostMention_mentionedId_fkey`
    FOREIGN KEY (`mentionedId`) REFERENCES `User` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: Comment
CREATE TABLE `Comment` (
  `id`        VARCHAR(191) NOT NULL,
  `postId`    VARCHAR(191) NOT NULL,
  `authorId`  VARCHAR(191) NOT NULL,
  `content`   TEXT         NOT NULL,
  `parentId`  VARCHAR(191) NULL,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3)  NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `Comment_postId_idx` (`postId`),
  INDEX `Comment_authorId_idx` (`authorId`),
  INDEX `Comment_parentId_idx` (`parentId`),
  CONSTRAINT `Comment_postId_fkey`
    FOREIGN KEY (`postId`) REFERENCES `Post` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Comment_authorId_fkey`
    FOREIGN KEY (`authorId`) REFERENCES `User` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Comment_parentId_fkey`
    FOREIGN KEY (`parentId`) REFERENCES `Comment` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: PostLike
CREATE TABLE `PostLike` (
  `id`        VARCHAR(191) NOT NULL,
  `postId`    VARCHAR(191) NOT NULL,
  `userId`    VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `PostLike_postId_userId_key` (`postId`, `userId`),
  INDEX `PostLike_postId_idx` (`postId`),
  INDEX `PostLike_userId_idx` (`userId`),
  CONSTRAINT `PostLike_postId_fkey`
    FOREIGN KEY (`postId`) REFERENCES `Post` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PostLike_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
