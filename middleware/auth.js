// middleware/auth.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mi_secreto_super_seguro_123"; // usa App Settings en prod

function getTokenFromHeader(req) {
    const auth = req.headers.authorization || "";
    if (auth.startsWith("Bearer ")) return auth.substring(7);
    return null;
}

export function auth(req, res, next) {
    // Soportar JWT por Cookie o por Header
    const token = req.cookies?.accessToken || getTokenFromHeader(req);
    if (!token) {
        return res.status(401).json({ message: "No autenticado" });
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        // payload típico: { sub: id_usuario, rol, iat, exp }
        req.user = payload;
        return next();
    } catch (err) {
        return res.status(401).json({ message: "Token inválido o expirado" });
    }
}

// Útil para endpoints que aceptan usuario opcional (no obligatorio)
export function optionalAuth(req, _res, next) {
    const token = req.cookies?.accessToken || getTokenFromHeader(req);
    if (!token) return next();
    try {
        req.user = jwt.verify(token, JWT_SECRET);
    } catch (_) {
        // ignoramos si falla
    }
    next();
}

/**
 * RBAC: permite solo a ciertos roles (por ID de rol)
 * Uso: requireRole(1) o requireRole(1, 2)
 */
export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ message: "No autenticado" });

        const roleFromToken = req.user.rol ?? req.user.role; // por si usaste "role" en algún lado
        if (roleFromToken == null) {
            return res.status(403).json({ message: "No autorizado: sin rol" });
        }
        // OJO: si tu rol viene como string, conviértelo a número
        const roleId = typeof roleFromToken === "string" ? Number(roleFromToken) : roleFromToken;

        if (!allowedRoles.includes(roleId)) {
            return res.status(403).json({ message: "No autorizado: rol insuficiente" });
        }
        next();
    };
}
