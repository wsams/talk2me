CREATE TABLE `rooms` (
    `id` INT AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    PRIMARY KEY(`id`)
);

CREATE TABLE `messages` (
    `id` INT AUTO_INCREMENT,
    `rooms` INT NOT NULL,
    `encrypted` BIT(1) NOT NULL,
    `message` TEXT NULL,
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`),
    CONSTRAINT `rooms_fk` FOREIGN KEY (`rooms`) REFERENCES `rooms` (`id`) ON DELETE CASCADE
);
