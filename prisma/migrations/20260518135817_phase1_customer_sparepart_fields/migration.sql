-- AlterTable
ALTER TABLE `customers` ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `fuel_type` ENUM('GASOLINE', 'DIESEL') NULL,
    ADD COLUMN `odometer` INTEGER NULL,
    ADD COLUMN `vehicle_brand` VARCHAR(191) NULL,
    ADD COLUMN `vehicle_color` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `spareparts` ADD COLUMN `sparepart_brand` VARCHAR(191) NULL,
    ADD COLUMN `sparepart_size` VARCHAR(191) NULL,
    ADD COLUMN `sparepart_type` VARCHAR(191) NULL;
