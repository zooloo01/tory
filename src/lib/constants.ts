export const DEBUG_PHONES = {
    ADMIN: ["+972544448102"],
    CUSTOMERS: ["+972507570657", "+972533880088"],
};

export const DEBUG_OTP = "123456";
export const DEBUG_COOKIE_NAME = "torforyou_debug_session";

export function isDebugPhone(phone: string): boolean {
    const normalized = phone.startsWith("+") ? phone : `+972${phone.startsWith("0") ? phone.slice(1) : phone}`;
    return DEBUG_PHONES.ADMIN.includes(normalized) || DEBUG_PHONES.CUSTOMERS.includes(normalized);
}

export function isAdminDebugPhone(phone: string): boolean {
    const normalized = phone.startsWith("+") ? phone : `+972${phone.startsWith("0") ? phone.slice(1) : phone}`;
    return DEBUG_PHONES.ADMIN.includes(normalized);
}
