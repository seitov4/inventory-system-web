import jwt from "jsonwebtoken";

export function authRequired(req, res, next) {
    const header = req.headers.authorization;
    if (!header) {
        return res.status(401).json({ message: "Требуется авторизация" });
    }

    const [, token] = header.split(" ");
    if (!token) {
        return res.status(401).json({ message: "Некорректный токен" });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload; // { id, email, role }
        next();
    } catch (err) {
        return res.status(401).json({ message: "Неверный или истёкший токен" });
    }
}

export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Доступ запрещён" });
        }
        next();
    };
}
