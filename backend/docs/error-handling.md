# Error Handling Standard (Backend)

## Цель
- Все пользовательские ошибки идут через единый механизм: `AppError + ERROR_CODES + RU_ERROR_MESSAGES`.
- API не возвращает внутренние детали (`err.message`, stack, SQL detail).

## Как добавить новую ошибку
1. Добавь код в `backend/src/errors/error-codes.js`.
2. Добавь RU-сообщение для кода в `backend/src/errors/error-messages.ru.js`.
3. Бросай ошибку через `createAppError(ERROR_CODES.XYZ, status, params?)`.
4. В контроллере/мидлваре передавай ошибку в `next(err)`, не формируй вручную user-facing error response.

## Где что делать
- Доменные/бизнес-валидации: в сервисах/validation-helpers, через `createAppError`.
- HTTP-слой: в контроллерах только orchestration и `next(err)`.
- Формат error-response: только в `backend/src/middleware/error.middleware.js`.

## Что запрещено
- `throw new Error("...")` для пользовательских ошибок.
- `return error(res, "...")` для пользовательских ошибок.
- Возврат клиенту сырых внутренних сообщений (`err.message`, SQL errors).
- Inline user-facing строки в контроллерах/сервисах вместо `ERROR_CODES`.

## Быстрый чек перед PR
- `npm --workspace backend run test`
- `npm --workspace backend run lint`
- `npm --workspace backend run db:check-sync`
- `npm run build`
