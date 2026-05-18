-- AlterTable
ALTER TABLE `restocks` ADD COLUMN `indent_order_id` VARCHAR(191) NULL,
    ADD COLUMN `receipt_image_path` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `indent_orders` (
    `id` VARCHAR(191) NOT NULL,
    `branch_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `supplier_name` VARCHAR(191) NOT NULL,
    `order_date` DATE NOT NULL,
    `expected_date` DATE NULL,
    `notes` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'PARTIAL', 'RECEIVED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `indent_order_items` (
    `id` VARCHAR(191) NOT NULL,
    `indent_order_id` VARCHAR(191) NOT NULL,
    `sparepart_id` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `received_qty` INTEGER NOT NULL DEFAULT 0,
    `estimated_price` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `restocks` ADD CONSTRAINT `restocks_indent_order_id_fkey` FOREIGN KEY (`indent_order_id`) REFERENCES `indent_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `indent_orders` ADD CONSTRAINT `indent_orders_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `indent_orders` ADD CONSTRAINT `indent_orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `indent_order_items` ADD CONSTRAINT `indent_order_items_indent_order_id_fkey` FOREIGN KEY (`indent_order_id`) REFERENCES `indent_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `indent_order_items` ADD CONSTRAINT `indent_order_items_sparepart_id_fkey` FOREIGN KEY (`sparepart_id`) REFERENCES `spareparts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
