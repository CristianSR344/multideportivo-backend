// middleware/auth.js
import jwt from "jsonwebtoken";

export function auth(req, res, next) {
  const token = req.cookies?.accessToken || req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "No autenticado" });

  try {
    const payload = jwt.verify(token, "mi_secreto_super_seguro_123"); // tu secreto/ENV
    req.user = { id: payload.sub, rol: payload.rol };
    next();
  } catch (e) {
    return res.status(401).json({ message: "Token inválido" });
  }
}

// 👉 Superuser: rol 1 siempre permitido
export function requireRole(allowed) {
  const allowedArray = Array.isArray(allowed) ? allowed : [allowed];
  return (req, res, next) => {
    if (!req.user?.rol) return res.status(403).json({ message: "Sin rol" });
    if (req.user.rol === 1) return next();             // ⬅️ Admin todo acceso
    if (allowedArray.includes(req.user.rol)) return next();
    return res.status(403).json({ message: "No autorizado" });
  };
}

// Opcional: rutas que pueden o no estar autenticadas
export function optionalAuth(req, _res, next) {
  const token = req.cookies?.accessToken || req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return next();
  try {
    const payload = jwt.verify(token, "mi_secreto_super_seguro_123");
    req.user = { id: payload.sub, rol: payload.rol };
  } catch {}
  next();
}
