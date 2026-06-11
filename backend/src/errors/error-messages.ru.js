import { ERROR_CODES } from "./error-codes.js";

export const RU_ERROR_MESSAGES = Object.freeze({
    [ERROR_CODES.INTERNAL_SERVER_ERROR]: "Внутренняя ошибка сервера",
    [ERROR_CODES.DB_SCHEMA_COLUMN_MISSING]: ({ column = "unknown", table = "unknown" } = {}) =>
        `Ошибка схемы базы данных: колонка '${column}' отсутствует в таблице '${table}'.`,
    [ERROR_CODES.DB_SCHEMA_TABLE_MISSING]: ({ table = "unknown" } = {}) =>
        `Ошибка схемы базы данных: таблица '${table}' отсутствует.`,
    [ERROR_CODES.DB_DATABASE_NOT_FOUND]: "Ошибка подключения к базе данных: база не найдена.",
    [ERROR_CODES.DB_UNIQUE_CONSTRAINT_VIOLATION]: "Нарушение уникальности данных.",

    [ERROR_CODES.AUTH_REQUIRED]: "Требуется аутентификация",
    [ERROR_CODES.AUTH_LOGIN_REQUIRED_FIELDS]: "Логин (email или телефон) и пароль обязательны",
    [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: "Неверный логин или пароль",
    [ERROR_CODES.AUTH_REGISTER_REQUIRED_FIELDS]:
        "Название магазина, имя, фамилия, контакт и пароль обязательны",
    [ERROR_CODES.AUTH_PASSWORD_CONFIRM_MISMATCH]: "Пароль и подтверждение не совпадают",
    [ERROR_CODES.AUTH_REGISTER_ROLE_INVALID]:
        "Роль при регистрации должна быть одной из: owner, manager, cashier, staff",
    [ERROR_CODES.AUTH_USER_EMAIL_EXISTS]: "Пользователь с таким email уже существует",
    [ERROR_CODES.AUTH_USER_PHONE_EXISTS]: "Пользователь с таким телефоном уже существует",
    [ERROR_CODES.AUTH_USER_NOT_FOUND]: "Пользователь не найден",
    [ERROR_CODES.AUTH_TOKEN_FORMAT_INVALID]: "Некорректный формат токена",
    [ERROR_CODES.AUTH_TOKEN_MISSING]: "Токен не предоставлен",
    [ERROR_CODES.AUTH_TOKEN_EXPIRED]: "Срок действия токена истек",
    [ERROR_CODES.AUTH_TOKEN_INVALID]: "Неверный токен",
    [ERROR_CODES.AUTH_TOKEN_VERIFICATION_FAILED]: "Не удалось проверить токен",
    [ERROR_CODES.AUTH_FORBIDDEN]: "Доступ запрещен: недостаточно прав",
    [ERROR_CODES.AUTHORIZATION_FAILED]: "Ошибка авторизации",

    [ERROR_CODES.PLATFORM_AUTH_REQUIRED_FIELDS]: "Email и пароль обязательны",
    [ERROR_CODES.PLATFORM_AUTH_INVALID_CREDENTIALS]:
        "Invalid email or password / Неверный email или пароль",
    [ERROR_CODES.PLATFORM_AUTH_DISABLED]: "Пользователь отключен",
    [ERROR_CODES.PLATFORM_AUTH_ACCESS_DENIED]: "Доступ запрещен",
    [ERROR_CODES.PLATFORM_AUTH_TOKEN_TYPE_INVALID]: "Доступ запрещен",
    [ERROR_CODES.PLATFORM_USER_REQUIRED_FIELDS]: "Имя, email, пароль и роль обязательны",
    [ERROR_CODES.PLATFORM_USER_PASSWORD_TOO_SHORT]: "Пароль должен быть не короче 8 символов",
    [ERROR_CODES.PLATFORM_USER_ROLE_INVALID]: "Недопустимая роль пользователя",
    [ERROR_CODES.PLATFORM_USER_EMAIL_EXISTS]: "Пользователь с таким email уже существует",

    [ERROR_CODES.USERS_REQUIRED_FIELDS]: "Имя, фамилия, контакт и пароль сотрудника обязательны",
    [ERROR_CODES.USERS_ROLE_INVALID]:
        "Роль сотрудника должна быть одной из: owner, manager, cashier, staff",
    [ERROR_CODES.USERS_NOT_FOUND]: "Сотрудник не найден",
    [ERROR_CODES.USERS_CANNOT_DELETE_SELF]: "Нельзя удалить самого себя",
    [ERROR_CODES.USERS_CANNOT_DELETE_OWNER]: "Владельца магазина нельзя удалить",

    [ERROR_CODES.MOVEMENT_REQUIRED_FIELDS_OUT]: "product_id, warehouse_id и qty обязательны",
    [ERROR_CODES.MOVEMENT_REQUIRED_FIELDS_TRANSFER]:
        "product_id, from_warehouse_id, to_warehouse_id и qty обязательны",
    [ERROR_CODES.MOVEMENT_TRANSFER_SAME_WAREHOUSE]:
        "Склад-источник и склад-назначение не могут совпадать",
    [ERROR_CODES.MOVEMENT_TYPE_REQUIRED]: "type обязателен",
    [ERROR_CODES.MOVEMENT_TYPE_INVALID]: ({ type } = {}) =>
        `Недопустимый тип движения: ${type ?? "unknown"}`,
    [ERROR_CODES.MOVEMENT_PRODUCT_ID_INVALID]:
        "product_id обязателен и должен быть положительным числом",
    [ERROR_CODES.MOVEMENT_QTY_INVALID]: "qty обязателен и должен быть положительным числом",
    [ERROR_CODES.MOVEMENT_USER_ID_INVALID]: "user_id обязателен и должен быть положительным числом",
    [ERROR_CODES.MOVEMENT_WAREHOUSE_TO_INVALID]:
        "warehouse_id или warehouse_to обязателен и должен быть положительным числом",
    [ERROR_CODES.MOVEMENT_WAREHOUSE_FROM_INVALID]:
        "warehouse_from обязателен и должен быть положительным числом",
    [ERROR_CODES.MOVEMENT_WAREHOUSE_TRANSFER_INVALID]:
        "warehouse_from и warehouse_to обязательны и должны быть положительными числами",
    [ERROR_CODES.MOVEMENT_PRODUCT_NOT_FOUND]: "Товар не найден",
    [ERROR_CODES.MOVEMENT_WAREHOUSE_FROM_NOT_FOUND]: ({ warehouseId } = {}) =>
        `Склад-источник с ID ${warehouseId ?? "unknown"} не найден.`,
    [ERROR_CODES.MOVEMENT_WAREHOUSE_TO_NOT_FOUND]: ({ warehouseId } = {}) =>
        `Склад-назначение с ID ${warehouseId ?? "unknown"} не найден.`,
    [ERROR_CODES.MOVEMENT_STOCK_NOT_FOUND]: "Остаток не найден для данного товара и склада",
    [ERROR_CODES.MOVEMENT_STOCK_FROM_NOT_FOUND]: "Остаток не найден для склада-источника",
    [ERROR_CODES.MOVEMENT_STOCK_ADJUST_NOT_FOUND]: "Запись stock не найдена для корректировки",
    [ERROR_CODES.MOVEMENT_INSUFFICIENT_STOCK]: ({ available, required } = {}) =>
        `Недостаточно товара на складе. Доступно: ${available ?? 0}, требуется: ${required ?? 0}`,
    [ERROR_CODES.MOVEMENT_INSUFFICIENT_STOCK_FROM]: ({ available, required } = {}) =>
        `Недостаточно товара на складе-источнике. Доступно: ${available ?? 0}, требуется: ${required ?? 0}`,

    [ERROR_CODES.PRODUCT_DEFAULT_WAREHOUSE_NOT_FOUND]:
        "Не найден склад по умолчанию. Создайте хотя бы один склад перед добавлением товаров.",
    [ERROR_CODES.PRODUCT_NAME_REQUIRED]: "Название товара обязательно и не может быть пустым",
    [ERROR_CODES.PRODUCT_SKU_REQUIRED]: "SKU товара обязателен и не может быть пустым",
    [ERROR_CODES.PRODUCT_PURCHASE_PRICE_INVALID]: "Цена закупки должна быть неотрицательным числом",
    [ERROR_CODES.PRODUCT_SALE_PRICE_INVALID]: "Цена продажи должна быть неотрицательным числом",
    [ERROR_CODES.PRODUCT_MIN_STOCK_INVALID]:
        "Минимальный остаток должен быть неотрицательным числом",
    [ERROR_CODES.PRODUCT_SKU_EXISTS]: ({ sku } = {}) => `Товар с SKU "${sku ?? ""}" уже существует`,
    [ERROR_CODES.PRODUCT_BARCODE_EXISTS]: ({ barcode } = {}) =>
        `Товар с штрихкодом "${barcode ?? ""}" уже существует`,
    [ERROR_CODES.PRODUCT_NOT_FOUND]: "Товар не найден",
    [ERROR_CODES.PRODUCT_UNIQUE_CONSTRAINT]: "Нарушение уникальности данных.",
    [ERROR_CODES.PRODUCT_IMPORT_ARRAY_REQUIRED]: "Массив products обязателен",
    [ERROR_CODES.PRODUCT_IMPORT_ARRAY_EMPTY]: "Массив products не может быть пустым",
    [ERROR_CODES.PRODUCT_IMPORT_MAX_LIMIT]: "Максимум 1000 товаров за один импорт",
    [ERROR_CODES.PRODUCT_IMPORT_ROW_MISSING_FIELDS]: ({ row = "unknown", fields = [] } = {}) =>
        `Строка ${row}: отсутствуют обязательные поля: ${Array.isArray(fields) ? fields.join(", ") : fields}`,
    [ERROR_CODES.PRODUCT_IMPORT_ROW_SALE_PRICE_INVALID]: ({ row = "unknown" } = {}) =>
        `Строка ${row}: sale_price должен быть неотрицательным числом`,
    [ERROR_CODES.PRODUCT_IMPORT_ROW_SKU_EXISTS]: ({ row = "unknown", sku = "" } = {}) =>
        `Строка ${row}: SKU "${sku}" уже существует`,
    [ERROR_CODES.PRODUCT_IMPORT_ROW_BARCODE_EXISTS]: ({ row = "unknown", barcode = "" } = {}) =>
        `Строка ${row}: штрихкод "${barcode}" уже существует`,
    [ERROR_CODES.PRODUCT_IMPORT_ROW_PROCESS_FAILED]: ({ row = "unknown" } = {}) =>
        `Строка ${row}: ошибка при обработке товара`,
    [ERROR_CODES.PLATFORM_STORE_NAME_REQUIRED]: "Название магазина обязательно",
    [ERROR_CODES.PLATFORM_STORE_NOT_FOUND]: "Магазин не найден",
    [ERROR_CODES.PLATFORM_STORE_ID_INVALID]: "Некорректный идентификатор магазина",
    [ERROR_CODES.PLATFORM_STORE_STATUS_INVALID]: ({ status = "unknown" } = {}) =>
        `Недопустимый статус магазина: ${status}`,
    [ERROR_CODES.PLATFORM_STORE_STATUS_TRANSITION_INVALID]: ({
        fromStatus = "unknown",
        toStatus = "unknown",
    } = {}) => `Нельзя изменить статус магазина с "${fromStatus}" на "${toStatus}"`,
    [ERROR_CODES.PLATFORM_STORE_SLUG_EXISTS]: ({ slug = "" } = {}) =>
        `Магазин со slug "${slug}" уже существует`,

    [ERROR_CODES.NOTIFICATION_TYPE_REQUIRED]: "Тип уведомления обязателен",
    [ERROR_CODES.NOTIFICATION_USER_IDS_REQUIRED]:
        "Список пользователей обязателен и не может быть пустым",
    [ERROR_CODES.NOTIFICATION_PAYLOAD_OBJECT_REQUIRED]: "Payload должен быть объектом",
    [ERROR_CODES.NOTIFICATION_NOT_FOUND_OR_ALREADY_READ]:
        "Уведомление не найдено или уже прочитано",

    [ERROR_CODES.SALES_ITEMS_REQUIRED]: "Список позиций продажи не может быть пустым",
    [ERROR_CODES.SALES_ITEM_PRODUCT_ID_REQUIRED]: "product_id обязателен для каждой позиции",
    [ERROR_CODES.SALES_ITEM_QTY_INVALID]: "qty должен быть положительным числом",
    [ERROR_CODES.SALES_ITEM_PRICE_INVALID]: "price обязателен и должен быть неотрицательным",
    [ERROR_CODES.SALES_WAREHOUSE_OR_STORE_REQUIRED]: "warehouse_id или store_id обязателен",
    [ERROR_CODES.SALES_PAYMENT_TYPE_INVALID]:
        "\u041d\u0435\u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0439 payment_type. \u0414\u043e\u0441\u0442\u0443\u043f\u043d\u043e: CASH, CARD, KASPI",
    [ERROR_CODES.SALES_DISCOUNT_INVALID]:
        "\u0421\u043a\u0438\u0434\u043a\u0430 \u043d\u0435 \u043c\u043e\u0436\u0435\u0442 \u0431\u044b\u0442\u044c \u0431\u043e\u043b\u044c\u0448\u0435 \u0441\u0443\u043c\u043c\u044b \u0447\u0435\u043a\u0430",
    [ERROR_CODES.SALES_INSUFFICIENT_STOCK]: ({
        productId = "unknown",
        available = 0,
        required = 0,
    } = {}) =>
        `Недостаточно товара (product_id=${productId}) на складе. Доступно: ${available}, требуется: ${required}`,
    [ERROR_CODES.SALES_NOT_FOUND]: "Продажа не найдена",
    [ERROR_CODES.SALES_ALREADY_RETURNED]: "Продажа уже возвращена",
    [ERROR_CODES.SALES_NO_ITEMS]: "Продажа не содержит позиций",
    [ERROR_CODES.SALES_RETURN_WAREHOUSE_REQUIRED]: "warehouse_id обязателен для возврата",

    [ERROR_CODES.REPORTS_DATE_RANGE_REQUIRED]:
        "Параметры from и to обязательны (формат YYYY-MM-DD)",
    [ERROR_CODES.REPORTS_DATE_FORMAT_INVALID]: "Некорректный формат даты: используйте YYYY-MM-DD",
    [ERROR_CODES.REPORTS_DATE_RANGE_INVALID]: "Дата from должна быть меньше или равна дате to",

    [ERROR_CODES.REPORTS_LIMIT_INVALID]:
        "\u041f\u0430\u0440\u0430\u043c\u0435\u0442\u0440 limit \u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u043f\u043e\u043b\u043e\u0436\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u043c \u0446\u0435\u043b\u044b\u043c \u0447\u0438\u0441\u043b\u043e\u043c",
    [ERROR_CODES.REPORTS_OFFSET_INVALID]:
        "\u041f\u0430\u0440\u0430\u043c\u0435\u0442\u0440 offset \u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u0446\u0435\u043b\u044b\u043c \u0447\u0438\u0441\u043b\u043e\u043c \u043d\u0435 \u043c\u0435\u043d\u044c\u0448\u0435 0",
    [ERROR_CODES.REPORTS_PRODUCT_ID_INVALID]:
        "\u041f\u0430\u0440\u0430\u043c\u0435\u0442\u0440 product_id \u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u043f\u043e\u043b\u043e\u0436\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u043c \u0446\u0435\u043b\u044b\u043c \u0447\u0438\u0441\u043b\u043e\u043c",
    [ERROR_CODES.REPORTS_EMPLOYEE_ID_INVALID]:
        "\u041f\u0430\u0440\u0430\u043c\u0435\u0442\u0440 employee_id \u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u043f\u043e\u043b\u043e\u0436\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u043c \u0446\u0435\u043b\u044b\u043c \u0447\u0438\u0441\u043b\u043e\u043c",
    [ERROR_CODES.REPORTS_OPERATION_TYPE_INVALID]:
        "\u041d\u0435\u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0439 operation_type. \u0414\u043e\u0441\u0442\u0443\u043f\u043d\u043e: SALE, RETURN, WRITE_OFF",
    [ERROR_CODES.API_ENDPOINT_NOT_FOUND]: "API-эндпоинт не найден",
    [ERROR_CODES.REPORTS_FORECAST_FORMAT_INVALID]:
        "\u041d\u0435\u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0439 format. \u0414\u043e\u0441\u0442\u0443\u043f\u043d\u043e: realistic, simple, extended",
    [ERROR_CODES.AI_MESSAGE_INVALID]:
        "\u0421\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u0434\u043b\u044f AI-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043d\u0442\u0430 \u0434\u043e\u043b\u0436\u043d\u043e \u0431\u044b\u0442\u044c \u0441\u0442\u0440\u043e\u043a\u043e\u0439 \u043e\u0442 1 \u0434\u043e 1000 \u0441\u0438\u043c\u0432\u043e\u043b\u043e\u0432",
});
