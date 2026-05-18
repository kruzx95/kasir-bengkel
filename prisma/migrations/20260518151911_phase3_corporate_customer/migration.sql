-- AlterTable
ALTER TABLE `customers` ADD COLUMN `corporate_customer_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `transactions` MODIFY `status` ENUM('COMPLETED', 'CANCELLED', 'PENDING_CORPORATE') NOT NULL DEFAULT 'COMPLETED';

-- CreateTable
CREATE TABLE `corporate_customers` (
    `id` VARCHAR(191) NOT NULL,
    `branch_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `contact_person` VARCHAR(191) NULL,
    `contact_phone` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `tax_id` VARCHAR(191) NULL,
    `billing_cycle` ENUM('WEEKLY', 'BIWEEKLY', 'MONTHLY') NOT NULL DEFAULT 'MONTHLY',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `corporate_customers` ADD CONSTRAINT `corporate_customers_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_corporate_customer_id_fkey` FOREIGN KEY (`corporate_customer_id`) REFERENCES `corporate_customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
